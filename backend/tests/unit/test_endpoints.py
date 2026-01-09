import pytest
from fastapi import HTTPException

from src.api.endpoints import _collect_stream_content


def test_collect_stream_content_success():
    chunks = [
        '{"type":"content","content":"Hello"}\n{"type":"content","content":" World"}\n',
        '{"type":"usage","input_tokens":1,"output_tokens":2,"total_tokens":3}\n',
    ]

    assert _collect_stream_content(chunks) == "Hello World"


def test_collect_stream_content_error():
    chunks = ['{"type":"error","message":"bad"}\n']

    with pytest.raises(HTTPException) as excinfo:
        _collect_stream_content(chunks)

    assert excinfo.value.status_code == 502
