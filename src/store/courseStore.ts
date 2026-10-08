import { create } from 'zustand'
import { openDB, type IDBPDatabase } from 'idb'
import type {
  AnswerRecord,
  Chunk,
  Course,
  Quiz,
  Slide,
  SourcePage,
  StepKey,
} from '../types'

const DB_NAME = 'edugen'
const STORE = 'courses'
const LAST_ID = 'current'

let dbPromise: Promise<IDBPDatabase> | null = null
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

function emptyCourse(): Course {
  const now = Date.now()
  return {
    id: LAST_ID,
    name: '未命名课程',
    createdAt: now,
    updatedAt: now,
    pages: [],
    chunks: [],
    selectedChunkIds: [],
    slides: [],
    quizzes: [],
    answers: [],
  }
}

interface CourseState extends Course {
  step: StepKey
  setStep: (s: StepKey) => void
  setName: (name: string) => void
  setParsed: (pages: SourcePage[], chunks: Chunk[]) => void
  toggleChunk: (id: string) => void
  selectAll: (on: boolean) => void
  setSlides: (slides: Slide[]) => void
  updateSlide: (index: number, patch: Partial<Slide>) => void
  setQuizzes: (quizzes: Quiz[]) => void
  addAnswer: (record: AnswerRecord) => void
  resetAnswers: () => void
  selectedChunks: () => Chunk[]
  buildContext: () => string
  saveCourse: () => Promise<void>
  loadLast: () => Promise<boolean>
  exportJson: () => void
}

function persist(get: () => CourseState) {
  const s = get()
  const course: Course = {
    id: s.id,
    name: s.name,
    createdAt: s.createdAt,
    updatedAt: Date.now(),
    pages: s.pages,
    chunks: s.chunks,
    selectedChunkIds: s.selectedChunkIds,
    slides: s.slides,
    quizzes: s.quizzes,
    answers: s.answers,
  }
  void getDB().then((db) => db.put(STORE, course))
}

export const useCourseStore = create<CourseState>((set, get) => ({
  ...emptyCourse(),
  step: 'upload',

  setStep: (step) => set({ step }),
  setName: (name) => {
    set({ name })
    persist(get)
  },

  setParsed: (pages, chunks) =>
    set({
      pages,
      chunks,
      selectedChunkIds: chunks.map((c) => c.id),
      slides: [],
      quizzes: [],
      answers: [],
    }),

  toggleChunk: (id) =>
    set((st) => {
      const has = st.selectedChunkIds.includes(id)
      return {
        selectedChunkIds: has
          ? st.selectedChunkIds.filter((x) => x !== id)
          : [...st.selectedChunkIds, id],
      }
    }),

  selectAll: (on) =>
    set((st) => ({ selectedChunkIds: on ? st.chunks.map((c) => c.id) : [] })),

  setSlides: (slides) => {
    set({ slides })
    persist(get)
  },
  updateSlide: (index, patch) => {
    set((st) => {
      const slides = st.slides.slice()
      slides[index] = { ...slides[index], ...patch }
      return { slides }
    })
    persist(get)
  },

  setQuizzes: (quizzes) => {
    set({ quizzes })
    persist(get)
  },

  addAnswer: (record) => {
    set((st) => ({
      answers: [...st.answers.filter((a) => a.quizId !== record.quizId), record],
    }))
    persist(get)
  },
  resetAnswers: () => {
    set({ answers: [] })
    persist(get)
  },

  selectedChunks: () => {
    const st = get()
    const set2 = new Set(st.selectedChunkIds)
    return st.chunks.filter((c) => set2.has(c.id))
  },

  buildContext: () =>
    get()
      .selectedChunks()
      .map((c) => `[${c.id}]（${c.chapter}）${c.text}`)
      .join('\n\n'),

  saveCourse: async () => {
    persist(get)
  },

  loadLast: async () => {
    const db = await getDB()
    const course = (await db.get(STORE, LAST_ID)) as Course | undefined
    if (!course) return false
    set({ ...course })
    return true
  },

  exportJson: () => {
    const s = get()
    const course: Course = {
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      updatedAt: Date.now(),
      pages: s.pages,
      chunks: s.chunks,
      selectedChunkIds: s.selectedChunkIds,
      slides: s.slides,
      quizzes: s.quizzes,
      answers: s.answers,
    }
    const blob = new Blob([JSON.stringify(course, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(s.name || 'course').replace(/[\\/:*?"<>|]/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  },
}))
