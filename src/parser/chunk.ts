import type { Chunk, SourcePage } from '../types'

const MAX_CHARS = 800

// Heading markers: markdown #, 第X章 / 第X节, numbered 1.1 / 1.2.3
const HEADING_RE =
  /^(\s*#{1,6}\s+.+|第\s*[0-9一二三四五六七八九十百]+\s*[章节节]\b.*|\d+(\.\d+)*[、.\s].{0,60})$/

function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (trimmed.length > 80) return false
  return HEADING_RE.test(trimmed)
}

function cleanHeading(line: string): string {
  return line.trim().replace(/^#{1,6}\s+/, '')
}

let counter = 0
function nextId(): string {
  counter += 1
  return `c${counter}`
}

/**
 * Split pages into chunks of <= 800 chars, grouped under the nearest heading.
 * Headings recognized: #, 第X章/节, 1.1 style numbering.
 */
export function chunkPages(pages: SourcePage[]): Chunk[] {
  counter = 0
  const chunks: Chunk[] = []
  let chapter = '前言'

  for (const page of pages) {
    const lines = page.text.split(/\r?\n/)
    let buffer = ''

    const flush = () => {
      const text = buffer.trim()
      buffer = ''
      if (!text) return
      // Further split overly long buffers on sentence boundaries.
      for (const piece of splitLong(text)) {
        chunks.push({
          id: nextId(),
          chapter,
          text: piece,
          pageNo: page.pageNo,
        })
      }
    }

    for (const line of lines) {
      if (isHeading(line)) {
        flush()
        chapter = cleanHeading(line)
        continue
      }
      const candidate = buffer ? `${buffer}\n${line}` : line
      if (candidate.length > MAX_CHARS) {
        flush()
        buffer = line
      } else {
        buffer = candidate
      }
    }
    flush()
  }

  return chunks
}

function splitLong(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text]
  const out: string[] = []
  const sentences = text.split(/(?<=[。！？.!?;；\n])/)
  let acc = ''
  for (const s of sentences) {
    if ((acc + s).length > MAX_CHARS && acc) {
      out.push(acc.trim())
      acc = s
    } else {
      acc += s
    }
  }
  if (acc.trim()) out.push(acc.trim())
  return out
}
