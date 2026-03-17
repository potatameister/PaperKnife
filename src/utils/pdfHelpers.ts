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
import { PDFDocument } from 'pdf-lib'
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

/**
 * Universal file downloader
 */
export const downloadFile = async (data: Uint8Array | string, fileName: string, mimeType: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // For Android, we use the Filesystem API
      let base64Data = '';
      if (typeof data === 'string') {
        base64Data = data.includes(',') ? data.split(',')[1] : data;
      } else {
        // High-performance chunked base64 conversion
        const bytes = new Uint8Array(data);
        const chunks = [];
        const chunkSize = 0x8000; // 32KB chunks
        for (let i = 0; i < bytes.length; i += chunkSize) {
          chunks.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize))));
        }
        base64Data = btoa(chunks.join(''));
      }

      // Resolve duplicate filenames
      let finalName = fileName;
      let counter = 1;
      const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const extension = fileName.substring(fileName.lastIndexOf('.'));

      while (true) {
        try {
          await Filesystem.stat({
            path: finalName,
            directory: Directory.Documents
          });
          // If stat succeeds, file exists
          finalName = `${baseName} (${counter})${extension}`;
          counter++;
        } catch (e) {
          // If stat fails, file doesn't exist, we can use this name
          break;
        }
      }

      await Filesystem.writeFile({
        path: finalName,
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
      let base64Data = '';
      if (typeof data === 'string') {
        base64Data = data.includes(',') ? data.split(',')[1] : data;
      } else {
        // High-performance chunked base64 conversion
        const bytes = new Uint8Array(data);
        const chunks = [];
        const chunkSize = 0x8000; // 32KB chunks
        for (let i = 0; i < bytes.length; i += chunkSize) {
          chunks.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize))));
        }
        base64Data = btoa(chunks.join(''));
      }

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
    });
    return await loadingTask.promise;
  } catch (error: any) {
    if (error.name === 'PasswordException') {
      throw error;
    }
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
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
    
    // High-quality preview (1200px)
    const maxDimension = 1200; 
    const thumbnailScale = Math.min(maxDimension / viewport.width, maxDimension / viewport.height);
    const dpr = window.devicePixelRatio || 1;
    const renderScale = scale * thumbnailScale * Math.min(dpr, 2);
    const thumbViewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Canvas context not available');
    
    canvas.height = thumbViewport.height;
    canvas.width = thumbViewport.width;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: context, viewport: thumbViewport, intent: 'print' }).promise;
    const dataUrl = canvas.toDataURL('image/webp', 0.8) || canvas.toDataURL('image/jpeg', 0.9);
    
    // Memory cleanup
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } catch (error) {
    console.error(`Error rendering page ${pageNum}:`, error);
    return '';
  }
};

/**
 * ULTRA-FAST: Render a small thumbnail for grids/lists
 * Uses lower dimension and higher compression to save RAM on 100+ page docs
 */
export const renderGridThumbnail = async (pdf: any, pageNum: number): Promise<string> => {
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.5 }); // Lower initial scale
    
    const maxDimension = 400; // Small but crisp for grids
    const thumbnailScale = Math.min(maxDimension / viewport.width, maxDimension / viewport.height);
    const thumbViewport = page.getViewport({ scale: thumbnailScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context) return '';
    
    canvas.height = thumbViewport.height;
    canvas.width = thumbViewport.width;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: context, viewport: thumbViewport, intent: 'display' }).promise;
    
    // Higher compression for grid thumbnails
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } catch (error) {
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

export const unlockPdf = async (file: File, password: string): Promise<PdfMetaData & { success: boolean, pdfDoc?: any, pdfData?: Uint8Array }> => {
  let arrayBuffer: ArrayBuffer;
  
  // Try pdfjs first
  try {
    arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: password,
    });

    const pdf = await loadingTask.promise;
    const firstPageThumb = await renderPageThumbnail(pdf, 1);

    return {
      thumbnail: firstPageThumb,
      pageCount: pdf.numPages,
      isLocked: false,
      success: true,
      pdfDoc: pdf,
      pdfData: new Uint8Array(arrayBuffer)
    };
  } catch (error: any) {
    const errorMsg = error?.message || '';
    const errorName = error?.name || '';
    console.error('pdfjs unlock failed:', errorName, errorMsg);
    
    // Check if it's definitely a wrong password error
    const isPasswordError = errorName === 'PasswordException' || 
      errorMsg.toLowerCase().includes('password') ||
      errorMsg.toLowerCase().includes('incorrect') ||
      errorMsg.toLowerCase().includes('invalid');
    
    if (isPasswordError) {
      return {
        thumbnail: '',
        pageCount: 0,
        isLocked: true,
        success: false
      };
    }
    
    // Try pdf-lib as fallback for other errors
    console.log('Trying pdf-lib fallback for unlock...');
    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer, { 
        password: password 
      } as any);
      
      const pageCount = pdfDoc.getPageCount();
      const unencryptedBytes = await pdfDoc.save();
      
      // Now load the unencrypted PDF with pdfjs for rendering
      const loadingTask = pdfjsLib.getDocument({
        data: unencryptedBytes,
      });
      const pdf = await loadingTask.promise;
      const firstPageThumb = await renderPageThumbnail(pdf, 1);
      
      return {
        thumbnail: firstPageThumb,
        pageCount: pageCount,
        isLocked: false,
        success: true,
        pdfDoc: pdf,
        pdfData: new Uint8Array(unencryptedBytes)
      };
    } catch (libError: any) {
      console.error('pdf-lib fallback also failed:', libError?.message);
      
      // If pdf-lib fails with encryption error, it's wrong password
      const libErrorMsg = libError?.message || '';
      if (libErrorMsg.toLowerCase().includes('encrypted') || 
          libErrorMsg.toLowerCase().includes('password') ||
          libErrorMsg.toLowerCase().includes('invalid')) {
        return {
          thumbnail: '',
          pageCount: 0,
          isLocked: true,
          success: false
        };
      }
      
      console.error('Non-password unlock error:', libError);
      return {
        thumbnail: '',
        pageCount: 0,
        isLocked: true,
        success: false
      };
    }
  }
};

