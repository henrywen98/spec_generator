from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from src.models.schemas import GenerationRequest
from src.services.llm_service import LLMService

router = APIRouter()

def get_llm_service():
    return LLMService()

@router.post("/generate")
async def generate_spec(
    request: GenerationRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    try:
        # We enforce streaming for this MVP based on plan
        if not request.stream:
             # Fallback to blocking if needed, but for now user story emphasizes instant/streaming
             # Assuming stream=True logic for simplicity as per requirement FR-006 implied (visual preview)
             pass
        
        return StreamingResponse(
            llm_service.generate_stream(request.description),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
