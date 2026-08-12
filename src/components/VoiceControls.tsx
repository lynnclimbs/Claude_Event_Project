import { useState } from 'react'
import {
  useConversationControls,
  useConversationInput,
  useConversationStatus,
} from '@elevenlabs/react'
import { useAppState } from '../state/AppState'
import { buildDynamicVariables } from '../agent/buildPrompt'
import { buildConnectionOptions, CONNECTION_MODE, SessionConfigError } from '../agent/session'

export function VoiceControls() {
  const { startSession, endSession, sendUserMessage } = useConversationControls()
  const { status } = useConversationStatus()
  const { isMuted, setMuted } = useConversationInput()
  const { stage, addError, errors, textOnly, setTextOnly, reset } = useAppState()

  const [connecting, setConnecting] = useState(false)
  const [draft, setDraft] = useState('')

  const connected = status === 'connected'

  async function handleStart() {
    setConnecting(true)
    reset()
    try {
      // Pre-flight mic check — catches permission denied before the SDK tries
      // to open the WebRTC stream, so we can show a clear message rather than
      // a generic connection error.
      if (!textOnly) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
      }
      const connection = await buildConnectionOptions()
      startSession({ ...connection, dynamicVariables: buildDynamicVariables(stage) })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        addError('Microphone access was denied. Allow mic access in your browser settings, or switch to Text mode.')
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        addError('No microphone found. Connect one, or switch to Text mode.')
      } else {
        addError(
          error instanceof SessionConfigError
            ? error.message
            : `Failed to start session: ${String(error)}`,
        )
      }
    } finally {
      setConnecting(false)
    }
  }

  function handleSend() {
    const text = draft.trim()
    if (!text) return
    sendUserMessage(text)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {connected ? (
          <button
            onClick={endSession}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            End session
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={connecting || status === 'connecting'}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {connecting || status === 'connecting' ? 'Connecting…' : 'Start session'}
          </button>
        )}

        {connected && !textOnly && (
          <button
            onClick={() => setMuted(!isMuted)}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            {isMuted ? 'Unmute mic' : 'Mute mic'}
          </button>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={textOnly}
            disabled={connected}
            onChange={(event) => setTextOnly(event.target.checked)}
            className="accent-sky-500"
          />
          Text mode
        </label>

        <span className="ml-auto font-mono text-xs text-slate-500">
          {CONNECTION_MODE} · {status}
        </span>
      </div>

      {errors.length > 0 && (
        <div className="rounded border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {errors[errors.length - 1]}
        </div>
      )}

      {/* Typing works in voice mode too — useful for feeding exact phrasing. */}
      {connected && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSend()
            }}
            placeholder="Type a message…"
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
