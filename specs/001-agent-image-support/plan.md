# Implementation Plan: Agent 框架调整与图片支持

**Branch**: `001-agent-image-support` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-agent-image-support/spec.md`

## Summary

扩展现有 PRD 生成系统，支持用户上传图片（UI 设计稿、流程图等）作为输入，结合 DashScope Qwen-VL 多模态模型生成更精准的 PRD 文档。采用 Base64 编码传输图片，保持全量上下文重新生成架构。

## Technical Context

**Language/Version**: Python 3.12, TypeScript 5.x
**Primary Dependencies**: FastAPI, DashScope SDK (dashscope>=1.24.6), Next.js 16, React 19
**Storage**: N/A（无持久化，图片仅在请求生命周期内使用）
**Testing**: pytest (backend), Vitest (frontend)
**Target Platform**: Docker 容器化 Web 应用
**Project Type**: Web 应用（前后端分离）
**Performance Goals**: 图片预览 3 秒内，首次响应 5 秒内
**Constraints**: 单张图片 ≤10MB，单次请求 ≤5 张图片
**Scale/Scope**: 100 并发请求

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| Monorepo | ✅ Pass | 所有代码在同一仓库 |
| 接口契约（SSOT） | ✅ Pass | API 使用 Pydantic Schema 定义 |
| API 契约生成一致性 | ✅ Pass | FastAPI 自动生成 OpenAPI |
| 分层架构 | ✅ Pass | 保持现有 api/services/models 分层 |
| 语言规范 | ✅ Pass | 文档使用简体中文 |
| 前后端分离 | ✅ Pass | 前端仅负责 UI，后端处理 LLM 调用 |
| Code Style | ✅ Pass | Python PEP8, TypeScript strict |
| 测试策略 | ✅ Pass | 集成测试为主 |
| 路径规范 | ✅ Pass | 使用相对路径 |
| MCP context7 | ✅ Pass | 已使用 context7 查询 DashScope MultiModalConversation API |

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-image-support/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   └── endpoints.py         # 修改：支持 multipart/form-data 或 JSON 图片
│   ├── models/
│   │   └── schemas.py           # 修改：新增 ImageAttachment, MultimodalMessage
│   ├── services/
│   │   └── llm_service.py       # 修改：调用 Qwen-VL MultiModalConversation API
│   └── core/
│       └── prompt_loader.py     # 无需修改：提示词已直接在 prompt.md 中调整
└── tests/
    ├── integration/
    │   └── test_image_generation.py  # 新增：图片生成集成测试
    └── unit/
        └── test_image_processing.py  # 新增：图片处理单元测试

frontend/
├── src/
│   ├── components/
│   │   ├── chat-input.tsx       # 修改：添加图片上传功能
│   │   ├── image-preview.tsx    # 新增：图片预览组件
│   │   └── image-upload.tsx     # 新增：图片上传组件
│   ├── app/
│   │   └── page.tsx             # 修改：集成图片状态管理
│   ├── hooks/
│   │   └── useImageUpload.ts    # 新增：图片上传 Hook
│   └── services/
│       └── api.ts               # 修改：支持图片数据传输
└── tests/
    └── components/
        └── image-upload.test.tsx # 新增

prompts/
├── prompt.md                    # 修改：支持图片理解指令
└── prompt-chat.md               # 修改：支持图片理解指令
```

**Structure Decision**: 使用现有 Web 应用结构（Option 2），在前后端分别扩展图片处理能力。

## Complexity Tracking

无需记录，Constitution Check 全部通过，无违规项。

## Phase 0: Research Findings

### DashScope Qwen-VL API 调用方式

**Decision**: 使用 `dashscope.MultiModalConversation.call()` API

**Rationale**:
- 现有代码使用 `dashscope.Generation.call()`，仅支持文本
- Qwen-VL 多模态需要使用 `MultiModalConversation` 接口
- 消息格式需要从字符串改为 content 数组结构

**API 对比**:

| 现有 (Generation.call) | 新增 (MultiModalConversation.call) |
|------------------------|-------------------------------------|
| `messages=[Message(role="user", content="text")]` | `messages=[{"role": "user", "content": [{"image": "base64..."}, {"text": "prompt"}]}]` |

**代码示例**:
```python
messages = [
    {
        "role": "user",
        "content": [
            {"image": f"data:image/png;base64,{base64_image}"},
            {"text": "描述图片内容..."},
        ],
    },
]
response = dashscope.MultiModalConversation.call(
    model="qwen-vl-plus",
    messages=messages,
)
```

### 提示词调整需求

**Decision**: 需要调整提示词，增加图片理解指令

**Rationale**:
- 现有提示词假设输入仅为文本描述
- 需要指导模型如何结合图片内容生成 PRD
- 图片类型主要是 UI 设计稿、流程图，需要针对性引导

**已完成调整** (2026-01-14):
1. `prompt.md`:
   - 新增 Input 部分的图片输入说明
   - 新增图片理解策略（竞品截图、设计稿、流程图分析）
   - 调整 Execution Flow 支持图片优先分析和纯图片输入
2. `prompt-chat.md`:
   - 新增参考图片输入说明
   - 新增图片在对话中的作用说明

**关键设计决策**:
- 竞品表述：功能背景可提及参考来源，功能需求使用抽象化描述
- 纯图片输入：允许，AI 自动推断并在"待确认/假设"章节标注
- 图文冲突：文字描述优先

### 前端图片处理方案

**Decision**: 前端 Base64 编码，随 JSON 请求发送

**Rationale**:
- 单张图片最大 10MB，Base64 后约 13.3MB，在可接受范围
- 避免引入额外文件存储服务
- 实现简单，与现有 API 结构兼容

**Alternatives Rejected**:
- FormData + multipart: 需要修改 API 格式，增加复杂度
- 临时存储 + URL: 需要额外存储服务，增加运维成本

### 模型选择

**Decision**: 使用 `qwen-vl-plus` 或 `qwen2.5-vl-7b-instruct`

**Rationale**:
- DashScope 提供多个 Qwen-VL 版本
- `qwen-vl-plus` 是通用版本，平衡性能和成本
- 需要通过环境变量 `DASHSCOPE_VL_MODEL` 配置，保持灵活性

## Phase 1: Design Artifacts

详见以下文件:
- [data-model.md](./data-model.md)
- [contracts/api.yaml](./contracts/api.yaml)
- [quickstart.md](./quickstart.md)
