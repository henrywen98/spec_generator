import os
from pathlib import Path
from functools import lru_cache

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
        
        with open(self.file_path, "r", encoding="utf-8") as f:
            return f.read()

@lru_cache()
def get_prompt_loader() -> PromptLoader:
    return PromptLoader()

@lru_cache()
def get_edit_prompt_loader() -> PromptLoader:
    edit_path = os.getenv("PROMPT_EDIT_FILE_PATH")
    if not edit_path:
        repo_root = Path(__file__).resolve().parents[3]
        edit_path = repo_root / "prompts" / "prompt-edit.md"
    return PromptLoader(str(edit_path))

@lru_cache()
def get_suggestions_prompt_loader() -> PromptLoader:
    suggestions_path = os.getenv("PROMPT_SUGGESTIONS_FILE_PATH")
    if not suggestions_path:
        repo_root = Path(__file__).resolve().parents[3]
        suggestions_path = repo_root / "prompts" / "prompt-suggestions.md"
    return PromptLoader(str(suggestions_path))

