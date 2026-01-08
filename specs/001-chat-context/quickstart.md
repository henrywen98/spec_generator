# Quickstart: 多轮对话上下文

**功能**: 在 chat 模式下支持多轮对话上下文，使 AI 能理解上下文指代。

## 前置条件

1. 已安装 Docker 和 Docker Compose
2. 已配置 `DASHSCOPE_API_KEY` 环境变量

## 快速测试

### 1. 安装新依赖

```bash
cd backend
poetry add langchain langchain-community
```

### 2. 启动服务

```bash
docker-compose up --build
```

### 3. 测试多轮对话

**第一轮：生成 PRD**
```bash
curl -X POST http://localhost:28000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "用户登录功能", "stream": false}'
```

**第二轮：讨论**
```bash
curl -X POST http://localhost:28000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "成功标准太多了",
    "mode": "chat",
    "current_prd": "[上一步返回的 PRD]",
    "stream": false
  }'
```

**第三轮：引用上下文**
```bash
curl -X POST http://localhost:28000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "第一个建议可以，第二个不行",
    "mode": "chat",
    "current_prd": "[当前 PRD]",
    "chat_history": [
      {"role": "user", "content": "成功标准太多了"},
      {"role": "assistant", "content": "[AI 的建议回复]"}
    ],
    "stream": false
  }'
```

## 验证成功标准

- [ ] AI 能正确理解"第一个建议"指的是什么
- [ ] AI 能执行"按刚才说的改"的指令
- [ ] 响应延迟增加不超过 10%

### 响应延迟对比测试

**基准测试（无历史）**:
```bash
# 记录无 chat_history 时的响应时间
time curl -X POST http://localhost:28000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "帮我精简成功标准",
    "mode": "chat",
    "current_prd": "[PRD 内容]",
    "stream": false
  }'
```

**对比测试（有历史）**:
```bash
# 记录有 chat_history 时的响应时间
time curl -X POST http://localhost:28000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "第一个建议可以",
    "mode": "chat",
    "current_prd": "[PRD 内容]",
    "chat_history": [
      {"role": "user", "content": "成功标准太多了"},
      {"role": "assistant", "content": "建议删除 SC-003 和 SC-004"},
      {"role": "user", "content": "为什么"},
      {"role": "assistant", "content": "因为这两条与核心功能关联度低"}
    ],
    "stream": false
  }'
```

**验证标准**: 有历史的响应时间 ≤ 无历史响应时间 × 1.1

## 相关文件

| 文件 | 变更 |
|------|------|
| `backend/src/models/schemas.py` | 新增 ChatMessage |
| `backend/src/services/llm_service.py` | 重构为 LangChain |
| `backend/src/api/endpoints.py` | 传递 chat_history |
| `frontend/src/app/page.tsx` | 新增 getChatHistory |
| `frontend/src/services/api.ts` | 新增 chatHistory 参数 |
| `prompts/prompt-chat.md` | 更新输入说明 |
