# Implementation Plan: PRD Document Export and Copy Fix

**Branch**: `001-export-docs` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-export-docs/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

为PRD生成器应用添加文档导出功能，包括：
1. **修复复制按钮**：改进Clipboard API实现，添加降级方案
2. **PDF导出**：使用html2pdf.js客户端生成PDF，保留Markdown格式
3. **DOCX导出**：使用docx库生成可编辑的Word文档

技术方案：纯前端实现，无需后端API支持。使用html2pdf.js（~100 KB gzipped）和docx v9（~80-100 KB gzipped），总bundle增加约200 KB，符合性能要求。

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), React 19, Next.js 16
**Primary Dependencies**: html2pdf.js (PDF export), docx v9 (DOCX export), marked (Markdown parsing)
**Storage**: 无持久化存储（纯客户端操作）
**Testing**: Vitest + React Testing Library
**Target Platform**: 现代浏览器（Chrome 66+, Firefox 63+, Safari 13.1+, Edge 79+）
**Project Type**: Web应用（前后端分离）
**Performance Goals**: 标准文档（<5000字）在5秒内完成导出
**Constraints**:
  - 必须支持中英文混合内容
  - 必须符合WCAG 2.1 AA可访问性标准
  - Bundle增加控制在250 KB以内
**Scale/Scope**:
  - 单页面功能（ChatMessage组件）
  - 预期文档大小：1,000-10,000字
  - 用户并发：无（客户端操作）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### General Principles

| Principle | Status | Notes |
|-----------|--------|-------|
| Monorepo | ✅ PASS | 单一仓库，frontend目录包含所有前端代码 |
| 接口契约（SSOT） | ✅ PASS | TypeScript接口作为唯一事实来源，定义在 `contracts/frontend-interfaces.md` |
| API契约生成一致性 | N/A | 无后端API，纯前端实现 |
| 分层架构 | ✅ PASS | 组件层 → 服务层，无跨层依赖 |
| 语言规范 | ✅ PASS | 所有人工维护内容使用简体中文 |
| 前后端分离 | ✅ PASS | 前端仅负责UI/交互，无业务逻辑，无数据验证 |
| Code Style | ✅ PASS | TypeScript strict模式，React Hooks标准模式 |
| 测试策略 | ✅ PASS | 单元测试覆盖导出服务，集成测试覆盖组件 |
| 路径规范 | ✅ PASS | 所有代码使用相对路径 |
| 变更影响追踪 | ⚠️ NOTE | 本功能不涉及跨模块依赖，无需更新 `.sync-map.md` |

### MCP

| Principle | Status | Notes |
|-----------|--------|-------|
| MCP context7 | ✅ PASS | 研究阶段使用context7获取库文档 |

### 设计规范

| Principle | Status | Notes |
|-----------|--------|-------|
| 前端设计 | ⚠️ DEFER | 可选：使用frontend-design技能优化UI/UX |
| 数据库设计 | N/A | 无数据库 |

### Gate Result: ✅ PASS

所有适用的constitution原则通过审核，可继续实施。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── chat-message.tsx        # 修改：添加导出按钮
│   │   └── export/                 # 新增：导出组件
│   │       ├── export-button.tsx
│   │       ├── progress-modal.tsx
│   │       └── warning-modal.tsx
│   ├── lib/
│   │   └── export/                 # 新增：导出服务
│   │       ├── export-pdf.ts
│   │       ├── export-docx.ts
│   │       ├── export-copy.ts
│   │       ├── markdown-parser.ts
│   │       └── index.ts
│   ├── hooks/
│   │   └── use-export.ts           # 新增：导出Hook
│   ├── types/
│   │   └── export.ts               # 新增：导出类型
│   └── utils/
│       ├── file.ts                 # 新增：文件工具
│       └── validation.ts           # 新增：验证工具
└── tests/
    ├── unit/
    │   ├── lib/
    │   │   └── export/             # 导出服务单元测试
    │   └── hooks/
    │       └── use-export.test.ts
    └── integration/
        └── components/
            └── chat-message.test.tsx
```

**Structure Decision**: Web应用结构（前后端分离）。本功能仅涉及frontend目录，添加导出服务层、组件层和自定义Hook。无后端变更。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无需填写 - Constitution Check全部通过，无违规需要论证。
