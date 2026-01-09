'use client';

import { AlertTriangle, X } from 'lucide-react';
import type { DocumentSizeInfo } from '@/types/export';

export interface WarningModalProps {
  /** Is modal open */
  isOpen: boolean;
  /** Document size info */
  sizeInfo: DocumentSizeInfo;
  /** Export format */
  format: 'pdf' | 'docx';
  /** Confirm handler */
  onConfirm: () => void;
  /** Cancel handler */
  onCancel: () => void;
}

/**
 * Warning modal for large document exports
 */
export function WarningModal({
  isOpen,
  sizeInfo,
  format,
  onConfirm,
  onCancel,
}: WarningModalProps) {
  if (!isOpen) return null;

  const formatLabel = format === 'pdf' ? 'PDF' : 'Word';
  const estimatedTime = format === 'pdf'
    ? sizeInfo.estimatedTime.pdf
    : sizeInfo.estimatedTime.docx;

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `约 ${seconds} 秒`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `约 ${minutes} 分钟`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warning-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={18} />
            <h3 id="warning-title" className="text-sm font-medium">
              大文档警告
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-amber-600 hover:text-amber-800 rounded-md hover:bg-amber-100 transition-colors"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          <p className="text-sm text-gray-700 mb-4">
            当前文档较大（{sizeInfo.wordCount.toLocaleString()} 字），导出为 {formatLabel} 可能需要较长时间。
          </p>

          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">字数</span>
              <span className="font-mono text-gray-900">{sizeInfo.wordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">字符数</span>
              <span className="font-mono text-gray-900">{sizeInfo.charCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">预计耗时</span>
              <span className="font-mono text-amber-600">{formatTime(estimatedTime)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            导出过程中可以取消操作。
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
          >
            仍要导出
          </button>
        </div>
      </div>
    </div>
  );
}
