import { PDFDocument } from 'pdf-lib';

async function test() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 500]);
    page.drawText('This is a test');
    
    // @ts-ignore
    if (typeof pdfDoc.encrypt === 'function') {
      // @ts-ignore
      pdfDoc.encrypt({
        userPassword: 'password',
        ownerPassword: 'password',
        permissions: { printing: 'highResolution' }
      });
      const bytes = await pdfDoc.save();
      console.log('Success! Bytes length:', bytes.length);
    } else {
      console.log('Encrypt function not found!');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
test();