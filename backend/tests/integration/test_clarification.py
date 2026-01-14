from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.services.llm_service import LLMService

client = TestClient(app)


def mock_generate_stream_clarification(user_description: str, images=None):
    yield '{"type":"content","content":"## Requirements\\n\\n- [NEEDS CLARIFICATION: What is the user role?]"}\n'


@pytest.fixture
def mock_llm_service_clarification():
    mock_service = MagicMock(spec=LLMService)
    mock_service.generate_stream.side_effect = mock_generate_stream_clarification
    return mock_service


def test_generate_spec_with_clarification(mock_llm_service_clarification):
    from src.api.endpoints import get_llm_service

    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service_clarification

    response = client.post("/api/v1/generate", json={"description": "Vague description", "stream": True})

    assert response.status_code == 200
    content = response.text
    assert "[NEEDS CLARIFICATION" in content

    app.dependency_overrides = {}
