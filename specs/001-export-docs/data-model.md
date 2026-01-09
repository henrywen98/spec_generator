# Data Model: PRD Document Export and Copy Fix

**Feature**: 001-export-docs
**Date**: 2026-01-09
**Status**: Final

## Overview

本文档定义了PRD文档导出功能的数据模型。由于这是一个纯前端功能，不涉及后端API或数据库持久化，所有数据模型都是前端组件内部使用的类型定义。

## Entity Relationship Diagram

```text
┌────────────────────────────────────────────────────────────────────┐
│                         ChatMessage Component                      │
├────────────────────────────────────────────────────────────────────┤
│  ExportAction (State)                                              │
│  ├── type: 'copy' | 'pdf' | 'docx'                                │
│  ├── status: 'idle' | 'generating' | 'success' | 'error'          │
│  ├── progress: number (0-100)                                      │
│  └── error: string | null                                          │
│                                                                   │
│  ExportOptions (Configuration)                                     │
│  ├── filename: string                                              │
│  ├── format: 'pdf' | 'docx'                                       │
│  └── version: number                                               │
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                   │
│  │  PRD Content     │ ──→  │  Exported File   │                   │
│  ├──────────────────┤      ├──────────────────┤                   │
│  │  markdown: str   │      │  blob: Blob      │                   │
│  │  version: num    │      │  url: string     │                   │
│  │  wordCount: num  │      │  filename: str   │                   │
│  └──────────────────┘      └──────────────────┘                   │
└────────────────────────────────────────────────────────────────────┘
```

## Entities

### 1. ExportAction

表示用户发起的导出操作的状态和元数据。

```typescript
interface ExportAction {
  /** 导出类型 */
  type: 'copy' | 'pdf' | 'docx';

  /** 当前状态 */
  status: ExportStatus;

  /** 导出进度 (0-100) */
  progress: number;

  /** 错误消息（如果status为error） */
  error: string | null;

  /** 开始时间戳 */
  startedAt: number;

  /** 完成时间戳（如果status为success或error） */
  completedAt?: number;
}
```

**State Transitions**:

```
idle → generating → success
  ↓                  ↑
  └────→ error ←─────┘
```

---

### 2. ExportStatus

导出操作的枚举状态。

```typescript
type ExportStatus =
  | 'idle'        // 空闲，无操作进行
  | 'generating'  // 正在生成文档
  | 'finalizing'  // 正在完成下载
  | 'success'     // 成功完成
  | 'error'       // 发生错误
  | 'cancelled';  // 用户取消
```

---

### 3. ExportOptions

导出配置选项。

```typescript
interface ExportOptions {
  /** 文件名（不含扩展名） */
  filename: string;

  /** 导出格式 */
  format: 'pdf' | 'docx';

  /** PRD版本号 */
  version: number;

  /** PDF特定选项 */
  pdf?: {
    /** 页边距 (mm) */
    margin?: number;
    /** 图像质量 (0-1) */
    quality?: number;
    /** 图像类型 */
    imageType?: 'png' | 'jpeg' | 'webp';
  };

  /** DOCX特定选项 */
  docx?: {
    /** 默认字体 */
    font?: string;
    /** 字体大小 (半点) */
    fontSize?: number;
    /** 行间距 */
    lineSpacing?: number;
  };
}
```

---

### 4. PRDDocument

PRD文档的内容和元数据。

```typescript
interface PRDDocument {
  /** Markdown内容 */
  markdown: string;

  /** 版本号 */
  version: number;

  /** 字数统计 */
  wordCount: number;

  /** Token使用情况 */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  /** 是否正在流式生成 */
  isStreaming: boolean;
}
```

---

### 5. ExportResult

导出操作的结果。

```typescript
interface ExportResult {
  /** 生成的文件Blob */
  blob: Blob;

  /** 下载URL */
  url: string;

  /** 文件名 */
  filename: string;

  /** 文件大小 (bytes) */
  size: number;

  /** MIME类型 */
  mimeType: string;

  /** 耗时 (ms) */
  duration: number;
}
```

---

### 6. ExportError

导出错误的详细信息。

```typescript
interface ExportError {
  /** 错误类型 */
  type:
    | 'clipboard_denied'     // 剪贴板权限被拒绝
    | 'clipboard_unavailable' // Clipboard API不可用
    | 'download_blocked'      // 浏览器阻止下载
    | 'generation_failed'     // 文档生成失败
    | 'file_too_large'        // 文件过大
    | 'network_error'         // 网络错误
    | 'unknown';              // 未知错误

  /** 用户友好的错误消息 */
  message: string;

  /** 技术详情（用于调试） */
  details?: string;

  /** 错误代码 */
  code?: string;
}
```

---

## Component State

### ChatMessage Component State

导出功能相关的组件状态。

