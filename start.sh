#!/bin/bash
# 生产环境启动脚本
cd "$(dirname "$0")"

# Stop and remove existing containers
docker stop spec-nginx spec-frontend-prod spec-backend-prod 2>/dev/null
docker rm spec-nginx spec-frontend-prod spec-backend-prod 2>/dev/null

# Load environment variables
export DASHSCOPE_API_KEY=$(grep "^DASHSCOPE_API_KEY=" .env | cut -d'=' -f2)
export DASHSCOPE_MODEL=$(grep "^DASHSCOPE_MODEL=" .env | cut -d'=' -f2)
export DASHSCOPE_VL_MODEL=$(grep "^DASHSCOPE_VL_MODEL=" .env | cut -d'=' -f2)
export ENABLE_THINKING=$(grep "^ENABLE_THINKING=" .env | cut -d'=' -f2)
export DEBUG_ERRORS=$(grep "^DEBUG_ERRORS=" .env | cut -d'=' -f2)
export ALLOWED_ORIGINS=$(grep "^ALLOWED_ORIGINS=" .env | cut -d'=' -f2)

# Create network if not exists
docker network create app-network 2>/dev/null || true

# Start backend
docker run -d --name spec-backend-prod --network app-network \
  -p 28000:8000 \
  -v ./prompts:/app/prompts:ro \
  -e DASHSCOPE_API_KEY=$DASHSCOPE_API_KEY \
  -e DASHSCOPE_MODEL=${DASHSCOPE_MODEL:-qwen-max} \
  -e DASHSCOPE_VL_MODEL=${DASHSCOPE_VL_MODEL:-qwen-vl-plus} \
  -e ENABLE_THINKING=${ENABLE_THINKING:-false} \
  -e DEBUG_ERRORS=${DEBUG_ERRORS:-false} \
  -e ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-http://localhost:23456} \
  -e PROMPT_FILE_PATH=/app/prompts/prompt.md \
  -e PROMPT_CHAT_FILE_PATH=/app/prompts/prompt-chat.md \
  -e PYTHONUNBUFFERED=1 \
  -e LOG_LEVEL=info \
  --restart unless-stopped \
  spec-generator-backend:prod

# Start frontend
docker run -d --name spec-frontend-prod --network app-network \
  --expose 3000 \
  -e NODE_ENV=production \
  -e BACKEND_URL=http://spec-backend-prod:8000 \
  --restart unless-stopped \
  spec-generator-frontend:prod

# Start nginx
docker run -d --name spec-nginx --network app-network \
  -p 23456:23456 \
  -v ./nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /dev/null:/etc/nginx/conf.d/default.conf:ro \
  --restart unless-stopped \
  nginx:alpine

echo "Services started!"
echo "Frontend: http://localhost:23456"
echo "Backend API: http://localhost:28000/docs"
echo ""
docker ps --filter "name=spec-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
