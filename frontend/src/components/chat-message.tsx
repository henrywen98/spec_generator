"use client";

import { ProgressModal } from "@/components/export/progress-modal";
import { WarningModal } from "@/components/export/warning-modal";
import { useExport } from "@/hooks/use-export";
import { TokenUsage } from "@/hooks/useStreamParser";
import {
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileDown,
  FileText,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  version?: number;
  tokenUsage?: TokenUsage | null;
  isStreaming?: boolean;
  reasoningContent?: string;
  promptSource?: string; // e.g., "🆕 初稿生成 @prompts/prompt.md"
}

export default function ChatMessage({
  role,
  content,
  version,
  tokenUsage,
  isStreaming,
  reasoningContent,
  promptSource,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showWarning, setShowWarning] = useState<"pdf" | "docx" | null>(null);
  const reasoningBoxRef = useRef<HTMLPreElement>(null);

  const {
    status: exportStatus,
    progress,
    currentFormat,
    copyToClipboard,
    exportToPDF,
    exportToDOCX,
    cancelExport,
    checkDocumentSize,
    error: exportError,
  } = useExport();

  // During streaming, check if we're still in "reasoning" phase (no main content yet)
  const isReasoningPhase = isStreaming && reasoningContent && !content;
  const hasContent = content && content.trim().length > 0;
  const canExport = hasContent && !isStreaming && version !== undefined;

  // Auto-scroll reasoning box to bottom when content updates during streaming
  useEffect(() => {
    if (isReasoningPhase && reasoningContent && reasoningBoxRef.current) {
      reasoningBoxRef.current.scrollTop = reasoningBoxRef.current.scrollHeight;
    }
  }, [reasoningContent, isReasoningPhase]);

  const handleCopy = async () => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePDFExport = async () => {
    if (!version) return;

    // Check document size
    const sizeInfo = checkDocumentSize(content);
    if (sizeInfo.shouldWarn) {
      setShowWarning("pdf");
      return;
    }

    await exportToPDF(content, version);
  };

  const handleDOCXExport = async () => {
    if (!version) return;

    // Check document size
    const sizeInfo = checkDocumentSize(content);
    if (sizeInfo.shouldWarn) {
      setShowWarning("docx");
      return;
    }

    await exportToDOCX(content, version);
  };

  const handleWarningConfirm = async () => {
    if (!version) return;

    const format = showWarning;
    setShowWarning(null);

    if (format === "pdf") {
      await exportToPDF(content, version);
    } else if (format === "docx") {
      await exportToDOCX(content, version);
    }
  };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[90%] w-full">
        {/* Version badge and prompt source */}
        {(version || promptSource) && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {version && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                📝 PRD v{version}
              </span>
            )}
            {promptSource && (
              <span className="text-xs text-gray-500">{promptSource}</span>
            )}
            {isStreaming && (
              <span className="inline-flex items-center text-xs text-gray-500">
                <span className="animate-pulse">
                  {isReasoningPhase ? "🧠 思考中..." : "✍️ 生成中..."}
                </span>
              </span>
            )}
          </div>
        )}

        {/* Reasoning content - show prominently during reasoning phase */}
        {reasoningContent && (isReasoningPhase || showReasoning) && (
          <div className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-amber-800">
              <Brain size={16} />
              <span className="text-sm font-medium">思考过程</span>
              {isReasoningPhase && (
                <span className="animate-pulse text-xs">...</span>
              )}
            </div>
            <div className="relative">
              <pre
                ref={reasoningBoxRef}
                className="whitespace-pre-wrap font-mono text-sm text-amber-900 max-h-64 overflow-y-auto border border-amber-300/30 rounded p-3 bg-amber-50/50 scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-amber-100"
              >
                {reasoningContent}
              </pre>
              {reasoningContent.split("\n").length > 10 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-50 to-transparent pointer-events-none rounded-b" />
              )}
            </div>
          </div>
        )}

        {/* Toggle for reasoning after streaming completes */}
        {reasoningContent && !isReasoningPhase && !showReasoning && (
          <button
            onClick={() => setShowReasoning(true)}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 mb-2"
          >
            <ChevronDown size={14} />
            查看思考过程
          </button>
        )}
        {reasoningContent && showReasoning && !isReasoningPhase && (
          <button
            onClick={() => setShowReasoning(false)}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 mb-2 mt-[-8px]"
          >
            <ChevronUp size={14} />
            收起
          </button>
        )}

        {/* Main content - only show if we have content */}
        {(hasContent || !isReasoningPhase) && (
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm overflow-hidden">
            <div className="p-4 prose prose-sm max-w-none min-h-[60px]">
              {hasContent ? (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {content}
                </Markdown>
              ) : (
                <div className="text-gray-400 text-sm">等待生成...</div>
              )}
            </div>

            {/* Actions */}
            {hasContent && !isStreaming && (
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  {/* Copy button with visual polish */}
                  <button
                    onClick={handleCopy}
                    disabled={
                      exportStatus === "generating" ||
                      exportStatus === "finalizing"
                    }
                    aria-label="复制内容到剪贴板"
                    aria-busy={
                      exportStatus === "generating" && currentFormat === "copy"
                    }
                    className={`
                                            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                                            transition-all duration-150 ease-in-out transform
                                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                                            ${
                                              copied
                                                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 active:scale-95"
                                            }
                                        `}
                  >
                    {copied ? (
                      <Check
                        size={14}
                        className="text-emerald-600 animate-in fade-in duration-200"
                      />
                    ) : (
                      <Copy
                        size={14}
                        className="transition-transform group-hover:scale-110"
                      />
                    )}
                    {copied ? "已复制" : "复制"}
                  </button>

                  {/* PDF export button with visual polish */}
                  {canExport && (
                    <button
                      onClick={handlePDFExport}
                      disabled={
                        exportStatus === "generating" ||
                        exportStatus === "finalizing"
                      }
                      aria-label="导出为 PDF"
                      aria-busy={
                        currentFormat === "pdf" &&
                        (exportStatus === "generating" ||
                          exportStatus === "finalizing")
                      }
                      className={`
                                                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                                                transition-all duration-150 ease-in-out transform
                                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                                                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                                                ${
                                                  currentFormat === "pdf" &&
                                                  exportStatus === "success"
                                                    ? "text-emerald-700 bg-emerald-50"
                                                    : "text-gray-700 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:scale-95"
                                                }
                                            `}
                    >
                      {currentFormat === "pdf" &&
                      exportStatus === "generating" ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <FileText size={14} />
                      )}
                      {currentFormat === "pdf" && exportStatus === "generating"
                        ? "导出中..."
                        : "PDF"}
                    </button>
                  )}

                  {/* DOCX export button with visual polish */}
                  {canExport && (
                    <button
                      onClick={handleDOCXExport}
                      disabled={
                        exportStatus === "generating" ||
                        exportStatus === "finalizing"
                      }
                      aria-label="导出为 Word 文档"
                      aria-busy={
                        currentFormat === "docx" &&
                        (exportStatus === "generating" ||
                          exportStatus === "finalizing")
                      }
                      className={`
                                                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                                                transition-all duration-150 ease-in-out transform
                                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                                                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                                                ${
                                                  currentFormat === "docx" &&
                                                  exportStatus === "success"
                                                    ? "text-emerald-700 bg-emerald-50"
                                                    : "text-gray-700 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 active:scale-95"
                                                }
                                            `}
                    >
                      {currentFormat === "docx" &&
                      exportStatus === "generating" ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <FileDown size={14} />
                      )}
                      {currentFormat === "docx" && exportStatus === "generating"
                        ? "导出中..."
                        : "Word"}
                    </button>
                  )}

                  {/* Error message display */}
                  {exportError && (
                    <span
                      className="text-xs text-red-600"
                      role="alert"
                      aria-live="polite"
                    >
                      {exportError}
                    </span>
                  )}

                  {/* Screen reader announcement */}
                  <span className="sr-only" aria-live="polite" role="status">
                    {exportStatus === "generating" &&
                      currentFormat === "copy" &&
                      "正在复制..."}
                    {exportStatus === "generating" &&
                      currentFormat === "pdf" &&
                      "正在生成 PDF..."}
                    {exportStatus === "generating" &&
                      currentFormat === "docx" &&
                      "正在生成 Word 文档..."}
                    {copied && "内容已复制到剪贴板"}
                    {exportStatus === "success" &&
                      currentFormat === "pdf" &&
                      "PDF 导出成功"}
                    {exportStatus === "success" &&
                      currentFormat === "docx" &&
                      "Word 文档导出成功"}
                  </span>
                </div>

                {tokenUsage && (
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      输入:{" "}
                      <span className="font-mono text-blue-600">
                        {tokenUsage.inputTokens.toLocaleString()}
                      </span>
                    </span>
                    <span>
                      输出:{" "}
                      <span className="font-mono text-green-600">
                        {tokenUsage.outputTokens.toLocaleString()}
                      </span>
                    </span>
                    <span>
                      总计:{" "}
                      <span className="font-mono font-semibold text-indigo-600">
                        {tokenUsage.totalTokens.toLocaleString()}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Progress Modal */}
            <ProgressModal
              isOpen={
                (exportStatus === "generating" ||
                  exportStatus === "finalizing") &&
                (currentFormat === "pdf" || currentFormat === "docx")
              }
              format={currentFormat === "docx" ? "docx" : "pdf"}
              progress={progress}
              stage={
                exportStatus === "finalizing" ? "finalizing" : "generating"
              }
              onCancel={cancelExport}
            />

            {/* Warning Modal for large documents */}
            {showWarning && (
              <WarningModal
                isOpen={true}
                sizeInfo={checkDocumentSize(content)}
                format={showWarning}
                onConfirm={handleWarningConfirm}
                onCancel={() => setShowWarning(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
