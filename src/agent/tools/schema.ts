/**
 * Tool schema definitions — the source of truth for what is configured in the
 * ElevenLabs agent dashboard.
 *
 * These are NOT sent to the SDK at runtime. Tool registration happens via
 * `useConversationClientTool` in `useRegisterActions.ts`. This file exists so
 * tool names, descriptions, and parameter shapes live in git and cannot drift
 * silently from the dashboard config.
 *
 * To update a tool:
 *   1. Edit the entry here.
 *   2. Paste the updated `description` and `parameters` into the ElevenLabs
 *      agent dashboard under the matching tool name.
 *   3. Ensure `expects_response` matches the dashboard setting.
 *
 * ⚠️ Tool names are case-sensitive. A mismatch between this file and the
 * dashboard fails silently at runtime — the agent simply never calls the tool.
 */

export type ParameterSchema = {
  type: 'object'
  properties: Record<string, { type: string; description: string }>
  required: string[]
}

export type ToolSchema = {
  name: string
  description: string
  parameters: ParameterSchema
  expects_response: boolean
}

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: 'log_note',
    description:
      'Save a note against the current account or conversation. Use this to capture anything the rep ' +
      'says that should be remembered: commitments, objections, products discussed, competitor mentions.',
    parameters: {
      type: 'object',
      properties: {
        note: { type: 'string', description: 'The text to save as a note.' },
      },
      required: ['note'],
    },
    expects_response: false,
  },

  {
    name: 'create_followup_task',
    description:
      'Create a follow-up task for the rep. Use this whenever the rep or customer commits to something ' +
      'with a date or deadline — samples by Friday, call back next week, send a quote.',
    parameters: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'What needs to be done.' },
        due_date: {
          type: 'string',
          description: 'When it is due. Plain language is fine, e.g. "Friday" or "2025-09-01".',
        },
      },
      required: ['task'],
    },
    expects_response: true,
  },

  {
    name: 'schedule_meeting',
    description:
      'Create a meeting placeholder with a customer or prospect. Use when the rep agrees a date to ' +
      'meet or call. The placeholder needs confirming in the calendar — say so when you confirm it.',
    parameters: {
      type: 'object',
      properties: {
        with: { type: 'string', description: 'Customer or contact name.' },
        when: {
          type: 'string',
          description: 'Date and time, or plain language such as "next Tuesday afternoon".',
        },
      },
      required: ['with', 'when'],
    },
    expects_response: true,
  },

  {
    name: 'lookup_product',
    description:
      'Look up a product from the Schraube catalogue by thread size, material, or DIN number. ' +
      'You must never state stock levels or lead times without calling this tool first — that data ' +
      'changes daily and guessing will cost the rep credibility. Call it even if you think you know ' +
      'the answer.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Thread size, material, or DIN number to look up. E.g. "M12", "A4 stainless", "DIN 933".',
        },
      },
      required: ['query'],
    },
    expects_response: true,
  },

  {
    name: 'lookup_account',
    description:
      'Look up a customer account by name. Call this before briefing the rep on any account — ' +
      'before the pre-meeting snapshot, before a follow-up recommendation, before raising any signal. ' +
      'Never state a contract date, ticket count, last-contact date, or open quote status without ' +
      'checking. Those details change and an incorrect briefing is worse than no briefing.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Customer or company name. Partial names are fine — e.g. "Müller" or "Bauer AG".',
        },
      },
      required: ['name'],
    },
    expects_response: true,
  },

  {
    name: 'prepare_quote',
    description:
      'Start a draft quote for a product and quantity. Call this when the customer asks for a quote ' +
      'or when the rep says they need one prepared. Pre-fill with whatever product and quantity details ' +
      'you have — do not wait for complete information. Pricing must be confirmed by a human before ' +
      'the quote is sent; say so when you confirm the draft.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product name, thread size, or description.' },
        quantity: { type: 'string', description: 'Number of units requested.' },
      },
      required: ['product'],
    },
    expects_response: true,
  },

  {
    name: 'set_sales_stage',
    description:
      'Update the current sales stage. Valid values: pre_meeting, in_meeting, post_meeting, follow_up. ' +
      'Call this when the context shifts — e.g. the rep arrives at the customer site (pre_meeting → ' +
      'in_meeting) or the meeting ends (in_meeting → post_meeting).',
    parameters: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          description: 'One of: pre_meeting, in_meeting, post_meeting, follow_up.',
        },
      },
      required: ['stage'],
    },
    expects_response: true,
  },
]
