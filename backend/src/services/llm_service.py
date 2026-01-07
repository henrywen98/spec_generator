import os
import dashscope
from http import HTTPStatus
from typing import Generator
from src.core.prompt_loader import get_prompt_loader

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY environment variable is not set")
        dashscope.api_key = self.api_key
        self.model = "deepseek-v3.2"  # Using deepseek-v3.2 with thinking mode
        self.prompt_loader = get_prompt_loader()

    def generate_stream(self, user_description: str) -> Generator[str, None, None]:
        system_prompt = self.prompt_loader.load_prompt()
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_description}
        ]

        responses = dashscope.Generation.call(
            model=self.model,
            messages=messages,
            result_format='message',  # Set result format to message
            stream=True,
            incremental_output=True,  # Enable incremental output
            enable_thinking=True  # Enable thinking mode for deepseek-v3.2
        )

        for response in responses:
            if response.status_code == HTTPStatus.OK:
                # In incremental mode, output.choices[0].message contains the new chunk
                if response.output and response.output.choices:
                    message = response.output.choices[0].message
                    # Output reasoning process first (if exists)
                    if hasattr(message, 'reasoning_content') and message.reasoning_content:
                        yield f"<!--REASONING_START-->{message.reasoning_content}<!--REASONING_END-->"
                    # Then output final response
                    content = message.content
                    if content:
                        yield content
            else:
                # Handle error
                error_msg = f"Error: {response.code} - {response.message}"
                yield f"\n[SYSTEM ERROR]: {error_msg}"
                # You might want to log this or raise exception depending on needs
