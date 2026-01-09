# Frontend Interface Contracts

**Feature**: 001-export-docs
**Date**: 2026-01-09

## Overview

本文档定义了PRD导出功能的前端接口契约。由于这是一个纯客户端功能，不涉及后端API，所有接口都是组件和服务之间的TypeScript接口契约。

## Service Interfaces

### ExportService

导出服务的接口契约。

```typescript
/**
 * 导出服务接口
 * 负责处理所有文档导出逻辑
 */
interface IExportService {
  /**
   * 复制内容到剪贴板
   * @param content - 要复制的文本内容
   * @returns Promise<boolean> - 成功返回true，失败返回false
   */
  copyToClipboard(content: string): Promise<boolean>;

  /**
   * 导出为PDF
   * @param content - Markdown内容
   * @param options - 导出选项
   * @returns Promise<ExportResult>
   */
  exportToPDF(
    content: string,
    options: PDFOptions
  ): Promise<ExportResult>;

  /**
   * 导出为DOCX
   * @param content - Markdown内容
   * @param options - 导出选项
   * @returns Promise<ExportResult>
   */
  exportToDOCX(
    content: string,
    options: DOCXOptions
  ): Promise<ExportResult>;

  /**
   * 检测文档大小
   * @param content - Markdown内容
   * @returns DocumentSizeInfo
   */
  detectDocumentSize(content: string): DocumentSizeInfo;

  /**
   * 生成文件名
   * @param base - 基础名称
   * @param version - 版本号
   * @param format - 文件格式
   * @returns 文件名
   */
  generateFilename(
    base: string,
    version: number,
    format: 'pdf' | 'docx'
  ): string;
}
```

---

### PDFOptions

PDF导出选项接口。

```typescript
/**
 * PDF导出选项
 */
interface PDFOptions {
  /** 文件名（不含扩展名） */
  filename?: string;

  /** 页边距 (mm)，默认10 */
  margin?: number;

  /** 图像质量 (0-1)，默认0.95 */
  quality?: number;

  /** 图像类型，默认'jpeg' */
  imageType?: 'png' | 'jpeg' | 'webp';

  /** 页面方向，默认'portrait' */
  orientation?: 'portrait' | 'landscape';

  /** HTML2Canvas选项 */
  html2canvas?: {
    scale?: number;      // 缩放比例，默认2
    useCORS?: boolean;   // 是否使用CORS，默认true
    allowTaint?: boolean; // 是否允许跨域图片，默认false
    logging?: boolean;   // 是否启用日志，默认false
  };

  /** jsPDF选项 */
  jsPDF?: {
    unit?: 'mm' | 'in' | 'pt';         // 单位，默认'mm'
    format?: 'a4' | 'letter' | 'legal'; // 页面格式，默认'a4'
    orientation?: 'portrait' | 'landscape'; // 方向，默认'portrait'
  };
}
```

---

### DOCXOptions

DOCX导出选项接口。

```typescript
/**
 * DOCX导出选项
 */
interface DOCXOptions {
  /** 文件名（不含扩展名） */
  filename?: string;

  /** 默认字体，默认'Microsoft YaHei' */
  font?: string;

  /** 字体大小（半点），默认24 (12pt) */
  fontSize?: number;

  /** 行间距，默认1.15 */
  lineSpacing?: number;

  /** 段落间距（缇，1/1440英寸） */
  spacing?: {
    before?: number; // 段前间距，默认240
    after?: number;  // 段后间距，默认120
  };

  /** 代码块样式 */
  codeBlock?: {
    font?: string;      // 字体，默认'Consolas'
    size?: number;      // 大小（半点），默认20 (10pt)
    shading?: string;   // 背景色，默认'#F5F5F5'
  };
}
```

---

### ExportResult

导出结果接口。

```typescript
/**
 * 导出结果
 */
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

  /** 元数据 */
  metadata: {
    version: number;
    wordCount: number;
    generatedAt: string; // ISO 8601 timestamp
  };
}
```

