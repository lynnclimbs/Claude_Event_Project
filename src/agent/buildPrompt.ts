import companyContext from './context/company.md?raw'
import userPersona from './context/persona.md?raw'
import avatarBehavior from './context/avatar.md?raw'
import salesProcess from './context/sales-process.md?raw'
import { STAGE_ACTIONS, STAGE_LABELS, type SalesStage } from './stages'

/**
 * Context assembly.
 *
 * The four markdown files are the source of truth and live in git. They reach
 * the agent as **dynamic variables**, which the agent's dashboard system prompt
 * references as {{company_context}}, {{user_persona}}, {{avatar_behavior}} and
 * {{stage_directive}}.
 *
 * Dynamic variables (rather than prompt overrides) are deliberate: overrides are
 * disabled by default on the agent and, once enabled, let anyone holding the
 * agent id replace the system prompt outright. Variables carry the same content
 * with none of that exposure.
 *
 * ⚠️ These files are bundled into the client JS by `?raw`, so their contents are
 * readable in devtools. Fine for fictional demo context; if real customer data
 * ever lands in them, this assembly has to move server-side.
 */

/** Dynamic variables only accept string | number | boolean. */
export type DynamicVariables = Record<string, string | number | boolean>

/**
 * Extracts a single `## <stage_id>` section from the sales process document.
 *
 * Returns the section body without its heading. Content before the first `##`
 * is preamble and always ignored.
 */
export function extractStageSection(markdown: string, stage: SalesStage): string {
  // Line-based scan rather than a regex: `\z` (end-of-document) does not exist
  // in JavaScript regex, and `$` under the `m` flag means end-of-line, which
  // would truncate the final section.
  const lines = markdown.split('\n')
  const heading = `## ${stage}`
  const start = lines.findIndex((line) => line.trim() === heading)
  if (start === -1) return ''

  const body: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) break
    body.push(lines[i])
  }
  return body.join('\n').trim()
}

/** True when the sales process file has a section for every declared stage. */
export function findMissingStageSections(stages: readonly SalesStage[]): SalesStage[] {
  return stages.filter((stage) => extractStageSection(salesProcess, stage) === '')
}

export function buildDynamicVariables(stage: SalesStage): DynamicVariables {
  const stageSection = extractStageSection(salesProcess, stage)
  const actions = STAGE_ACTIONS[stage]

  // Compose the stage directive: the narrative from markdown plus the concrete
  // action list from code, so the model knows both intent and available tools.
  const stageDirective = [
    `Current stage: ${STAGE_LABELS[stage]} (${stage}).`,
    '',
    stageSection || '(No directive defined for this stage.)',
    '',
    `Actions appropriate at this stage: ${actions.join(', ')}.`,
  ].join('\n')

  return {
    company_context: companyContext.trim(),
    user_persona: userPersona.trim(),
    avatar_behavior: avatarBehavior.trim(),
    stage_directive: stageDirective,
    sales_stage: stage,
  }
}

/**
 * The system prompt to paste into the ElevenLabs agent dashboard.
 *
 * We do not send this at runtime — it lives on the agent. It is exported so the
 * debug panel can display it and so it stays version-controlled next to the
 * variables it references.
 */
export const AGENT_SYSTEM_PROMPT = `You are a voice assistant for a sales team. Everything you say is spoken aloud.

# How you behave
{{avatar_behavior}}

# The company you work for
{{company_context}}

# Who you are talking to
{{user_persona}}

# What you should be doing right now
{{stage_directive}}

# Rules that override the above
- You are being spoken, not read. Never use markdown, lists, or headings.
- One idea per sentence. Lead with the answer.
- Never invent prices, delivery dates, tolerances, or certifications. Those
  require a human. Say you'll get it confirmed instead.
- Ask at most one question per turn.`

/** Rough token-ish size estimate, for the debug panel. */
export function estimateContextSize(vars: DynamicVariables): number {
  return Object.values(vars).reduce<number>(
    (total, value) => total + String(value).length,
    0,
  )
}
