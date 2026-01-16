import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetUrl = `${BACKEND_URL}/api/v1/${path.join('/')}`;

  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  // 流式响应：直接透传
  if (response.headers.get('content-type')?.includes('ndjson')) {
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
      },
    });
  }

  // 非流式响应
  const data = await response.text();
  return new Response(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetUrl = `${BACKEND_URL}/api/v1/${path.join('/')}`;

  const response = await fetch(targetUrl);
  const data = await response.text();

  return new Response(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
