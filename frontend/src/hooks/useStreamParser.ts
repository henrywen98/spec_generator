import { useState, useRef, useCallback } from 'react';

type StreamParserState = 'idle' | 'reasoning';

interface UseStreamParserResult {
  reasoningContent: string;
  markdownContent: string;
  parseChunk: (chunk: string) => void;
  reset: () => void;
}

const START_MARKER = '<!--REASONING_START-->';
const END_MARKER = '<!--REASONING_END-->';

export function useStreamParser(): UseStreamParserResult {
  const [reasoningContent, setReasoningContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const stateRef = useRef<StreamParserState>('idle');
  const bufferRef = useRef('');

  const reset = useCallback(() => {
    setReasoningContent('');
    setMarkdownContent('');
    stateRef.current = 'idle';
    bufferRef.current = '';
  }, []);

  const parseChunk = useCallback((chunk: string) => {
    bufferRef.current += chunk;

    while (bufferRef.current.length > 0) {
      const buffer = bufferRef.current;
      const state = stateRef.current;

      if (state === 'reasoning') {
        const endIdx = buffer.indexOf(END_MARKER);
        if (endIdx !== -1) {
          setReasoningContent(prev => prev + buffer.slice(0, endIdx));
          bufferRef.current = buffer.slice(endIdx + END_MARKER.length);
          stateRef.current = 'idle';
        } else {
          // Check for partial END marker - wait for more chunks
          if (buffer.includes('<!--REASONING_EN')) {
            return;
          }
          // No END marker yet, keep buffering
          return;
        }
      } else {
        const startIdx = buffer.indexOf(START_MARKER);
        if (startIdx !== -1) {
          if (startIdx > 0) {
            setMarkdownContent(prev => prev + buffer.slice(0, startIdx));
          }
          bufferRef.current = buffer.slice(startIdx + START_MARKER.length);
          stateRef.current = 'reasoning';
        } else {
          // Check for partial START marker
          if (buffer.includes('<!--REASONING_STA')) {
            return;
          }
          // No START marker, all markdown
          setMarkdownContent(prev => prev + buffer);
          bufferRef.current = '';
          break;
        }
      }
    }
  }, []);

  return { reasoningContent, markdownContent, parseChunk, reset };
}
