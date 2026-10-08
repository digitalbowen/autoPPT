import { useEffect, useRef } from 'react'
import Reveal from 'reveal.js'
import type { Api } from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/white.css'
import type { Slide } from '../types'

interface PptViewProps {
  slides: Slide[]
  onEdit: (index: number, patch: Partial<Slide>) => void
}

/** reveal.js wrapped as a React component with inline slide editing. */
export function PptView({ slides, onEdit }: PptViewProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const deckRef = useRef<Api | null>(null)
  const readyRef = useRef(false)

  useEffect(() => {
    if (!rootRef.current) return
    const deck = new Reveal(rootRef.current, {
      embedded: true,
      hash: false,
      transition: 'slide',
      width: 960,
      height: 640,
      margin: 0.06,
    })
    // initialize() is async; only mark ready once reveal's DOM is built.
    deck
      .initialize()
      .then(() => {
        readyRef.current = true
      })
      .catch(() => {
        /* initialize failed; keep readyRef false so sync() is skipped */
      })
    deckRef.current = deck
    return () => {
      readyRef.current = false
      try {
        deck.destroy()
      } catch {
        /* reveal already torn down */
      }
      deckRef.current = null
    }
  }, [])

  // Re-sync reveal after slide data changes — only once init has finished.
  useEffect(() => {
    if (!readyRef.current) return
    try {
      deckRef.current?.sync()
    } catch {
      /* sync raced with teardown; safe to ignore */
    }
  }, [slides.length])

  return (
    <div className="reveal-wrap overflow-hidden rounded-card border border-edu-soft bg-white shadow-card">
      <div ref={rootRef} className="reveal" style={{ height: 460 }}>
        <div className="slides">
          {slides.map((s, i) => (
            <section key={i}>
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) =>
                  onEdit(i, { title: e.currentTarget.textContent ?? '' })
                }
                className="text-edu-ink"
                style={{ fontSize: 30 }}
              >
                {s.title}
              </h2>
              <ul>
                {(s.points ?? []).map((p, j) => (
                  <li
                    key={j}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const points = s.points.slice()
                      points[j] = e.currentTarget.textContent ?? ''
                      onEdit(i, { points })
                    }}
                    style={{ fontSize: 20, marginBottom: 6 }}
                  >
                    {p}
                  </li>
                ))}
              </ul>
              {(s.sourceChunkIds?.length ?? 0) > 0 && (
                <div
                  style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}
                >
                  来源：{s.sourceChunkIds.join(', ')}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
