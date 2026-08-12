import { useEffect, useRef } from 'react'
import { useAppState } from '../state/AppState'

export function Transcript() {
  const { transcript } = useAppState()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript.length])

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/50">
      <h2 className="border-b border-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Transcript
      </h2>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {transcript.length === 0 && (
          <p className="text-sm text-slate-600">
            Nothing yet. Start a session and say — or type — something.
          </p>
        )}
        {transcript.map((line) => (
          <div key={line.id} className="text-sm">
            <span
              className={
                line.role === 'user'
                  ? 'font-medium text-sky-400'
                  : 'font-medium text-purple-400'
              }
            >
              {line.role === 'user' ? 'You' : 'Schraube'}
            </span>
            <p className="mt-0.5 whitespace-pre-wrap text-slate-300">{line.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  )
}
