import { useCallback, useRef, useState } from 'react';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface UseStreamParserResult {
  reasoningContent: string;
  markdownContent: string;
  tokenUsage: TokenUsage | null;
  isFullPrd: boolean | null;
  parseChunk: (chunk: string) => void;
  reset: () => void;
}

const LINE_BREAK = '\n';

export function useStreamParser(): UseStreamParserResult {
  const [reasoningContent, setReasoningContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [isFullPrd, setIsFullPrd] = useState<boolean | null>(null);
  const bufferRef = useRef('');

  const reset = useCallback(() => {
    setReasoningContent('');
    setMarkdownContent('');
    setTokenUsage(null);
    setIsFullPrd(null);
    bufferRef.current = '';
  }, []);

  const parseChunk = useCallback((chunk: string) => {
    bufferRef.current += chunk;

    while (true) {
      const newlineIndex = bufferRef.current.indexOf(LINE_BREAK);
      if (newlineIndex === -1) {
        return;
      }
      const line = bufferRef.current.slice(0, newlineIndex).trim();
      bufferRef.current = bufferRef.current.slice(newlineIndex + 1);

      if (!line) {
        continue;
      }

      try {
        const event = JSON.parse(line) as { type?: string; [key: string]: unknown };
        switch (event.type) {
          case 'content':
            if (typeof event.content === 'string') {
              setMarkdownContent(prev => prev + event.content);
            }
            break;
          case 'reasoning':
            if (typeof event.content === 'string') {
              setReasoningContent(prev => prev + event.content);
            }
            break;
          case 'usage':
            setTokenUsage({
              inputTokens: Number(event.input_tokens ?? 0),
              outputTokens: Number(event.output_tokens ?? 0),
              totalTokens: Number(event.total_tokens ?? 0),
            });
            break;
          case 'metadata':
            if (typeof event.is_full_prd === 'boolean') {
              setIsFullPrd(event.is_full_prd);
            }
            break;
          case 'error':
            if (typeof event.message === 'string') {
              setMarkdownContent(prev => `${prev}\n\n❌ ${event.message}`);
            } else {
              setMarkdownContent(prev => `${prev}\n\n❌ 请求失败`);
            }
            break;
          default:
            break;
        }
      } catch {
        // Skip malformed lines.
      }
    }
  }, []);

  return { reasoningContent, markdownContent, tokenUsage, isFullPrd, parseChunk, reset };
}
