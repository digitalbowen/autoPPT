import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Catches render errors so a bad slide/quiz shape shows a message, not a white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EduGen render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto mt-16 max-w-md rounded-card border border-rose-200 bg-rose-50 p-6 text-center shadow-card">
          <div className="text-3xl">⚠️</div>
          <h2 className="mt-2 text-lg font-semibold text-rose-800">出错了</h2>
          <p className="mt-1 text-sm text-rose-600">
            渲染时发生错误：{this.state.error.message}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null })
              location.reload()
            }}
            className="mt-4 rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            重新加载
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
