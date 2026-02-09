/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
// Explicitly import the worker as a URL so Vite handles it correctly
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PdfMetaData {
  thumbnail: string
  pageCount: number
  isLocked: boolean
}

// Fixed cMapUrl for true offline usage (relative to base)
const getCMapUrl = () => {
  const isCapacitor = Capacitor.isNativePlatform();
  return isCapacitor ? 'cmaps/' : '/PaperKnife/cmaps/';
};

/**
 * Universal file downloader that works on Web and Android
 */
export const downloadFile = async (data: Uint8Array | string, fileName: string, mimeType: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // For Android, we use the Filesystem API
      const base64Data = typeof data === 'string' 
        ? data.split(',')[1] 
        : btoa(data.reduce((acc, byte) => acc + String.fromCharCode(byte), ''));

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      
      return true;
    } catch (e) {
      console.error('Download error:', e);
      throw e;
    }
  } else {
    // Standard Web Download
    const blob = typeof data === 'string' 
      ? await (await fetch(data)).blob() 
      : new Blob([data as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
};

/**
 * Universal file sharer
 */
export const shareFile = async (data: Uint8Array | string, fileName: string, mimeType: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // For Android, we save to Cache directory first, then share
      const base64Data = typeof data === 'string' 
        ? data.split(',')[1] 
        : btoa(data.reduce((acc, byte) => acc + String.fromCharCode(byte), ''));

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache, // Use Cache for temporary sharing
        recursive: true
      });

      await Share.share({
        title: fileName,
        text: `Shared via PaperKnife`,
        url: result.uri,
        dialogTitle: 'Share PDF'
      });
      
      return true;
    } catch (e) {
      console.error('Share error:', e);
      throw e;
    }
  } else {
    // Web Share API
    const blob = typeof data === 'string' 
      ? await (await fetch(data)).blob() 
      : new Blob([data as BlobPart], { type: mimeType });
    
    const file = new File([blob], fileName, { type: mimeType });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: 'Shared via PaperKnife'
        });
        return true;
      } catch (e) {
        console.error('Web share failed, falling back to download');
      }
    }
    
    // Fallback to download if sharing is not supported
    return downloadFile(data, fileName, mimeType);
  }
};

// Optimized: Load the PDF Document once
export const loadPdfDocument = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: getCMapUrl(),
      cMapPacked: true,
    });
    return await loadingTask.promise;
  } catch (error: any) {
    if (error.name === 'PasswordException') {
      throw error;
    }
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: getCMapUrl(),
      cMapPacked: true,
      stopAtErrors: false,
    });
    return await loadingTask.promise;
  }
};

// Optimized: Render a specific page from an already loaded PDF Document
export const renderPageThumbnail = async (pdf: any, pageNum: number, scale = 1.0): Promise<string> => {
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale });
    
    const maxDimension = 300;
    const thumbnailScale = Math.min(maxDimension / viewport.width, maxDimension / viewport.height);
    
    // Higher scale for better quality on high-DPI mobile screens
    const renderScale = scale * thumbnailScale * (Math.min(window.devicePixelRatio, 2) || 1);
    const thumbViewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    // For mobile performance, we use a simpler context
    const context = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false 
    });
    
    if (!context) throw new Error('Canvas context not available');
    
    canvas.height = thumbViewport.height;
    canvas.width = thumbViewport.width;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const renderTask = page.render({ 
      canvasContext: context, 
      viewport: thumbViewport, 
      intent: 'display'
    });

    await renderTask.promise;
    
    // Using image/jpeg for smaller memory footprint on mobile
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Clean up canvas memory immediately
    canvas.width = 0;
    canvas.height = 0;
    
    return dataUrl;
  } catch (error) {
    console.error(`Error rendering page ${pageNum}:`, error);
    return '';
  }
};

// Wrapper for backward compatibility
export const generateThumbnail = async (file: File, pageNum: number = 1): Promise<string> => {
  try {
    const pdf = await loadPdfDocument(file);
    return await renderPageThumbnail(pdf, pageNum, 0.8);
  } catch (error) {
    console.error('Thumbnail error:', error);
    return '';
  }
};

export const getPdfMetaData = async (file: File): Promise<PdfMetaData> => {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: await file.arrayBuffer(),
      cMapUrl: getCMapUrl(),
      cMapPacked: true,
    });
    
    loadingTask.onPassword = () => { throw new Error('PASSWORD_REQUIRED'); };
    
    const pdf = await loadingTask.promise;
    const firstPageThumb = await renderPageThumbnail(pdf, 1);
    
    return {
      thumbnail: firstPageThumb,
      pageCount: pdf.numPages,
      isLocked: false
    };
  } catch (error: any) {
    if (error.message === 'PASSWORD_REQUIRED' || error.name === 'PasswordException') {
      return { thumbnail: '', pageCount: 0, isLocked: true };
    }
    return { thumbnail: '', pageCount: 0, isLocked: false };
  }
};

export const unlockPdf = async (file: File, password: string): Promise<PdfMetaData & { success: boolean, pdfDoc?: any }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password,
      cMapUrl: getCMapUrl(),
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    const firstPageThumb = await renderPageThumbnail(pdf, 1);

    return {
      thumbnail: firstPageThumb,
      pageCount: pdf.numPages,
      isLocked: false,
      success: true,
      pdfDoc: pdf
    };
  } catch (error: any) {
    return {
      thumbnail: '',
      pageCount: 0,
      isLocked: true,
      success: false
    };
  }
};
