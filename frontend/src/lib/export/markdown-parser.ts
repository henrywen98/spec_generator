/**
 * Markdown parser for DOCX export
 * Converts markdown tokens to docx-compatible structure
 */

import { marked, type TokensList, type Tokens } from 'marked';

export interface ParsedToken {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'blockquote' | 'table' | 'hr' | 'space';
  depth?: number; // For headings (1-6)
  text?: string;
  items?: string[]; // For lists
  ordered?: boolean; // For lists
  lang?: string; // For code blocks
  rows?: string[][]; // For tables
  header?: string[]; // For tables
}

type MarkedToken = TokensList[number];

/**
 * Parse markdown content into tokens for DOCX conversion
 */
export function parseMarkdownTokens(markdown: string): ParsedToken[] {
  const tokens = marked.lexer(markdown);
  return tokens.map(convertToken).filter((t): t is ParsedToken => t !== null);
}

/**
 * Convert marked token to our simplified format
 */
function convertToken(token: MarkedToken): ParsedToken | null {
  switch (token.type) {
    case 'heading':
      return {
        type: 'heading',
        depth: token.depth,
        text: token.text,
      };

    case 'paragraph':
      return {
        type: 'paragraph',
        text: token.text,
      };

    case 'list':
      return {
        type: 'list',
        ordered: token.ordered,
        items: token.items.map((item: Tokens.ListItem) => item.text),
      };

    case 'code':
      return {
        type: 'code',
        text: token.text,
        lang: token.lang || undefined,
      };

    case 'blockquote':
      return {
        type: 'blockquote',
        text: token.text,
      };

    case 'table':
      return {
        type: 'table',
        header: token.header.map((cell: Tokens.TableCell) => cell.text),
        rows: token.rows.map((row: Tokens.TableCell[]) => row.map((cell: Tokens.TableCell) => cell.text)),
      };

    case 'hr':
      return {
        type: 'hr',
      };

    case 'space':
      return {
        type: 'space',
      };

    default:
      // Handle other token types as paragraphs if they have text
      if ('text' in token && typeof token.text === 'string') {
        return {
          type: 'paragraph',
          text: token.text,
        };
      }
      return null;
  }
}

/**
 * Strip markdown formatting from text (for plain text extraction)
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1')     // Italic
    .replace(/__(.+?)__/g, '$1')     // Bold
    .replace(/_(.+?)_/g, '$1')       // Italic
    .replace(/`(.+?)`/g, '$1')       // Inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/!\[.*?\]\(.+?\)/g, '') // Images
    .trim();
}
