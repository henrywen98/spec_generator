from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Literal

class GenerationRequest(BaseModel):
    description: str = Field(..., min_length=1, description="Feature description or edit instructions")
    stream: bool = Field(default=True, description="Whether to stream the response")
    mode: Literal["generate", "suggest", "regenerate"] = Field(default="generate", description="Generation mode: generate=initial PRD, suggest=modification suggestions, regenerate=new version")
    current_prd: str | None = Field(default=None, description="Current PRD content for suggest/regenerate modes")
    session_id: str | None = Field(default=None, description="Session identifier for conversation tracking")

class GenerationResponse(BaseModel):
    markdown_content: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
