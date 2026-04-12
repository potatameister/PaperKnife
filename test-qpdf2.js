import qpdfModule from '@lafraise/qpdf';

async function test() {
  try {
    const qpdf = await qpdfModule.Qpdf.open(new Uint8Array([0, 1, 2]));
    console.log("Qpdf instance created:", Object.getOwnPropertyNames(Object.getPrototypeOf(qpdf)));
  } catch (e) {
    console.error(e);
  }
}
test();