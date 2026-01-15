'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ChatMessage from '@/components/chat-message';
import ChatInput from '@/components/chat-input';
import { generateSpecStream, GenerationMode, ImageAttachment } from '@/services/api';
import { useStreamParser, TokenUsage } from '@/hooks/useStreamParser';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ArrowDown } from 'lucide-react';

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
  const [sessionId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
  );
  const [versionCount, setVersionCount] = useState(0);
  const versionCountRef = useRef(0); // 用于同步获取最新版本号，避免竞态条件
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Image upload hook
  const {
    pendingImages,
    addImages,
    removeImage,
    clearImages,
    getImageAttachments,
    canAddMore,
    maxCount,
  } = useImageUpload();

  const finalizeRequest = useCallback(() => {
    setIsLoading(false);
    abortControllerRef.current = null;
  }, []);

  const updateLastAssistant = useCallback((updater: (message: Message) => Message) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (updated[lastIdx].role !== 'assistant') return prev;
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
      setUserHasScrolledUp(!isNearBottom); // Track if user scrolled up
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

  // Auto-scroll when content updates during streaming, unless user scrolled up
  useEffect(() => {
    if (isLoading && !userHasScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [markdownContent, reasoningContent, isLoading, userHasScrolledUp]);

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
    setUserHasScrolledUp(false); // Reset scroll intent when user clicks button
  }, []);

  const getLatestPrd = useCallback(() => {
    const prdMessages = messages.filter(m => m.role === 'assistant' && m.version && !m.isStreaming);
    return prdMessages.length > 0 ? prdMessages[prdMessages.length - 1].content : '';
  }, [messages]);

  const determineMode = useCallback((): { mode: GenerationMode } => {
    // No PRD yet = generate mode, otherwise chat mode
    // LLM will decide whether to give suggestions or full document based on user intent
    return { mode: versionCount === 0 ? 'generate' : 'chat' };
  }, [versionCount]);

  const getPromptLabel = (mode: GenerationMode): string => {
    return mode === 'generate' ? '🆕 初稿生成' : '💬 对话模式';
  };

  const handleSend = useCallback(async (userInput: string) => {
    setIsLoading(true);
    reset();
    setUserHasScrolledUp(false); // Reset scroll intent when sending new message

    const { mode } = determineMode();
    const currentPrd = getLatestPrd();
    const promptLabel = getPromptLabel(mode);
    const isInitialGeneration = mode === 'generate';

    // Get images before clearing
    const imageAttachments = getImageAttachments();

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
    };

    // Add placeholder assistant message
    // Both generate and chat mode always produce a new version
    versionCountRef.current += 1;
    const newVersion = versionCountRef.current;

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      version: newVersion,
      isStreaming: true,
      promptSource: promptLabel,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setVersionCount(newVersion);

    // Clear images after adding to state (images are captured above)
    clearImages();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build options (no chat history needed - simplified flow)
    const options = {
      mode,
      currentPrd: isInitialGeneration ? undefined : currentPrd,
      sessionId,
      signal: controller.signal,
      images: imageAttachments.length > 0 ? imageAttachments as ImageAttachment[] : undefined,
    };

    await generateSpecStream(
      userInput,
      parseChunk,
      err => {
        updateLastAssistant(msg => ({
          ...msg,
          content: `❌ 错误: ${err}`,
          isStreaming: false,
          version: undefined,
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
            version: undefined,  // Clear version on abort
          };
        });
      }
    );
  }, [
    versionCount,
    sessionId,
    parseChunk,
    reset,
    determineMode,
    getLatestPrd,
    finalizeRequest,
    updateLastAssistant,
    getImageAttachments,
    clearImages,
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
                <p>💡 生成后可继续对话，AI 会自动判断是给建议还是直接修改</p>
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
            : "继续对话，提出修改意见或要求生成新版..."
        }
        pendingImages={pendingImages}
        onAddImages={addImages}
        onRemoveImage={removeImage}
        canAddMoreImages={canAddMore}
        maxImageCount={maxCount}
      />
    </div>
  );
}
