from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Literal

class GenerationRequest(BaseModel):
    description: str = Field(..., min_length=1, description="Feature description or user message")
    stream: bool = Field(default=True, description="Whether to stream the response")
    mode: Literal["generate", "chat"] = Field(default="generate", description="Generation mode: generate=initial PRD from scratch, chat=discuss/modify existing PRD")
    current_prd: str | None = Field(default=None, description="Current PRD content for chat mode")
    session_id: str | None = Field(default=None, description="Session identifier for conversation tracking")

class GenerationResponse(BaseModel):
    markdown_content: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
