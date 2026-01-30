import * as pdfjsLib from 'pdfjs-dist';
// Explicitly import the worker as a URL so Vite handles it correctly
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const generateThumbnail = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the document with standard font maps (cMaps) to prevent missing text
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 1.0 }); // Render at 1x scale
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Canvas context not available');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport, canvas: canvas as any }).promise;
    
    // Return JPEG for smaller memory footprint
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Thumbnail generation failed for file:', file.name, error);
    return ''; // Return empty string on failure
  }
};