import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from src.models.schemas import GenerationRequest
from src.services.llm_service import LLMService

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

def get_llm_service():
    return LLMService()

def _collect_stream_content(chunks) -> str:
    content_parts: list[str] = []
    for chunk in chunks:
        for line in chunk.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            event_type = event.get("type")
            if event_type == "content":
                content_parts.append(event.get("content", ""))
            elif event_type == "error":
                raise HTTPException(status_code=502, detail="Upstream model error")
    return "".join(content_parts)

@router.post("/generate")
async def generate_spec(
    request: GenerationRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    if request.session_id:
        logger.info("generate request session_id=%s mode=%s", request.session_id, request.mode)

    if request.mode == "chat":
        # Chat mode: discuss or modify existing PRD
        if not request.current_prd:
            raise HTTPException(status_code=400, detail="current_prd is required for chat mode")
        generator = llm_service.chat_stream(
            current_prd=request.current_prd,
            user_message=request.description,
            chat_history=request.chat_history,
        )
    else:
        # Generate mode (default): create PRD from scratch
        generator = llm_service.generate_stream(request.description)

    if request.stream:
        return StreamingResponse(generator, media_type="application/x-ndjson")

    content = _collect_stream_content(generator)
    return JSONResponse({"markdown_content": content})
