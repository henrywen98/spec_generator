# Feature Specification: 多轮对话上下文

**Feature Branch**: `001-chat-context`
**Created**: 2026-01-08
**Status**: Draft
**Input**: 在 chat 模式下传递最近 N 轮对话历史给 LLM，使其能理解上下文指代

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 引用之前的建议 (Priority: P1)

用户在与 AI 讨论 PRD 修改时，经常会引用之前的对话内容。例如用户说"第一个建议可以，第二个不行"，AI 需要理解"第一个建议"指的是什么，才能正确响应。

**Why this priority**: 这是多轮对话的核心价值。如果 AI 无法理解上下文指代，用户必须每次重复完整描述，体验极差。

**Independent Test**: 可以通过发送两轮对话后引用之前内容来验证。

**Acceptance Scenarios**:

1. **Given** 用户已与 AI 进行了一轮讨论（AI 给出了多条建议），**When** 用户发送"第一个建议可以，第二个不行"，**Then** AI 能正确识别并回应具体是哪两个建议
2. **Given** 用户之前问过"成功标准太多了"并收到 AI 建议，**When** 用户发送"按刚才说的改"，**Then** AI 能执行之前给出的具体建议

---

### User Story 2 - 连续追问细节 (Priority: P2)

用户在收到 AI 建议后，可能想追问更多细节或要求澄清。AI 需要记住之前讨论的上下文。

**Why this priority**: 追问是自然对话的常见模式，但相比引用指代，追问通常会包含更多上下文信息。

**Independent Test**: 发送建议请求后，追问"为什么这样改"来验证 AI 是否理解上下文。

**Acceptance Scenarios**:

1. **Given** AI 刚给出了删除 SC-003 的建议，**When** 用户发送"为什么要删这条"，**Then** AI 能理解"这条"指的是 SC-003 并解释原因

---

### Edge Cases

- 用户第一次发消息时（无历史）：系统正常工作，不传递历史
- 历史消息中包含错误消息（❌ 错误: ...）：应排除，不传递给 LLM
- 历史消息中包含中断消息（⏹️ 已停止生成）：应排除，不传递给 LLM
- 历史消息中包含完整 PRD（有 version 标记）：应排除，PRD 已通过 current_prd 传递
- 正在流式输出的消息（isStreaming=true）：应排除，不传递未完成的内容

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须在 chat 模式下传递最近 2 轮对话历史给 LLM
- **FR-002**: 系统必须过滤掉错误消息（以 ❌ 开头）
- **FR-003**: 系统必须过滤掉中断消息（⏹️ 已停止生成）
- **FR-004**: 系统必须过滤掉完整 PRD 消息（有 version 标记的消息）
- **FR-005**: 系统必须过滤掉正在流式输出的消息
- **FR-006**: 前端必须将对话历史转换为 `{role, content}` 格式传递给后端
- **FR-007**: 后端必须将对话历史构建为 LLM 消息列表的一部分
- **FR-008**: 系统必须按以下顺序构建消息列表：① 完整 PRD（始终在第一位）→ ② 对话历史 → ③ 用户最新消息
- **FR-009**: 当用户生成新版本 PRD 时，上下文中的 PRD 必须替换为新版本

### Key Entities

- **ChatMessage**: 单条对话消息，包含角色（user/assistant）和内容
- **ChatHistory**: 对话历史列表，包含最近 2 轮（4 条消息）的 ChatMessage

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户发送引用之前内容的消息（如"第一个建议"）时，AI 能正确理解并响应
- **SC-002**: 对话历史功能不会显著增加响应延迟（用户感知响应时间增加不超过 10%）
- **SC-003**: 系统正确过滤无效消息，确保只有有效对话内容传递给 LLM

## Assumptions

- 保留 2 轮对话（4 条消息）可以覆盖大多数上下文指代场景
- 不对历史消息进行截断，完整保留内容
- Token 消耗增加在可接受范围内（预估增加 500-1000 tokens）

## Clarifications

### Session 2026-01-08

- Q: PRD 在消息列表中的位置和版本更新策略？ → A: 完整 PRD 始终保持在上下文第一位，对话历史接在 PRD 之后；生成新版本 PRD 时，替换上下文中的 PRD 为新版本
- Q: LLM 调用框架选择？ → A: 迁移到 LangChain 框架，替换现有 DashScope SDK 直接调用，以便更好地管理 AI 模型调用
