# Research: 多轮对话上下文

**Date**: 2026-01-08
**Branch**: `001-chat-context`

## 研究问题

1. LangChain 如何与 DashScope 集成？
2. ChatTongyi 如何支持流式输出？
3. 如何在 FastAPI 中集成 LangChain 流式响应？

---

## 决策 1: LangChain DashScope 集成方案

### 决策
使用 `langchain-community` 包中的 `ChatTongyi` 类替换现有 DashScope SDK 直接调用。

### 理由
- LangChain 官方提供 DashScope 集成，通过 `ChatTongyi` 类支持阿里云通义千问模型
- 支持流式输出（streaming）和异步调用（astream）
- 消息格式统一为 LangChain 标准（HumanMessage, AIMessage, SystemMessage）
- 便于后续扩展其他模型或添加 LangChain 功能（如 Memory、Chain）

### 备选方案
| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| 继续使用 DashScope SDK | 无需修改 | 不便于管理多轮对话，无法利用 LangChain 生态 | ❌ 拒绝 |
| LangChain ChatTongyi | 标准化消息格式，支持流式，生态丰富 | 需要重构 llm_service.py | ✅ 采用 |
| 自定义封装 | 完全控制 | 开发成本高，维护负担 | ❌ 拒绝 |

### 参考
- [LangChain ChatTongyi 文档](https://python.langchain.com/docs/integrations/chat/tongyi/)
- [LangChain DashScope 集成](https://docs.langchain.com/oss/python/integrations/text_embedding/dashscope)

---

## 决策 2: 流式输出实现方案

### 决策
使用 ChatTongyi 的 `stream()` 方法实现同步流式输出，保持与现有 FastAPI StreamingResponse 兼容。

### 理由
- ChatTongyi 支持 `streaming=True` 参数和 `stream()` 方法
- 现有架构使用 Generator 返回 NDJSON 事件，可无缝迁移
- DashScope SDK 不提供原生 async API，LangChain 的 `astream()` 内部也是包装同步调用

### 代码示例
```python
from langchain_community.chat_models import ChatTongyi
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

chat = ChatTongyi(model="deepseek-v3.2", streaming=True)

messages = [
    SystemMessage(content="你是 PRD 助手"),
    HumanMessage(content="当前 PRD: ..."),
    AIMessage(content="好的，我已了解"),
    HumanMessage(content="成功标准太多了"),
    AIMessage(content="建议删除 SC-003"),
    HumanMessage(content="第一个建议可以"),
]

for chunk in chat.stream(messages):
    yield emit_event({"type": "content", "content": chunk.content})
```

---

## 决策 3: 消息列表构建顺序

### 决策
按以下顺序构建 LangChain 消息列表：
1. `SystemMessage`: prompt-chat.md 内容
2. `HumanMessage`: 当前 PRD 全文
3. `AIMessage`: 确认消息（"好的，我已了解当前 PRD 内容"）
4. 对话历史（交替的 HumanMessage/AIMessage）
5. `HumanMessage`: 用户最新消息

### 理由
- 符合规格 FR-008 的顺序要求
- PRD 作为第一条用户消息，让模型始终"看到"完整上下文
- AI 确认消息让对话历史可以直接接续

### 消息结构示意
```
┌─────────────────────────────────────┐
│ SystemMessage: prompt-chat.md       │
├─────────────────────────────────────┤
│ HumanMessage: "## 当前 PRD\n..."     │
│ AIMessage: "好的，我已了解..."       │
├─────────────────────────────────────┤
│ HumanMessage: "成功标准太多了"       │  ← 对话历史
│ AIMessage: "建议删除 SC-003..."     │
├─────────────────────────────────────┤
│ HumanMessage: "第一个建议可以"       │  ← 用户最新消息
└─────────────────────────────────────┘
```

---

## 决策 4: 依赖包版本

### 决策
添加以下依赖到 `pyproject.toml`:
```toml
langchain = ">=0.3.0"
langchain-community = ">=0.3.0"
```

### 理由
- 0.3.x 是当前稳定版本
- `langchain-community` 包含 ChatTongyi 集成
- 继续保留 `dashscope` 依赖（ChatTongyi 内部使用）

---

## 未解决问题

无。所有 NEEDS CLARIFICATION 已解决。

---

## 下一步

进入 Phase 1: 设计数据模型和 API 契约。
