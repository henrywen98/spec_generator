<!--
SYNC IMPACT REPORT
Version: 0.0.0 -> 1.0.0
Type: Major (Initial Ratification & Strict Standards)

Modified Principles:
- Added "Monorepo" (Single repo, explicit deps)
- Added "SSOT" (DTO/Schema driven)
- Added "Code-first API" (No manual JSON)
- Added "Layered Architecture" (Clear boundaries)
- Added "Language Specification" (Mandatory Simplified Chinese for specs/tasks)
- Added "Frontend/Backend Separation" (UI vs Business Logic)
- Added "Code Style" (PEP 8, React Hooks)
- Added "Test Strategy" (Integration > E2E/Unit)
- Added "Path Conventions" (Relative paths default)
- Added "MCP & GLM Rules" (Context7, Web Search, Visual constraints)
- Added "Design Standards" (Skills frontend-design, database-design)
- Added "Containerized Testing" (Docker environment)

Templates Impact (⚠ Pending Manual Review for Language Compliance):
- .specify/templates/plan-template.md: "Constitution Check" now refers to these new strict gates.
- .specify/templates/spec-template.md: Content filled here MUST now be in Simplified Chinese.
- .specify/templates/tasks-template.md: Task descriptions MUST now be in Simplified Chinese.
-->

# Spec Generator Constitution

## General

### Monorepo
- 所有模块与代码统一放在同一仓库。
- 模块依赖方向必须明确、可被工具分析。
- 禁止隐式依赖或反向依赖。

### 接口契约（SSOT）
- 接口契约以 **DTO / Schema** 作为唯一事实来源（SSOT）。
- 任何契约变更必须显式声明是否为破坏性变更。
- 破坏性变更必须通过版本演进或迁移策略处理。

### API 契约生成一致性
- 所有 API 必须采用 **Code-first**。
- OpenAPI 规范必须由代码自动生成并与实现保持一致。
- 禁止手写或人工维护 JSON 格式的接口定义。

### 分层架构
- 按职责分层组织代码，层次边界清晰。
- 禁止跨层直接依赖。
- 跨层调用必须通过明确的接口或适配层完成。

### 语言规范
- 仓库内**人工维护**的所有内容（SPEC / 任务说明 / 代码注释 / 沟通文本）必须使用**简体中文**。
- 第三方依赖与自动生成产物不受此限制。

### 前后端分离
- 前端仅负责表现层与交互层（UI 渲染、状态管理、API 调用）。
- 前端不得包含业务规则、权限判断或数据可信校验。
- 后端作为唯一业务事实来源（SSOT），必须承载：
  - 业务逻辑  
  - 规则校验  
  - 权限控制  
  - 数据持久化
- 前后端仅通过契约化 API 交互。

### Code Style
- Python 遵循 **PEP 8**。
- JS / React 遵循标准 **React Hooks** 使用模式。
- 项目内应保持一致的格式化与风格规范。

### 测试策略（设计层面）
- 优先覆盖：
  - 核心业务闭环
  - 关键用户旅程
- 测试类型建议：
  - 服务级集成测试为主
  - 少量端到端测试覆盖真实跨模块链路
  - 单元测试用于规则复杂、分支多、边界多、历史易回归的逻辑点
- 核心路径行为变化时，应同步调整对应回归测试用例。

### 路径规范
- 业务代码与配置默认使用**相对路径**。
- 如必须使用绝对路径（如容器挂载点、系统目录、工具链要求），必须在 SPEC 或配置中显式声明并说明原因。

## MCP Guidelines

### MCP context7
- 当输出依赖**具体库 / API / CLI 的精确行为、参数或版本差异**时，必须优先使用 **context7** 获取文档后再编写。
- 若 context7 不可用，必须在输出中注明原因并采用降级方案。

## GLM Guidelines

### 视觉理解
- 在可用时**仅使用** MCP `zai-mcp-server`。
- 不可用时必须注明原因并降级。

### 联网搜索
- 在可用时**必须且仅使用** MCP `web-search-prime`。
- 不可用时必须注明原因并降级。

### 网页内容提取
- 对已给 URL 的正文或结构化内容抽取：
  - 在可用时**仅使用** MCP `web-reader`。
  - 不可用时必须注明原因并降级。

## Design Standards

### 前端设计
- 前端 UI / UX 设计统一使用 Skills 的 **frontend-design**。

### 数据库设计
- 数据库设计必须遵循 **database-design** 规范。
- 所有表结构与字段设计需基于该规范实现，确保数据一致性、可扩展性与安全性。

## Environment & Testing

### 容器化测试
- 自动化测试的标准执行环境为 **Docker**。
- 测试基于仓库内提供的 `Dockerfile` / `docker-compose`。
- 核心依赖（OS 包、运行时、Python / Node 版本）必须在镜像中显式声明并固定。
- 测试镜像与运行镜像建议通过多阶段构建或 target 区分。

## Governance

- **Supremacy**: This Constitution supersedes all other project documentation or practices.
- **Compliance**: All Pull Requests, Plans, and Specifications must verify compliance with these principles.
- **Amendments**: Changes to this document require a Pull Request with a "Sync Impact Report" and strict semantic versioning updates.

**Version**: 1.0.0 | **Ratified**: 2026-01-07 | **Last Amended**: 2026-01-07