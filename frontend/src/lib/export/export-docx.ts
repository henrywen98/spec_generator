/**
 * DOCX export service using docx library
 * Converts markdown content to Word document
 */

import type { DOCXOptions, ExportResult } from '@/types/export';
import { generateExportFilename, createExportResult } from '@/utils/file';
import { parseMarkdownTokens, stripMarkdown, type ParsedToken } from './markdown-parser';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
  AlignmentType,
} from 'docx';

/**
 * Export markdown content to DOCX
 * @param content - Markdown content to export
 * @param version - PRD version number
 * @param options - DOCX export options
 * @returns Promise<ExportResult>
 */
export async function exportToDOCX(
  content: string,
  version: number,
  options: DOCXOptions = {}
): Promise<ExportResult> {
  const startTime = Date.now();

  const font = options.font || 'Microsoft YaHei';
  const fontSize = options.fontSize || 24; // 12pt in half-points
  const lineSpacing = options.lineSpacing || 1.15;

  // Parse markdown to tokens
  const tokens = parseMarkdownTokens(content);

  // Convert tokens to docx elements
  const children = tokens.flatMap(token => tokenToDocxElements(token, { font, fontSize, lineSpacing }));

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
    styles: {
      default: {
        document: {
          run: {
            font,
            size: fontSize,
          },
          paragraph: {
            spacing: {
              line: Math.round(lineSpacing * 240), // Convert to twips
              before: 120,
              after: 120,
            },
          },
        },
      },
    },
  });

  // Generate blob
  const blob = await Packer.toBlob(doc);
  const filename = options.filename || generateExportFilename('prd', version, 'docx');

  return createExportResult(
    blob,
    filename,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    startTime
  );
}

interface DocxOptions {
  font: string;
  fontSize: number;
  lineSpacing: number;
}

/**
 * Convert parsed token to docx elements
 */
function tokenToDocxElements(
  token: ParsedToken,
  options: DocxOptions
): (Paragraph | Table)[] {
  const { font, fontSize } = options;

  switch (token.type) {
    case 'heading':
      return [createHeading(token.text || '', token.depth || 1, font)];

    case 'paragraph':
      return [createParagraph(token.text || '', font, fontSize)];

    case 'list':
      return createList(token.items || [], token.ordered || false, font, fontSize);

    case 'code':
      return [createCodeBlock(token.text || '')];

    case 'blockquote':
      return [createBlockquote(token.text || '', font, fontSize)];

    case 'table':
      if (token.header && token.rows) {
        return [createTable(token.header, token.rows, font, fontSize)];
      }
      return [];

    case 'hr':
      return [createHorizontalRule()];

    case 'space':
      return [new Paragraph({})];

    default:
      return [];
  }
}

/**
 * Create heading paragraph
 */
function createHeading(text: string, depth: number, font: string): Paragraph {
  const headingLevelMap: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };

  const sizeMap: Record<number, number> = {
    1: 48, // 24pt
    2: 36, // 18pt
    3: 28, // 14pt
    4: 24, // 12pt
    5: 22, // 11pt
    6: 20, // 10pt
  };

  return new Paragraph({
    heading: headingLevelMap[depth] || HeadingLevel.HEADING_1,
    children: parseInlineFormatting(stripMarkdown(text), font, sizeMap[depth] || 24, true),
    spacing: {
      before: 240,
      after: 120,
    },
  });
}

/**
 * Create regular paragraph
 */
function createParagraph(text: string, font: string, fontSize: number): Paragraph {
  return new Paragraph({
    children: parseInlineFormatting(text, font, fontSize),
    spacing: {
      before: 120,
      after: 120,
    },
  });
}

/**
 * Create list items
 */
function createList(
  items: string[],
  ordered: boolean,
  font: string,
  fontSize: number
): Paragraph[] {
  return items.map((item, index) => {
    const bullet = ordered ? `${index + 1}. ` : '• ';
    return new Paragraph({
      children: [
        new TextRun({
          text: bullet,
          font,
          size: fontSize,
        }),
        ...parseInlineFormatting(stripMarkdown(item), font, fontSize),
      ],
      indent: {
        left: 720, // 0.5 inch in twips
      },
      spacing: {
        before: 60,
        after: 60,
      },
    });
  });
}

/**
 * Create code block
 */
function createCodeBlock(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: 'Consolas',
        size: 20, // 10pt
      }),
    ],
    shading: {
      fill: 'F5F5F5',
    },
    spacing: {
      before: 120,
      after: 120,
    },
  });
}

/**
 * Create blockquote
 */
function createBlockquote(text: string, font: string, fontSize: number): Paragraph {
  return new Paragraph({
    children: parseInlineFormatting(stripMarkdown(text), font, fontSize),
    indent: {
      left: 720,
    },
    border: {
      left: {
        color: '3B82F6',
        size: 24,
        style: BorderStyle.SINGLE,
        space: 10,
      },
    },
    spacing: {
      before: 120,
      after: 120,
    },
  });
}

/**
 * Create table
 */
function createTable(
  header: string[],
  rows: string[][],
  font: string,
  fontSize: number
): Table {
  const headerRow = new TableRow({
    children: header.map(cell => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text: stripMarkdown(cell),
          font,
          size: fontSize,
          bold: true,
        })],
        alignment: AlignmentType.LEFT,
      })],
      shading: {
        fill: 'F8F9FA',
      },
    })),
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text: stripMarkdown(cell),
          font,
          size: fontSize,
        })],
        alignment: AlignmentType.LEFT,
      })],
    })),
  }));

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
}

/**
 * Create horizontal rule
 */
function createHorizontalRule(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        color: 'DDDDDD',
        size: 6,
        style: BorderStyle.SINGLE,
        space: 1,
      },
    },
    spacing: {
      before: 240,
      after: 240,
    },
  });
}

/**
 * Parse inline markdown formatting to TextRuns
 */
function parseInlineFormatting(
  text: string,
  font: string,
  fontSize: number,
  isBold = false
): TextRun[] {
  // Simple implementation - just return plain text
  // A more complete implementation would parse bold, italic, code, links
  const runs: TextRun[] = [];

  // Split by bold markers
  const boldRegex = /\*\*(.+?)\*\*|__(.+?)__/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      runs.push(new TextRun({
        text: text.slice(lastIndex, match.index),
        font,
        size: fontSize,
        bold: isBold,
      }));
    }

    // Add bold text
    runs.push(new TextRun({
      text: match[1] || match[2],
      font,
      size: fontSize,
      bold: true,
    }));

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({
      text: text.slice(lastIndex),
      font,
      size: fontSize,
      bold: isBold,
    }));
  }

  // If no runs were created, create one with the full text
  if (runs.length === 0) {
    runs.push(new TextRun({
      text,
      font,
      size: fontSize,
      bold: isBold,
    }));
  }

  return runs;
}
