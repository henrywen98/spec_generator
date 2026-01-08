import json

import dashscope
from http import HTTPStatus

from src.services.llm_service import LLMService


class FakeMessage:
    def __init__(self, content=None, reasoning_content=None):
        self.content = content
        self.reasoning_content = reasoning_content


class FakeChoice:
    def __init__(self, message):
        self.message = message


class FakeOutput:
    def __init__(self, message):
        self.choices = [FakeChoice(message)]


class FakeUsage:
    def __init__(self, input_tokens, output_tokens):
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens


class FakeResponse:
    def __init__(self, status_code, output=None, code="ERR", message="bad", usage=None):
        self.status_code = status_code
        self.output = output
        self.code = code
        self.message = message
        self.usage = usage


def test_stream_response_emits_events(monkeypatch):
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")
    monkeypatch.setenv("DEBUG_ERRORS", "false")

    message = FakeMessage(content="hello", reasoning_content="thinking")
    output = FakeOutput(message)
    usage = FakeUsage(1, 2)
    response = FakeResponse(HTTPStatus.OK, output=output, usage=usage)

    monkeypatch.setattr(dashscope.Generation, "call", lambda **kwargs: [response])

    service = LLMService()
    events = [json.loads(line) for line in service._stream_response([])]

    assert events[0]["type"] == "reasoning"
    assert events[0]["content"] == "thinking"
    assert events[1]["type"] == "content"
    assert events[1]["content"] == "hello"
    assert events[2]["type"] == "usage"
    assert events[2]["input_tokens"] == 1
    assert events[2]["output_tokens"] == 2
    assert events[2]["total_tokens"] == 3


def test_stream_response_emits_error_on_exception(monkeypatch):
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")
    monkeypatch.setenv("DEBUG_ERRORS", "false")

    def raise_error(**kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(dashscope.Generation, "call", raise_error)

    service = LLMService()
    events = [json.loads(line) for line in service._stream_response([])]

    assert events[0]["type"] == "error"
    assert events[0]["message"] == "Upstream model error"