```typescript
interface ChatMessageExportState {
  /** 复制状态 */
  copy: {
    copied: boolean;        // 是否已复制
    error: string | null;   // 错误消息
  };

  /** PDF导出状态 */
  pdf: {
    status: ExportStatus;
    progress: number;
    error: string | null;
  };

  /** DOCX导出状态 */
  docx: {
    status: ExportStatus;
    progress: number;
    error: string | null;
  };

  /** 大文档警告状态 */
  largeDocWarning: {
    show: boolean;          // 是否显示警告
    wordCount: number;      // 字数
    onConfirm: () => void;  // 确认回调
  };
}
```

---

## Validation Rules

### 文件名验证

```typescript
/**
 * 生成安全的文件名
 */
function sanitizeFilename(filename: string): string {
  // 移除不安全的字符
  return filename
    .replace(/[<>:"/\\|?*]/g, '')  // 移除非法字符
    .replace(/\s+/g, '_')           // 空格替换为下划线
    .substring(0, 200);             // 限制长度
}

/**
 * 生成带时间戳的文件名
 */
function generateExportFilename(
  base: string,
  version: number,
  format: 'pdf' | 'docx'
): string {
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .substring(0, 19); // 2026-01-09T12-34-56

  return `${base}-v${version}-${timestamp}.${format}`;
}

// 示例输出: "prd-v1-2026-01-09T12-34-56.pdf"
```

### 文档大小检测

```typescript
/**
 * 检测是否为大文档
 */
function isLargeDocument(markdown: string): boolean {
  const wordCount = markdown.split(/\s+/).length;
  return wordCount > 10000;
}

/**
 * 估算导出时间（基于字数）
 */
function estimateExportTime(wordCount: number, format: 'pdf' | 'docx'): number {
  const baseTime = format === 'pdf' ? 2000 : 1500; // ms
  const wordsPerMs = 0.5; // 每毫秒处理的字数
  return baseTime + (wordCount / wordsPerMs);
}
```

---

## Data Flow

### 复制流程

```text
用户点击复制按钮
    ↓
检查内容长度
    ↓
调用 navigator.clipboard.writeText()
    ↓
成功 → 设置 copied=true (2秒)
    ↓
失败 → 降级到 execCommand('copy')
    ↓
仍失败 → 显示错误消息
```

### PDF导出流程

```text
用户点击PDF导出按钮
    ↓
检查文档大小
    ↓
>10,000字? → 显示警告 → 用户确认?
    ↓ 否                ↓ 是
    ←───────────────────┘
    ↓
显示进度指示器
    ↓
html2pdf.js生成PDF
    ↓
创建下载链接
    ↓
触发浏览器下载
    ↓
完成 → 清理状态
```

### DOCX导出流程

```text
用户点击DOCX导出按钮
    ↓
检查文档大小
    ↓
>10,000字? → 显示警告 → 用户确认?
    ↓ 否                ↓ 是
    ←───────────────────┘
    ↓
显示进度指示器
    ↓
marked.lexer()解析Markdown
    ↓
转换为docx结构
    ↓
docx.Packer.toBlob()生成Blob
    ↓
创建下载链接
    ↓
触发浏览器下载
    ↓
完成 → 清理状态
```

---

## Storage

### 无持久化存储

本功能不涉及任何持久化存储：
- ❌ 不使用LocalStorage/IndexedDB
- ❌ 不发送到后端API
- ❌ 不存储导出历史

所有导出操作都是：
1. 用户触发
2. 客户端生成
3. 浏览器下载
4. 清理内存

### 临时内存管理

```typescript
// 导出完成后清理URL对象
function cleanupDownload(url: string): void {
  URL.revokeObjectURL(url);
}

// 使用示例
const blob = await generateDocx(markdown);
const url = URL.createObjectURL(blob);
triggerDownload(url);
setTimeout(() => cleanupDownload(url), 1000);
```

---

## Type Safety

所有接口都使用TypeScript严格模式定义，确保：

```typescript
// ✅ 类型安全的导出函数
async function exportToPDF(
  content: string,
  options: ExportOptions
): Promise<ExportResult> {
  // ...
}

// ✅ 类型守卫
function isExportError(error: unknown): error is ExportError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  );
}

// ✅ 不可变状态
const [exportState, setExportState] = useState<Readonly<ExportAction>>(
  initialExportState
);
```

---

## Summary

| Entity | Type | Purpose |
|---|---|---|
| ExportAction | Interface | 追踪导出操作状态 |
| ExportStatus | Type | 导出状态枚举 |
| ExportOptions | Interface | 导出配置参数 |
| PRDDocument | Interface | PRD文档数据 |
| ExportResult | Interface | 导出结果 |
| ExportError | Interface | 错误信息 |

**Key Points**:
- ✅ 所有类型定义使用TypeScript strict模式
- ✅ 状态管理使用React hooks
- ✅ 无后端依赖，纯前端实现
- ✅ 内存安全，及时清理临时对象
- ✅ 类型安全，编译时检查
