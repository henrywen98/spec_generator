'use client';

import { useState, useCallback } from 'react';

// 支持的图片格式
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

// 限制常量
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGES_COUNT = 5;

// 图片状态
export type ImageStatus = 'pending' | 'ready' | 'error';

// 待上传图片的状态
export interface PendingImage {
  id: string;
  file: File;
  preview: string; // Data URL for preview
  base64: string; // Base64 data (without data URI prefix)
  mimeType: SupportedImageType;
  status: ImageStatus;
  error?: string;
}

// API 请求格式的图片附件
export interface ImageAttachment {
  data: string; // Base64 encoded
  mime_type: SupportedImageType;
  filename?: string;
  size?: number;
}

// 验证结果
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 验证文件是否为支持的图片格式和大小
 */
function validateFile(file: File): ValidationResult {
  // 检查文件类型
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType)) {
    return {
      valid: false,
      error: `不支持的图片格式: ${file.type}。支持的格式: JPEG, PNG, GIF, WebP`,
    };
  }

  // 检查文件大小
  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `图片过大: ${sizeMB}MB。单张图片最大 10MB`,
    };
  }

  return { valid: true };
}

/**
 * 将 File 转换为 Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data URI 前缀，只保留 Base64 数据
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 图片上传 Hook
 *
 * 管理图片的选择、预览、Base64 编码和删除
 */
export function useImageUpload() {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 添加图片
   */
  const addImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // 检查总数限制
    const currentCount = pendingImages.length;
    const remainingSlots = MAX_IMAGES_COUNT - currentCount;

    if (remainingSlots <= 0) {
      console.warn(`已达到图片数量上限 (${MAX_IMAGES_COUNT} 张)`);
      return;
    }

    // 只取剩余可添加的数量
    const filesToAdd = fileArray.slice(0, remainingSlots);

    setIsProcessing(true);

    const newImages: PendingImage[] = [];

    for (const file of filesToAdd) {
      const validation = validateFile(file);

      if (!validation.valid) {
        // 添加错误状态的图片
        newImages.push({
          id: crypto.randomUUID(),
          file,
          preview: '',
          base64: '',
          mimeType: file.type as SupportedImageType,
          status: 'error',
          error: validation.error,
        });
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const preview = URL.createObjectURL(file);

        newImages.push({
          id: crypto.randomUUID(),
          file,
          preview,
          base64,
          mimeType: file.type as SupportedImageType,
          status: 'ready',
        });
      } catch {
        newImages.push({
          id: crypto.randomUUID(),
          file,
          preview: '',
          base64: '',
          mimeType: file.type as SupportedImageType,
          status: 'error',
          error: '读取图片失败',
        });
      }
    }

    setPendingImages((prev: PendingImage[]) => [...prev, ...newImages]);
    setIsProcessing(false);
  }, [pendingImages.length]);

  /**
   * 删除指定图片
   */
  const removeImage = useCallback((id: string) => {
    setPendingImages((prev: PendingImage[]) => {
      const image = prev.find((img: PendingImage) => img.id === id);
      // 释放 Object URL
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img: PendingImage) => img.id !== id);
    });
  }, []);

  /**
   * 清空所有图片
   */
  const clearImages = useCallback(() => {
    // 释放所有 Object URLs
    pendingImages.forEach((img: PendingImage) => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setPendingImages([]);
  }, [pendingImages]);

  /**
   * 获取可用于 API 请求的图片数组
   */
  const getImageAttachments = useCallback((): ImageAttachment[] => {
    return pendingImages
      .filter((img: PendingImage) => img.status === 'ready')
      .map((img: PendingImage) => ({
        data: img.base64,
        mime_type: img.mimeType,
        filename: img.file.name,
        size: img.file.size,
      }));
  }, [pendingImages]);

  /**
   * 检查是否可以添加更多图片
   */
  const canAddMore = pendingImages.length < MAX_IMAGES_COUNT;

  /**
   * 获取有效图片数量
   */
  const readyCount = pendingImages.filter((img: PendingImage) => img.status === 'ready').length;

  return {
    pendingImages,
    isProcessing,
    addImages,
    removeImage,
    clearImages,
    getImageAttachments,
    canAddMore,
    readyCount,
    maxCount: MAX_IMAGES_COUNT,
  };
}