---

## Component Props Contracts

### ChatMessageProps

聊天消息组件的props接口契约。

```typescript
/**
 * 聊天消息组件Props
 */
interface ChatMessageProps {
  /** 消息角色 */
  role: 'user' | 'assistant';

  /** Markdown内容 */
  content: string;

  /** PRD版本号（可选） */
  version?: number;

  /** Token使用情况 */
  tokenUsage?: TokenUsage;

  /** 是否正在流式生成 */
  isStreaming?: boolean;

  /** 推理内容 */
  reasoningContent?: string;

  /** 提示词来源 */
  promptSource?: string;

  /** 导出功能配置 */
  exportConfig?: {
    /** 是否启用复制功能 */
    enableCopy?: boolean;
    /** 是否启用PDF导出 */
    enablePDF?: boolean;
    /** 是否启用DOCX导出 */
    enableDOCX?: boolean;
    /** 大文档警告阈值（字数），默认10000 */
    largeDocThreshold?: number;
  };
}
```

---

### ExportButtonProps

导出按钮组件的props接口契约。

```typescript
/**
 * 导出按钮组件Props
 */
interface ExportButtonProps {
  /** 按钮类型 */
  type: 'copy' | 'pdf' | 'docx';

  /** 图标组件 */
  icon: React.ComponentType<{ size?: number; className?: string }>;

  /** 按钮文本 */
  label: string;

  /** 是否禁用 */
  disabled?: boolean;

  /** 是否正在导出 */
  loading?: boolean;

  /** 导出进度 (0-100) */
  progress?: number;

  /** 点击回调 */
  onClick: () => void | Promise<void>;

  /** 取消回调（仅在loading时可用） */
  onCancel?: () => void;

  /** ARIA标签 */
  ariaLabel?: string;

  /** 错误消息 */
  error?: string | null;
}
```

---

## Event Contracts

### ExportEvents

导出相关事件的类型定义。

```typescript
/**
 * 导出开始事件
 */
interface ExportStartEvent {
  type: 'export-start';
  format: 'pdf' | 'docx' | 'copy';
  timestamp: number;
}

/**
 * 导出进度事件
 */
interface ExportProgressEvent {
  type: 'export-progress';
  format: 'pdf' | 'docx';
  progress: number; // 0-100
  stage: 'generating' | 'finalizing' | 'downloading';
  timestamp: number;
}

/**
 * 导出成功事件
 */
interface ExportSuccessEvent {
  type: 'export-success';
  format: 'pdf' | 'docx' | 'copy';
  result: ExportResult;
  timestamp: number;
}

/**
 * 导出错误事件
 */
interface ExportErrorEvent {
  type: 'export-error';
  format: 'pdf' | 'docx' | 'copy';
  error: ExportError;
  timestamp: number;
}

/**
 * 导出取消事件
 */
interface ExportCancelEvent {
  type: 'export-cancel';
  format: 'pdf' | 'docx';
  timestamp: number;
}

/**
 * 导出事件联合类型
 */
type ExportEvent =
  | ExportStartEvent
  | ExportProgressEvent
  | ExportSuccessEvent
  | ExportErrorEvent
  | ExportCancelEvent;
```

---

## Utility Interfaces

### DocumentSizeInfo

文档大小信息接口。

```typescript
/**
 * 文档大小信息
 */
interface DocumentSizeInfo {
  /** 字数 */
  wordCount: number;

  /** 字符数 */
  charCount: number;

  /** 是否为大文档 */
  isLarge: boolean;

  /** 预估导出时间 (ms) */
  estimatedTime: {
    pdf: number;
    docx: number;
  };

  /** 是否显示警告 */
  shouldWarn: boolean;
}
```

---

### ExportError

导出错误接口。

