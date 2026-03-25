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
import { decryptPDF } from '@pdfsmaller/pdf-decrypt-lite'
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
// Explicitly import the worker as a URL so Vite handles it correctly
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// @ts-ignore
import openjpegWasm from 'pdfjs-dist/wasm/openjpeg.wasm?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Extract the directory path from the WASM file URL for wasmUrl parameter
const wasmDir = openjpegWasm.replace(/openjpeg\.wasm.*$/, '');

// Helper to create document loading task with WASM support for JPX
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDocumentWithWasm = (params: any) => {
  return pdfjsLib.getDocument({
    ...params,
    wasmUrl: wasmDir
  });
};

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
    const loadingTask = getDocumentWithWasm({
      data: arrayBuffer.slice(0),
    });
    return await loadingTask.promise;
  } catch (error: any) {
    if (error.name === 'PasswordException') {
      throw error;
    }
    const loadingTask = getDocumentWithWasm({
      data: arrayBuffer.slice(0),
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
    
    await page.render({ canvasContext: context, viewport: thumbViewport }).promise;
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
    const loadingTask = getDocumentWithWasm({
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

// Rasterize a PDF by rendering each page to an image and saving to a new PDF
// This effectively removes ALL encryption and permissions (but loses text selection)
export const flattenPdf = async (pdf: any): Promise<Uint8Array> => {
  const newPdf = await PDFDocument.create();
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    // Render page to ultra-high-quality image
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 }); // 2.5x scale for excellent text clarity
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas context unavailable');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Fill white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
      intent: 'print'
    }).promise;
    
    // Convert to high-quality JPG (0.95) for better text preservation than standard 0.9
    const imgBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (!imgBlob) throw new Error('Failed to generate image from canvas');
    
    const imgBytes = await imgBlob.arrayBuffer();
    
    // Embed into new PDF
    const jpgImage = await newPdf.embedJpg(imgBytes);
    const jpgDims = jpgImage.scale(1/2.5); // Scale back down to original size
    
    const newPage = newPdf.addPage([jpgDims.width, jpgDims.height]);
    newPage.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: jpgDims.width,
      height: jpgDims.height,
    });
    
    // Clean up to save memory
    canvas.width = 0;
    canvas.height = 0;
  }

  return await newPdf.save();
};

