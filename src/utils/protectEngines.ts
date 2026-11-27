/**
 * Protect engine — shared by ProtectTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 */
import { PDFDocument } from 'pdf-lib'
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite'

import { getProcessBytes } from './decryptInput'
import type { ToolEngineInput, ToolEngineResult } from './rotateEngines'
import { t } from '../i18n'

export const protectPdf = async (
  input: ToolEngineInput,
  sourcePassword: string | undefined,
  newPassword: string,
  createUrl: (blob: Blob) => string
): Promise<ToolEngineResult> => {
  const bytes = await getProcessBytes(input.file, sourcePassword)
  const sourcePdf = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
  const newPdf = await PDFDocument.create()
  const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
  pages.forEach(page => newPdf.addPage(page))
  const pdfBytes = await newPdf.save({ useObjectStreams: false })

  // Heavy task: encryption
  const encryptedBytes = await encryptPDF(pdfBytes, newPassword)

  const blob = new Blob([encryptedBytes as any], { type: 'application/pdf' })
  const buffer = new Uint8Array(await blob.arrayBuffer())
  return { url: createUrl(blob), size: blob.size, buffer, note: t("Encrypted — opens with the new password only") }
}
