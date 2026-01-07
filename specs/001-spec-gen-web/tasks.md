# Tasks: Specification Generator Web Application

**Feature**: Specification Generator Web Application (`001-spec-gen-web`)
**Status**: Planned

## Phase 1: Environment & Project Setup

**Goal**: Initialize the monorepo structure, set up Docker environment, and configure basic frontend/backend frameworks.

- [x] T001 [P] 初始化 frontend Next.js 16 项目，包含 TypeScript 和 Tailwind CSS v4 配置 (`frontend/package.json`)
- [x] T002 [P] 初始化 backend FastAPI 项目，创建标准目录结构和依赖文件 (`backend/pyproject.toml`, `backend/src/`)
- [x] T003 创建 `docker-compose.yml` 和 `Dockerfile`，确保 `speckit.specify.md` 可被后端服务访问 (`docker-compose.yml`)
- [x] T004 [P] 配置开发环境代码规范工具 (`ruff` for python, `eslint` for js) (`backend/pyproject.toml`, `frontend/.eslintrc.json`)

## Phase 2: Foundation & Infrastructure

**Goal**: Establish the core data models, API clients, and service integrations required for the feature.

- [x] T005 [P] 在后端实现 `data-model.md` 中定义的 Pydantic 模型 (`GenerationRequest`, `GenerationResponse`) (`backend/src/models/schemas.py`)
- [x] T006 [P] 实现 `PromptLoader` 服务，用于安全读取和缓存系统提示词文件 (`backend/src/core/prompt_loader.py`)
- [x] T007 实现 `LLMService` 类，集成 `dashscope` SDK 以调用 Aliyun Qwen 模型 (`backend/src/services/llm_service.py`)
- [x] T008 [P] 在前端实现 API 客户端，定义与后端契约匹配的 TypeScript 类型 (`frontend/src/services/api.ts`)

## Phase 3: User Story 1 - Generate Specification

**Goal**: Enable users to input a description, generate a specification, and view/copy the result.
**Independent Test**: User can enter text, see streaming markdown output, and copy it.

- [x] T009 [US1] 实现 `/api/v1/generate` 接口，支持 `StreamingResponse` 流式输出 (`backend/src/api/endpoints.py`)
- [x] T010 [US1] 为 `/generate` 接口编写集成测试，Mock LLM 服务以验证流式响应 (`backend/tests/integration/test_generate.py`)
- [x] T011 [P] [US1] 创建 `InputForm` 组件，包含文本输入区域和提交按钮，并进行输入验证 (`frontend/src/components/input-form.tsx`)
- [x] T012 [P] [US1] 创建 `MarkdownPreview` 组件，使用 `react-markdown` 和 `remark-gfm` 渲染 Markdown 内容 (`frontend/src/components/markdown-preview.tsx`)
- [x] T013 [US1] 在 `MarkdownPreview` 组件中实现“一键复制”功能 (`frontend/src/components/markdown-preview.tsx`)
- [x] T014 [US1] 在主页面集成 `InputForm` 和 `MarkdownPreview`，实现流式数据接收和实时更新状态 (`frontend/src/app/page.tsx`)

## Phase 4: User Story 2 - Vague Descriptions & Edge Cases

**Goal**: Ensure the system handles vague inputs gracefully by generating clarification markers and managing errors.
**Independent Test**: Sending a vague prompt results in output containing "[NEEDS CLARIFICATION]".

- [x] T015 [US2] 优化 `LLMService` 的 Prompt 构建逻辑，确保能够正确触发“需要澄清”的机制 (`backend/src/services/llm_service.py`)
- [x] T016 [US2] 在后端添加全局异常处理中间件，捕获 LLM 调用失败等错误并返回友好提示 (`backend/src/main.py`)
- [x] T017 [US2] 在前端主页面实现错误状态展示 UI (`frontend/src/app/page.tsx`)
- [x] T018 [US2] 编写端到端测试场景，验证模糊输入是否生成包含 `[NEEDS CLARIFICATION]` 的标记 (`tests/e2e/test_clarification.py` or manual verification script)

## Phase 5: Polish & Documentation

**Goal**: Final styling adjustments and documentation for handoff.

- [x] T019 对前端界面进行最终的 Tailwind 样式调整，确保响应式布局美观 (`frontend/src/app/globals.css`)
- [x] T020 更新 `README.md`，添加项目启动说明和开发指南，引用 `quickstart.md` (`README.md`)
- [x] T021 运行所有代码检查和测试，确保项目质量符合标准 (`run_tests.sh` or equivalent)

## Dependencies & Execution Strategy

**Critical Path**: Setup -> Backend Core -> Backend API -> Frontend Integration.

**Parallel Opportunities**:
- Frontend components (T011, T012) can be built while Backend API (T009) is being developed.
- Data models (T005) and API Client (T008) can be defined concurrently based on `data-model.md`.

**Implementation Strategy**:
1.  **MVP**: Complete Phases 1, 2, and 3 to get the core "Input -> Gen -> Output" flow working.
2.  **Refinement**: Add Phase 4 error handling and edge cases.
