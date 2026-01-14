import os
import sys
from pathlib import Path

# Set a dummy API key for tests to avoid dependency injection errors
os.environ.setdefault("DASHSCOPE_API_KEY", "test-api-key-for-ci")

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
