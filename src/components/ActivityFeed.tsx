import { useAppState } from '../state/AppState'

/**
 * Visible proof that actions fired.
 *
 * Actions are mocked (see agent/tools/actions.ts) — this feed is what makes them
 * demonstrable. On stage it reads identically to a real CRM integration.
 */
export function ActivityFeed() {
  const { activity } = useAppState()

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/50">
      <h2 className="border-b border-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Actions ({activity.length})
      </h2>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {activity.length === 0 && (
          <p className="text-sm text-slate-600">No actions taken yet.</p>
        )}
        {activity.map((entry) => (
          <div
            key={entry.id}
            className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"
          >
            <div className="flex items-baseline justify-between gap-2">
              <code className="text-xs text-emerald-400">{entry.action}</code>
              <time className="font-mono text-[10px] text-slate-600">
                {entry.at.toLocaleTimeString()}
              </time>
            </div>
            <p className="mt-1 text-sm text-slate-300">{entry.summary}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
