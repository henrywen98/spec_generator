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
        if (input.trim() && !isLoading) {
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
                        className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none placeholder-gray-400 disabled:opacity-50 max-h-48"
                    />
                    <div className="flex items-center gap-2">
                        {isLoading && (
                            <button
                                onClick={onStop}
                                className="flex-shrink-0 p-2.5 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                                aria-label="停止生成"
                            >
                                <Square size={16} />
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={!input.trim() || isLoading}
                            className="flex-shrink-0 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                    ⌘ + Enter 发送
                </p>
            </div>
        </div>
    );
}
