# Research: Specification Generator Web Application

**Branch**: `001-spec-gen-web` | **Date**: 2026-01-07
**Context**: Researching best practices for Single-Turn Conversation App with Markdown output.

## Technical Decisions

### 1. Backend Stack: FastAPI + DashScope
- **Decision**: Use **FastAPI** as the web framework and **DashScope** (Aliyun Qwen) as the LLM provider.
- **Rationale**:
    - FastAPI is the standard for high-performance Python APIs and supports async streaming natively (`StreamingResponse`).
    - DashScope (via `dashscope` SDK) provides access to high-quality Qwen models (e.g., `qwen-turbo`, `qwen-plus`) with native Python streaming support.
    - Code-first API contract generation via Pydantic + FastAPI.
- **Alternatives Considered**:
    - **Google GenAI**: Originally planned, but replaced by DashScope per user request.
    - **OpenAI**: Good, but project defaults to DashScope environment.

### 2. Frontend Stack: Next.js 16 + Tailwind v4
- **Decision**: Use **Next.js 16 (App Router)** with **Tailwind CSS v4** and **React 19**.
- **Rationale**:
    - Reference repo uses this modern stack.
    - React Server Components (RSC) simplify data fetching (though less relevant for client-side streaming).
    - Tailwind v4 is the future-proof choice for styling.
- **Alternatives Considered**:
    - **Vite + React**: Simpler, but lacks the standardized structure of Next.js for "monorepo-like" separation.

### 3. Markdown Rendering: react-markdown + remark-gfm
- **Decision**: Use `react-markdown` with `remark-gfm` plugin.
- **Rationale**:
    - Standard community choice for rendering Markdown in React.
    - `remark-gfm` provides critical support for Tables, Strikethrough, and Task Lists, which are mandatory for the Spec format.
- **Implementation Note**:
    ```tsx
    <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    ```

### 4. Streaming Strategy: Server-Sent Events (SSE) vs Raw Stream
- **Decision**: Use **Raw Text Stream** (Chunked Transfer Encoding) via `StreamingResponse`.
- **Rationale**:
    - For a single-turn generation where the only output is text, complex SSE event structures are unnecessary overhead.
    - The frontend can simply read the `response.body` reader.
- **Alternatives Considered**:
    - **SSE (`sse-starlette`)**: Good for multi-event streams (e.g., status updates + text), but overkill here.
    - **WebSocket**: Too complex for a single request-response flow.

### 5. Testing Strategy
- **Backend**: `pytest` with `TestClient`. Integration tests for the `/generate` endpoint.
- **Frontend**: `vitest` + `react-testing-library` to test the Input form and Markdown rendering.

## Prompt Integration
- The file `speckit.specify.md` must be read at startup or on request.
- It will be injected as a "System Prompt" or "User Prompt" prefix depending on the model's preferred API structure.

## Unknowns Resolved
- **Tailwind v4 Config**: Will use standard Next.js 16 setup.
- **Streaming**: Confirmed FastAPI `StreamingResponse` is capable.
