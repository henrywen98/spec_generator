# Research: PRD Document Export and Copy Fix

**Feature**: 001-export-docs
**Date**: 2026-01-09
**Status**: Complete

## Overview

本文档记录了为PRD生成器应用添加PDF/DOCX导出功能和修复复制按钮的技术研究和方案选择。

## Research Questions

### 1. PDF导出库选择

**需求**:
- 客户端生成PDF（不依赖后端）
- 保留Markdown格式（标题、列表、表格、代码块）
- 支持中英文混合内容
- 性能要求：<5000字文档在5秒内完成

**评估方案**:

| 库 | Bundle大小 | 中文支持 | 优缺点 |
|---|---|---|---|
| **html2pdf.js** | ~100 KB gzipped | ✅ 完美 | ✅ 保留CSS样式<br>✅ 易于实现<br>✅ 与react-markdown集成良好<br>❌ PDF为图片（文本不可选） |
| **jsPDF v3** | ~124 KB gzipped | ⚠️ 需配置字体 | ✅ 文本可选<br>✅ 文件更小<br>❌ 需要嵌入中文字体<br>❌ 实现复杂 |
| **@react-pdf/renderer** | ~70-90 KB gzipped | ⚠️ 需配置字体 | ✅ 原生React组件<br>❌ 与react-markdown集成困难<br>❌ 学习曲线陡峭 |

**决策**: **html2pdf.js**

**理由**:
1. 完美的中文支持（无需额外配置）
2. 保留Tailwind Typography样式
3. 与现有react-markdown输出无缝集成
4. 实现简单快速
5. 对于PRD文档场景，图片化PDF可接受

**Bundle影响**: ~100 KB gzipped

---

### 2. DOCX导出库选择

**需求**:
- 生成可编辑的Word文档
- 中文支持
- TypeScript友好
- 客户端生成

**评估方案**:

| 库 | Bundle大小 | 中文支持 | 优缺点 |
|---|---|---|---|
| **docx v9** | ~80-100 KB gzipped | ✅ 优秀 | ✅ TypeScript优先设计<br>✅ 声明式API<br>✅ 内置多语言支持<br>✅ 活跃维护<br>❌ 需要转换Markdown |
| **docx-templates** | ~60-80 KB gzipped | ⚠️ 取决于模板 | ✅ 模板化方法<br>❌ 需要维护Word模板<br>❌ 不适合动态内容 |
| **html-docx-js** | ~100-150 KB | ⚠️ 不确定 | ✅ HTML直接转DOCX<br>❌ 维护较少<br>❌ 样式控制有限 |

**决策**: **docx v9.5.1**

**理由**:
1. TypeScript-first设计，类型安全
2. 内置中文支持，设置中文字体简单
3. 生成专业的可编辑Word文档
4. 活跃维护，社区支持好
5. 适合程序化文档生成

**Bundle影响**: ~80-100 KB gzipped

---

### 3. Markdown到DOCX转换方案

**挑战**: 需要将Markdown AST转换为docx库的文档结构

**解决方案**:

使用 **marked** 词法分析器解析Markdown，然后遍历tokens转换为docx结构：

```typescript
import { marked } from 'marked';
import { Paragraph, TextRun, HeadingLevel } from 'docx';

const tokens = marked.lexer(markdown);
const paragraphs: Paragraph[] = [];

for (const token of tokens) {
  switch (token.type) {
    case 'heading':
      paragraphs.push(new Paragraph({
        text: token.text,
        heading: token.depth as HeadingLevel
      }));
      break;
    case 'paragraph':
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: token.text, font: 'Microsoft YaHei' })]
      }));
      break;
    // ... 其他token类型
  }
}
```

**支持的Markdown元素**:
- ✅ 标题（h1-h6）
- ✅ 段落
- ✅ 代码块（等宽字体 + 灰色背景）
- ✅ 列表（有序/无序）
- ⚠️ 表格（需要额外处理）
- ⚠️ 链接（需要额外处理）

---

### 4. 复制按钮修复方案

**问题**: 现有复制按钮使用Clipboard API但无法工作

**可能原因**:
1. 浏览器权限限制（需要HTTPS或localhost）
2. Clipboard API在非用户手势下被阻止
3. 异步错误未正确处理

**解决方案**:

