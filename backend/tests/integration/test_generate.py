from fastapi.testclient import TestClient
from src.main import app
from src.services.llm_service import LLMService
from unittest.mock import MagicMock
import pytest

client = TestClient(app)

def mock_generate_stream(description: str):
    yield '{"type":"content","content":"Chunk 1"}\n'
    yield '{"type":"content","content":"Chunk 2"}\n'
    yield '{"type":"usage","input_tokens":1,"output_tokens":2,"total_tokens":3}\n'

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
    assert '"type":"content"' in content
    assert "Chunk 1" in content
    assert "Chunk 2" in content
    
    # Cleanup
    app.dependency_overrides = {}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_generate_spec_non_streaming(mock_llm_service):
    from src.api.endpoints import get_llm_service
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service

    response = client.post(
        "/api/v1/generate",
        json={"description": "Test feature", "stream": False}
    )

    assert response.status_code == 200
    assert response.json()["markdown_content"] == "Chunk 1Chunk 2"

    app.dependency_overrides = {}

def test_chat_requires_current_prd():
    response = client.post(
        "/api/v1/generate",
        json={"description": "Give me suggestions", "stream": True, "mode": "chat"}
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "current_prd is required for chat mode"

def test_chat_streaming(mock_llm_service):
    mock_llm_service.chat_stream.side_effect = lambda current_prd, user_message, chat_history=None: iter([
        '{"type":"content","content":"Response from chat"}\n'
    ])

    from src.api.endpoints import get_llm_service
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service

    response = client.post(
        "/api/v1/generate",
        json={
            "description": "Please improve this PRD",
            "stream": True,
            "mode": "chat",
            "current_prd": "Current doc"
        }
    )

    assert response.status_code == 200
    assert "Response from chat" in response.text

    app.dependency_overrides = {}


def test_chat_with_history(mock_llm_service):
    """测试带对话历史的 chat 模式"""
    mock_llm_service.chat_stream.side_effect = lambda current_prd, user_message, chat_history=None: iter([
        '{"type":"content","content":"I understand your first suggestion"}\n'
    ])

    from src.api.endpoints import get_llm_service
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service

    response = client.post(
        "/api/v1/generate",
        json={
            "description": "第一个建议可以",
            "stream": True,
            "mode": "chat",
            "current_prd": "Current PRD content",
            "chat_history": [
                {"role": "user", "content": "成功标准太多了"},
                {"role": "assistant", "content": "建议删除 SC-003"}
            ]
        }
    )

    assert response.status_code == 200
    assert "I understand" in response.text

    app.dependency_overrides = {}


def test_chat_history_validation():
    """测试 chat_history 最大长度验证"""
    response = client.post(
        "/api/v1/generate",
        json={
            "description": "Test",
            "stream": True,
            "mode": "chat",
            "current_prd": "PRD",
            "chat_history": [
                {"role": "user", "content": "1"},
                {"role": "assistant", "content": "2"},
                {"role": "user", "content": "3"},
                {"role": "assistant", "content": "4"},
                {"role": "user", "content": "5"}  # 超过 4 条
            ]
        }
    )

    assert response.status_code == 422  # Validation error
