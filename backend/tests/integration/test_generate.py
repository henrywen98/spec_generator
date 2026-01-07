from fastapi.testclient import TestClient
from src.main import app
from src.services.llm_service import LLMService
from unittest.mock import MagicMock
import pytest

client = TestClient(app)

def mock_generate_stream(description: str):
    yield "Chunk 1"
    yield "Chunk 2"

@pytest.fixture
def mock_llm_service():
    mock_service = MagicMock(spec=LLMService)
    mock_service.generate_stream.side_effect = mock_generate_stream
    return mock_service

def test_generate_spec_streaming(mock_llm_service):
    # Override dependency
    app.dependency_overrides[LLMService] = lambda: mock_llm_service
    # Actually dependency override needs to match the dependency callable in endpoints.py
    # In endpoints.py: llm_service: LLMService = Depends(get_llm_service)
    # So we override get_llm_service
    from src.api.endpoints import get_llm_service
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service

    response = client.post(
        "/api/v1/generate",
        json={"description": "Test feature", "stream": True}
    )

    assert response.status_code == 200
    # Consuming the streaming response
    content = response.text
    assert "Chunk 1" in content
    assert "Chunk 2" in content
    
    # Cleanup
    app.dependency_overrides = {}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
