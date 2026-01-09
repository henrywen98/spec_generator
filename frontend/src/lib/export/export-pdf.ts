/**
 * PDF export service using html2pdf.js
 * Converts markdown content to PDF with proper formatting
 */

import type { PDFOptions, ExportResult } from '@/types/export';
import { generateExportFilename, createExportResult } from '@/utils/file';
import { marked } from 'marked';

/**
 * Export markdown content to PDF
 * @param content - Markdown content to export
 * @param version - PRD version number
 * @param options - PDF export options
 * @returns Promise<ExportResult>
 */
export async function exportToPDF(
  content: string,
  version: number,
  options: PDFOptions = {}
): Promise<ExportResult> {
  const startTime = Date.now();

  // Dynamic import for html2pdf.js (reduces initial bundle size)
  const html2pdf = (await import('html2pdf.js')).default;

  // Convert markdown to HTML
  const htmlContent = await marked.parse(content);

  // Create styled HTML wrapper for PDF
  const styledHtml = createStyledHtml(htmlContent);

  // Create temporary container (kept offscreen) but export the inner content
  // to avoid cloning the offscreen positioning into the PDF.
  const container = document.createElement('div');
  container.innerHTML = styledHtml;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  try {
    const margin = options.margin ?? 10;
    const quality = options.quality ?? 0.95;
    const imageType = options.imageType ?? 'jpeg';

    // Configure html2pdf options
    const pdfOptions = {
      margin,
      filename: options.filename || generateExportFilename('prd', version, 'pdf'),
      image: { type: imageType, quality },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
    };

    // Generate PDF blob
    const exportSource = container.firstElementChild ?? container;
    const blob = await html2pdf()
      .set(pdfOptions)
      .from(exportSource)
      .outputPdf('blob');

    const filename = pdfOptions.filename;

    return createExportResult(
      blob as Blob,
      filename,
      'application/pdf',
      startTime
    );
  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
}

/**
 * Create styled HTML wrapper for PDF rendering
 */
function createStyledHtml(htmlContent: string): string {
  return `
    <div style="
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      padding: 20px;
    ">
      <style>
        h1 { font-size: 24pt; font-weight: bold; margin: 24pt 0 12pt 0; color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 8pt; }
        h2 { font-size: 18pt; font-weight: bold; margin: 20pt 0 10pt 0; color: #2563eb; }
        h3 { font-size: 14pt; font-weight: bold; margin: 16pt 0 8pt 0; color: #333; }
        h4 { font-size: 12pt; font-weight: bold; margin: 12pt 0 6pt 0; color: #555; }
        p { margin: 8pt 0; }
        ul, ol { margin: 8pt 0; padding-left: 24pt; }
        li { margin: 4pt 0; }
        code { font-family: 'Consolas', 'Monaco', monospace; background: #f5f5f5; padding: 2pt 4pt; border-radius: 3pt; font-size: 10pt; }
        pre { background: #f5f5f5; padding: 12pt; border-radius: 6pt; overflow-x: auto; margin: 12pt 0; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4pt solid #3b82f6; padding-left: 12pt; margin: 12pt 0; color: #666; font-style: italic; }
        table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        th, td { border: 1pt solid #ddd; padding: 8pt; text-align: left; }
        th { background: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background: #f8f9fa; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        hr { border: none; border-top: 1pt solid #ddd; margin: 16pt 0; }
        a { color: #2563eb; text-decoration: none; }
      </style>
      ${htmlContent}
    </div>
  `;
}
