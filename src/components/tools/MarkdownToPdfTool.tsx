import { useState, useRef } from 'react'
import { FileText, Loader2, ArrowRight, Upload, Type, X } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib'
import { toast } from 'sonner'
import { marked } from 'marked'
import { Capacitor } from '@capacitor/core'

import { addActivity } from '../../utils/recentActivity'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type InputMode = 'paste' | 'file'

// Helper to strip inline markdown formatting
const stripInlineMarkdown = (text: string): string => {
  return text
    // Remove images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Convert links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold **text** or __text__ -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove italic *text* or _text_ -> text
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(?<![a-zA-Z])_([^_]+)_(?![a-zA-Z])/g, '$1')
    // Remove strikethrough ~~text~~ -> text
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove inline code `code` -> code
    .replace(/`([^`]+)`/g, '$1')
    // Clean up any remaining markdown artifacts
    .replace(/\s+/g, ' ')
    .trim()
}

interface RenderConfig {
  regularFont: PDFFont
  boldFont: PDFFont
  italicFont: PDFFont
  monoFont: PDFFont
  pageWidth: number
  pageHeight: number
  margin: number
  lineHeightMultiplier: number
}

export default function MarkdownToPdfTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [markdownText, setMarkdownText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-markdown')
  const isNative = Capacitor.isNativePlatform()

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown') && !file.name.endsWith('.txt')) {
      toast.error('Please select a Markdown or text file')
      return
    }
    const text = await file.text()
    setMarkdownText(text)
    setFileName(file.name)
    setCustomFileName(file.name.replace(/\.(md|markdown|txt)$/, ''))
    setDownloadUrl(null)
  }

  const PAGE_WIDTH = 612
  const PAGE_HEIGHT = 792
  const MARGIN = 50
  const LINE_HEIGHT_MULTIPLIER = 1.4

  const renderTokensToPdf = async (
    pdfDoc: PDFDocument,
    tokens: ReturnType<typeof marked.lexer>,
    config: RenderConfig
  ) => {
    const { regularFont, boldFont, italicFont, monoFont, pageWidth, pageHeight, margin, lineHeightMultiplier } = config

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin

    const getNewPage = () => {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
      return page
    }

    const checkPageBreak = (neededHeight: number) => {
      if (y - neededHeight < margin) {
        getNewPage()
      }
    }

    const drawText = (
      text: string,
      font: PDFFont,
      size: number,
      color = rgb(0, 0, 0),
      indent = 0
    ) => {
      // Sanitize text - remove newlines and other control characters that pdf-lib cannot encode
      const sanitizedText = text.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim()
      if (!sanitizedText) return

      const lineHeight = size * lineHeightMultiplier
      const maxWidth = pageWidth - (2 * margin) - indent
      const words = sanitizedText.split(' ')
      let line = ''

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word
        const testWidth = font.widthOfTextAtSize(testLine, size)

        if (testWidth > maxWidth && line) {
          checkPageBreak(lineHeight)
          page.drawText(line, { x: margin + indent, y, size, font, color })
          y -= lineHeight
          line = word
        } else {
          line = testLine
        }
      }

      if (line) {
        checkPageBreak(lineHeight)
        page.drawText(line, { x: margin + indent, y, size, font, color })
        y -= lineHeight
      }
    }

    for (const token of tokens) {
      switch (token.type) {
        case 'heading': {
          const sizes: Record<number, number> = { 1: 24, 2: 20, 3: 16, 4: 14, 5: 12, 6: 11 }
          const size = sizes[token.depth] || 12
          y -= size * 0.5
          checkPageBreak(size * lineHeightMultiplier)
          drawText(stripInlineMarkdown(token.text), boldFont, size)
          y -= size * 0.3
          break
        }

        case 'paragraph': {
          const text = token.text || (token.raw || '').replace(/\n/g, ' ')
          drawText(stripInlineMarkdown(text), regularFont, 11)
          y -= 6
          break
        }

        case 'list': {
          for (let i = 0; i < token.items.length; i++) {
            const item = token.items[i]
            const bullet = token.ordered ? `${i + 1}. ` : '\u2022 '
            const itemText = item.text || ''
            drawText(bullet + stripInlineMarkdown(itemText), regularFont, 11, rgb(0, 0, 0), 15)
          }
          y -= 6
          break
        }

        case 'code': {
          const codeLines = token.text.split('\n')
          y -= 8
          const codeHeight = codeLines.length * 12 * lineHeightMultiplier + 16
          checkPageBreak(Math.min(codeHeight, pageHeight - 2 * margin))

          const bgHeight = Math.min(codeHeight, y - margin + 8)
          page.drawRectangle({
            x: margin,
            y: y - bgHeight + 8,
            width: pageWidth - 2 * margin,
            height: bgHeight,
            color: rgb(0.95, 0.95, 0.95)
          })
          y -= 8
          for (const codeLine of codeLines) {
            checkPageBreak(12 * lineHeightMultiplier)
            drawText(codeLine || ' ', monoFont, 10, rgb(0.2, 0.2, 0.2), 10)
          }
          y -= 8
          break
        }

        case 'blockquote': {
          y -= 6
          const quoteText = token.text || (token.raw || '').replace(/^>\s*/gm, '').replace(/\n/g, ' ')
          checkPageBreak(20)
          page.drawRectangle({
            x: margin,
            y: y - 12,
            width: 3,
            height: 14,
            color: rgb(0.7, 0.7, 0.7)
          })
          drawText(stripInlineMarkdown(quoteText), italicFont, 11, rgb(0.4, 0.4, 0.4), 12)
          y -= 6
          break
        }

        case 'hr': {
          y -= 15
          checkPageBreak(10)
          page.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8)
          })
          y -= 15
          break
        }

        case 'space': {
          y -= 11
          break
        }
      }
    }
  }

  const convertToPdf = async () => {
    if (!markdownText.trim()) {
      toast.error('Please enter or upload markdown content')
      return
    }

    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const pdfDoc = await PDFDocument.create()

      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
      const monoFont = await pdfDoc.embedFont(StandardFonts.Courier)

      const tokens = marked.lexer(markdownText)

      await renderTokensToPdf(pdfDoc, tokens, {
        regularFont,
        boldFont,
        italicFont,
        monoFont,
        pageWidth: PAGE_WIDTH,
        pageHeight: PAGE_HEIGHT,
        margin: MARGIN,
        lineHeightMultiplier: LINE_HEIGHT_MULTIPLIER
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      addActivity({
        name: `${customFileName}.pdf`,
        tool: 'Markdown to PDF',
        size: blob.size,
        resultUrl: url
      })
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const ActionButton = () => (
    <button
      onClick={convertToPdf}
      disabled={isProcessing || !markdownText.trim()}
      className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}
    >
      {isProcessing ? <><Loader2 className="animate-spin" /> Converting...</> : <>Generate PDF <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout
      title="Markdown to PDF"
      description="Convert Markdown text into a professional PDF document."
      actions={markdownText && !downloadUrl && <ActionButton />}
    >
      <input
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {!downloadUrl ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setInputMode('paste')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${inputMode === 'paste' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'}`}
            >
              <Type size={20} className={inputMode === 'paste' ? 'text-rose-500' : 'text-gray-400'} />
              <span className="font-black uppercase text-[10px] mt-1">Paste Text</span>
            </button>
            <button
              onClick={() => { setInputMode('file'); fileInputRef.current?.click() }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${inputMode === 'file' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'}`}
            >
              <Upload size={20} className={inputMode === 'file' ? 'text-rose-500' : 'text-gray-400'} />
              <span className="font-black uppercase text-[10px] mt-1">Upload File</span>
            </button>
          </div>

          {fileName && (
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-rose-500" />
                <span className="font-bold text-sm dark:text-white truncate">{fileName}</span>
              </div>
              <button onClick={() => { setFileName(null); setMarkdownText('') }} className="text-gray-400 hover:text-rose-500">
                <X size={18} />
              </button>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
              Markdown Content
            </label>
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder={`# Heading\n\nYour markdown content here...\n\n- List item 1\n- List item 2\n\n**Bold text** and *italic text*`}
              className="w-full h-64 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl p-4 font-mono text-sm resize-none outline-none focus:border-rose-500 dark:text-gray-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
              Output Filename
            </label>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white"
            />
          </div>

          {!isNative && <ActionButton />}
        </div>
      ) : (
        <SuccessState
          message="PDF Generated Successfully!"
          downloadUrl={downloadUrl}
          fileName={`${customFileName}.pdf`}
          onStartOver={() => { setMarkdownText(''); setDownloadUrl(null); setFileName(null) }}
        />
      )}

      <PrivacyBadge />
    </NativeToolLayout>
  )
}
