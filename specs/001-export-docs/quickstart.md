# Quick Start Guide: PRD Document Export

**Feature**: 001-export-docs
**Date**: 2026-01-09

## Overview

本指南将帮助您快速开始实施PRD文档导出功能。在开始之前，请确保已阅读并理解 `research.md` 和 `data-model.md`。

## Prerequisites

### System Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- 现代浏览器（Chrome 66+, Firefox 63+, Safari 13.1+, Edge 79+）

### Existing Dependencies

项目已有：
- ✅ Next.js 16.1.1
- ✅ React 19.2.3
- ✅ TypeScript 5
- ✅ Tailwind CSS 4
- ✅ lucide-react（图标库）

## Installation

### 1. 安装新依赖

```bash
cd /Users/henry/Documents/5_Github/spec_generator/frontend

# PDF导出库
npm install html2pdf.js

# DOCX导出库
npm install docx

# Markdown解析器
npm install marked

# TypeScript类型
npm install --save-dev @types/marked
```

### 2. 验证安装

```bash
# 检查package.json
cat package.json | grep -E "(html2pdf|docx|marked)"

# 应该看到：
#   "html2pdf.js": "^版本号"
#   "docx": "^版本号"
#   "marked": "^版本号"
```

---

## Project Structure

### 新增文件结构

```text
frontend/src/
├── lib/
│   ├── export/
│   │   ├── export-pdf.ts      # PDF导出服务
│   │   ├── export-docx.ts     # DOCX导出服务
│   │   ├── export-copy.ts     # 复制服务
│   │   ├── markdown-parser.ts # Markdown解析器
│   │   └── index.ts           # 导出入口
│   └── utils/
│       ├── file.ts            # 文件工具函数
│       └── validation.ts      # 验证工具
│
├── components/
│   ├── chat-message.tsx       # 修改：添加导出按钮
│   └── export/                # 新增：导出相关组件
│       ├── export-button.tsx  # 导出按钮组件
│       ├── progress-modal.tsx # 进度模态框
│       └── warning-modal.tsx  # 大文档警告模态框
│
├── hooks/
│   └── use-export.ts          # 导出Hook
│
└── types/
    └── export.ts              # 导出类型定义
```

---

## Implementation Steps

### Step 1: 创建类型定义

**文件**: `frontend/src/types/export.ts`

```typescript
// 导出状态
export type ExportStatus =
  | 'idle'
  | 'generating'
  | 'finalizing'
  | 'success'
  | 'error'
  | 'cancelled';

// PDF选项
export interface PDFOptions {
  filename?: string;
  margin?: number;
  quality?: number;
  imageType?: 'png' | 'jpeg' | 'webp';
}

// DOCX选项
export interface DOCXOptions {
  filename?: string;
  font?: string;
  fontSize?: number;
  lineSpacing?: number;
}

// 导出结果
export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  duration: number;
}

// 导出错误
export interface ExportError {
  type: string;
  message: string;
  details?: string;
}
```

---

### Step 2: 实现复制功能

**文件**: `frontend/src/lib/export/export-copy.ts`

```typescript
/**
 * 复制内容到剪贴板
 * 支持Clipboard API和降级方案
 */
export async function copyToClipboard(
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 尝试使用现代Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content);
      return { success: true };
    }

    // 降级方案：使用execCommand
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      return { success: true };
    } else {
      return {
        success: false,
        error: '复制失败，请检查浏览器权限'
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '未知错误'
    };
  }
}
```

---

### Step 3: 实现PDF导出

**文件**: `frontend/src/lib/export/export-pdf.ts`

```typescript
import html2pdf from 'html2pdf.js';
import { PDFOptions, ExportResult } from '@/types/export';

const defaultOptions: PDFOptions = {
  margin: 10,
  quality: 0.95,
  imageType: 'jpeg'
};

export async function exportToPDF(
  element: HTMLElement,
  content: string,
  options: PDFOptions = {}
): Promise<ExportResult> {
  const startTime = Date.now();
  const mergedOptions = { ...defaultOptions, ...options };

  // 生成文件名
  const filename = options.filename || `prd-${Date.now()}.pdf`;

  // 配置html2pdf
  const pdfOptions = {
    margin: mergedOptions.margin,
    filename: filename,
    image: {
      type: mergedOptions.imageType!,
      quality: mergedOptions.quality!
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  // 生成PDF
  await html2pdf().set(pdfOptions).from(element).save();

  const duration = Date.now() - startTime;

  return {
    blob: new Blob(), // html2pdf直接触发下载
    url: '',
    filename,
    size: 0,
    mimeType: 'application/pdf',
    duration
  };
}
```