export interface RenderPageOptions {
  scale?: number;
  enableTextLayer?: boolean;
  enableAnnotationLayer?: boolean;
}

export const renderPdfPage = async (
  pdf: any,
  pageNum: number,
  container: HTMLElement,
  options: RenderPageOptions = {}
): Promise<void> => {
  const { scale = 1.0, enableAnnotationLayer = true } = options;
  
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    // Clear container
    container.innerHTML = '';
    container.style.width = `${viewport.width}px`;
    container.style.height = `${viewport.height}px`;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Wrapper for positioning
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;
    
    // Canvas layer
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.position = 'absolute';
    canvasWrapper.style.top = '0';
    canvasWrapper.style.left = '0';
    canvasWrapper.appendChild(canvas);
    
    wrapper.appendChild(canvasWrapper);
    container.appendChild(wrapper);
    
    // Render canvas
    await page.render({
      canvasContext: context,
      viewport,
      intent: 'display'
    }).promise;
    
    // Annotation layer for hyperlinks
    if (enableAnnotationLayer) {
      const annotations = await page.getAnnotations();
      const annotationLayer = document.createElement('div');
      annotationLayer.style.position = 'absolute';
      annotationLayer.style.top = '0';
      annotationLayer.style.left = '0';
      annotationLayer.style.width = '100%';
      annotationLayer.style.height = '100%';
      annotationLayer.style.pointerEvents = 'auto';
      annotationLayer.style.zIndex = '10';
      
      for (const annotation of annotations) {
        if (annotation.subtype === 'Link' && annotation.rect) {
          const link = document.createElement('a');
          // PDF coordinates: [x1, y1, x2, y2] where origin is bottom-left
          const rect = annotation.rect;
          const x1 = Math.min(rect[0], rect[2]);
          const x2 = Math.max(rect[0], rect[2]);
          const y1 = Math.min(rect[1], rect[3]);
          const y2 = Math.max(rect[1], rect[3]);
          
          // Convert PDF coords to viewport coords
          const viewX = viewport.convertToViewportPoint(x1, y2);
          const viewY = viewport.convertToViewportPoint(x2, y1);
          
          const left = Math.min(viewX[0], viewY[0]);
          const top = Math.min(viewX[1], viewY[1]);
          const width = Math.abs(viewY[0] - viewX[0]);
          const height = Math.abs(viewY[1] - viewX[1]);
          
          link.style.position = 'absolute';
          link.style.left = `${left}px`;
          link.style.top = `${top}px`;
          link.style.width = `${width}px`;
          link.style.height = `${height}px`;
          link.style.cursor = 'pointer';
          link.style.zIndex = '10';
          
          if (annotation.url) {
            link.href = annotation.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
          } else if (annotation.dest) {
            link.href = '#';
            link.onclick = (e) => {
              e.preventDefault();
            };
          }
          
          annotationLayer.appendChild(link);
        }
      }
      
      wrapper.appendChild(annotationLayer);
    }
    
  } catch (error) {
    console.error(`Error rendering page ${pageNum}:`, error);
  }
};
