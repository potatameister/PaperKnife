import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function test() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 500]);
  page.drawText('Testing native encryption!', { x: 50, y: 400 });
  
  if (typeof pdfDoc.encrypt === 'function') {
    pdfDoc.encrypt({
      userPassword: 'password',
      ownerPassword: 'password',
      permissions: { printing: 'highResolution' }
    });
    const bytes = await pdfDoc.save();
    fs.writeFileSync('test-encrypted.pdf', bytes);
    console.log('Saved test-encrypted.pdf, size:', bytes.length);
  } else {
    console.log('Encrypt function missing.');
  }
}

test().catch(console.error);
