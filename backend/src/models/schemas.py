from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Literal

# 支持的图片 MIME 类型
SUPPORTED_IMAGE_TYPES = Literal["image/jpeg", "image/png", "image/gif", "image/webp"]

# 图片大小限制（10MB）
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10485760 bytes

# 单次请求最大图片数量
MAX_IMAGES_PER_REQUEST = 5


class ImageAttachment(BaseModel):
    """用户上传的图片附件，包含 Base64 编码数据和元信息。"""
    data: str = Field(..., description="Base64 编码的图片数据（不含 data URI 前缀）")
    mime_type: SUPPORTED_IMAGE_TYPES = Field(..., description="图片 MIME 类型")
    filename: str | None = Field(default=None, max_length=255, description="原始文件名")
    size: int | None = Field(default=None, le=MAX_IMAGE_SIZE, description="原始文件大小（字节），最大 10MB")


class ChatMessage(BaseModel):
    """单条对话消息，用于前后端通信和 LangChain 消息构建。"""
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)


class GenerationRequest(BaseModel):
    description: str = Field(..., min_length=1, description="Feature description or user message")
    stream: bool = Field(default=True, description="Whether to stream the response")
    mode: Literal["generate", "chat"] = Field(default="generate", description="Generation mode: generate=initial PRD from scratch, chat=modify existing PRD")
    current_prd: str | None = Field(default=None, description="Current PRD content for chat mode")
    chat_history: list[ChatMessage] | None = Field(default=None, description="[DEPRECATED] No longer used, kept for backward compatibility")
    session_id: str | None = Field(default=None, description="Session identifier for conversation tracking")
    images: list[ImageAttachment] | None = Field(default=None, description="Image attachments (max 5 images)")

    @field_validator("images")
    @classmethod
    def validate_images_count(cls, v: list[ImageAttachment] | None) -> list[ImageAttachment] | None:
        if v is not None and len(v) > MAX_IMAGES_PER_REQUEST:
            raise ValueError(f"images cannot exceed {MAX_IMAGES_PER_REQUEST} items")
        return v


class GenerationResponse(BaseModel):
    markdown_content: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
