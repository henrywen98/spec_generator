# Tasks: 多轮对话上下文

**Input**: Design documents from `/specs/001-chat-context/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 功能规格未明确要求测试，测试任务作为 Polish 阶段可选项。

**Organization**: 任务按用户故事分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属用户故事 (e.g., US1, US2)
- 描述中包含精确文件路径

## 路径约定

- **Web 应用**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup（共享基础设施）

**目的**: 项目初始化和 LangChain 依赖配置

- [x] T001 在 backend/pyproject.toml 中添加 langchain>=0.3.0 和 langchain-community>=0.3.0 依赖
- [x] T002 验证 DASHSCOPE_API_KEY 环境变量配置正确

---

## Phase 2: Foundational（阻塞性前置条件）

**目的**: 必须在任何用户故事实现之前完成的核心基础设施

**⚠️ 关键**: 此阶段完成前不能开始用户故事工作

- [x] T003 [P] 在 backend/src/models/schemas.py 中创建 ChatMessage Pydantic 模型
- [x] T004 [P] 在 backend/src/models/schemas.py 中更新 GenerationRequest 模型，添加 chat_history 字段
- [x] T005 在 backend/src/services/llm_service.py 中将 DashScope SDK 重构为 LangChain ChatTongyi
- [x] T006 在 backend/src/services/llm_service.py 中实现消息列表构建函数（SystemMessage → PRD → 确认 → 历史 → 最新消息）
- [x] T007 在 backend/src/api/endpoints.py 中更新 generate 端点，传递 chat_history 给 llm_service

**检查点**: 基础设施就绪 - LangChain 集成完成，可以开始用户故事实现

---

## Phase 3: User Story 1 - 引用之前的建议 (Priority: P1) 🎯 MVP

**目标**: 使 AI 能理解上下文引用，如"第一个建议可以，第二个不行"

**独立测试**: 发送两轮对话后，用"第一个建议可以"引用之前内容验证

### User Story 1 实现

- [x] T008 [P] [US1] 在 frontend/src/app/page.tsx 中添加 getChatHistory 函数，收集最近 2 轮对话
- [x] T009 [P] [US1] 在 frontend/src/app/page.tsx 中实现消息过滤逻辑（排除 ❌ 错误、⏹️ 中断、version PRD、streaming 消息）
- [x] T010 [US1] 在 frontend/src/services/api.ts 中更新 API 服务，添加 chatHistory 参数
- [x] T011 [US1] 在 frontend/src/app/page.tsx 中将 getChatHistory 集成到 chat 模式请求流程
- [x] T012 [US1] 在 prompts/prompt-chat.md 中更新文档，说明 chat_history 输入格式

**检查点**: User Story 1 功能完整 - AI 能理解"第一个建议"引用

---

## Phase 4: User Story 2 - 连续追问细节 (Priority: P2)

**目标**: 使 AI 能理解追问问题，如"为什么要删这条"

**独立测试**: 收到 AI 建议后，追问"为什么"验证 AI 理解上下文

### User Story 2 实现

- [x] T013 [US2] 在 frontend/src/app/page.tsx 中实现 PRD 上下文替换（生成新版本时替换为新 PRD）
- [x] T014 [US2] 在 backend/src/services/llm_service.py 中验证消息顺序符合规格（PRD 第一位 → 历史 → 最新），并确认 current_prd 参数接收新版本时自动使用（FR-009）
- [x] T015 [US2] 在 backend/src/models/schemas.py 中添加 chat_history 最大长度验证（4 条消息）

**检查点**: User Story 1 和 2 均可工作 - AI 维护完整对话上下文

---

## Phase 5: Polish（跨功能优化）

**目的**: 影响多个用户故事的改进

- [x] T016 [P] 在 backend/tests/integration/test_generate.py 中更新现有集成测试，覆盖 chat_history 场景
- [x] T017 [P] 在 backend/tests/unit/test_llm_service.py 中添加 LangChain 消息构建器单元测试
- [x] T018 运行 quickstart.md 验证场景，包括响应延迟对比测试

---

## 依赖关系与执行顺序

### Phase 依赖

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - 阻塞所有用户故事
- **User Stories (Phase 3+)**: 均依赖 Foundational 阶段完成
- **Polish (Phase 5)**: 依赖所有用户故事完成

### User Story 依赖

- **User Story 1 (P1)**: Foundational (Phase 2) 完成后可开始 - 不依赖其他故事
- **User Story 2 (P2)**: Foundational (Phase 2) 完成后可开始 - 独立，但验证 US1 行为

### 各 User Story 内部

- 前端和后端任务通常可并行
- 模型先于服务
- 服务先于端点
- 核心实现先于集成

### 并行机会

- T003 和 T004 可并行（同一文件但不同模型定义）
- T008 和 T009 可并行（同一文件但不同函数）
- T016 和 T017 可并行（不同测试文件）

---

## 并行示例: Phase 2 (Foundational)

```bash
# 并行启动模型更新:
Task: "在 backend/src/models/schemas.py 中创建 ChatMessage Pydantic 模型"
Task: "在 backend/src/models/schemas.py 中更新 GenerationRequest 模型"
```

## 并行示例: User Story 1

```bash
# 并行启动前端任务:
Task: "在 frontend/src/app/page.tsx 中添加 getChatHistory 函数"
Task: "在 frontend/src/app/page.tsx 中实现消息过滤逻辑"
```

---

## 实现策略

### MVP 优先 (仅 User Story 1)

1. 完成 Phase 1: Setup（添加依赖）
2. 完成 Phase 2: Foundational（LangChain 迁移，API 变更）
3. 完成 Phase 3: User Story 1（前端历史收集）
4. **暂停验证**: 用"第一个建议可以"测试引用功能
5. 准备就绪则部署/演示

### 增量交付

1. 完成 Setup + Foundational → LangChain 集成就绪
2. 添加 User Story 1 → 测试"引用之前的建议" → 部署/演示 (MVP!)
3. 添加 User Story 2 → 测试"连续追问细节" → 部署/演示
4. 每个故事独立增加价值，不破坏之前功能

---

## 备注

- [P] 任务 = 不同文件或独立函数，无依赖
- [Story] 标签映射任务到特定用户故事，便于追溯
- 每个用户故事应可独立完成和测试
- 每个任务或逻辑组完成后提交
- 在任何检查点可暂停验证故事独立性
