/**
 * PaperKnife - Surgical PDF Unlocker
 * Copyright (C) 2026 potatameister
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib'

// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class PdfUnlocker {
  /**
   * Universal Unlock Method
   * TIER 1: Native pdf-lib (Fastest, best for older PDFs)
   * TIER 2: pdf.js saveDocument (Most robust, handles AES-256 Rev 6 flawlessly)
   */
  static async unlock(bytes: Uint8Array, password = ''): Promise<{ success: boolean; data?: Uint8Array; error?: string }> {
    try {
      // 1. Check if encrypted first
      const header = new TextDecoder().decode(bytes.slice(0, 2048))
      if (!header.includes('/Encrypt')) {
        return { success: true, data: bytes }
      }

      // TIER 1: Native pdf-lib Unlock
      try {
        const nativeDoc = await PDFDocument.load(bytes, { password } as any)
        const nativeBytes = await nativeDoc.save({ useObjectStreams: false })
        return { success: true, data: nativeBytes }
      } catch (e) {
        console.log('Tier 1 Unlock failed or unsupported version, trying Tier 2...')
      }

      // TIER 2: pdf.js saveDocument (The "Mozilla Bridge")
      try {
        const loadingTask = pdfjsLib.getDocument({ data: bytes, password });
        const pdfDoc = await loadingTask.promise;
        
        // saveDocument() in recent pdf.js versions can return the document as a Uint8Array.
        // If loaded with a password, it handles the decryption internally.
        const decryptedBytes = await (pdfDoc as any).saveDocument();
        
        if (decryptedBytes && decryptedBytes instanceof Uint8Array) {
          // Double check with pdf-lib to ensure it's truly unlocked and stable
          const verifyDoc = await PDFDocument.load(decryptedBytes, { ignoreEncryption: true });
          if (!verifyDoc.isEncrypted) {
             return { success: true, data: decryptedBytes };
          }
        }
      } catch (e: any) {
        if (e.name === 'PasswordException') {
          return { success: false, error: 'INCORRECT_PASSWORD' };
        }
        console.error('Tier 2 Unlock failed:', e);
      }

      return { success: false, error: 'DECRYPTION_FAILED' }

    } catch (e: any) {
      console.error('Surgical unlock failed:', e)
      return { success: false, error: e.message }
    }
  }
}