```typescript
/**
 * 导出错误
 */
interface ExportError {
  /** 错误类型 */
  type:
    | 'clipboard_denied'
    | 'clipboard_unavailable'
    | 'download_blocked'
    | 'generation_failed'
    | 'file_too_large'
    | 'network_error'
    | 'unknown';

  /** 用户友好的错误消息 */
  message: string;

  /** 技术详情 */
  details?: string;

  /** 错误代码 */
  code?: string;

  /** 原始错误对象 */
  originalError?: unknown;
}
```

---

## React Hooks Contracts

### UseExportResult

useExport hook的返回值接口契约。

```typescript
/**
 * 导出Hook返回值
 */
interface UseExportResult {
  /** 导出状态 */
  status: ExportStatus;

  /** 导出进度 (0-100) */
  progress: number;

  /** 错误信息 */
  error: string | null;

  /** 是否正在导出 */
  isExporting: boolean;

  /** 复制到剪贴板 */
  copyToClipboard: (content: string) => Promise<boolean>;

  /** 导出为PDF */
  exportToPDF: (content: string, options?: PDFOptions) => Promise<void>;

  /** 导出为DOCX */
  exportToDOCX: (content: string, options?: DOCXOptions) => Promise<void>;

  /** 取消导出 */
  cancelExport: () => void;

  /** 重置状态 */
  reset: () => void;
}
```

---

## Implementation Requirements

### TypeScript Strict Mode

所有接口实现必须遵循：

```typescript
// ✅ 正确：启用所有严格选项
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}

// ✅ 正确：明确返回类型
async function exportToPDF(
  content: string,
  options: PDFOptions
): Promise<ExportResult> {
  // 实现
}

// ✅ 正确：处理null/undefined
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
}

// ❌ 错误：使用any
function badFunction(data: any): any {
  return data;
}
```

### Prop Validation

使用TypeScript进行prop验证：

```typescript
// ✅ 正确：类型安全的props
function ExportButton({ type, onClick, disabled }: ExportButtonProps) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick();
    }
  }, [onClick, disabled]);

  return <button onClick={handleClick} disabled={disabled}>...</button>;
}

// ❌ 错误：没有类型检查
function BadButton({ type, onClick }: any) {
  return <button onClick={onClick}>...</button>;
}
```

---

## Contract Versioning

当前版本：**v1.0.0**

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-09 | Initial version |

### Breaking Changes Policy

- 任何接口变更必须更新次版本号 (x.x.x → x.x+1.0)
- 移除接口必须更新主版本号 (x.x.x → x+1.0.0)
- 添加可选字段不影响版本号

---

## Testing Requirements

### Unit Tests

每个接口实现必须有对应的单元测试：

```typescript
describe('ExportService', () => {
  it('should copy content to clipboard', async () => {
    const service = new ExportService();
    const result = await service.copyToClipboard('test content');
    expect(result).toBe(true);
  });

  it('should handle clipboard errors gracefully', async () => {
    const service = new ExportService();
    jest.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('Permission denied')
    );
    const result = await service.copyToClipboard('test content');
    expect(result).toBe(false);
  });
});
```

### Integration Tests

测试组件集成：

```typescript
describe('ChatMessage Export Integration', () => {
  it('should export to PDF when button clicked', async () => {
    const { getByLabelText } = render(<ChatMessage {...props} />);
    const pdfButton = getByLabelText('Export as PDF');
    await fireEvent.click(pdfButton);
    await waitFor(() => {
      expect(mockExportToPDF).toHaveBeenCalled();
    });
  });
});
```

---

## Summary

本文档定义了PRD导出功能的所有前端接口契约：

| Contract Type | Description |
|--------------|-------------|
| Service Interfaces | 导出服务的接口定义 |
| Component Props | 组件Props类型定义 |
| Event Contracts | 导出相关事件类型 |
| Utility Interfaces | 工具函数接口 |
| React Hooks | 自定义Hook接口 |

**Key Points**:
- ✅ 所有接口使用TypeScript strict模式
- ✅ 完整的类型定义和验证
- ✅ 明确的错误处理契约
- ✅ 事件驱动的状态管理
- ✅ 可测试的接口设计
