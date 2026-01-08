'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ChatMessage from '@/components/chat-message';
import ChatInput from '@/components/chat-input';
import { generateSpecStream, GenerationMode } from '@/services/api';
import { useStreamParser, TokenUsage } from '@/hooks/useStreamParser';
import { ArrowDown } from 'lucide-react';

// Keywords that trigger regeneration
const REGENERATE_KEYWORDS = ['生成新版', '整合修改', '输出完整版', '生成完整版', '重新生成'];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  version?: number;
  tokenUsage?: TokenUsage | null;
  reasoningContent?: string;
  isStreaming?: boolean;
  promptSource?: string; // e.g., "@prompts/prompt.md", "@prompts/prompt-suggestions.md"
}

export default function Home() {
  const { reasoningContent, markdownContent, tokenUsage, parseChunk, reset } = useStreamParser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [versionCount, setVersionCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const finalizeRequest = useCallback(() => {
    setIsLoading(false);
    abortControllerRef.current = null;
  }, []);

  const updateLastAssistant = useCallback((updater: (message: Message) => Message) => {
    setMessages(prev => {
      if (prev.length === 0) {
        return prev;
      }
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (updated[lastIdx].role !== 'assistant') {
        return prev;
      }
      updated[lastIdx] = updater(updated[lastIdx]);
      return updated;
    });
  }, []);

  // Check if user is near bottom
  const checkScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  // Update the last assistant message with streaming content (no auto-scroll)
  useEffect(() => {
    if (isLoading && (markdownContent || reasoningContent)) {
      updateLastAssistant(message => ({
        ...message,
        content: markdownContent,
        reasoningContent,
      }));
    }
  }, [markdownContent, reasoningContent, isLoading, updateLastAssistant]);

  // Finalize message when streaming completes
  useEffect(() => {
    if (!isLoading && markdownContent && messages.length > 0) {
      updateLastAssistant(message => ({
        ...message,
        content: markdownContent,
        tokenUsage,
        reasoningContent,
        isStreaming: false,
      }));
    }
  }, [isLoading, markdownContent, tokenUsage, reasoningContent, messages.length, updateLastAssistant]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const getLatestPrd = useCallback(() => {
    // Get the latest complete PRD (only from version messages)
    const prdMessages = messages.filter(m => m.role === 'assistant' && m.version && !m.isStreaming);
    return prdMessages.length > 0 ? prdMessages[prdMessages.length - 1].content : '';
  }, [messages]);

  const determineMode = useCallback((userInput: string): { mode: GenerationMode; isNewVersion: boolean } => {
    // No PRD yet = generate mode
    if (versionCount === 0) {
      return { mode: 'generate', isNewVersion: true };
    }

    // Check for regenerate keywords
    const shouldRegenerate = REGENERATE_KEYWORDS.some(kw => userInput.includes(kw));
    if (shouldRegenerate) {
      return { mode: 'regenerate', isNewVersion: true };
    }

    // Default to suggest mode (lightweight discussion)
    return { mode: 'suggest', isNewVersion: false };
  }, [versionCount]);

  const getPromptLabel = (mode: GenerationMode): string => {
    switch (mode) {
      case 'generate': return '🆕 初稿生成';
      case 'suggest': return '💡 修改建议';
      case 'regenerate': return '📝 新版生成';
    }
  };

  const handleSend = useCallback(async (userInput: string) => {
    setIsLoading(true);
    reset();

    const { mode, isNewVersion } = determineMode(userInput);
    const currentPrd = getLatestPrd();
    const promptLabel = getPromptLabel(mode);

    // For regenerate, collect recent discussion as modifications
    let contextForRegenerate = userInput;
    if (mode === 'regenerate') {
      // Collect suggestions from recent messages
      const recentSuggestions = messages
        .filter(m => m.role === 'assistant' && !m.version && !m.content.startsWith('❌ 错误'))
        .map(m => m.content)
        .join('\n\n');
      if (recentSuggestions) {
        const trimmed = recentSuggestions.slice(-4000);
        contextForRegenerate = trimmed + '\n\n用户确认: ' + userInput;
      }
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
    };

    // Add placeholder assistant message
    const newVersion = isNewVersion ? versionCount + 1 : undefined;
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      version: newVersion,
      isStreaming: true,
      promptSource: promptLabel,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    if (isNewVersion) {
      setVersionCount(prev => prev + 1);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const options = {
      mode,
      currentPrd: mode === 'generate' ? undefined : currentPrd,
      sessionId,
      signal: controller.signal,
    };

    await generateSpecStream(
      mode === 'regenerate' ? contextForRegenerate : userInput,
      parseChunk,
      (err) => {
        updateLastAssistant(message => ({
          ...message,
          content: `❌ 错误: ${err}`,
          isStreaming: false,
        }));
        finalizeRequest();
      },
      () => {
        finalizeRequest();
      },
      options,
      () => {
        finalizeRequest();
        updateLastAssistant(message => {
          const existing = message.content?.trim();
          return {
            ...message,
            isStreaming: false,
            content: existing ? message.content : '⏹️ 已停止生成',
          };
        });
      }
    );
  }, [
    versionCount,
    messages,
    sessionId,
    parseChunk,
    reset,
    determineMode,
    getLatestPrd,
    finalizeRequest,
    updateLastAssistant,
  ]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">PRD Generator</h1>
            <p className="text-sm text-gray-500">描述功能需求，AI 帮你生成产品规格文档</p>
          </div>
          {versionCount > 0 && (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              当前 v{versionCount}
            </span>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <main
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">开始创建 PRD</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                在下方输入您的功能需求描述，AI 将为您生成标准化的产品需求文档。
              </p>
              <div className="mt-6 text-sm text-gray-400 space-y-1">
                <p>💡 生成后可继续输入修改意见进行讨论</p>
                <p>📝 输入"生成新版"将整合讨论内容生成新版本</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                version={msg.version}
                tokenUsage={msg.tokenUsage}
                isStreaming={msg.isStreaming}
                reasoningContent={msg.reasoningContent}
                promptSource={msg.promptSource}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Scroll to bottom button - centered above input */}
      {showScrollButton && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <button
            onClick={scrollToBottom}
            className="p-2 px-4 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-colors pointer-events-auto flex items-center gap-2 text-sm text-gray-600"
          >
            <ArrowDown size={16} />
            <span>滚动到底部</span>
          </button>
        </div>
      )}

      {/* Fixed Bottom Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
        placeholder={
          versionCount === 0
            ? "描述您的功能需求..."
            : "输入修改意见，或输入\"生成新版\"整合讨论内容..."
        }
      />
    </div>
  );
}
