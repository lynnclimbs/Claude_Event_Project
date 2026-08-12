export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Hackathon
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Claude Event Project
        </h1>
        <p className="max-w-xl text-lg text-slate-400">
          Vite + React + TypeScript + Tailwind. Edit{' '}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-base text-slate-200">
            src/App.tsx
          </code>{' '}
          and start building.
        </p>
      </div>
    </main>
  )
}
