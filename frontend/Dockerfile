# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# 配置 npm 国内镜像源
RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN npm install

COPY . .

# 设置构建时的环境变量（Next.js rewrites 在构建时读取）
ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=${BACKEND_URL}

# 生产环境构建
RUN npm run build

CMD ["npm", "run", "start"]
