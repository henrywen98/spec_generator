# API Contract: Specification Generator

**Method**: `POST`
**URL**: `/api/v1/generate`

## Description
Generates a feature specification based on the provided description using the `speckit.specify.md` prompt context.

## Request
**Content-Type**: `application/json`

```json
{
  "description": "A web app that...",
  "stream": true
}
```

## Response

### Case 1: Stream (`stream=true`)
**Content-Type**: `text/plain` (or `text/event-stream` if we switch)
**Body**: Raw markdown text chunks.

### Case 2: JSON (`stream=false`)
**Content-Type**: `application/json`

```json
{
  "markdown_content": "# Feature Spec...",
  "generated_at": "2026-01-07T12:00:00Z"
}
```
