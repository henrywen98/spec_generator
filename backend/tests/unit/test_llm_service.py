import json
from http import HTTPStatus
from unittest.mock import MagicMock, patch

from src.services.llm_service import LLMService


class FakeResponse:
    """模拟 DashScope 流式响应"""
    def __init__(self, content: str = "", reasoning_content: str = "", status_code=HTTPStatus.OK):
        self.status_code = status_code
        self.output = MagicMock()
        self.output.choices = [MagicMock()]

        # 模拟 message 对象
        message = MagicMock()
        message.content = content
        if reasoning_content:
            message.reasoning_content = reasoning_content
        else:
            # 模拟没有 reasoning_content 属性的情况
            type(message).reasoning_content = property(lambda self: (_ for _ in ()).throw(KeyError()))

        self.output.choices[0].message = message
        self.usage = None
        self.message = "Error message"
        self.code = "ERROR_CODE"


class FakeUsageResponse(FakeResponse):
    """带 usage 信息的响应"""
    def __init__(self, input_tokens: int = 10, output_tokens: int = 20):
        super().__init__()
        self.usage = MagicMock()
        self.usage.input_tokens = input_tokens
        self.usage.output_tokens = output_tokens


def test_build_chat_messages_basic(monkeypatch):
    """测试简化的消息构建（无历史）"""
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")

    with patch.object(LLMService, '__init__', lambda self: None):
        service = LLMService()

        messages = service._build_chat_messages(
            system_prompt="System prompt",
            current_prd="PRD content",
            user_message="User question",
        )

        # System + PRD + 确认 + 用户消息 = 4
        assert len(messages) == 4
        assert messages[0].role == "system"
        assert messages[0].content == "System prompt"
        assert messages[1].role == "user"
        assert "PRD content" in messages[1].content
        assert messages[2].role == "assistant"
        assert messages[3].role == "user"
        assert messages[3].content == "User question"


def test_build_chat_messages_order(monkeypatch):
    """测试消息顺序：System → PRD → 确认 → 用户消息"""
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")

    with patch.object(LLMService, '__init__', lambda self: None):
        service = LLMService()

        messages = service._build_chat_messages(
            system_prompt="System",
            current_prd="PRD",
            user_message="Latest",
        )

        # 验证顺序：System → PRD → 确认 → 最新
        assert messages[0].content == "System"
        assert "PRD" in messages[1].content
        assert "了解" in messages[2].content
        assert messages[3].content == "Latest"


def test_stream_response_emits_events(monkeypatch):
    """测试 DashScope 流式响应事件"""
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")

    with patch.object(LLMService, '__init__', lambda self: None):
        service = LLMService()
        service.debug_errors = False
        service.model = "test-model"
        service.enable_thinking = False

        # 模拟 DashScope 响应
        responses = [
            FakeResponse(content="Hello"),
            FakeResponse(content=" World"),
            FakeUsageResponse(input_tokens=10, output_tokens=5),
        ]

        with patch('dashscope.Generation.call', return_value=iter(responses)):
            events = [json.loads(line) for line in service._stream_response([])]

        assert events[0]["type"] == "content"
        assert events[0]["content"] == "Hello"
        assert events[1]["type"] == "content"
        assert events[1]["content"] == " World"
        assert events[2]["type"] == "usage"
        assert events[2]["input_tokens"] == 10
        assert events[2]["output_tokens"] == 5


def test_stream_response_emits_reasoning(monkeypatch):
    """测试 DashScope reasoning 事件"""
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")

    with patch.object(LLMService, '__init__', lambda self: None):
        service = LLMService()
        service.debug_errors = False
        service.model = "test-model"
        service.enable_thinking = True

        # 模拟带 reasoning 的响应
        response = MagicMock()
        response.status_code = HTTPStatus.OK
        response.output = MagicMock()
        response.output.choices = [MagicMock()]
        response.output.choices[0].message = MagicMock()
        response.output.choices[0].message.content = "Answer"
        response.output.choices[0].message.reasoning_content = "Thinking process"
        response.usage = None

        with patch('dashscope.Generation.call', return_value=iter([response])):
            events = [json.loads(line) for line in service._stream_response([])]

        assert events[0]["type"] == "reasoning"
        assert events[0]["content"] == "Thinking process"
        assert events[1]["type"] == "content"
        assert events[1]["content"] == "Answer"


def test_stream_response_emits_error(monkeypatch):
    """测试 DashScope 错误处理"""
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")

    with patch.object(LLMService, '__init__', lambda self: None):
        service = LLMService()
        service.debug_errors = False
        service.model = "test-model"
        service.enable_thinking = False

        with patch('dashscope.Generation.call', side_effect=RuntimeError("API Error")):
            events = [json.loads(line) for line in service._stream_response([])]

        assert events[0]["type"] == "error"
        assert events[0]["message"] == "Upstream model error"
