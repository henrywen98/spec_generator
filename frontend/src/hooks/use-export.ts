/**
 * Export functionality hook
 * Manages export state and provides export functions
 */

import { useState, useCallback } from 'react';
import type { ExportStatus } from '@/types/export';
import { copyToClipboard } from '@/lib/export/export-copy';

export interface UseExportResult {
  /** Current export status */
  status: ExportStatus;
  /** Export progress (0-100) */
  progress: number;
  /** Error message if status is 'error' */
  error: string | null;
  /** Whether an export operation is in progress */
  isExporting: boolean;
  /** Copy content to clipboard */
  copyToClipboard: (content: string) => Promise<boolean>;
  /** Reset export state */
  reset: () => void;
}

export function useExport(): UseExportResult {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const copy = useCallback(async (content: string) => {
    setStatus('generating');
    setError(null);

    const result = await copyToClipboard(content);

    if (result.success) {
      setStatus('success');
      // Reset to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
      return true;
    } else {
      setStatus('error');
      setError(result.error || '复制失败');
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setError(null);
      }, 3000);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, []);

  return {
    status,
    progress,
    error,
    isExporting: status === 'generating' || status === 'finalizing',
    copyToClipboard: copy,
    reset,
  };
}
