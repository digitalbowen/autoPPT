import { useState, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import mammoth from 'mammoth'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import type { Chunk, SourcePage } from '../types'
import { chunkPages } from './chunk'

// Wire pdf.js worker through Vite's ?worker import (no CDN dependency).
pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()

export interface ParseResult {
  pages: SourcePage[]
  chunks: Chunk[]
}

async function parsePdf(file: File): Promise<SourcePage[]> {
  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  const pages: SourcePage[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((it) => (it as TextItem).str ?? '')
      .join(' ')
      .replace(/\s+\n/g, '\n')
      .trim()
    pages.push({ pageNo: i, text })
  }
  await doc.destroy()
  return pages
}

async function parseWord(file: File): Promise<SourcePage[]> {
  const arrayBuffer = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer })
  return [{ pageNo: 1, text: value.trim() }]
}

export function useFileParser() {
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseText = useCallback((raw: string): ParseResult => {
    const pages: SourcePage[] = [{ pageNo: 1, text: raw.trim() }]
    return { pages, chunks: chunkPages(pages) }
  }, [])

  const parseFile = useCallback(async (file: File): Promise<ParseResult> => {
    setParsing(true)
    setError(null)
    try {
      const name = file.name.toLowerCase()
      let pages: SourcePage[]
      if (name.endsWith('.pdf')) {
        pages = await parsePdf(file)
      } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
        pages = await parseWord(file)
      } else if (name.endsWith('.txt') || name.endsWith('.md')) {
        pages = [{ pageNo: 1, text: (await file.text()).trim() }]
      } else {
        throw new Error('仅支持 PDF / Word(.docx) / 文本(.txt/.md)')
      }
      return { pages, chunks: chunkPages(pages) }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '解析失败'
      setError(msg)
      throw e
    } finally {
      setParsing(false)
    }
  }, [])

  return { parsing, error, parseFile, parseText }
}
