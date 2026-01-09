'use client';

import { X, Loader2 } from 'lucide-react';

export interface ProgressModalProps {
  /** Is modal open */
  isOpen: boolean;
  /** Export format */
  format: 'pdf' | 'docx';
  /** Current progress (0-100) */
  progress: number;
  /** Current stage */
  stage: 'generating' | 'finalizing' | 'downloading';
  /** Cancel handler */
  onCancel: () => void;
}

/**
 * Progress modal for long-running export operations
 */
export function ProgressModal({
  isOpen,
  format,
  progress,
  stage,
  onCancel,
}: ProgressModalProps) {
  if (!isOpen) return null;

  const formatLabel = format === 'pdf' ? 'PDF' : 'Word';

  const stageLabels: Record<typeof stage, string> = {
    generating: '正在生成文档...',
    finalizing: '正在处理...',
    downloading: '准备下载...',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 id="progress-title" className="text-sm font-medium text-gray-900">
            导出 {formatLabel}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="取消导出"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-6">
          {/* Spinner and stage label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <span className="text-sm text-gray-600">{stageLabels[stage]}</span>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Progress percentage */}
          <div className="mt-2 text-center text-xs text-gray-500">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
