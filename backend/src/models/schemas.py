from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class GenerationRequest(BaseModel):
    description: str = Field(..., min_length=10, description="Feature description")
    stream: bool = Field(default=True, description="Whether to stream the response")

class GenerationResponse(BaseModel):
    markdown_content: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
