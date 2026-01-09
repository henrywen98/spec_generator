import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from '../lib/export/export-copy';

describe('copyToClipboard', () => {
  let originalClipboard: any;
  let originalExecCommand: any;

  beforeEach(() => {
    // Save original values
    originalClipboard = (navigator as any).clipboard;
    originalExecCommand = document.execCommand;
  });

  afterEach(() => {
    // Restore original values
    (navigator as any).clipboard = originalClipboard;
    document.execCommand = originalExecCommand;
    vi.clearAllMocks();
  });

  it('should copy content using Clipboard API when in secure context', async () => {
    // Mock secure context and Clipboard API
    Object.assign(window, { isSecureContext: true });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');

    const result = await copyToClipboard('test content');

    expect(writeTextSpy).toHaveBeenCalledWith('test content');
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return success when Clipboard API succeeds', async () => {
    // Mock secure context
    Object.assign(window, { isSecureContext: true });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const result = await copyToClipboard('hello world');

    expect(result.success).toBe(true);
  });

  it('should use fallback when not in secure context', async () => {
    // Mock non-secure context
    Object.assign(window, { isSecureContext: false });

    // Mock successful execCommand
    const mockExecCommand = vi.fn().mockReturnValue(true);
    document.execCommand = mockExecCommand;

    const result = await copyToClipboard('fallback test');

    expect(result.success).toBe(true);
    expect(mockExecCommand).toHaveBeenCalledWith('copy');
  });

  it('should return error when both Clipboard API and fallback fail', async () => {
    // Mock secure context but Clipboard API fails
    Object.assign(window, { isSecureContext: true });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(
          new Error('Permission denied')
        ),
      },
    });

    // Mock execCommand to fail
    const mockExecCommand = vi.fn().mockReturnValue(false);
    document.execCommand = mockExecCommand;

    const result = await copyToClipboard('test content');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should use fallback when Clipboard API is not available', async () => {
    // Mock non-secure context and no clipboard API
    Object.assign(window, { isSecureContext: false });
    Object.assign(navigator, { clipboard: undefined });

    // Mock successful execCommand
    const mockExecCommand = vi.fn().mockReturnValue(true);
    document.execCommand = mockExecCommand;
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const result = await copyToClipboard('fallback test');

    expect(result.success).toBe(true);
    expect(mockExecCommand).toHaveBeenCalledWith('copy');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});
