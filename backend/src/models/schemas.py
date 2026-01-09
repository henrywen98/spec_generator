from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Literal


class ChatMessage(BaseModel):
    """单条对话消息，用于前后端通信和 LangChain 消息构建。"""
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)


class GenerationRequest(BaseModel):
    description: str = Field(..., min_length=1, description="Feature description or user message")
    stream: bool = Field(default=True, description="Whether to stream the response")
    mode: Literal["generate", "chat"] = Field(default="generate", description="Generation mode: generate=initial PRD from scratch, chat=discuss/modify existing PRD")
    current_prd: str | None = Field(default=None, description="Current PRD content for chat mode")
    chat_history: list[ChatMessage] | None = Field(default=None, description="Chat history (max 4 messages, i.e., 2 rounds)")
    session_id: str | None = Field(default=None, description="Session identifier for conversation tracking")

    @field_validator("chat_history")
    @classmethod
    def validate_chat_history_length(cls, v: list[ChatMessage] | None) -> list[ChatMessage] | None:
        if v is not None and len(v) > 4:
            raise ValueError("chat_history cannot exceed 4 messages (2 rounds)")
        return v


class GenerationResponse(BaseModel):
    markdown_content: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
