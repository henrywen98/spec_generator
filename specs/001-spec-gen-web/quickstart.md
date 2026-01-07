# Quickstart: Spec Generator Web

**Prerequisites**:
- Docker & Docker Compose
- Node.js 20+ (local dev)
- Python 3.12 (local dev)
- DashScope API Key

## Running the App (Docker)

1. **Set Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env and set DASHSCOPE_API_KEY
   ```

2. **Start Services**:
   ```bash
   docker-compose up --build
   ```

3. **Access**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/docs`

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing
```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```
