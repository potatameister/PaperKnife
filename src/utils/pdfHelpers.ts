import * as pdfjsLib from 'pdfjs-dist';
// Explicitly import the worker as a URL so Vite handles it correctly
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PdfMetaData {
  thumbnail: string
  pageCount: number
  isLocked: boolean
}

export const generateThumbnail = async (file: File): Promise<PdfMetaData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the document with local standard font maps (cMaps) for true offline support
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `${window.location.origin}/PaperKnife/cmaps/`,
      cMapPacked: true,
    });

    // Handle password protected files
    loadingTask.onPassword = (_updatePassword: (p: string) => void, reason: number) => {
      console.warn('PDF is password protected', reason);
      // We don't ask for password here, just flag it as locked
      throw new Error('PASSWORD_REQUIRED');
    };

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Canvas context not available');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport, canvas: canvas as any }).promise;
    
    return {
      thumbnail: canvas.toDataURL('image/jpeg', 0.8),
      pageCount,
      isLocked: false
    };
  } catch (error: any) {
    console.error('DEBUG: Metadata generation failed for file:', file.name, {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    if (error.message === 'PASSWORD_REQUIRED' || error.name === 'PasswordException') {
      return { thumbnail: '', pageCount: 0, isLocked: true };
    }
    return { thumbnail: '', pageCount: 0, isLocked: false };
  }
};