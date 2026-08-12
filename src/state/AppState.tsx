import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { DEFAULT_STAGE, type ActionName, type SalesStage } from '../agent/stages'
import { makeActivityEntry, type ActivityEntry } from '../agent/tools/actions'

/**
 * App-level state that must live *above* ConversationProvider, because the
 * provider's callbacks (onMessage, onError) write into it.
 */

export type TranscriptLine = {
  id: string
  role: 'user' | 'ai'
  text: string
  at: Date
}

type AppStateValue = {
  stage: SalesStage
  setStage: (stage: SalesStage) => void

  transcript: TranscriptLine[]
  addTranscriptLine: (role: 'user' | 'ai', text: string) => void

  activity: ActivityEntry[]
  addActivity: (action: ActionName, summary: string, detail: Record<string, unknown>) => void

  errors: string[]
  addError: (message: string) => void

  textOnly: boolean
  setTextOnly: (value: boolean) => void

  reset: () => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

let lineCounter = 0

export function AppStateProvider({ children }: PropsWithChildren) {
  const [stage, setStage] = useState<SalesStage>(DEFAULT_STAGE)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [errors, setErrors] = useState<string[]>([])
  // Default to text mode: iterating the context pipeline by typing is far
  // faster than talking, and it works without microphone permission.
  const [textOnly, setTextOnly] = useState(true)

  const addTranscriptLine = useCallback((role: 'user' | 'ai', text: string) => {
    lineCounter += 1
    setTranscript((prev) => [
      ...prev,
      { id: `line_${lineCounter}`, role, text, at: new Date() },
    ])
  }, [])

  const addActivity = useCallback(
    (action: ActionName, summary: string, detail: Record<string, unknown>) => {
      setActivity((prev) => [makeActivityEntry(action, summary, detail), ...prev])
    },
    [],
  )

  const addError = useCallback((message: string) => {
    setErrors((prev) => [...prev, message])
  }, [])

  const reset = useCallback(() => {
    setTranscript([])
    setActivity([])
    setErrors([])
  }, [])

  const value = useMemo<AppStateValue>(
    () => ({
      stage,
      setStage,
      transcript,
      addTranscriptLine,
      activity,
      addActivity,
      errors,
      addError,
      textOnly,
      setTextOnly,
      reset,
    }),
    [
      stage,
      transcript,
      addTranscriptLine,
      activity,
      addActivity,
      errors,
      addError,
      textOnly,
      reset,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState must be used within an AppStateProvider')
  return value
}
