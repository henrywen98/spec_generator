# Data Model: Specification Generator

**Branch**: `001-spec-gen-web` | **Date**: 2026-01-07
**Purpose**: Define the Single Source of Truth (SSOT) for data schemas.

## Core Entities

### 1. GenerationRequest
**Description**: The input payload from the user.

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `description` | `str` | Yes | The natural language description of the feature. | Min length: 10 chars |
| `stream` | `bool` | No | Whether to stream the response. Default `True`. | - |

### 2. GenerationResponse
**Description**: The output structure (for non-streaming or final chunk).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `markdown_content` | `str` | Yes | The generated Markdown specification. |
| `generated_at` | `datetime` | Yes | Timestamp of generation. |

## Pydantic Models (Draft)

```python
from pydantic import BaseModel, Field
from datetime import datetime

class GenerationRequest(BaseModel):
    description: str = Field(..., min_length=10, description="Feature description")
    stream: bool = Field(default=True, description="Stream output")

class GenerationResponse(BaseModel):
    markdown_content: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
```
