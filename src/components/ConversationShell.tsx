import { ConversationProvider } from '@elevenlabs/react'
import type { PropsWithChildren } from 'react'
import { useAppState } from '../state/AppState'

/**
 * Wires app state into the ElevenLabs provider.
 *
 * This sits *between* AppStateProvider and the app: the provider's callbacks
 * write transcript lines and errors into app state, so app state has to exist
 * above it.
 *
 * Connection details and dynamic variables are supplied per-session at
 * `startSession()` rather than here, because they depend on the sales stage
 * selected at the moment of connecting.
 */
export function ConversationShell({ children }: PropsWithChildren) {
  const { addTranscriptLine, addError, textOnly } = useAppState()

  return (
    <ConversationProvider
      textOnly={textOnly}
      onMessage={({ message, source }) => {
        addTranscriptLine(source === 'user' ? 'user' : 'ai', message)
      }}
      onError={(message) => {
        addError(message)
      }}
    >
      {children}
    </ConversationProvider>
  )
}
