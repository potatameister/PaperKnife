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
  const chunkSize = 32768;
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    // @ts-ignore
    chunks.push(String.fromCharCode.apply(null, chunk));
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
    const url = canvas.toDataURL('image/jpeg', 0.75);
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
    
    // Check if definitely locked via pdf-lib
    let isLocked = false;
    try {
      const pdfDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
      isLocked = pdfDoc.isEncrypted;
    } catch (e) {}

    // Try loading with pdf.js to get thumbnail/pageCount
    try {
      const pdf = await loadPdfDocument(bytes.slice(0));
      const thumb = await renderPageThumbnail(pdf, 1);
      return { thumbnail: thumb, pageCount: pdf.numPages, isLocked };
    } catch (e) {
      // If pdf.js also fails, it's definitely locked or corrupt
      return { thumbnail: '', pageCount: 0, isLocked: true };
    }
  } catch (error: any) {
    return { thumbnail: '', pageCount: 0, isLocked: true };
  }
};

export const flattenPdf = async (pdf: any): Promise<Uint8Array> => {
  const newPdf = await PDFDocument.create();
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 1.2; 
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) continue;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise;
    
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.8));
    const img = await newPdf.embedJpg(await blob.arrayBuffer());
    const newPage = newPdf.addPage([viewport.width / scale, viewport.height / scale]);
    newPage.drawImage(img, { x: 0, y: 0, width: viewport.width / scale, height: viewport.height / scale });
    canvas.width = 0; canvas.height = 0;
  }
  return await newPdf.save();
};

export const unlockPdf = async (file: File, password: string): Promise<PdfMetaData & { success: boolean, isDecrypted: boolean, pdfDoc?: any, pdfData?: Uint8Array }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // 1. Try Standard
    try {
      const decrypted = await decryptPDF(bytes.slice(0), password);
      // Extra safety: slice the result
      const safeDecrypted = new Uint8Array(decrypted);
      if (safeDecrypted[0] === 0x25) {
        const pdf = await loadPdfDocument(safeDecrypted.slice(0));
        return { 
          thumbnail: await renderPageThumbnail(pdf, 1), 
          pageCount: pdf.numPages, 
          isLocked: false, 
          success: true, 
          isDecrypted: true, 
          pdfDoc: pdf, 
          pdfData: safeDecrypted 
        };
      }
    } catch (e) {}

    // 2. Try Modern
    try {
      const pdf = await getDocumentWithWasm({ data: bytes.slice(0), password, stopAtErrors: false }).promise;
      const flattened = await flattenPdf(pdf);
      const safeFlattened = new Uint8Array(flattened);
      const newPdf = await loadPdfDocument(safeFlattened.slice(0));
      return { 
        thumbnail: await renderPageThumbnail(newPdf, 1), 
        pageCount: newPdf.numPages, 
        isLocked: false, 
        success: true, 
        isDecrypted: true, 
        pdfDoc: newPdf, 
        pdfData: safeFlattened 
      };
    } catch (e2) {
      return { thumbnail: '', pageCount: 0, isLocked: true, success: false, isDecrypted: false };
    }
  } catch (err) {
    return { thumbnail: '', pageCount: 0, isLocked: true, success: false, isDecrypted: false };
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
    await page.render({ canvasContext: ctx, viewport }).promise;
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
