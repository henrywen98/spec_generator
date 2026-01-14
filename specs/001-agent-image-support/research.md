# Research: Agent 框架调整与图片支持

**Feature**: 001-agent-image-support
**Date**: 2026-01-14

## 1. DashScope Qwen-VL 多模态 API

### Decision

使用 `dashscope.MultiModalConversation.call()` API 替代现有的 `dashscope.Generation.call()`

### Rationale

- 现有 `Generation.call()` 仅支持纯文本输入
- Qwen-VL 多模态模型需要使用专门的 `MultiModalConversation` 接口
- 消息结构从字符串变为支持图文混合的 content 数组

### Alternatives Considered

| 方案 | 说明 | 结论 |
|------|------|------|
| OpenAI 兼容接口 | 使用 `openai.OpenAI(base_url="dashscope...")` | 需要额外依赖，且流式支持不确定 |
| HTTP 直接调用 | 直接调用 REST API | 需要手动处理认证、重试、流式解析 |
| MultiModalConversation | DashScope 原生 SDK | ✅ 采用，与现有代码风格一致 |

### 技术细节

**SDK 版本要求**: dashscope >= 1.24.6

**消息格式**:
```python
messages = [
    {
        "role": "system",
        "content": [{"text": "系统提示词"}]
    },
    {
        "role": "user",
        "content": [
            {"image": "data:image/png;base64,{base64_string}"},
            {"text": "用户描述"}
        ]
    }
]
```

**API 调用**:
```python
response = dashscope.MultiModalConversation.call(
    model="qwen-vl-plus",
    messages=messages,
    stream=True,
    incremental_output=True,
)
```

### Sources

- [Alibaba Cloud Model Studio - Vision](https://www.alibabacloud.com/help/en/model-studio/vision)
- [DashScope PyPI](https://pypi.org/project/dashscope/)

---

## 2. 图片传输方案

### Decision

前端将图片编码为 Base64，作为 JSON 请求体的一部分发送

### Rationale

- 实现简单，与现有 JSON API 结构兼容
- 单张图片最大 10MB，Base64 后约 13.3MB，仍在可接受范围
- 无需引入文件存储服务或修改 API 格式

### Alternatives Considered

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Base64 in JSON | 实现简单，兼容现有 API | 数据量增加 33% | ✅ 采用 |
| FormData multipart | 传输效率高 | 需要修改 API 格式，复杂度增加 | 不采用 |
| 临时存储 + URL | 支持超大文件 | 需要额外存储服务 | 不采用 |
| 前端压缩 | 减少传输量 | 可能影响图片质量 | 可选优化 |

### 数据流

```
用户选择图片 → 前端 FileReader 读取 → Base64 编码 → JSON 请求体 → 后端解析 → Qwen-VL API
```

---

## 3. 模型选择

### Decision

默认使用 `qwen-vl-plus`，通过环境变量 `DASHSCOPE_VL_MODEL` 可配置

### Rationale

- `qwen-vl-plus` 是通用多模态模型，平衡性能和成本
- 通过环境变量配置，便于切换模型版本
- 保持与现有 `DASHSCOPE_MODEL` 配置方式一致

### 可用模型

| 模型 | 说明 | 适用场景 |
|------|------|----------|
| qwen-vl-plus | 通用版本 | 默认选择 |
| qwen2.5-vl-7b-instruct | 较新版本 | 需要更好视觉理解时 |
| qwen3-vl-plus | 最新版本 | 高级视觉理解 |

---

## 4. 提示词调整分析

### Decision

需要修改 `prompt.md` 和 `prompt-chat.md`，增加图片理解指令

### 调整内容

**prompt.md (生成模式)**:
- 增加输入说明：可能包含图片（UI 设计稿、流程图等）
- 增加图片理解指令：如何从视觉内容提取功能需求
- 保持输出格式不变

**prompt-chat.md (对话模式)**:
- 增加图片上下文说明：如何结合新图片理解修改意图
- 保持现有对话逻辑不变

### 示例调整

```markdown
## Input

You will receive:
1. Feature description in natural language (required)
2. Reference images such as UI mockups, flowcharts, or screenshots (optional)

When images are provided:
- Analyze UI elements, layouts, and interactions visible in the mockups
- Extract functional requirements from flowcharts
- Use visual context to enrich the PRD with specific details
```

---

## 5. 向后兼容策略

### Decision

无图片时保持与当前版本完全相同的行为

### 实现策略

1. **API 层**: `images` 字段可选，默认为空列表
2. **LLM 服务层**: 检测图片存在，动态选择 API
   - 有图片 → `MultiModalConversation.call()`
   - 无图片 → `Generation.call()` (保持现有逻辑)
3. **提示词**: 图片相关指令仅在有图片时有意义，无图片时自动忽略

### 测试验证

- 现有纯文本测试用例必须全部通过
- 新增图片测试用例独立验证
