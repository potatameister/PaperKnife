/**
 * Metadata engine — shared by MetadataTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 * Lab default is the deep-clean wipe.
 */
import { PDFDocument } from 'pdf-lib'

import { getProcessBytes } from './decryptInput'
import type { ToolEngineInput, ToolEngineResult } from './rotateEngines'
import { t } from '../i18n'

export const wipeMetadata = async (
  input: ToolEngineInput,
  createUrl: (blob: Blob) => string
): Promise<ToolEngineResult> => {
  const bytes = await getProcessBytes(input.file, input.password)
  const sourcePdf = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
  const targetPdf = await PDFDocument.create()
  const copiedPages = await targetPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
  copiedPages.forEach(page => targetPdf.addPage(page))

  targetPdf.setTitle('')
  targetPdf.setAuthor('')
  targetPdf.setSubject('')
  targetPdf.setKeywords([] as any)
  targetPdf.setCreator(' ')
  targetPdf.setProducer(' ')

  targetPdf.setModificationDate(new Date())
  targetPdf.setCreationDate(new Date())

  const dict = targetPdf.catalog.get(targetPdf.context.obj('Metadata'))
  if (dict) targetPdf.catalog.delete(targetPdf.context.obj('Metadata'))

  const pdfBytes = await targetPdf.save()
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
  const buffer = new Uint8Array(await blob.arrayBuffer())
  return { url: createUrl(blob), size: blob.size, buffer, note: t("Metadata wiped (deep clean)") }
}
