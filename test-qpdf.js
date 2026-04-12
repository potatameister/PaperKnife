import { Qpdf } from '@lafraise/qpdf';

async function test() {
  const qpdf = await Qpdf.create();
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(qpdf)));
}
test();