/**
 * Copy to clipboard service with fallback support
 */

/**
 * Copy content to clipboard using modern Clipboard API with execCommand fallback
 * @param content - Text content to copy
 * @returns Object with success status and optional error message
 */
export async function copyToClipboard(
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try modern Clipboard API first (requires HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content);
      return { success: true };
    }

    // Fallback to execCommand for older browsers or non-secure contexts
    return fallbackCopy(content);
  } catch (err) {
    // If Clipboard API fails, try fallback
    try {
      return fallbackCopy(content);
    } catch {
      return {
        success: false,
        error: err instanceof Error ? err.message : '复制失败，请检查浏览器权限'
      };
    }
  }
}

/**
 * Fallback copy method using execCommand
 * @param content - Text content to copy
 * @returns Object with success status and optional error message
 */
function fallbackCopy(
  content: string
): { success: boolean; error?: string } {
  const textarea = document.createElement('textarea');
  textarea.value = content;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
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
    document.body.removeChild(textarea);
    return {
      success: false,
      error: err instanceof Error ? err.message : '复制失败'
    };
  }
}
