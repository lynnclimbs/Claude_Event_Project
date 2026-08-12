import { useConversationClientTool } from '@elevenlabs/react'
import { useAppState } from '../../state/AppState'
import { STAGE_LABELS, isSalesStage } from '../stages'
import { buildDynamicVariables } from '../buildPrompt'
import { asText, lookupAccount, lookupProduct } from './actions'

/**
 * Registers every client tool with the active conversation.
 *
 * Must be called from a component inside `ConversationProvider`. Handlers are
 * ref-backed by the SDK, so referencing app state here is safe without listing
 * dependencies.
 *
 * ⚠️ Each string below must match a tool configured on the ElevenLabs agent
 * *exactly* — names are case-sensitive, and a mismatch fails silently (the agent
 * simply never calls it). `ACTIONS` in ../stages.ts is the canonical list.
 *
 * Return values matter: a tool whose agent config sets `expects_response: true`
 * feeds its return string back to the model, so these read as things the
 * assistant can say next.
 */
export function useRegisterActions() {
  const { addActivity, setStage } = useAppState()

  useConversationClientTool('log_note', (params) => {
    const note = asText(params.note ?? params.text, '(empty note)')
    addActivity('log_note', note, params)
    return 'Note saved.'
  })

  useConversationClientTool('create_followup_task', (params) => {
    const task = asText(params.task ?? params.description, '(unspecified task)')
    const due = asText(params.due_date ?? params.due, 'no date')
    addActivity('create_followup_task', `${task} — due ${due}`, params)
    return `Follow-up task created, due ${due}.`
  })

  useConversationClientTool('schedule_meeting', (params) => {
    const withWhom = asText(params.with ?? params.attendee, 'the customer')
    const when = asText(params.when ?? params.date, 'unspecified time')
    addActivity('schedule_meeting', `Meeting with ${withWhom} — ${when}`, params)
    return `Meeting placeholder created for ${when}. It needs confirming in the calendar.`
  })

  useConversationClientTool('lookup_product', (params) => {
    const query = asText(params.query ?? params.product)
    const result = lookupProduct(query)
    addActivity('lookup_product', `Looked up "${query}"`, { query, result })
    return result
  })

  useConversationClientTool('lookup_account', (params) => {
    const name = asText(params.name ?? params.account ?? params.customer)
    const result = lookupAccount(name)
    addActivity('lookup_account', `Looked up account "${name}"`, { name, result })
    return result
  })

  useConversationClientTool('prepare_quote', (params) => {
    const product = asText(params.product, 'unspecified product')
    const quantity = asText(params.quantity, 'unspecified quantity')
    addActivity('prepare_quote', `Draft quote: ${quantity} × ${product}`, params)
    // Deliberately refuses to invent a price — see company.md.
    return `Draft quote started for ${quantity} of ${product}. Pricing has to be confirmed by a human before it goes out.`
  })

  useConversationClientTool('set_sales_stage', (params) => {
    const requested = asText(params.stage)
    if (!isSalesStage(requested)) {
      return `"${requested}" is not a valid stage. Valid stages are pre_meeting, in_meeting, post_meeting, follow_up.`
    }
    setStage(requested)
    addActivity('set_sales_stage', `Stage changed to ${requested}`, params)
    // Dynamic variables are fixed for the life of a session, so the new
    // stage's directive is injected via this tool return — the model reads it
    // and adapts behaviour immediately without a reconnect.
    const { stage_directive } = buildDynamicVariables(requested)
    return `Stage is now ${STAGE_LABELS[requested]}. ${stage_directive}`
  })
}
