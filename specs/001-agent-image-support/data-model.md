# Data Model: Agent 框架调整与图片支持

**Feature**: 001-agent-image-support
**Date**: 2026-01-14

## 概述

本功能扩展现有数据模型，支持图片作为多模态输入。主要新增 `ImageAttachment` 实体，并扩展 `GenerationRequest` 以支持图片字段。

## 实体定义

### 1. ImageAttachment（新增）

用户上传的图片附件，包含 Base64 编码数据和元信息。

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| data | string | 是 | - | Base64 编码的图片数据（不含 data URI 前缀） |
| mime_type | string | 是 | enum: image/jpeg, image/png, image/gif, image/webp | 图片 MIME 类型 |
| filename | string | 否 | max_length: 255 | 原始文件名 |
| size | integer | 否 | max: 10485760 (10MB) | 原始文件大小（字节） |

**验证规则**:
- `data` 必须是有效的 Base64 编码字符串
- `mime_type` 必须是支持的图片格式之一
- `size`（如提供）不得超过 10MB

**示例**:
```json
{
  "data": "/9j/4AAQSkZJRgABAQEASABIAAD...",
  "mime_type": "image/jpeg",
  "filename": "ui-mockup.jpg",
  "size": 1048576
}
```

### 2. GenerationRequest（扩展）

在现有 `GenerationRequest` 基础上新增 `images` 字段。

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| description | string | 是 | min_length: 1 | 功能描述或用户消息 |
| stream | boolean | 否 | default: true | 是否流式响应 |
| mode | string | 否 | enum: generate, chat; default: generate | 生成模式 |
| current_prd | string | 否 | - | chat 模式下的当前 PRD |
| chat_history | ChatMessage[] | 否 | max_length: 4 | 对话历史 |
| session_id | string | 否 | - | 会话标识 |
| **images** | ImageAttachment[] | **否** | **max_length: 5** | **图片附件列表（新增）** |

**验证规则**:
- `images` 列表最多包含 5 张图片
- 每张图片必须符合 `ImageAttachment` 的验证规则
- 当 `images` 为空或未提供时，行为与当前版本完全一致（向后兼容）

### 3. ChatMessage（保持不变）

单条对话消息，无需修改。

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| role | string | 是 | enum: user, assistant | 消息角色 |
| content | string | 是 | min_length: 1 | 消息内容 |

### 4. GenerationResponse（保持不变）

生成响应，无需修改。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| markdown_content | string | 是 | 生成的 PRD 内容 |
| generated_at | datetime | 是 | 生成时间 |

## 实体关系

```
GenerationRequest
    ├── 0..1 current_prd (string)
    ├── 0..4 chat_history (ChatMessage[])
    └── 0..5 images (ImageAttachment[])  # 新增
```

## 前端状态模型

### PendingImage（新增）

前端图片上传状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 临时唯一标识（用于删除操作） |
| file | File | 原始文件对象 |
| preview | string | Data URL 格式预览 |
| base64 | string | Base64 编码数据 |
| status | string | 上传状态: pending, ready, error |
| error | string | 错误信息（如有） |

## 后端内部模型

### MultimodalContent（内部使用）

用于构建 DashScope API 调用的消息内容。

```python
# 消息内容可以是文本或图片
ContentItem = dict[str, str]  # {"text": "..."} 或 {"image": "data:..."}

# 完整消息结构
MultimodalMessage = dict[str, list[ContentItem]]
# 示例: {"role": "user", "content": [{"image": "..."}, {"text": "..."}]}
```

## 数据流

```
前端                          后端                          LLM
  │                             │                             │
  │ 1. 用户选择图片              │                             │
  │ 2. FileReader 读取           │                             │
  │ 3. Base64 编码               │                             │
  │                             │                             │
  │ ──────────────────────────> │                             │
  │    GenerationRequest        │                             │
  │    (含 images 数组)          │                             │
  │                             │                             │
  │                             │ 4. 验证 images               │
  │                             │ 5. 构建 MultimodalMessage    │
  │                             │                             │
  │                             │ ──────────────────────────> │
  │                             │    MultiModalConversation    │
  │                             │                             │
  │                             │ <────────────────────────── │
  │                             │    流式响应                  │
  │                             │                             │
  │ <────────────────────────── │                             │
  │    NDJSON 事件流             │                             │
```

## 约束总结

| 约束 | 值 | 说明 |
|------|-----|------|
| 单张图片最大 | 10MB | 原始文件大小 |
| 单次最多图片 | 5 张 | images 数组长度 |
| 支持格式 | JPEG, PNG, GIF, WebP | mime_type 枚举 |
| 对话历史最多 | 4 条 | 保持不变 |
