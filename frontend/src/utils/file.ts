/**
 * File utility functions for export functionality
 */

import type { ExportResult } from '@/types/export';

/**
 * Sanitize filename by removing unsafe characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')  // Remove illegal characters
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .substring(0, 200);             // Limit length
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(
  base: string,
  version: number,
  format: 'pdf' | 'docx'
): string {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .substring(0, 19); // 2026-01-09T12-34-56

  return `${base}-v${version}-${timestamp}.${format}`;
}

/**
 * Trigger browser download for a blob
 */
export function triggerDownload(blob: Blob, filename: string): string {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  return url;
}

/**
 * Cleanup download URL
 */
export function cleanupDownload(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Create export result object
 */
export function createExportResult(
  blob: Blob,
  filename: string,
  mimeType: string,
  startTime: number
): ExportResult {
  const url = triggerDownload(blob, filename);
  const duration = Date.now() - startTime;

  return {
    blob,
    url,
    filename,
    size: blob.size,
    mimeType,
    duration,
  };
}
