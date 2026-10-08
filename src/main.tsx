import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TutorPage } from './components/TutorPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Minimal query-param routing (no react-router): ?tutor=<quizId> opens the chat page.
const params = new URLSearchParams(window.location.search)
const tutorId = params.get('tutor')
const tutorModel = params.get('model') || 'qwen-plus'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {tutorId ? <TutorPage quizId={tutorId} model={tutorModel} /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>,
)
