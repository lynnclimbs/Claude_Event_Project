import { useState } from 'react'
import { useConversationStatus } from '@elevenlabs/react'
import { useAppState } from '../state/AppState'
import {
  AGENT_SYSTEM_PROMPT,
  buildDynamicVariables,
  estimateContextSize,
  findMissingStageSections,
} from '../agent/buildPrompt'
import { SALES_STAGES, STAGE_ACTIONS, STAGE_LABELS } from '../agent/stages'
import { TOOL_SCHEMAS } from '../agent/tools/schema'

/**
 * Development surface: pick the stage, inspect exactly what context the agent
 * will receive, and see config problems before they become silent failures.
 */
export function DebugPanel() {
  const { stage, setStage, errors } = useAppState()
  const { status } = useConversationStatus()
  const [showContext, setShowContext] = useState(false)

  const variables = buildDynamicVariables(stage)
  const size = estimateContextSize(variables)
  const missingSections = findMissingStageSections(SALES_STAGES)
  const connected = status === 'connected'

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Debug
      </h2>

      <div>
        <label className="mb-1 block text-xs text-slate-500">Sales stage</label>
        <div className="flex flex-wrap gap-2">
          {SALES_STAGES.map((candidate) => (
            <button
              key={candidate}
              onClick={() => setStage(candidate)}
              className={`rounded px-3 py-1.5 text-xs ${
                stage === candidate
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {STAGE_LABELS[candidate]}
            </button>
          ))}
        </div>
        {connected && (
          <p className="mt-2 text-xs text-amber-500">
            Dynamic variables are fixed for the life of a session — reconnect for
            this stage's directive to reach the model.
          </p>
        )}
      </div>

      <div className="text-xs text-slate-500">
        <span className="text-slate-400">Actions this stage: </span>
        {STAGE_ACTIONS[stage].join(', ')}
      </div>

      <div className="text-xs text-slate-500">
        <span className="text-slate-400">Tools in schema.ts: </span>
        {TOOL_SCHEMAS.map((t) => t.name).join(', ')}
      </div>

      {(() => {
        const schemaNames = new Set(TOOL_SCHEMAS.map((t) => t.name))
        const stageNames = STAGE_ACTIONS[stage]
        const missing = stageNames.filter((n) => !schemaNames.has(n))
        return missing.length > 0 ? (
          <div className="rounded border border-amber-700 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
            <strong>schema.ts</strong> has no entry for:{' '}
            {missing.join(', ')}. Add it or the dashboard config will drift.
          </div>
        ) : null
      })()}

      <div className="text-xs text-slate-500">
        <span className="text-slate-400">Injected context: </span>
        {size.toLocaleString()} chars (~{Math.round(size / 4).toLocaleString()} tokens)
      </div>

      {missingSections.length > 0 && (
        <div className="rounded border border-amber-700 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
          <strong>sales-process.md</strong> has no section for:{' '}
          {missingSections.join(', ')}. Add a matching{' '}
          <code>## stage_id</code> heading.
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {errors.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowContext((value) => !value)}
        className="self-start text-xs text-sky-400 hover:underline"
      >
        {showContext ? 'Hide' : 'Show'} assembled context
      </button>

      {showContext && (
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-slate-500">
              Paste this into the agent's system prompt (dashboard):
            </p>
            <pre className="max-h-48 overflow-auto rounded bg-slate-950 p-3 text-[10px] leading-relaxed text-slate-400">
              {AGENT_SYSTEM_PROMPT}
            </pre>
          </div>
          {Object.entries(variables).map(([key, value]) => (
            <div key={key}>
              <p className="mb-1 font-mono text-xs text-emerald-500">
                {`{{${key}}}`}
              </p>
              <pre className="max-h-40 overflow-auto rounded bg-slate-950 p-3 text-[10px] leading-relaxed text-slate-400">
                {String(value)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
