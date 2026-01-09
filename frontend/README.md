# Spec Generator Frontend

Frontend UI for the Spec Generator application.

## Overview

- Framework: Next.js 16
- Language: TypeScript
- Styling: Tailwind CSS v4
- Streaming: NDJSON event stream from the backend

## Requirements

- Node.js 20+
- Backend service running at `http://localhost:8000`

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

The frontend uses `NEXT_PUBLIC_API_URL` for the backend base URL.

Example:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

When using Docker Compose, the default is:

```bash
NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
```

## Tests

```bash
npm run test
```

## Lint

```bash
npm run lint
```
