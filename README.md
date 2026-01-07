# Specification Generator Web Application

A single-turn conversation application that generates standardized PRD specifications from natural language descriptions using LLMs.

## Features

- **Instant Generation**: Streamed Markdown output.
- **Standardized Format**: Follows project PRD templates.
- **Clarification**: Automatically identifies vague requirements.
- **One-Click Copy**: Easy export.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- DashScope API Key

### Running with Docker

1. Create `.env` file:
   ```bash
   DASHSCOPE_API_KEY=your_key_here
   ```

2. Run services:
   ```bash
   docker-compose up --build
   ```

3. Open http://localhost:3000

## Development

See [Quickstart Guide](specs/001-spec-gen-web/quickstart.md) for local development instructions.

## Architecture

- **Frontend**: Next.js 16, Tailwind CSS v4, TypeScript
- **Backend**: FastAPI, DashScope SDK (Qwen)
- **Infrastructure**: Docker