---

### Step 4: 实现DOCX导出

**文件**: `frontend/src/lib/export/export-docx.ts`

```typescript
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType
} from 'docx';
import { marked } from 'marked';
import { DOCXOptions, ExportResult } from '@/types/export';

const defaultOptions: DOCXOptions = {
  font: 'Microsoft YaHei',
  fontSize: 24,
  lineSpacing: 1.15
};

export async function exportToDOCX(
  markdown: string,
  options: DOCXOptions = {}
): Promise<ExportResult> {
  const startTime = Date.now();
  const mergedOptions = { ...defaultOptions, ...options };

  // 解析Markdown
  const tokens = marked.lexer(markdown);
  const children: Paragraph[] = [];

  // 转换tokens
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        children.push(
          new Paragraph({
            text: token.text,
            heading: token.depth as HeadingLevel,
            spacing: { before: 240, after: 120 }
          })
        );
        break;

      case 'paragraph':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: token.text,
                font: mergedOptions.font,
                size: mergedOptions.fontSize
              })
            ],
            spacing: { after: 120 }
          })
        );
        break;

      case 'code':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: token.text,
                font: 'Consolas',
                size: 20
              })
            ],
            shading: { fill: 'F5F5F5' },
            spacing: { before: 120, after: 120 }
          })
        );
        break;

      // 添加更多token类型...
    }
  }

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  // 生成Blob
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const filename = options.filename || `prd-${Date.now()}.docx`;

  // 触发下载
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  const duration = Date.now() - startTime;

  return {
    blob,
    url,
    filename,
    size: blob.size,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    duration
  };
}
```

---

### Step 5: 创建导出Hook

**文件**: `frontend/src/hooks/use-export.ts`

```typescript
import { useState, useCallback } from 'react';
import { ExportStatus, ExportError } from '@/types/export';
import { copyToClipboard } from '@/lib/export/export-copy';
import { exportToPDF } from '@/lib/export/export-pdf';
import { exportToDOCX } from '@/lib/export/export-docx';

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const copy = useCallback(async (content: string) => {
    setStatus('generating');
    setError(null);

    const result = await copyToClipboard(content);

    if (result.success) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('error');
      setError(result.error || '复制失败');
    }
  }, []);

  const exportPDF = useCallback(async (content: string, version: number) => {
    setStatus('generating');
    setError(null);
    setProgress(0);

    try {
      // 实现PDF导出逻辑
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError('PDF导出失败');
    }
  }, []);

  const exportDOCX = useCallback(async (content: string, version: number) => {
    setStatus('generating');
    setError(null);
    setProgress(0);

    try {
      // 实现DOCX导出逻辑
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError('DOCX导出失败');
    }
  }, []);

  return {
    status,
    progress,
    error,
    isExporting: status === 'generating' || status === 'finalizing',
    copy,
    exportPDF,
    exportDOCX
  };
}
```

---

### Step 6: 修改ChatMessage组件

**文件**: `frontend/src/components/chat-message.tsx`

在现有的actions区域添加导出按钮：

