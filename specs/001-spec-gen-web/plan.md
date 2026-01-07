# Implementation Plan: Specification Generator Web Application

**Branch**: `001-spec-gen-web` | **Date**: 2026-01-07 | **Spec**: [specs/001-spec-gen-web/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-spec-gen-web/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个基于 Web 的单轮对话应用，允许用户输入自然语言需求，后端利用 LLM 及预设的 `speckit.specify.md` Prompt 生成标准化的 PRD 文档（Markdown 格式），并在前端实时预览。

## Technical Context

**Language/Version**: Python 3.12 (Backend), TypeScript 5.x (Frontend)
**Primary Dependencies**: 
- Backend: FastAPI, DashScope (Qwen), Pydantic
- Frontend: Next.js 16 (App Router), Tailwind CSS v4, React 19, react-markdown
**Storage**: N/A (Stateless single-turn)
**Testing**: 
- Backend: Pytest (Integration)
- Frontend: Vitest / React Testing Library
**Target Platform**: Localhost (Dockerized)
**Project Type**: Web Application (Monorepo)
**Performance Goals**: <30s generation time (Streaming response preferred for UX)
**Constraints**: Must use existing `speckit.specify.md` as the system prompt.
**Scale/Scope**: Single feature MVP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Monorepo**: Frontend and Backend in `src/` or top-level directories (aligned with ref repo).
- [x] **SSOT**: API contracts defined via Pydantic Models (Backend as SSOT).
- [x] **Code-first API**: FastAPI auto-generates OpenAPI.
- [x] **Layered Architecture**: Service/Controller separation in Backend.
- [x] **Language Specification**: Plan and Specs in Simplified Chinese.
- [x] **Frontend/Backend Separation**: Distinct projects.
- [x] **Code Style**: PEP 8 & React Hooks.
- [x] **Test Strategy**: Integration tests for API, component tests for UI.

## Project Structure

### Documentation (this feature)

```text
specs/001-spec-gen-web/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py
│   ├── api/
│   │   └── endpoints.py
│   ├── core/
│   │   ├── config.py
│   │   └── prompt_loader.py
│   ├── models/
│   │   └── schemas.py
│   └── services/
│       └── llm_service.py
└── tests/
    └── integration/

frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── input-form.tsx
│   │   └── markdown-preview.tsx
│   └── services/
│       └── api.ts
└── tests/
```

**Structure Decision**: Adopting the `backend/` and `frontend/` top-level structure to match the reference repository `audit-financial`, ensuring clear separation of concerns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |