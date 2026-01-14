import os
from functools import lru_cache
from pathlib import Path


class PromptLoader:
    def __init__(self, file_path: str = None):
        self.file_path = file_path or os.getenv("PROMPT_FILE_PATH")
        if not self.file_path:
            # Fallback for local dev if env not set
            repo_root = Path(__file__).resolve().parents[3] # up from src/core/ -> backend/ -> repo/
            self.file_path = repo_root / "prompts" / "prompt.md"

        self.file_path = Path(self.file_path)

    def load_prompt(self) -> str:
        if not self.file_path.exists():
            raise FileNotFoundError(f"Prompt file not found at: {self.file_path}")

        with open(self.file_path, encoding="utf-8") as f:
            return f.read()

@lru_cache
def get_prompt_loader() -> PromptLoader:
    """Loader for generate mode (from scratch)."""
    return PromptLoader()

@lru_cache
def get_chat_prompt_loader() -> PromptLoader:
    """Loader for chat mode (discuss/modify existing PRD)."""
    chat_path = os.getenv("PROMPT_CHAT_FILE_PATH")
    if not chat_path:
        repo_root = Path(__file__).resolve().parents[3]
        chat_path = repo_root / "prompts" / "prompt-chat.md"
    return PromptLoader(str(chat_path))