```typescript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    // 降级方案：使用传统方法
    fallbackCopy(content);
    console.error('Clipboard failed:', err);
  }
};

// 降级方案（兼容旧浏览器）
const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Fallback copy failed:', err);
    // 显示用户友好的错误消息
  }
  document.body.removeChild(textarea);
};
```

---

### 5. 性能优化策略

**动态导入**: 仅在需要时加载导出库

```typescript
const exportToPDF = async (content: string) => {
  const html2pdf = (await import('html2pdf.js')).default;
  // ... 导出逻辑
};
```

**大文档处理**:
- 检测文档大小（>10,000字显示警告）
- 显示进度指示器
- 提供取消按钮

---

### 6. 可访问性实现

**WCAG 2.1 AA要求**:

1. **ARIA标签**:
```typescript
<button
  aria-label="Export document as PDF file"
  aria-describedby="export-help"
>
  <Download aria-hidden="true" />
  导出PDF
</button>
```

2. **键盘导航**:
```typescript
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleExport();
    }
  }}
  tabIndex={0}
>
```

3. **屏幕阅读器通知**:
```typescript
<div role="status" aria-live="polite" className="sr-only">
  {exportStatus}
</div>
```

4. **焦点管理**:
```typescript
const [exporting, setExporting] = useState(false);
<button
  aria-busy={exporting}
  disabled={exporting}
>
```

---

## 推荐安装的包

```bash
cd /Users/henry/Documents/5_Github/spec_generator/frontend

# PDF导出
npm install html2pdf.js

# DOCX导出
npm install docx

# Markdown解析
npm install marked

# TypeScript类型
npm install --save-dev @types/marked

# 图标（已有lucide-react，无需额外安装）
# 文件下载图标已包含在lucide-react中
```

---

## Bundle影响总览

| 功能 | 库 | Gzipped大小 |
|---|---|---|
| PDF导出 | html2pdf.js | ~100 KB |
| DOCX导出 | docx | ~80-100 KB |
| Markdown解析 | marked | ~5 KB |
| **总计** | | **~185-205 KB** |

**评估**: 对于完整的文档导出功能，这个bundle大小是可接受的。

---

## 实现优先级

基于规范中的用户故事优先级：

1. **P1 - 复制按钮修复** (立即)
   - 实现改进的复制逻辑
   - 添加降级方案
   - 错误处理和用户反馈

2. **P2 - PDF导出** (第二)
   - 集成html2pdf.js
   - 实现导出按钮和进度指示
   - 添加可访问性支持

3. **P3 - DOCX导出** (最后)
   - 集成docx库
   - 实现Markdown到DOCX转换器
   - 测试中文字体渲染

---

## 潜在风险和缓解措施

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| Bundle大小增加 | 首次加载变慢 | 使用动态导入，按需加载 |
| 大文档性能 | 导出时间过长 | 显示进度条，提供取消按钮 |
| 中文PDF质量 | 字体渲染问题 | html2pdf.js无需配置，完美支持 |
| DOCX转换复杂度 | 某些Markdown元素不支持 | 先实现基础元素，逐步扩展 |
| 浏览器兼容性 | 旧浏览器不支持 | Clipboard API降级方案 |

---

## 替代方案考虑

### PDF导出替代方案

**jsPDF + 中文字体**
- 优点: 文本可选择，文件更小
- 缺点: 需要嵌入字体（增加2-3MB），实现复杂
- 结论: 不推荐，除非文本选择是关键需求

### DOCX导出替代方案

**docx-templates**
- 优点: 使用Word模板，易于样式控制
- 缺点: 需要维护模板文件，不适合动态内容
- 结论: 不推荐，PRD内容高度动态

---

## 总结

**技术栈选择**:
- **PDF**: html2pdf.js
- **DOCX**: docx v9 + marked
- **复制**: 改进的Clipboard API + 降级方案
- **可访问性**: ARIA标签 + 键盘导航 + 屏幕阅读器支持

**预期结果**:
- ✅ 完美的中文支持
- ✅ 保留Markdown格式
- ✅ 5秒内完成标准文档导出
- ✅ 符合WCAG 2.1 AA标准
- ✅ Bundle增加可接受（~200 KB gzipped）

**下一步**: 进入Phase 1，生成数据模型和API契约。
