# Implementation Plan: 多轮对话上下文

**Branch**: `001-chat-context` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-chat-context/spec.md`

## Summary

在 chat 模式下实现多轮对话上下文支持，使 LLM 能够理解用户的上下文指代（如"第一个建议"、"刚才说的"）。同时将 LLM 调用框架从 DashScope SDK 迁移到 LangChain，以便更好地管理 AI 模型调用和对话历史。

## Technical Context

**Language/Version**: Python 3.12, TypeScript 5.x
**Primary Dependencies**: FastAPI, LangChain (langchain-community), Next.js 16, React 19
**Storage**: N/A（无持久化存储，对话历史在前端内存中管理）
**Testing**: pytest（后端）, Vitest（前端）
**Target Platform**: Docker 容器化部署，Web 应用
**Project Type**: Web 应用（前后端分离）
**Performance Goals**: 响应延迟增加不超过 10%
**Constraints**: Token 消耗增加控制在 500-1000 tokens
**Scale/Scope**: 2 轮对话历史（4 条消息）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| Monorepo | ✅ Pass | 所有代码在同一仓库 |
| 接口契约（SSOT） | ✅ Pass | ChatMessage Schema 作为契约 |
| API 契约生成一致性 | ✅ Pass | FastAPI 自动生成 OpenAPI |
| 分层架构 | ✅ Pass | 前端 → API → LLM Service 层次清晰 |
| 语言规范 | ✅ Pass | 规格和文档使用简体中文 |
| 前后端分离 | ✅ Pass | 前端负责 UI，后端负责 LLM 调用 |
| Code Style | ✅ Pass | Python PEP 8, React Hooks |
| 测试策略 | ✅ Pass | 集成测试覆盖核心链路 |
| 路径规范 | ✅ Pass | 使用相对路径 |
| 容器化测试 | ✅ Pass | Docker Compose 环境 |

## Project Structure

### Documentation (this feature)

```text
specs/001-chat-context/
├── spec.md              # 功能规格
├── plan.md              # 本文件
├── research.md          # Phase 0 研究输出
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速开始指南
├── contracts/           # Phase 1 API 契约
└── tasks.md             # Phase 2 任务清单（/speckit.tasks 生成）
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── schemas.py         # 新增 ChatMessage 模型
│   ├── services/
│   │   └── llm_service.py     # 重构为 LangChain 实现
│   └── api/
│       └── endpoints.py       # 传递 chat_history 参数
└── tests/
    ├── integration/
    │   └── test_generate.py   # 更新测试
    └── unit/
        └── test_llm_service.py # 新增 LangChain 测试

frontend/
├── src/
│   ├── app/
│   │   └── page.tsx           # 新增 getChatHistory 函数
│   └── services/
│       └── api.ts             # 新增 chatHistory 参数
└── tests/

prompts/
└── prompt-chat.md             # 更新输入说明
```

**Structure Decision**: 沿用现有 Web 应用结构（frontend/ + backend/），修改现有文件

## Complexity Tracking

无需特殊复杂度记录，未违反任何 Constitution 原则。

---

## Phase 0: Research (完成)

**输出**: [research.md](./research.md)

**关键决策**:
1. 使用 LangChain `ChatTongyi` 替换 DashScope SDK 直接调用
2. 使用同步 `stream()` 方法实现流式输出
3. 消息顺序：SystemMessage → PRD(HumanMessage) → 确认(AIMessage) → 历史 → 最新消息
4. 添加 `langchain>=0.3.0` 和 `langchain-community>=0.3.0` 依赖

---

## Phase 1: Design (完成)

**输出**:
- [data-model.md](./data-model.md) - ChatMessage 实体定义
- [contracts/api.yaml](./contracts/api.yaml) - API 契约变更
- [quickstart.md](./quickstart.md) - 快速开始指南

**Constitution Re-check**: ✅ 所有原则继续通过

---

## 下一步

运行 `/speckit.tasks` 生成任务清单。
