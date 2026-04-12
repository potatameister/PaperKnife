/**
 * PaperKnife - Surgical PDF Security (Lock/Unlock)
 * Copyright (C) 2026 potatameister
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib'

// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class PdfSecurity {
  /**
   * Universal Unlock Method
   */
  static async unlock(bytes: Uint8Array, password = ''): Promise<{ success: boolean; data?: Uint8Array; error?: string }> {
    try {
      const fileSize = bytes.length
      const chunkSize = Math.min(4096, fileSize)
      const offset = Math.max(0, fileSize - chunkSize)
      
      const endBuffer = bytes.slice(offset, fileSize)
      const endContent = new TextDecoder().decode(endBuffer)
      
      const startBuffer = bytes.slice(0, chunkSize)
      const startContent = new TextDecoder().decode(startBuffer)

      const isLocked = endContent.includes('/Encrypt') || startContent.includes('/Encrypt')
      
      if (!isLocked) return { success: true, data: bytes }

      try {
        const nativeDoc = await PDFDocument.load(bytes, { password } as any)
        const nativeBytes = await nativeDoc.save()
        return { success: true, data: nativeBytes }
      } catch (e) {
        console.log('Tier 1 Unlock failed, trying Tier 2...')
      }

      const loadingTask = pdfjsLib.getDocument({ data: bytes, password });
      const pdfDoc = await loadingTask.promise;
      const decryptedBytes = await (pdfDoc as any).saveDocument();
      
      if (decryptedBytes && decryptedBytes instanceof Uint8Array) {
        return { success: true, data: decryptedBytes };
      }

      return { success: false, error: 'DECRYPTION_FAILED' }
    } catch (e: any) {
      if (e.name === 'PasswordException') return { success: false, error: 'INCORRECT_PASSWORD' };
      return { success: false, error: e.message }
    }
  }

  /**
   * Surgical Lock Method
   * Using native pdf-lib encryption from the updated library to prevent artifacts.
   */
  static async lock(bytes: Uint8Array, password = ''): Promise<{ success: boolean; data?: Uint8Array; error?: string }> {
    try {
      const pdfDoc = await PDFDocument.load(bytes)
      
      // The updated library supports native encryption
      // @ts-ignore
      if (typeof pdfDoc.encrypt === 'function') {
        // @ts-ignore
        pdfDoc.encrypt({
          userPassword: password,
          ownerPassword: password,
          permissions: {
            printing: 'highResolution',
            modifying: true,
            copying: true,
            annotating: true,
            fillingForms: true,
            contentAccessibility: true,
            documentAssembly: true,
          }
        })
        const data = await pdfDoc.save()
        return { success: true, data }
      }

      return { success: false, error: 'ENCRYPTION_NOT_SUPPORTED' }
    } catch (e: any) {
      console.error('Lock failed:', e)
      return { success: false, error: e.message }
    }
  }
}
