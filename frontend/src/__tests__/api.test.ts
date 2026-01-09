import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateSpecStream } from '../services/api';

function createReader(chunks: string[]) {
  let index = 0;
  return {
    read: vi.fn().mockImplementation(() => {
      if (index < chunks.length) {
        const value = new TextEncoder().encode(chunks[index]);
        index += 1;
        return Promise.resolve({ done: false, value });
      }
      return Promise.resolve({ done: true, value: undefined });
    }),
  };
}

describe('generateSpecStream', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('streams chunks and calls onComplete', async () => {
    const chunks = ['{"type":"content","content":"A"}\n', '{"type":"content","content":"B"}\n'];
    const reader = createReader(chunks);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => reader },
      json: vi.fn(),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const received: string[] = [];
    const onComplete = vi.fn();

    await generateSpecStream(
      'desc',
      (chunk) => received.push(chunk),
      vi.fn(),
      onComplete,
      { stream: true }
    );

    expect(received.join('')).toContain('"type":"content"');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('handles abort without calling onError', async () => {
    const abortError = new DOMException('aborted', 'AbortError');
    const fetchMock = vi.fn().mockRejectedValue(abortError);
    global.fetch = fetchMock as unknown as typeof fetch;

    const onError = vi.fn();
    const onAbort = vi.fn();
    const controller = new AbortController();

    await generateSpecStream(
      'desc',
      vi.fn(),
      onError,
      vi.fn(),
      { signal: controller.signal },
      onAbort
    );

    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });
});
