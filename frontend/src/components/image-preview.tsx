'use client';

import { X, AlertCircle, Loader2 } from 'lucide-react';
import type { PendingImage } from '@/hooks/useImageUpload';

interface ImagePreviewProps {
  image: PendingImage;
  onRemove: (id: string) => void;
}

/**
 * 单张图片预览组件
 * 显示缩略图、文件名、删除按钮和状态指示器
 */
export function ImagePreviewItem({ image, onRemove }: ImagePreviewProps) {
  const { id, file, preview, status, error } = image;

  return (
    <div className="relative group flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
      {/* 缩略图 */}
      <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        {status === 'ready' && preview ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : status === 'error' ? (
          <div className="w-full h-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* 文件名和状态 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate" title={file.name}>
          {file.name}
        </p>
        {status === 'error' && error && (
          <p className="text-xs text-red-500 truncate" title={error}>
            {error}
          </p>
        )}
        {status === 'ready' && (
          <p className="text-xs text-gray-400">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>

      {/* 删除按钮 */}
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        aria-label={`删除 ${file.name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ImagePreviewListProps {
  images: PendingImage[];
  onRemove: (id: string) => void;
  maxCount: number;
}

/**
 * 图片预览列表组件
 * 显示所有待上传图片，支持横向滚动
 */
export function ImagePreviewList({ images, onRemove, maxCount }: ImagePreviewListProps) {
  if (images.length === 0) {
    return null;
  }

  const readyCount = images.filter(img => img.status === 'ready').length;

  return (
    <div className="space-y-2">
      {/* 图片计数器 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>已选择 {readyCount}/{maxCount} 张图片</span>
        {readyCount >= maxCount && (
          <span className="text-amber-600">已达到上限</span>
        )}
      </div>

      {/* 图片预览网格 */}
      <div className="flex flex-wrap gap-2">
        {images.map(image => (
          <ImagePreviewItem
            key={image.id}
            image={image}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

export default ImagePreviewList;
