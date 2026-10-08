import PptxGenJS from 'pptxgenjs'
import type { Slide } from '../types'

/** Export slides (with speaker notes + source refs) to a .pptx file. */
export function exportPptx(courseName: string, slides: Slide[]): void {
  const pptx = new PptxGenJS()
  pptx.author = 'EduGen'
  pptx.title = courseName

  // Title slide
  const cover = pptx.addSlide()
  cover.background = { color: 'FFFDF7' }
  cover.addText(courseName || '教学课件', {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1.2,
    fontSize: 36,
    bold: true,
    color: '2563EB',
    align: 'center',
  })
  cover.addText('由 EduGen 基于学习材料生成', {
    x: 0.5,
    y: 3.6,
    w: 9,
    h: 0.6,
    fontSize: 16,
    color: '64748B',
    align: 'center',
  })

  slides.forEach((s) => {
    const slide = pptx.addSlide()
    slide.background = { color: 'FFFFFF' }
    slide.addText(s.title || '', {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.9,
      fontSize: 26,
      bold: true,
      color: '1E293B',
    })
    const bullets = (s.points ?? []).map((p) => ({
      text: p,
      options: { bullet: true, fontSize: 18, color: '334155', paraSpaceAfter: 8 },
    }))
    if (bullets.length) {
      slide.addText(bullets, { x: 0.7, y: 1.4, w: 8.6, h: 4.2, valign: 'top' })
    }
    if (s.sourceChunkIds?.length) {
      slide.addText(`来源：${s.sourceChunkIds.join(', ')}`, {
        x: 0.5,
        y: 6.9,
        w: 9,
        h: 0.4,
        fontSize: 11,
        italic: true,
        color: '94A3B8',
      })
    }
    if (s.speakerNotes) slide.addNotes(s.speakerNotes)
  })

  const safe = (courseName || 'edugen-course').replace(/[\\/:*?"<>|]/g, '_')
  void pptx.writeFile({ fileName: `${safe}.pptx` })
}
