'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square } from 'lucide-react';
import { ImageUpload } from './image-upload';
import { ImagePreviewList } from './image-preview';
import type { PendingImage } from '@/hooks/useImageUpload';

interface ChatInputProps {
    onSend: (message: string) => void;
    onStop?: () => void;
    isLoading: boolean;
    placeholder?: string;
    onInputResize?: () => void;
    // Image upload props
    pendingImages?: PendingImage[];
    onAddImages?: (files: FileList) => void;
    onRemoveImage?: (id: string) => void;
    canAddMoreImages?: boolean;
    maxImageCount?: number;
}

export default function ChatInput({
    onSend,
    onStop,
    isLoading,
    placeholder = "输入功能需求或修改意见...",
    onInputResize,
    pendingImages = [],
    onAddImages,
    onRemoveImage,
    canAddMoreImages = true,
    maxImageCount = 5,
}: ChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            const prevHeight = textareaRef.current.offsetHeight;
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            if (textareaRef.current.offsetHeight !== prevHeight) {
                onInputResize?.();
            }
        }
    }, [input, onInputResize]);

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

    // Handle paste event for clipboard images
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        if (!onAddImages || !canAddMoreImages) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            // Convert File[] to FileList-like object
            const dataTransfer = new DataTransfer();
            imageFiles.forEach(file => dataTransfer.items.add(file));
            onAddImages(dataTransfer.files);
        }
    }, [onAddImages, canAddMoreImages]);

    // Check if image upload is enabled
    const imageUploadEnabled = !!onAddImages && !!onRemoveImage;

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto space-y-3">
                {/* Image preview list (above input area) */}
                {imageUploadEnabled && pendingImages.length > 0 && (
                    <ImagePreviewList
                        images={pendingImages}
                        onRemove={onRemoveImage}
                        maxCount={maxImageCount}
                    />
                )}

                <div className="flex items-end gap-3 bg-gray-50 rounded-2xl border border-gray-200 p-2">
                    {/* Image upload button (left of text input) */}
                    {imageUploadEnabled && (
                        <ImageUpload
                            onFilesSelected={onAddImages}
                            disabled={isLoading}
                            canAddMore={canAddMoreImages}
                            maxCount={maxImageCount}
                            currentCount={pendingImages.length}
                        />
                    )}

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
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
                    ⌘ + Enter 发送 · ⌘ + V 粘贴图片
                </p>
            </div>
        </div>
    );
}
