# 规格生成器 Web 应用

一个单轮对话应用，使用大语言模型从自然语言描述生成标准化的 PRD 规格。

## 功能特性

- **即时生成**：流式 Markdown 输出
- **标准化格式**：遵循项目 PRD 模板
- **自动澄清**：自动识别模糊的需求
- **一键复制**：轻松导出

## 快速开始

### 前置要求
- Docker & Docker Compose
- DashScope API Key（[获取地址](https://dashscope.console.aliyun.com/)）

### 使用 Docker 运行（推荐）

1. 在项目根目录创建 `.env` 文件：
   ```bash
   DASHSCOPE_API_KEY=your_key_here
   ```

2. 启动服务：
   ```bash
   docker-compose up --build
   ```

3. 访问应用：
   - 前端界面：http://localhost:23456
   - 后端 API：http://localhost:28000
   - API 文档：http://localhost:28000/docs

### 本地开发

#### 后端

```bash
cd backend

# 安装依赖（需要 Poetry）
poetry install

# 启动开发服务器
poetry run uvicorn src.main:app --reload --port 28000

# 运行测试
poetry run pytest

# 代码检查
poetry run ruff check .
poetry run ruff format .
```

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 设置后端地址（可选，默认 http://localhost:8000/api/v1）
export NEXT_PUBLIC_API_URL=http://localhost:28000/api/v1

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 构建生产版本
npm run build
```

### 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DASHSCOPE_API_KEY` | ✅ | - | DashScope API 密钥 |
| `DASHSCOPE_MODEL` | - | `deepseek-v3.2` | 使用的模型名称 |
| `ENABLE_THINKING` | - | `false` | 是否启用推理过程输出 |
| `DEBUG_ERRORS` | - | `false` | 是否显示详细错误信息 |
| `ALLOWED_ORIGINS` | - | `http://localhost:3000` | CORS 允许的来源 |

## 架构

- **前端**：Next.js 16、Tailwind CSS v4、TypeScript
- **后端**：FastAPI、DashScope SDK（通义千问）
- **基础设施**：Docker
