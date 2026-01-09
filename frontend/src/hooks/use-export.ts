/**
 * Export functionality hook
 * Manages export state and provides export functions for copy, PDF, and DOCX
 */

import { useState, useCallback, useRef } from 'react';
import type { ExportStatus, PDFOptions, DOCXOptions, ExportResult } from '@/types/export';
import { copyToClipboard } from '@/lib/export/export-copy';
import { getDocumentSizeInfo } from '@/utils/validation';
import { triggerDownload } from '@/utils/file';

export interface UseExportResult {
  /** Current export status */
  status: ExportStatus;
  /** Export progress (0-100) */
  progress: number;
  /** Error message if status is 'error' */
  error: string | null;
  /** Whether an export operation is in progress */
  isExporting: boolean;
  /** Current export format */
  currentFormat: 'pdf' | 'docx' | 'copy' | null;
  /** Copy content to clipboard */
  copyToClipboard: (content: string) => Promise<boolean>;
  /** Export to PDF */
  exportToPDF: (content: string, version: number, options?: PDFOptions) => Promise<ExportResult | null>;
  /** Export to DOCX */
  exportToDOCX: (content: string, version: number, options?: DOCXOptions) => Promise<ExportResult | null>;
  /** Cancel current export */
  cancelExport: () => void;
  /** Reset export state */
  reset: () => void;
  /** Check if document is large */
  checkDocumentSize: (content: string) => ReturnType<typeof getDocumentSizeInfo>;
}

export function useExport(): UseExportResult {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentFormat, setCurrentFormat] = useState<'pdf' | 'docx' | 'copy' | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const copy = useCallback(async (content: string) => {
    setStatus('generating');
    setCurrentFormat('copy');
    setError(null);

    const result = await copyToClipboard(content);

    if (result.success) {
      setStatus('success');
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus('idle');
        setCurrentFormat(null);
      }, 2000);
      return true;
    } else {
      setStatus('error');
      setError(result.error || '复制失败');
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setError(null);
        setCurrentFormat(null);
      }, 3000);
      return false;
    }
  }, []);

  const exportPDF = useCallback(async (
    content: string,
    version: number,
    options?: PDFOptions
  ): Promise<ExportResult | null> => {
    setStatus('generating');
    setCurrentFormat('pdf');
    setProgress(0);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Dynamic import for code splitting
      const { exportToPDF: exportPDFService } = await import('@/lib/export/export-pdf');

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        clearInterval(progressInterval);
        return null;
      }

      setStatus('finalizing');
      setProgress(95);

      const blobResult = await exportPDFService(content, version, options);

      clearInterval(progressInterval);

      // Check if cancelled after service completes (before triggering download)
      if (abortControllerRef.current?.signal.aborted) {
        setStatus('cancelled');
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
          setCurrentFormat(null);
        }, 1000);
        return null;
      }

      // Trigger download only if not cancelled
      const url = triggerDownload(blobResult.blob, blobResult.filename);
      const result: ExportResult = { ...blobResult, url };

      setProgress(100);
      setStatus('success');

      // Reset after success
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setCurrentFormat(null);
      }, 2000);

      return result;
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        setStatus('cancelled');
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
          setCurrentFormat(null);
        }, 1000);
        return null;
      }

      setStatus('error');
      setError(err instanceof Error ? err.message : 'PDF 导出失败');

      setTimeout(() => {
        setStatus('idle');
        setError(null);
        setProgress(0);
        setCurrentFormat(null);
      }, 3000);

      return null;
    }
  }, []);

  const exportDOCX = useCallback(async (
    content: string,
    version: number,
    options?: DOCXOptions
  ): Promise<ExportResult | null> => {
    setStatus('generating');
    setCurrentFormat('docx');
    setProgress(0);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Dynamic import for code splitting
      const { exportToDOCX: exportDOCXService } = await import('@/lib/export/export-docx');

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        clearInterval(progressInterval);
        return null;
      }

      setStatus('finalizing');
      setProgress(95);

      const blobResult = await exportDOCXService(content, version, options);

      clearInterval(progressInterval);

      // Check if cancelled after service completes (before triggering download)
      if (abortControllerRef.current?.signal.aborted) {
        setStatus('cancelled');
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
          setCurrentFormat(null);
        }, 1000);
        return null;
      }

      // Trigger download only if not cancelled
      const url = triggerDownload(blobResult.blob, blobResult.filename);
      const result: ExportResult = { ...blobResult, url };

      setProgress(100);
      setStatus('success');

      // Reset after success
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setCurrentFormat(null);
      }, 2000);

      return result;
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        setStatus('cancelled');
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
          setCurrentFormat(null);
        }, 1000);
        return null;
      }

      setStatus('error');
      setError(err instanceof Error ? err.message : 'DOCX 导出失败');

      setTimeout(() => {
        setStatus('idle');
        setError(null);
        setProgress(0);
        setCurrentFormat(null);
      }, 3000);

      return null;
    }
  }, []);

  const cancelExport = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('cancelled');
    setTimeout(() => {
      setStatus('idle');
      setProgress(0);
      setCurrentFormat(null);
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setProgress(0);
    setError(null);
    setCurrentFormat(null);
  }, []);

  const checkDocumentSize = useCallback((content: string) => {
    return getDocumentSizeInfo(content);
  }, []);

  return {
    status,
    progress,
    error,
    isExporting: status === 'generating' || status === 'finalizing',
    currentFormat,
    copyToClipboard: copy,
    exportToPDF: exportPDF,
    exportToDOCX: exportDOCX,
    cancelExport,
    reset,
    checkDocumentSize,
  };
}
