import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.endpoints import router as api_router

load_dotenv()

app = FastAPI(title="Spec Generator API", version="1.0.0")

logger = logging.getLogger("uvicorn.error")

def _parse_origins(value: str | None) -> list[str]:
    if not value:
        return ["http://localhost:3000"]
    origins = [origin.strip() for origin in value.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]

origins = _parse_origins(os.getenv("ALLOWED_ORIGINS"))
allow_credentials = "*" not in origins
if "*" in origins:
    origins = ["*"]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
