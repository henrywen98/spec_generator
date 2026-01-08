import json
import os
import dashscope
from http import HTTPStatus
from typing import Generator
from dashscope.api_entities.dashscope_response import Message
from src.core.prompt_loader import get_prompt_loader, get_edit_prompt_loader, get_suggestions_prompt_loader

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY environment variable is not set")
        dashscope.api_key = self.api_key
        self.model = os.getenv("DASHSCOPE_MODEL", "deepseek-v3.2")
        self.enable_thinking = os.getenv("ENABLE_THINKING", "false").lower() in ("1", "true", "yes")
        self.debug_errors = os.getenv("DEBUG_ERRORS", "false").lower() in ("1", "true", "yes")
        self.prompt_loader = get_prompt_loader()
        self.edit_prompt_loader = get_edit_prompt_loader()
        self.suggestions_prompt_loader = get_suggestions_prompt_loader()

    def _emit_event(self, event: dict) -> str:
        return json.dumps(event, ensure_ascii=True) + "\n"

    def _stream_response(self, messages: list[Message]) -> Generator[str, None, None]:
        """Common streaming logic."""
        try:
            responses = dashscope.Generation.call(
                model=self.model,
                messages=messages,
                result_format="message",
                stream=True,
                incremental_output=True,
                enable_thinking=self.enable_thinking,
                timeout=300
            )
        except Exception as exc:
            message = str(exc) if self.debug_errors else "Upstream model error"
            yield self._emit_event({"type": "error", "message": message})
            return

        last_response = None

        for response in responses:
            last_response = response
            if response.status_code == HTTPStatus.OK:
                if response.output and response.output.choices:
                    message = response.output.choices[0].message
                    reasoning_content = getattr(message, "reasoning_content", None)
                    if reasoning_content:
                        yield self._emit_event({"type": "reasoning", "content": reasoning_content})
                    content = message.content
                    if content:
                        assert isinstance(content, str)
                        yield self._emit_event({"type": "content", "content": content})
            else:
                message = response.message if self.debug_errors else "Upstream model error"
                yield self._emit_event({"type": "error", "message": message, "code": response.code})

        if last_response and hasattr(last_response, "usage") and last_response.usage:
            usage = last_response.usage
            input_tokens = getattr(usage, "input_tokens", 0)
            output_tokens = getattr(usage, "output_tokens", 0)
            yield self._emit_event({
                "type": "usage",
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
            })

    def generate_stream(self, user_description: str) -> Generator[str, None, None]:
        """Generate a new PRD from scratch."""
        system_prompt = self.prompt_loader.load_prompt()
        messages: list[Message] = [
            Message(role='system', content=system_prompt),
            Message(role='user', content=user_description)
        ]
        yield from self._stream_response(messages)

    def generate_suggestions_stream(self, current_prd: str, user_feedback: str) -> Generator[str, None, None]:
        """Generate modification suggestions (lightweight discussion)."""
        system_prompt = self.suggestions_prompt_loader.load_prompt()
        user_message = f"""## 当前 PRD

{current_prd}

---

## 用户意见

{user_feedback}"""
        messages: list[Message] = [
            Message(role='system', content=system_prompt),
            Message(role='user', content=user_message)
        ]
        yield from self._stream_response(messages)

    def regenerate_stream(self, current_prd: str, modifications: str) -> Generator[str, None, None]:
        """Regenerate complete PRD with modifications applied."""
        system_prompt = self.edit_prompt_loader.load_prompt()
        user_message = f"""## 当前 PRD 全文

{current_prd}

---

## 需要整合的修改

{modifications}"""
        messages: list[Message] = [
            Message(role='system', content=system_prompt),
            Message(role='user', content=user_message)
        ]
        yield from self._stream_response(messages)
