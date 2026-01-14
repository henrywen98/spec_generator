import json
import logging
import os
import re
import dashscope
from http import HTTPStatus
from typing import Generator
from dashscope.api_entities.dashscope_response import Message

from src.core.prompt_loader import get_prompt_loader, get_chat_prompt_loader
from src.models.schemas import ChatMessage, ImageAttachment

logger = logging.getLogger("uvicorn.error")


class LLMService:
    # PRD 文档必须包含的章节（至少 2 个）
    PRD_REQUIRED_SECTIONS = ["功能背景", "功能需求", "功能概述"]
    # PRD 文档可选的标志性章节（配合必需章节判断）
    PRD_OPTIONAL_SECTIONS = ["验收场景", "用户故事", "异常处理", "用户流程"]

    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY environment variable is not set")
        dashscope.api_key = self.api_key
        self.model = os.getenv("DASHSCOPE_MODEL", "deepseek-v3.2")
        self.vl_model = os.getenv("DASHSCOPE_VL_MODEL", "qwen-vl-plus")
        self.enable_thinking = os.getenv("ENABLE_THINKING", "true").lower() in ("1", "true", "yes")
        self.debug_errors = os.getenv("DEBUG_ERRORS", "false").lower() in ("1", "true", "yes")
        self.prompt_loader = get_prompt_loader()
        self.chat_prompt_loader = get_chat_prompt_loader()

    def _emit_event(self, event: dict) -> str:
        return json.dumps(event, ensure_ascii=True) + "\n"

    def _is_full_prd(self, content: str) -> bool:
        """检测内容是否为完整 PRD 文档。

        使用正则匹配 markdown 标题（h1-h3），避免在建议文本中提及章节名导致的误判。

        判断逻辑：
        - 必需章节命中 >= 2，或
        - 必需章节命中 >= 1 且可选章节命中 >= 2
        """
        all_sections = self.PRD_REQUIRED_SECTIONS + self.PRD_OPTIONAL_SECTIONS
        # 匹配 markdown 标题格式: # 功能背景、## 功能背景、### 功能背景 等
        pattern = r'^#{1,3}\s*\d*\.?\s*(' + '|'.join(re.escape(s) for s in all_sections) + r')'
        matches = re.findall(pattern, content, re.MULTILINE)

        required_count = sum(1 for m in matches if m in self.PRD_REQUIRED_SECTIONS)
        optional_count = sum(1 for m in matches if m in self.PRD_OPTIONAL_SECTIONS)
        return required_count >= 2 or (required_count >= 1 and optional_count >= 2)

    def _stream_response(self, messages: list[Message], emit_prd_metadata: bool = False) -> Generator[str, None, None]:
        """Common streaming logic with DashScope SDK.

        Args:
            messages: 发送给 LLM 的消息列表
            emit_prd_metadata: 是否在流结束时发送 metadata 事件（用于 chat 模式检测完整 PRD）
        """
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
        content_parts: list[str] = []

        for response in responses:
            last_response = response
            if response.status_code == HTTPStatus.OK:
                if response.output and response.output.choices:
                    message = response.output.choices[0].message
                    # Safely get reasoning_content - DashScope objects raise KeyError for missing attrs
                    try:
                        reasoning_content = message.reasoning_content
                        if reasoning_content:
                            yield self._emit_event({"type": "reasoning", "content": reasoning_content})
                    except (KeyError, AttributeError):
                        pass
                    content = message.content
                    if content:
                        assert isinstance(content, str)
                        if emit_prd_metadata:
                            content_parts.append(content)
                        yield self._emit_event({"type": "content", "content": content})
            else:
                error_msg = response.message if self.debug_errors else "Upstream model error"
                yield self._emit_event({"type": "error", "message": error_msg, "code": response.code})

        # 在 chat 模式下，检测输出是否为完整 PRD 并发送 metadata 事件
        if emit_prd_metadata and content_parts:
            full_content = "".join(content_parts)
            is_full_prd = self._is_full_prd(full_content)
            yield self._emit_event({"type": "metadata", "is_full_prd": is_full_prd})

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

    def _build_multimodal_content(
        self,
        text: str,
        images: list[ImageAttachment] | None = None,
    ) -> list[dict[str, str]]:
        """构建多模态消息的 content 数组。

        Args:
            text: 文本内容
            images: 图片附件列表

        Returns:
            DashScope MultiModalConversation 格式的 content 数组:
            [{"image": "data:image/png;base64,..."}, {"text": "..."}]
        """
        content: list[dict[str, str]] = []

        # 先添加所有图片
        if images:
            for img in images:
                # 构建 data URI 格式
                data_uri = f"data:{img.mime_type};base64,{img.data}"
                content.append({"image": data_uri})

        # 最后添加文本
        content.append({"text": text})

        return content

    def _build_multimodal_messages(
        self,
        system_prompt: str,
        user_text: str,
        images: list[ImageAttachment] | None = None,
    ) -> list[dict]:
        """构建多模态 API 的消息列表（generate 模式）。

        Args:
            system_prompt: 系统提示词
            user_text: 用户文本输入
            images: 图片附件列表

        Returns:
            DashScope MultiModalConversation 格式的消息列表
        """
        messages = [
            {
                "role": "system",
                "content": [{"text": system_prompt}]
            },
            {
                "role": "user",
                "content": self._build_multimodal_content(user_text, images)
            }
        ]
        return messages

    def _stream_multimodal_response(
        self,
        messages: list[dict],
        emit_prd_metadata: bool = False,
    ) -> Generator[str, None, None]:
        """多模态 API 的流式响应处理。

        Args:
            messages: 多模态格式的消息列表
            emit_prd_metadata: 是否在流结束时发送 metadata 事件

        Yields:
            NDJSON 格式的事件字符串
        """
        try:
            responses = dashscope.MultiModalConversation.call(
                model=self.vl_model,
                messages=messages,
                stream=True,
                incremental_output=True,
                timeout=300
            )
        except Exception as exc:
            message = str(exc) if self.debug_errors else "Upstream model error"
            yield self._emit_event({"type": "error", "message": message})
            return

        last_response = None
        content_parts: list[str] = []

        for response in responses:
            last_response = response
            if response.status_code == HTTPStatus.OK:
                if response.output and response.output.choices:
                    choice = response.output.choices[0]
                    message = choice.message
                    # MultiModalConversation 返回的 content 可能是列表
                    content = message.content
                    if content:
                        # 提取文本内容
                        if isinstance(content, list):
                            for item in content:
                                if isinstance(item, dict) and "text" in item:
                                    text = item["text"]
                                    if text:
                                        if emit_prd_metadata:
                                            content_parts.append(text)
                                        yield self._emit_event({"type": "content", "content": text})
                        elif isinstance(content, str):
                            if emit_prd_metadata:
                                content_parts.append(content)
                            yield self._emit_event({"type": "content", "content": content})
            else:
                error_msg = response.message if self.debug_errors else "Upstream model error"
                yield self._emit_event({"type": "error", "message": error_msg, "code": response.code})

        # 在 chat 模式下，检测输出是否为完整 PRD
        if emit_prd_metadata and content_parts:
            full_content = "".join(content_parts)
            is_full_prd = self._is_full_prd(full_content)
            yield self._emit_event({"type": "metadata", "is_full_prd": is_full_prd})

        # 发送 usage 信息
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

    def _build_chat_messages(
        self,
        system_prompt: str,
        current_prd: str,
        user_message: str,
        chat_history: list[ChatMessage] | None = None,
    ) -> list[Message]:
        """
        按规格 FR-008 构建消息列表：
        1. SystemMessage: prompt-chat.md 内容
        2. HumanMessage: 当前 PRD 全文
        3. AIMessage: 确认消息
        4. 对话历史（交替的 user/assistant）
        5. HumanMessage: 用户最新消息
        """
        messages: list[Message] = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=f"## 当前 PRD\n\n{current_prd}"),
            Message(role="assistant", content="好的，我已了解当前 PRD 内容，请告诉我你的想法或问题。"),
        ]

        if chat_history:
            for msg in chat_history:
                messages.append(Message(role=msg.role, content=msg.content))

        messages.append(Message(role="user", content=user_message))

        return messages

    def _build_multimodal_chat_messages(
        self,
        system_prompt: str,
        current_prd: str,
        user_message: str,
        images: list[ImageAttachment],
        chat_history: list[ChatMessage] | None = None,
    ) -> list[dict]:
        """构建多模态 Chat 模式的消息列表。

        按规格 FR-008 构建消息列表，最后的用户消息包含图片：
        1. SystemMessage: prompt-chat.md 内容
        2. HumanMessage: 当前 PRD 全文
        3. AIMessage: 确认消息
        4. 对话历史（交替的 user/assistant）
        5. HumanMessage: 用户最新消息 + 图片

        Args:
            system_prompt: 系统提示词
            current_prd: 当前 PRD 内容
            user_message: 用户文本消息
            images: 图片附件列表
            chat_history: 对话历史

        Returns:
            DashScope MultiModalConversation 格式的消息列表
        """
        messages: list[dict] = [
            {
                "role": "system",
                "content": [{"text": system_prompt}]
            },
            {
                "role": "user",
                "content": [{"text": f"## 当前 PRD\n\n{current_prd}"}]
            },
            {
                "role": "assistant",
                "content": [{"text": "好的，我已了解当前 PRD 内容，请告诉我你的想法或问题。"}]
            },
        ]

        # 添加对话历史
        if chat_history:
            for msg in chat_history:
                messages.append({
                    "role": msg.role,
                    "content": [{"text": msg.content}]
                })

        # 添加最后的用户消息（带图片）
        messages.append({
            "role": "user",
            "content": self._build_multimodal_content(user_message, images)
        })

        return messages

    def generate_stream(
        self,
        user_description: str,
        images: list[ImageAttachment] | None = None,
    ) -> Generator[str, None, None]:
        """Generate a new PRD from scratch.

        Args:
            user_description: 用户的功能描述
            images: 可选的图片附件列表

        Yields:
            NDJSON 格式的事件字符串
        """
        system_prompt = self.prompt_loader.load_prompt()

        # 如果有图片，使用多模态 API
        if images:
            # Log multi-image request details for debugging
            total_size = sum(img.size or 0 for img in images)
            logger.info(
                "generate_stream with images: count=%d, total_size=%.2fMB, model=%s",
                len(images),
                total_size / (1024 * 1024),
                self.vl_model
            )
            messages = self._build_multimodal_messages(
                system_prompt=system_prompt,
                user_text=user_description,
                images=images,
            )
            yield from self._stream_multimodal_response(messages)
        else:
            # 无图片时保持原有逻辑（向后兼容）
            messages: list[Message] = [
                Message(role="system", content=system_prompt),
                Message(role="user", content=user_description)
            ]
            yield from self._stream_response(messages)

    def chat_stream(
        self,
        current_prd: str,
        user_message: str,
        chat_history: list[ChatMessage] | None = None,
        images: list[ImageAttachment] | None = None,
    ) -> Generator[str, None, None]:
        """
        Chat about existing PRD with optional chat history and images.
        FR-008: 消息顺序为 PRD 第一位 → 历史 → 最新消息
        FR-009: current_prd 参数接收新版本时自动使用新 PRD

        Args:
            current_prd: 当前 PRD 内容
            user_message: 用户消息
            chat_history: 对话历史
            images: 可选的图片附件列表

        在流结束时发送 metadata 事件，指示输出是否为完整 PRD（用于前端版本追踪）。
        """
        system_prompt = self.chat_prompt_loader.load_prompt()

        # 如果有图片，使用多模态 API
        if images:
            # Log multi-image request details for debugging
            total_size = sum(img.size or 0 for img in images)
            logger.info(
                "chat_stream with images: count=%d, total_size=%.2fMB, model=%s",
                len(images),
                total_size / (1024 * 1024),
                self.vl_model
            )
            messages = self._build_multimodal_chat_messages(
                system_prompt=system_prompt,
                current_prd=current_prd,
                user_message=user_message,
                images=images,
                chat_history=chat_history,
            )
            yield from self._stream_multimodal_response(messages, emit_prd_metadata=True)
        else:
            # 无图片时保持原有逻辑（向后兼容）
            messages = self._build_chat_messages(
                system_prompt=system_prompt,
                current_prd=current_prd,
                user_message=user_message,
                chat_history=chat_history,
            )
            yield from self._stream_response(messages, emit_prd_metadata=True)
