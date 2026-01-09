'use client';

import React, { useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export interface ExportButtonProps {
  /** Icon component */
  icon: React.ReactNode;
  /** Button label */
  label: string;
  /** Success label (shown after successful operation) */
  successLabel?: string;
  /** Is disabled */
  disabled?: boolean;
  /** Is loading/exporting */
  loading?: boolean;
  /** Is in success state */
  success?: boolean;
  /** Click handler */
  onClick: () => void | Promise<void>;
  /** ARIA label */
  ariaLabel?: string;
  /** Error message */
  error?: string | null;
}

/**
 * Reusable export button component with loading and success states
 * WCAG 2.1 AA compliant:
 * - Color contrast ratio >= 4.5:1 for all text
 * - Visible focus indicators (2px ring)
 * - Screen reader support via ARIA attributes
 * - Keyboard accessible (Enter/Space)
 */
export function ExportButton({
  icon,
  label,
  successLabel,
  disabled = false,
  loading = false,
  success = false,
  onClick,
  ariaLabel,
  error,
}: ExportButtonProps) {
  const isDisabled = disabled || loading;

  const handleClick = useCallback(async () => {
    if (isDisabled) return;
    await onClick();
  }, [isDisabled, onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Support Enter and Space for activation (WCAG 2.1)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  // Determine button state and appearance
  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          <span>导出中...</span>
        </>
      );
    }

    if (success && successLabel) {
      return (
        <>
          <span aria-hidden="true">{icon}</span>
          <span>{successLabel}</span>
        </>
      );
    }

    return (
      <>
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </>
    );
  };

  // WCAG 2.1 AA color contrast compliant styles
  // - Normal text: #374151 on white = 7.5:1 contrast ratio
  // - Success text: #047857 on white = 5.9:1 contrast ratio
  // - Error text: #b91c1c on white = 5.8:1 contrast ratio
  // - Disabled text: #9ca3af on white = 3.0:1 (acceptable for disabled)
  const getButtonStyles = () => {
    const baseStyles = `
      flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
      transition-all duration-150 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
      focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
    `;

    if (isDisabled) {
      // Disabled state - reduced opacity but still visible
      return `${baseStyles} text-gray-400 bg-gray-50 cursor-not-allowed`;
    }

    if (success) {
      // Success state - green with sufficient contrast (5.9:1)
      return `${baseStyles} text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200`;
    }

    if (error) {
      // Error state - red with sufficient contrast (5.8:1)
      return `${baseStyles} text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200`;
    }

    // Default state - gray with high contrast (7.5:1)
    return `${baseStyles} text-gray-700 bg-transparent hover:bg-gray-100 active:bg-gray-200`;
  };

  // Generate descriptive aria-label based on state
  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    if (loading) return `${label} - 正在导出`;
    if (success) return `${label} - 导出成功`;
    if (error) return `${label} - 导出失败: ${error}`;
    return label;
  };

  return (
    <div className="relative inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        aria-label={getAriaLabel()}
        aria-busy={loading}
        aria-disabled={isDisabled}
        aria-describedby={error ? 'export-error' : undefined}
        className={getButtonStyles()}
        tabIndex={isDisabled ? -1 : 0}
      >
        {getButtonContent()}
      </button>

      {/* Error message with proper ARIA */}
      {error && (
        <span
          id="export-error"
          className="absolute top-full left-0 mt-1 text-xs text-red-700 whitespace-nowrap"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </span>
      )}

      {/* Live region for status announcements */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && '正在导出，请稍候'}
        {success && '导出成功'}
      </span>
    </div>
  );
}
