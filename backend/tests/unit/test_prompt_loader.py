from src.core.prompt_loader import (
    PromptLoader,
    get_edit_prompt_loader,
    get_suggestions_prompt_loader,
)


def test_prompt_loader_env_override(tmp_path, monkeypatch):
    prompt_path = tmp_path / "prompt.md"
    prompt_path.write_text("hello", encoding="utf-8")
    monkeypatch.setenv("PROMPT_FILE_PATH", str(prompt_path))

    loader = PromptLoader()

    assert loader.load_prompt() == "hello"


def test_prompt_loader_default_path(monkeypatch):
    monkeypatch.delenv("PROMPT_FILE_PATH", raising=False)
    loader = PromptLoader()

    assert loader.file_path.name == "prompt.md"
    assert loader.file_path.parent.name == "prompts"
    assert loader.file_path.exists()
    assert "PRD/Specification" in loader.load_prompt()


def test_edit_prompt_loader_default_path(monkeypatch):
    monkeypatch.delenv("PROMPT_EDIT_FILE_PATH", raising=False)
    get_edit_prompt_loader.cache_clear()
    loader = get_edit_prompt_loader()

    assert loader.file_path.name == "prompt-edit.md"
    assert loader.file_path.parent.name == "prompts"
    assert loader.file_path.exists()


def test_suggestions_prompt_loader_default_path(monkeypatch):
    monkeypatch.delenv("PROMPT_SUGGESTIONS_FILE_PATH", raising=False)
    get_suggestions_prompt_loader.cache_clear()
    loader = get_suggestions_prompt_loader()

    assert loader.file_path.name == "prompt-suggestions.md"
    assert loader.file_path.parent.name == "prompts"
    assert loader.file_path.exists()
