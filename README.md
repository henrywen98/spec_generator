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
- DashScope API Key

### 使用 Docker 运行

1. 创建 `.env` 文件：
   ```bash
   DASHSCOPE_API_KEY=your_key_here
   ```

2. 启动服务：
   ```bash
   docker-compose up --build
   ```

3. 打开 http://localhost:3000

## 开发

本地开发说明请参阅 [快速入门指南](specs/001-spec-gen-web/quickstart.md)。

## 架构

- **前端**：Next.js 16、Tailwind CSS v4、TypeScript
- **后端**：FastAPI、DashScope SDK（通义千问）
- **基础设施**：Docker