```typescript
// 在文件顶部添加导入
import { Download, FileText } from 'lucide-react';
import { useExport } from '@/hooks/use-export';

// 在ChatMessage组件内
export default function ChatMessage({ role, content, version, ...props }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const { status, exportPDF, exportDOCX } = useExport();

  // 复制处理
  const handleCopy = async () => {
    // 使用useExport的copy方法
  };

  // PDF导出处理
  const handleExportPDF = async () => {
    if (!version) return;
    await exportPDF(content, version);
  };

  // DOCX导出处理
  const handleExportDOCX = async () => {
    if (!version) return;
    await exportDOCX(content, version);
  };

  // 在返回的JSX中，找到actions区域并添加按钮
  return (
    <div className="...">
      {/* ...existing content... */}

      {/* Actions区域 */}
      {hasContent && !isStreaming && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* 现有复制按钮 */}
            <button onClick={handleCopy} aria-label="复制内容">
              <Copy size={14} />
              {copied ? '已复制' : '复制'}
            </button>

            {/* 新增：PDF导出按钮 */}
            {version && (
              <button
                onClick={handleExportPDF}
                disabled={status === 'generating'}
                aria-label="导出为PDF"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <Download size={14} />
                导出PDF
              </button>
            )}

            {/* 新增：DOCX导出按钮 */}
            {version && (
              <button
                onClick={handleExportDOCX}
                disabled={status === 'generating'}
                aria-label="导出为Word文档"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <FileText size={14} />
                导出Word
              </button>
            )}
          </div>

          {/* Token使用情况 */}
          {tokenUsage && <div>...</div>}
        </div>
      )}
    </div>
  );
}
```

---

## Testing

### 本地测试

1. **启动开发服务器**:

```bash
cd /Users/henry/Documents/5_Github/spec_generator/frontend
npm run dev
```

2. **测试流程**:

```text
1. 打开浏览器访问 http://localhost:23456
2. 输入功能需求生成PRD
3. 等待PRD生成完成
4. 测试复制按钮：
   - 点击复制
   - 粘贴到文本编辑器验证内容
5. 测试PDF导出：
   - 点击"导出PDF"按钮
   - 验证PDF文件下载
   - 打开PDF检查格式
6. 测试DOCX导出：
   - 点击"导出Word"按钮
   - 验证DOCX文件下载
   - 用Word打开检查可编辑性
```

### 测试检查清单

- [ ] 复制按钮正常工作
- [ ] PDF导出保留中文和格式
- [ ] DOCX导出可编辑
- [ ] 导出按钮在流式生成时禁用
- [ ] 大文档显示警告
- [ ] 进度指示器正常显示
- [ ] 错误处理友好
- [ ] 键盘导航可用
- [ ] 屏幕阅读器支持

---

## Debugging

### 常见问题

**问题1**: 复制按钮不工作

```typescript
// 检查浏览器是否支持Clipboard API
console.log('Clipboard API available:', !!navigator.clipboard);
console.log('Secure context:', window.isSecureContext);

// 如果不支持，会自动降级到execCommand
```

**问题2**: PDF中文显示乱码

```typescript
// html2pdf.js应该正确处理中文
// 如果有问题，检查：
// 1. 元素的CSS字体设置
// 2. html2canvas的scale配置
```

**问题3**: DOCX导出失败

```typescript
// 检查marked解析是否正常
const tokens = marked.lexer(markdown);
console.log('Parsed tokens:', tokens);

// 检查docx生成
try {
  const blob = await Packer.toBlob(doc);
  console.log('Blob size:', blob.size);
} catch (err) {
  console.error('DOCX generation failed:', err);
}
```

---

## Performance Optimization

### 动态导入

减少初始bundle大小：

```typescript
// 在需要时动态导入导出库
const exportToPDF = async (content: string) => {
  const html2pdf = (await import('html2pdf.js')).default;
  // ... 导出逻辑
};

const exportToDOCX = async (content: string) => {
  const { Document, Paragraph, Packer } = await import('docx');
  // ... 导出逻辑
};
```

---

## Accessibility Checklist

确保实现符合WCAG 2.1 AA标准：

- [ ] 所有按钮有`aria-label`属性
- [ ] 键盘可访问（Tab导航）
- [ ] 焦点可见（`focus-visible`样式）
- [ ] 屏幕阅读器通知（`aria-live`区域）
- [ ] 颜色对比度≥4.5:1
- [ ] 加载状态有`aria-busy`属性

---

## Next Steps

1. ✅ 安装依赖
2. ✅ 创建类型定义
3. ✅ 实现导出服务
4. ✅ 修改ChatMessage组件
5. ⏳ 测试功能
6. ⏳ 添加单元测试
7. ⏳ 性能优化
8. ⏳ 文档完善

完成这些步骤后，您应该有一个完整的PRD导出功能！

---

## Additional Resources

- [html2pdf.js Documentation](https://github.com/ekoopmans/html2pdf.js)
- [docx Documentation](https://docx.js.org/)
- [marked Documentation](https://marked.js.org/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
