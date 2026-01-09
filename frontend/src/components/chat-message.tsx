'use client';

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Copy, Check, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { TokenUsage } from '@/hooks/useStreamParser';
import { useExport } from '@/hooks/use-export';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
    version?: number;
    tokenUsage?: TokenUsage | null;
    isStreaming?: boolean;
    reasoningContent?: string;
    promptSource?: string; // e.g., "🆕 初稿生成 @prompts/prompt.md"
}

export default function ChatMessage({
    role,
    content,
    version,
    tokenUsage,
    isStreaming,
    reasoningContent,
    promptSource
}: ChatMessageProps) {
    const [copied, setCopied] = useState(false);
    const [showReasoning, setShowReasoning] = useState(false);
    const { status: exportStatus, copyToClipboard, error: copyError } = useExport();

    // During streaming, check if we're still in "reasoning" phase (no main content yet)
    const isReasoningPhase = isStreaming && reasoningContent && !content;
    const hasContent = content && content.trim().length > 0;

    const handleCopy = async () => {
        const success = await copyToClipboard(content);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (role === 'user') {
        return (
            <div className="flex justify-end mb-4">
                <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                    <p className="whitespace-pre-wrap">{content}</p>
                </div>
            </div>
        );
    }

    // Assistant message
    return (
        <div className="flex justify-start mb-4">
            <div className="max-w-[90%] w-full">
                {/* Version badge and prompt source */}
                {(version || promptSource) && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {version && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                📝 PRD v{version}
                            </span>
                        )}
                        {promptSource && (
                            <span className="text-xs text-gray-500">
                                {promptSource}
                            </span>
                        )}
                        {isStreaming && (
                            <span className="inline-flex items-center text-xs text-gray-500">
                                <span className="animate-pulse">
                                    {isReasoningPhase ? '🧠 思考中...' : '✍️ 生成中...'}
                                </span>
                            </span>
                        )}
                    </div>
                )}

                {/* Reasoning content - show prominently during reasoning phase */}
                {reasoningContent && (isReasoningPhase || showReasoning) && (
                    <div className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2 text-amber-800">
                            <Brain size={16} />
                            <span className="text-sm font-medium">思考过程</span>
                            {isReasoningPhase && (
                                <span className="animate-pulse text-xs">...</span>
                            )}
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-sm text-amber-900 max-h-64 overflow-y-auto">
                            {reasoningContent}
                        </pre>
                    </div>
                )}

                {/* Toggle for reasoning after streaming completes */}
                {reasoningContent && !isReasoningPhase && !showReasoning && (
                    <button
                        onClick={() => setShowReasoning(true)}
                        className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 mb-2"
                    >
                        <ChevronDown size={14} />
                        查看思考过程
                    </button>
                )}
                {reasoningContent && showReasoning && !isReasoningPhase && (
                    <button
                        onClick={() => setShowReasoning(false)}
                        className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 mb-2 mt-[-8px]"
                    >
                        <ChevronUp size={14} />
                        收起
                    </button>
                )}

                {/* Main content - only show if we have content */}
                {(hasContent || !isReasoningPhase) && (
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm overflow-hidden">
                        <div className="p-4 prose prose-sm max-w-none min-h-[60px]">
                            {hasContent ? (
                                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</Markdown>
                            ) : (
                                <div className="text-gray-400 text-sm">等待生成...</div>
                            )}
                        </div>

                        {/* Actions */}
                        {hasContent && !isStreaming && (
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    {/* Copy button with accessibility */}
                                    <button
                                        onClick={handleCopy}
                                        disabled={exportStatus === 'generating'}
                                        aria-label="复制内容到剪贴板"
                                        aria-busy={exportStatus === 'generating'}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                    >
                                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                        {copied ? '已复制' : '复制'}
                                    </button>

                                    {/* Error message display */}
                                    {copyError && (
                                        <span className="text-xs text-red-600" role="alert" aria-live="polite">
                                            {copyError}
                                        </span>
                                    )}

                                    {/* Screen reader announcement */}
                                    <span className="sr-only" aria-live="polite" role="status">
                                        {exportStatus === 'generating' && '正在复制...'}
                                        {copied && '内容已复制到剪贴板'}
                                    </span>
                                </div>

                                {tokenUsage && (
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>输入: <span className="font-mono text-blue-600">{tokenUsage.inputTokens.toLocaleString()}</span></span>
                                        <span>输出: <span className="font-mono text-green-600">{tokenUsage.outputTokens.toLocaleString()}</span></span>
                                        <span>总计: <span className="font-mono font-semibold text-indigo-600">{tokenUsage.totalTokens.toLocaleString()}</span></span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
