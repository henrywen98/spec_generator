#!/bin/bash
# Local Development Startup Script
# Usage: ./scripts/dev.sh [backend|frontend|all]

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

start_backend() {
    echo "🚀 Starting Backend on http://localhost:28000..."
    cd "$PROJECT_ROOT/backend"
    poetry run uvicorn src.main:app --reload --port 28000
}

start_frontend() {
    echo "🚀 Starting Frontend on http://localhost:3000..."
    cd "$PROJECT_ROOT/frontend"
    npm run dev
}

case "${1:-all}" in
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    all)
        echo "📦 Starting both services..."
        echo "   Backend:  http://localhost:28000"
        echo "   Frontend: http://localhost:3000"
        echo ""
        # Start backend in background
        start_backend &
        BACKEND_PID=$!
        sleep 2
        # Start frontend in foreground
        start_frontend
        # Cleanup on exit
        trap "kill $BACKEND_PID 2>/dev/null" EXIT
        ;;
    *)
        echo "Usage: $0 [backend|frontend|all]"
        exit 1
        ;;
esac
