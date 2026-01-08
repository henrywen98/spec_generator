# Data Model: 多轮对话上下文

**Date**: 2026-01-08
**Branch**: `001-chat-context`

## 实体定义

### ChatMessage

单条对话消息，用于前后端通信和 LangChain 消息构建。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | Literal["user", "assistant"] | ✅ | 消息角色 |
| content | str | ✅ | 消息内容 |

**验证规则**:
- `role` 只能是 "user" 或 "assistant"
- `content` 不能为空字符串

**Pydantic 模型**:
```python
from pydantic import BaseModel
from typing import Literal

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
```

---

### GenerationRequest（更新）

生成请求，新增 `chat_history` 字段。

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| description | str | ✅ | - | 用户输入描述或消息 |
| stream | bool | ❌ | True | 是否流式输出 |
| mode | Literal["generate", "chat"] | ❌ | "generate" | 生成模式 |
| current_prd | str \| None | ❌ | None | 当前 PRD 内容（chat 模式必填） |
| chat_history | list[ChatMessage] \| None | ❌ | None | 对话历史（chat 模式可选） |
| session_id | str \| None | ❌ | None | 会话 ID |

**验证规则**:
- `chat` 模式下 `current_prd` 必填
- `chat_history` 最多包含 4 条消息（2 轮对话）

---

## 前端消息结构（参考）

前端 `Message` 接口中用于过滤对话历史的属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| version | number \| undefined | 有值表示是完整 PRD，应排除 |
| isStreaming | boolean | true 表示正在输出，应排除 |
| content | string | 以 ❌ 开头或等于 "⏹️ 已停止生成" 应排除 |
| role | "user" \| "assistant" | 消息角色 |

---

## LangChain 消息映射

| ChatMessage.role | LangChain 类型 |
|------------------|----------------|
| "user" | HumanMessage |
| "assistant" | AIMessage |
| (system prompt) | SystemMessage |

---

## 状态转换

本功能无持久化状态，对话历史在前端内存中管理。

### 前端状态流转

```
初始状态（无消息）
    ↓ 用户发送第一条消息
生成模式（versionCount=0）
    ↓ 生成完成，versionCount=1
对话模式（chat）
    ↓ 用户继续对话
    ↓ 前端收集最近 2 轮历史
    ↓ 发送请求（含 chat_history）
    ↓ 如果生成新版 PRD
对话模式（新 PRD 替换旧 PRD 作为上下文）
```

---

## 无持久化说明

- 对话历史不保存到数据库
- 每次请求时从前端传递
- 刷新页面后历史丢失（符合当前产品设计）
