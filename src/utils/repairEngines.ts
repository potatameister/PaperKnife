/**
 * Repair engine — shared by RepairTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 * Locked files are refused by callers (UI gate + lab matrix policy), never here.
 */
import { PDFDocument } from 'pdf-lib'

import type { ToolEngineInput, ToolEngineResult } from './rotateEngines'
import { t } from '../i18n'

export const repairPdf = async (
  input: ToolEngineInput,
  createUrl: (blob: Blob) => string
): Promise<ToolEngineResult> => {
  const arrayBuffer = await input.file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true, throwOnInvalidObject: false
  } as any)

  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
  const buffer = new Uint8Array(await blob.arrayBuffer())
  return { url: createUrl(blob), size: blob.size, buffer, note: t("Rebuilt via load+save") }
}
