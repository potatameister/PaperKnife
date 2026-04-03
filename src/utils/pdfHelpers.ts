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

// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// @ts-ignore
import openjpegWasm from 'pdfjs-dist/wasm/openjpeg.wasm?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
const wasmDir = openjpegWasm.replace(/openjpeg\.wasm.*$/, '');

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

const bytesToBase64 = (bytes: Uint8Array): string => {
  const chunkSize = 16384;
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let s = '';
    for (let j = 0; j < chunk.length; j++) {
      s += String.fromCharCode(chunk[j]);
    }
    chunks.push(s);
  }
  return btoa(chunks.join(''));
};

export const downloadFile = async (data: Uint8Array | string, fileName: string, mimeType: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = typeof data === 'string' 
        ? (data.includes(',') ? data.split(',')[1] : data)
        : bytesToBase64(new Uint8Array(data));

      let finalName = fileName;
      let counter = 1;
      const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const extension = fileName.substring(fileName.lastIndexOf('.'));

      while (true) {
        try {
          await Filesystem.stat({ path: finalName, directory: Directory.Documents });
          finalName = `${baseName} (${counter})${extension}`;
          counter++;
        } catch (e) { break; }
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
    const blob = typeof data === 'string' ? await (await fetch(data)).blob() : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;
    link.download = fileName;
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    return true;
  }
};

export const loadPdfDocument = async (file: File | Uint8Array) => {
  const data = file instanceof Uint8Array ? file.slice(0) : new Uint8Array(await file.arrayBuffer());
  return await getDocumentWithWasm({ data }).promise;
};

export const renderPageThumbnail = async (pdf: any, pageNum: number, scale = 0.5): Promise<string> => {
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return '';
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const url = canvas.toDataURL('image/jpeg', 0.7);
    canvas.width = 0; canvas.height = 0;
    return url;
  } catch (e) { return ''; }
};

export const renderGridThumbnail = async (pdf: any, pageNum: number): Promise<string> => {
  return await renderPageThumbnail(pdf, pageNum, 0.3);
};

export const getPdfMetaData = async (file: File): Promise<PdfMetaData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    let isLocked = false;
    try {
      const pdfDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
      isLocked = pdfDoc.isEncrypted;
    } catch (e) {}

    try {
      const pdf = await loadPdfDocument(bytes.slice(0));
      return { thumbnail: await renderPageThumbnail(pdf, 1), pageCount: pdf.numPages, isLocked };
    } catch (e) {
      return { thumbnail: '', pageCount: 0, isLocked: true };
    }
  } catch (error: any) {
    return { thumbnail: '', pageCount: 0, isLocked: true };
  }
};

export const flattenPdf = async (pdf: any): Promise<Uint8Array> => {
  const newPdf = await PDFDocument.create();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas unavailable');

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    
    // Safety: Cap dimensions to prevent memory crashes
    const rawViewport = page.getViewport({ scale: 1.0 });
    const maxDim = 1500; 
    const scale = Math.min(1.0, maxDim / Math.max(rawViewport.width, rawViewport.height));
    const viewport = page.getViewport({ scale });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise;
    
    // Use toBlob for better memory handling than toDataURL
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.75));
    const img = await newPdf.embedJpg(await blob.arrayBuffer());
    
    const newPage = newPdf.addPage([viewport.width, viewport.height]);
    newPage.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    
    // Clean up current page
    canvas.width = 0; canvas.height = 0;
  }
  
  return await newPdf.save({ useObjectStreams: false });
};

export type UnlockResult = PdfMetaData & { 
  success: boolean, 
  isDecrypted: boolean, 
  pdfDoc?: any, 
  pdfData?: Uint8Array,
  error?: 'PASSWORD' | 'PROCESS' 
}

export const unlockPdf = async (file: File, password: string): Promise<UnlockResult> => {
  await new Promise(res => setTimeout(res, 100));
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  try {
    // TIER 1: Native pdf-lib Unlock (Instant, highest quality)
    try {
      const libDoc = await PDFDocument.load(bytes.slice(0), { password });
      const decryptedBytes = await libDoc.save({ useObjectStreams: false });
      const pdf = await loadPdfDocument(decryptedBytes);
      return { 
        thumbnail: await renderPageThumbnail(pdf, 1), 
        pageCount: pdf.numPages, 
        isLocked: false, 
        success: true, 
        isDecrypted: true, 
        pdfDoc: pdf, 
        pdfData: decryptedBytes 
      };
    } catch (e) {
      console.log('Tier 1 failed, trying Tier 2...');
    }

    // TIER 2: Specialized Decryption Engine
    try {
      const decrypted = await decryptPDF(bytes.slice(0), password);
      if (decrypted && decrypted[0] === 0x25) {
        const libDoc = await PDFDocument.load(decrypted, { ignoreEncryption: true });
        const cleanDecrypted = await libDoc.save({ useObjectStreams: false });
        const pdf = await loadPdfDocument(cleanDecrypted);
        return { 
          thumbnail: await renderPageThumbnail(pdf, 1), 
          pageCount: pdf.numPages, 
          isLocked: false, 
          success: true, 
          isDecrypted: true, 
          pdfDoc: pdf, 
          pdfData: cleanDecrypted 
        };
      }
    } catch (e) {
      console.log('Tier 2 failed, trying Tier 3...');
    }

    // TIER 3: Reconstruction Fallback (For AES-256)
    try {
      const pdf = await getDocumentWithWasm({ data: bytes.slice(0), password, stopAtErrors: false }).promise;
      const flattened = await flattenPdf(pdf);
      const newPdf = await loadPdfDocument(flattened);
      return { 
        thumbnail: await renderPageThumbnail(newPdf, 1), 
        pageCount: newPdf.numPages, 
        isLocked: false, 
        success: true, 
        isDecrypted: true, 
        pdfDoc: newPdf, 
        pdfData: flattened 
      };
    } catch (e2: any) {
      const isPasswordError = e2.name === 'PasswordException' || e2.message?.toLowerCase().includes('password');
      return { 
        thumbnail: '', 
        pageCount: 0, 
        isLocked: true, 
        success: false, 
        isDecrypted: false, 
        error: isPasswordError ? 'PASSWORD' : 'PROCESS' 
      };
    }
  } catch (err) {
    return { thumbnail: '', pageCount: 0, isLocked: true, success: false, isDecrypted: false, error: 'PROCESS' };
  }
};

export const renderPdfPage = async (pdf: any, pageNum: number, container: HTMLElement, options: any = {}) => {
  const { scale = 1.0 } = options;
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    container.innerHTML = '';
    container.appendChild(canvas);
    await page.render({ canvasContext: ctx, viewport, intent: 'display' }).promise;
  } catch (e) { console.error(e); }
};

export const shareFile = async (data: any, fileName: string, mimeType: string) => {
  if (Capacitor.isNativePlatform()) {
    const base64 = typeof data === 'string' ? data : bytesToBase64(new Uint8Array(data));
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    await Share.share({ title: fileName, url: `${Directory.Cache}/${fileName}` });
    return true;
  }
  return await downloadFile(data, fileName, mimeType);
};
