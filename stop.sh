#!/bin/bash
# 生产环境停止脚本

echo "Stopping production services..."

# 停止并删除容器
docker stop spec-nginx spec-frontend-prod spec-backend-prod 2>/dev/null || true
docker rm spec-nginx spec-frontend-prod spec-backend-prod 2>/dev/null || true

echo "Services stopped."
