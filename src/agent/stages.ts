/**
 * Sales process stages.
 *
 * The stage ids here MUST match the `## <stage_id>` headings in
 * `context/sales-process.md` — `buildPrompt.ts` slices that file by heading so
 * the agent only ever sees the directive for the current stage.
 */

export const SALES_STAGES = [
  'pre_meeting',
  'in_meeting',
  'post_meeting',
  'follow_up',
] as const

export type SalesStage = (typeof SALES_STAGES)[number]

export const DEFAULT_STAGE: SalesStage = 'pre_meeting'

/** Human-readable labels for the debug panel. */
export const STAGE_LABELS: Record<SalesStage, string> = {
  pre_meeting: 'Pre-meeting',
  in_meeting: 'In meeting',
  post_meeting: 'Post-meeting',
  follow_up: 'Follow-up',
}

/**
 * Client tool names, i.e. the actions the assistant can perform.
 *
 * ⚠️ These strings are the contract with the ElevenLabs agent config. Tool names
 * are case-sensitive and must match the dashboard exactly — a mismatch fails
 * silently at runtime. Change them in both places or not at all.
 */
export const ACTIONS = [
  'log_note',
  'create_followup_task',
  'schedule_meeting',
  'lookup_product',
  'lookup_account',
  'prepare_quote',
  'set_sales_stage',
] as const

export type ActionName = (typeof ACTIONS)[number]

/**
 * Which actions are appropriate at each stage.
 *
 * This is advisory context we hand the model, not an enforcement mechanism —
 * the agent config decides what it *can* call. Keeping the mapping here means
 * the debug panel can show what should be available at a glance.
 */
export const STAGE_ACTIONS: Record<SalesStage, ActionName[]> = {
  pre_meeting: ['lookup_account', 'lookup_product', 'log_note', 'schedule_meeting', 'set_sales_stage'],
  in_meeting: ['lookup_product', 'log_note', 'prepare_quote', 'set_sales_stage'],
  post_meeting: ['log_note', 'create_followup_task', 'prepare_quote', 'set_sales_stage'],
  follow_up: ['lookup_account', 'create_followup_task', 'schedule_meeting', 'log_note', 'set_sales_stage'],
}

export function isSalesStage(value: string): value is SalesStage {
  return (SALES_STAGES as readonly string[]).includes(value)
}
