'use client';

import { useRef, useCallback } from 'react';
import { ImagePlus } from 'lucide-react';
import { SUPPORTED_IMAGE_TYPES } from '@/hooks/useImageUpload';

interface ImageUploadProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
  canAddMore: boolean;
  maxCount: number;
  currentCount: number;
}

/**
 * 图片上传按钮组件
 * 包含隐藏的文件输入和触发按钮
 */
export function ImageUpload({
  onFilesSelected,
  disabled = false,
  canAddMore,
  maxCount,
  currentCount,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 构建 accept 属性
  const acceptTypes = SUPPORTED_IMAGE_TYPES.join(',');

  const handleClick = useCallback(() => {
    if (canAddMore && !disabled) {
      inputRef.current?.click();
    }
  }, [canAddMore, disabled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesSelected(files);
      }
      // 清空 input 以便重复选择同一文件
      e.target.value = '';
    },
    [onFilesSelected]
  );

  const isDisabled = disabled || !canAddMore;

  return (
    <>
      {/* 隐藏的文件输入 */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        multiple
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* 上传按钮 */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={
          isDisabled
            ? `已达到图片上限 (${maxCount} 张)`
            : `添加图片 (${currentCount}/${maxCount})`
        }
        title={
          isDisabled
            ? `已达到图片上限 (${maxCount} 张)`
            : `添加图片 (支持 JPEG, PNG, GIF, WebP，最多 ${maxCount} 张)`
        }
      >
        <ImagePlus className="w-5 h-5" />
      </button>
    </>
  );
}

export default ImageUpload;
