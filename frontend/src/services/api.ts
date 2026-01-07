const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface GenerationRequest {
  description: string;
  stream?: boolean;
}

export interface GenerationResponse {
  markdown_content: string;
  generated_at: string;
}

// Helper to handle streaming response
export async function generateSpecStream(
  description: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  onComplete: () => void
) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }

    onComplete();
  } catch (err: any) {
    onError(err.message || 'Unknown error occurred');
  }
}
