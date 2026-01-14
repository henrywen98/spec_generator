# Quickstart: Agent 框架调整与图片支持

**Feature**: 001-agent-image-support
**Date**: 2026-01-14

## 功能概述

本功能扩展 PRD 生成器，支持用户上传图片（UI 设计稿、流程图等）作为输入，结合 Qwen-VL 多模态模型生成更精准的 PRD 文档。

## 快速开始

### 1. 环境配置

在 `.env` 文件中添加多模态模型配置：

```bash
# 现有配置
DASHSCOPE_API_KEY=your_key_here
DASHSCOPE_MODEL=deepseek-v3.2

# 新增：多模态模型配置
DASHSCOPE_VL_MODEL=qwen-vl-plus
```

### 2. 依赖更新

确保 DashScope SDK 版本 >= 1.24.6：

```bash
cd backend
poetry add dashscope@">=1.24.6"
```

### 3. 启动服务

```bash
docker-compose up --build
```

### 4. 使用图片生成 PRD

**方式一：纯文本输入（向后兼容）**

与现有功能完全一致，无需任何改动。

**方式二：图片 + 文本输入**

1. 在输入框左侧点击图片上传按钮
2. 选择 UI 设计稿或流程图（支持 JPEG/PNG/GIF/WebP）
3. 输入文字描述（可选）
4. 点击发送

### 5. API 调用示例

**Python 示例**:

```python
import base64
import requests

def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

response = requests.post(
    "http://localhost:28000/api/v1/generate",
    json={
        "description": "请根据这个 UI 设计稿生成登录功能的 PRD",
        "mode": "generate",
        "stream": True,
        "images": [
            {
                "data": encode_image("login-ui.png"),
                "mime_type": "image/png",
                "filename": "login-ui.png"
            }
        ]
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        print(line.decode("utf-8"))
```

**curl 示例**:

```bash
# 将图片编码为 Base64
BASE64_IMAGE=$(base64 -i login-ui.png)

curl -X POST http://localhost:28000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "请根据这个 UI 设计稿生成 PRD",
    "mode": "generate",
    "stream": true,
    "images": [{
      "data": "'"$BASE64_IMAGE"'",
      "mime_type": "image/png"
    }]
  }'
```

## 限制说明

| 限制项 | 值 |
|--------|-----|
| 单张图片最大 | 10MB |
| 单次最多图片 | 5 张 |
| 支持格式 | JPEG, PNG, GIF, WebP |

## 测试验证

### 单元测试

```bash
cd backend
poetry run pytest tests/unit/test_image_processing.py -v
```

### 集成测试

```bash
cd backend
poetry run pytest tests/integration/test_image_generation.py -v
```

### 前端测试

```bash
cd frontend
npm run test -- --grep "image"
```

## 故障排查

### 图片上传失败

1. 检查文件大小是否超过 10MB
2. 确认文件格式是否支持
3. 检查网络连接

### 生成结果不理想

1. 确保图片清晰度足够
2. 尝试添加更详细的文字描述
3. 使用更高版本的 VL 模型（如 `qwen2.5-vl-7b-instruct`）

### API 调用超时

1. 多模态处理可能需要更长时间，建议设置较长超时
2. 检查 `DASHSCOPE_VL_MODEL` 配置是否正确

## 相关文档

- [spec.md](./spec.md) - 功能规格说明
- [plan.md](./plan.md) - 实现计划
- [data-model.md](./data-model.md) - 数据模型
- [contracts/api.yaml](./contracts/api.yaml) - API 契约
