import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppStateProvider } from './state/AppState.tsx'
import { ConversationShell } from './components/ConversationShell.tsx'

// Ordering matters: AppStateProvider must sit above ConversationShell, because
// the conversation's callbacks write transcript lines and errors into app state.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <ConversationShell>
        <App />
      </ConversationShell>
    </AppStateProvider>
  </StrictMode>,
)
