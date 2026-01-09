# Backend Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
# Install poetry and dependencies
RUN pip install poetry && poetry config virtualenvs.create false && poetry install --no-root --without dev

COPY src/ ./src/

CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port 8000 ${UVICORN_RELOAD:+--reload}"]
