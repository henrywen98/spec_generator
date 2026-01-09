/**
 * Validation utility functions for export functionality
 */

import type { DocumentSizeInfo } from '@/types/export';

/**
 * Count words in markdown content
 */
export function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Check if document is large (>10,000 words)
 */
export function isLargeDocument(markdown: string): boolean {
  const wordCount = countWords(markdown);
  return wordCount > 10000;
}

/**
 * Estimate export time based on word count
 */
export function estimateExportTime(wordCount: number, format: 'pdf' | 'docx'): number {
  const baseTime = format === 'pdf' ? 2000 : 1500; // ms
  const wordsPerMs = 0.5; // Words processed per millisecond
  return baseTime + (wordCount / wordsPerMs);
}

/**
 * Get document size information
 */
export function getDocumentSizeInfo(markdown: string): DocumentSizeInfo {
  const wordCount = countWords(markdown);
  const charCount = markdown.length;
  const isLarge = wordCount > 10000;

  return {
    wordCount,
    charCount,
    isLarge,
    estimatedTime: {
      pdf: estimateExportTime(wordCount, 'pdf'),
      docx: estimateExportTime(wordCount, 'docx'),
    },
    shouldWarn: isLarge,
  };
}
