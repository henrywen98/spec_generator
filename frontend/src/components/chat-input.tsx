'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    onStop?: () => void;
    isLoading: boolean;
    placeholder?: string;
}

export default function ChatInput({
    onSend,
    onStop,
    isLoading,
    placeholder = "输入功能需求或修改意见..."
}: ChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleSubmit = () => {
        if (isLoading) {
            // If loading, stop generation
            onStop?.();
        } else if (input.trim()) {
            // Otherwise, send the message
            onSend(input.trim());
            setInput('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-end gap-3 bg-gray-50 rounded-2xl border border-gray-200 p-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        rows={1}
                        className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-none placeholder-gray-400 disabled:opacity-50 max-h-48"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!isLoading && !input.trim()}
                        className="flex-shrink-0 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label={isLoading ? "停止生成" : "发送"}
                    >
                        {isLoading ? (
                            <Square size={18} />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                    ⌘ + Enter 发送
                </p>
            </div>
        </div>
    );
}
