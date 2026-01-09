/**
 * Export type definitions for PRD document export functionality
 */

/**
 * Export operation status enum
 */
export type ExportStatus =
  | 'idle'        // No operation in progress
  | 'generating'  // Document is being generated
  | 'finalizing'  // Download is being finalized
  | 'success'     // Operation completed successfully
  | 'error'       // Operation failed
  | 'cancelled';  // Operation cancelled by user

/**
 * PDF export options
 */
export interface PDFOptions {
  /** Filename without extension */
  filename?: string;
  /** Page margin in mm, default 10 */
  margin?: number;
  /** Image quality (0-1), default 0.95 */
  quality?: number;
  /** Image type, default 'jpeg' */
  imageType?: 'png' | 'jpeg' | 'webp';
}

/**
 * DOCX export options
 */
export interface DOCXOptions {
  /** Filename without extension */
  filename?: string;
  /** Default font, default 'Microsoft YaHei' */
  font?: string;
  /** Font size in half-points, default 24 (12pt) */
  fontSize?: number;
  /** Line spacing, default 1.15 */
  lineSpacing?: number;
}

/**
 * Export operation result
 */
export interface ExportResult {
  /** Generated file blob */
  blob: Blob;
  /** Download URL */
  url: string;
  /** Filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Export error information
 */
export interface ExportError {
  /** Error type */
  type:
    | 'clipboard_denied'     // Clipboard permission denied
    | 'clipboard_unavailable' // Clipboard API unavailable
    | 'download_blocked'      // Browser blocked download
    | 'generation_failed'     // Document generation failed
    | 'file_too_large'        // File too large
    | 'network_error'         // Network error
    | 'unknown';              // Unknown error
  /** User-friendly error message */
  message: string;
  /** Technical details */
  details?: string;
  /** Error code */
  code?: string;
}

/**
 * Document size information
 */
export interface DocumentSizeInfo {
  /** Word count */
  wordCount: number;
  /** Character count */
  charCount: number;
  /** Is large document (>10,000 words) */
  isLarge: boolean;
  /** Estimated export time in ms */
  estimatedTime: {
    pdf: number;
    docx: number;
  };
  /** Should show warning */
  shouldWarn: boolean;
}