export const unlockPdf = async (file: File, password: string): Promise<PdfMetaData & { success: boolean, isDecrypted: boolean, pdfDoc?: any, pdfData?: Uint8Array }> => {
  console.log('unlockPdf: attempting to unlock file with password length:', password?.length || 0);
  
  // Try @pdfsmaller/pdf-decrypt-lite first (supports more encryption types)
  try {
    const libBuffer = await file.slice(0, file.size).arrayBuffer();
    const pdfBytes = new Uint8Array(libBuffer);
    console.log('pdf-decrypt-lite: read buffer, length:', pdfBytes.length);

    const decryptedBytes = await decryptPDF(pdfBytes, password);
    if (!decryptedBytes || decryptedBytes.length === 0) {
      throw new Error('Decryption returned empty data.');
    }
    console.log('pdf-decrypt-lite: successfully decrypted, bytes:', decryptedBytes.length);
    
    // Copy the decrypted bytes IMMEDIATELY. 
    // This is required because if the library returns a view into WASM memory, 
    // it will be detached/invalidated shortly after.
    const safeBytes = new Uint8Array(decryptedBytes.length);
    safeBytes.set(decryptedBytes instanceof Uint8Array ? decryptedBytes : new Uint8Array(decryptedBytes));
    
    // Validate PDF header (%PDF-)
    if (safeBytes.length < 4 || safeBytes[0] !== 0x25 || safeBytes[1] !== 0x50 || safeBytes[2] !== 0x44 || safeBytes[3] !== 0x46) {
      console.error('Decryption failed: Invalid PDF header in decrypted data');
      throw new Error('Decryption failed: The resulting data is not a valid PDF document.');
    }
    
    let firstPageThumb = '';
    let pageCount = 0;
    let pdfDocResult = undefined;

    try {
      // Pass a copy of the bytes to prevent pdf.js from detaching the original ArrayBuffer
      const loadingTask = getDocumentWithWasm({
        data: safeBytes.slice(0),
      });
      pdfDocResult = await loadingTask.promise;
      firstPageThumb = await renderPageThumbnail(pdfDocResult, 1);
      pageCount = pdfDocResult.numPages;
    } catch (thumbError) {
      console.warn('pdf-decrypt-lite: pdf.js load or thumbnail rendering failed after decryption:', thumbError);
    }
    
    // CRITICAL: Attempt to "clean" the PDF using pdf-lib.
    // This often fixes "buggy" text caused by corrupted content streams or 
    // invalid cross-reference tables after decryption.
    // However, if it fails, we should still return the raw decrypted bytes.
    let cleanedBytes = safeBytes;
    try {
      console.log('pdf-decrypt-lite: attempting to clean PDF with pdf-lib...');
      const pdfDoc = await PDFDocument.load(safeBytes, { ignoreEncryption: true });
      
      // Optimization: If the PDF is small, we can use object streams. 
      // For larger files, sometimes disabling them helps with initial parse time in pdf.js
      const useObjectStreams = safeBytes.length < 5 * 1024 * 1024; 
      
      cleanedBytes = await pdfDoc.save({ useObjectStreams });
      console.log('pdf-decrypt-lite: successfully cleaned and re-serialized PDF');
    } catch (cleanError) {
      console.warn('pdf-decrypt-lite: cleaning failed, using raw decrypted bytes:', cleanError);
      // Fallback to safeBytes if cleaning fails for any reason
      cleanedBytes = safeBytes;
    }
    
    return {
      thumbnail: firstPageThumb,
      pageCount: pageCount,
      isLocked: false,
      success: true,
      isDecrypted: true,
      pdfDoc: pdfDocResult, 
      pdfData: cleanedBytes
    };
  } catch (libError: any) {
    const libErrorMsg = libError?.message || '';
    const libErrorName = libError?.name || '';
    console.log('pdf-decrypt-lite unlock failed:', libErrorName, libErrorMsg);

    // Check if it's a wrong password error
    if (libErrorMsg.toLowerCase().includes('incorrect') || 
        libErrorMsg.toLowerCase().includes('password') ||
        libErrorName === 'PasswordException') {
      return {
        thumbnail: '',
        pageCount: 0,
        isLocked: true,
        success: false,
        isDecrypted: false
      };
    }

    // If pdf-decrypt-lite failed (unsupported encryption), try pdfjs for viewing fallback
    try {
      console.log('pdfjs: attempting fallback unlock...');
      const fallbackBuffer = await file.slice(0, file.size).arrayBuffer();
      const fallbackBytes = new Uint8Array(fallbackBuffer);
      
      const loadingTask = getDocumentWithWasm({
        data: fallbackBytes.slice(0),
        password: password,
        stopAtErrors: false
      });

      const pdf = await loadingTask.promise;
      console.log('pdfjs: successfully unlocked in fallback mode (encrypted view only)');
      
      let firstPageThumb = '';
      try {
        firstPageThumb = await renderPageThumbnail(pdf, 1);
      } catch (thumbError) {
        console.warn('pdfjs: thumbnail rendering failed in fallback:', thumbError);
      }

      return {
        thumbnail: firstPageThumb,
        pageCount: pdf.numPages,
        isLocked: false,
        success: true,
        isDecrypted: false,
        pdfDoc: pdf,
        pdfData: fallbackBytes
      };
    } catch (pdfjsError: any) {
      const errorMsg = pdfjsError?.message || '';
      const errorName = pdfjsError?.name || '';
      console.error('pdfjs unlock also failed:', errorName, errorMsg);
      
      return {
        thumbnail: '',
        pageCount: 0,
        isLocked: true,
        success: false,
        isDecrypted: false
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
