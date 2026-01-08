# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-round chat application that generates standardized PRD (Product Requirement Document) specifications from natural language descriptions using LLMs. The app features instant streaming Markdown output, automatic clarification of ambiguous requirements, and standardized formatting following project templates.

## Technology Stack

- **Backend**: FastAPI (Python 3.12), DashScope SDK (通义千问/Qwen), Poetry for dependency management
- **Frontend**: Next.js 16, TypeScript 5.x, Tailwind CSS v4, React 19
- **Infrastructure**: Docker & Docker Compose

## Architecture

### Backend (`backend/src/`)

The backend is a FastAPI application with a clean architecture:

- `main.py`: FastAPI app entry point with CORS middleware, global exception handlers, and health check endpoint
- `api/endpoints.py`: API routes with three generation modes:
  - `generate`: Initial PRD generation from scratch
  - `suggest`: Lightweight modification suggestions/discussion (doesn't create new version)
  - `regenerate`: Creates complete new PRD version incorporating suggested modifications
- `services/llm_service.py`: LLM integration using DashScope SDK
  - Handles streaming responses with NDJSON event format
  - Events: `content`, `reasoning`, `error`, `usage`
  - Supports optional reasoning output via `ENABLE_THINKING` env var
- `core/prompt_loader.py`: Loads system prompts from `/prompts/` directory
  - Three prompt types: `prompt.md` (generate), `prompt-edit.md` (regenerate), `prompt-suggestions.md` (suggest)
  - Uses `lru_cache` for prompt loading efficiency
- `models/schemas.py`: Pydantic models for request/response validation

### Frontend (`frontend/src/`)

Next.js app with a chat-based interface:

- `app/page.tsx`: Main chat interface with three-mode flow:
  - **Generate mode**: First PRD generation (version 1)
  - **Suggest mode**: Default for user feedback after initial PRD (lightweight discussion, no version increment)
  - **Regenerate mode**: Triggered by keywords like "生成新版", creates new PRD version from discussion
- `components/chat-message.tsx`: Message rendering with Markdown support
- `components/chat-input.tsx`: Input with send/stop controls
- `hooks/useStreamParser.ts`: Parses NDJSON event stream
- `services/api.ts`: Backend API client with streaming support

**Mode Detection Logic**: Keywords like "生成新版", "整合修改", "输出完整版" trigger regenerate mode. Otherwise defaults to suggest mode for iterative discussion.

### Prompts (`prompts/`)

System prompts are mounted as read-only volumes in Docker:
- `prompt.md`: Initial PRD generation
- `prompt-edit.md`: PRD regeneration with modifications
- `prompt-suggestions.md`: Lightweight modification suggestions

## Development Commands

### Using Docker Compose (Recommended)

Required: Create `.env` file in project root with:
```bash
DASHSCOPE_API_KEY=your_key_here
```

Start both services:
```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:23456
- Backend: http://localhost:28000
- API docs: http://localhost:28000/docs

### Backend Local Development

```bash
cd backend

# Install dependencies (requires Poetry)
poetry install

# Run tests
poetry run pytest

# Run specific test
poetry run pytest tests/unit/test_llm_service.py -v

# Lint
poetry run ruff check .

# Format
poetry run ruff format .

# Run dev server (requires .env with DASHSCOPE_API_KEY)
poetry run uvicorn src.main:app --reload --port 8000
```

### Frontend Local Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm run test

# Lint
npm run lint

# Build for production
npm run build
```

**Environment**: Set `NEXT_PUBLIC_API_URL` to backend URL (defaults to `http://localhost:8000/api/v1`)

## Key Environment Variables

**Backend** (`.env` in project root):
- `DASHSCOPE_API_KEY` (required): DashScope API key for LLM access
- `DASHSCOPE_MODEL`: Model name (default: `deepseek-v3.2`)
- `ENABLE_THINKING`: Enable reasoning output (default: `false`)
- `DEBUG_ERRORS`: Show detailed error messages (default: `false`)
- `ALLOWED_ORIGINS`: CORS allowed origins (default: `http://localhost:3000`)
- `UVICORN_RELOAD`: Enable auto-reload in Docker (set in docker-compose.yml)

**Frontend** (set in docker-compose.yml or locally):
- `NEXT_PUBLIC_API_URL`: Backend API base URL

## Testing

Backend tests use pytest with fixtures in `tests/conftest.py`:
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`

Frontend tests use Vitest with React Testing Library.

## Important Patterns

1. **Streaming Response Format**: Backend sends NDJSON events, frontend parses with `useStreamParser` hook
2. **Version Tracking**: Frontend tracks PRD versions, only incremented for `generate` and `regenerate` modes
3. **Prompt Loading**: Prompts are loaded from files, not hardcoded. Modify `prompts/*.md` to change LLM behavior
4. **CORS Configuration**: Backend parses comma-separated origins, handles wildcard (`*`)
5. **Session Tracking**: Optional `session_id` parameter tracks conversations for logging/analytics

## Active Technologies
- Python 3.12, TypeScript 5.x + FastAPI, LangChain (langchain-community), Next.js 16, React 19 (001-chat-context)
- N/A（无持久化存储，对话历史在前端内存中管理） (001-chat-context)

## Recent Changes
- 001-chat-context: Added Python 3.12, TypeScript 5.x + FastAPI, LangChain (langchain-community), Next.js 16, React 19
