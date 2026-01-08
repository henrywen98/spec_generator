// 使用相对路径，由 Next.js rewrites 代理到后端
const API_BASE_URL = '/api/v1';

export type GenerationMode = 'generate' | 'chat';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  mode?: GenerationMode;
  currentPrd?: string;
  chatHistory?: ChatHistoryMessage[];
  sessionId?: string;
  stream?: boolean;
  signal?: AbortSignal;
}

// Helper to handle streaming response
export async function generateSpecStream(
  description: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  onComplete: () => void,
  options: GenerateOptions = {},
  onAbort?: () => void
) {
  try {
    const { mode = 'generate', currentPrd, chatHistory, sessionId, stream = true, signal } = options;

    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        description,
        stream,
        mode,
        current_prd: currentPrd,
        chat_history: chatHistory,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser.');
    }

    if (stream) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }

      const tail = decoder.decode();
      if (tail) {
        onChunk(tail);
      }

      onComplete();
      return;
    }

    const data = await response.json();
    if (data?.markdown_content) {
      onChunk(JSON.stringify({ type: 'content', content: data.markdown_content }) + '\n');
    }
    onComplete();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      onAbort?.();
      return;
    }
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    onError(message);
  }
}
