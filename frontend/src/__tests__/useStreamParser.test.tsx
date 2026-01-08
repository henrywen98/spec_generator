import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useStreamParser } from '../hooks/useStreamParser';

describe('useStreamParser', () => {
  it('parses content, reasoning, and usage events', () => {
    const { result } = renderHook(() => useStreamParser());

    act(() => {
      result.current.parseChunk('{"type":"reasoning","content":"think"}\n');
      result.current.parseChunk('{"type":"content","content":"hello"}\n');
      result.current.parseChunk('{"type":"usage","input_tokens":1,"output_tokens":2,"total_tokens":3}\n');
    });

    expect(result.current.reasoningContent).toBe('think');
    expect(result.current.markdownContent).toBe('hello');
    expect(result.current.tokenUsage).toEqual({
      inputTokens: 1,
      outputTokens: 2,
      totalTokens: 3,
    });
  });

  it('buffers partial lines until newline', () => {
    const { result } = renderHook(() => useStreamParser());

    act(() => {
      result.current.parseChunk('{"type":"content","content":"partial"}');
      result.current.parseChunk('\n{"type":"content","content":"done"}\n');
    });

    expect(result.current.markdownContent).toBe('partialdone');
  });

  it('appends error messages to markdown content', () => {
    const { result } = renderHook(() => useStreamParser());

    act(() => {
      result.current.parseChunk('{"type":"error","message":"oops"}\n');
    });

    expect(result.current.markdownContent).toContain('oops');
  });
});
