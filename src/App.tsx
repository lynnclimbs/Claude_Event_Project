import { Avatar } from './components/Avatar/Avatar'
import { VoiceControls } from './components/VoiceControls'
import { Transcript } from './components/Transcript'
import { ActivityFeed } from './components/ActivityFeed'
import { DebugPanel } from './components/DebugPanel'
import { useRegisterActions } from './agent/tools/useRegisterActions'

export default function App() {
  // Registers all client tools with the active conversation. Must run inside
  // ConversationProvider, which ConversationShell supplies in main.tsx.
  useRegisterActions()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          Schraube{' '}
          <span className="font-normal text-slate-500">· voice sales assistant</span>
        </h1>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: the character and the controls */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-6 rounded-lg border border-slate-800 bg-slate-900/50 p-8">
            <Avatar />
            <div className="w-full">
              <VoiceControls />
            </div>
          </div>
          <DebugPanel />
        </div>

        {/* Right: what happened */}
        <div className="grid min-h-[32rem] gap-6 lg:grid-rows-[1.4fr_1fr]">
          <Transcript />
          <ActivityFeed />
        </div>
      </main>
    </div>
  )
}
