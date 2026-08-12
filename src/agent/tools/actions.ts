import type { ActionName } from '../stages'

/**
 * Demo implementations of the assistant's actions.
 *
 * These are deliberately mocked into a visible activity feed rather than wired
 * to a real CRM: on stage it demos identically, and it cannot fail because of
 * someone else's API. Swap the bodies for real calls when there is a backend.
 *
 * Every function here must be registered under a tool name that matches the
 * ElevenLabs agent config exactly — see `ACTIONS` in ../stages.ts.
 */

export type ActivityEntry = {
  id: string
  action: ActionName
  summary: string
  detail: Record<string, unknown>
  at: Date
}

let counter = 0
function nextId(): string {
  counter += 1
  return `act_${counter}`
}

export function makeActivityEntry(
  action: ActionName,
  summary: string,
  detail: Record<string, unknown>,
): ActivityEntry {
  return { id: nextId(), action, summary, detail, at: new Date() }
}

/** Narrow an unknown tool parameter to a trimmed string. */
export function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

/**
 * Fake product catalogue so `lookup_product` returns something plausible
 * without a backend. Keys are matched loosely on substring.
 */
const PRODUCT_CATALOGUE: Record<string, string> = {
  m8: 'M8 hex bolt, DIN 933, A2 stainless. In stock, 14,200 units. Lead time 3 days.',
  m10: 'M10 hex bolt, DIN 931, 8.8 zinc-plated. In stock, 6,800 units. Lead time 3 days.',
  m12: 'M12 hex bolt, DIN 931, 10.9 plain. Low stock, 900 units. Lead time 12 days.',
  threaded: 'Threaded rod, DIN 975, 1m lengths, A2 stainless. In stock, 2,400 units.',
  stainless:
    'A2 and A4 stainless available across the DIN 931/933 range. A4 carries a 10 day lead time.',
  custom:
    'Custom-machined fasteners to drawing. Minimum batch 250 units, typical lead time 4 weeks, requires engineering review.',
}

export function lookupProduct(query: string): string {
  const needle = query.toLowerCase()
  for (const [key, value] of Object.entries(PRODUCT_CATALOGUE)) {
    if (needle.includes(key)) return value
  }
  return `No catalogue entry matched "${query}". Ask engineering, or narrow to a DIN number or thread size.`
}

/**
 * Fake account book so `lookup_account` returns something plausible without a
 * CRM backend. Keys are matched loosely on customer name substring.
 */
const ACCOUNTS: Record<string, string> = {
  'müller|muller':
    'Müller Maschinenbau. Last contact 3 weeks ago (M12 tolerances, unresolved). ' +
    'Contract expires in 47 days. 4 service tickets in the last fortnight — delivery delays. ' +
    'New head of procurement since March: Katrin Weiss. Open quote from 12 June, not yet opened.',
  bauer:
    'Bauer AG. Last contact 8 weeks ago. Maintenance contract EUR 85,000/year expires in 28 days — ' +
    'no renewal conversation started. 2 open service tickets, both in progress. ' +
    'Recent order: 2 spare-parts batches totalling EUR 12,000.',
  hoffmann:
    'Hoffmann GmbH. Last contact 5 days ago (routine check-in). Contract healthy, renews in 9 months. ' +
    'No open tickets. LinkedIn signal: purchasing contact connected with a competitor rep last week — ' +
    'worth monitoring.',
  schneider:
    'Schneider Industrie. Last contact 6 weeks ago. No active contract — prospect stage. ' +
    'Just announced a new production line in Bavaria; expansion aligns with DIN 931/933 range. ' +
    'No open quote. Good moment to initiate contact.',
  kellner:
    'Kellner GmbH. Last contact 35 days ago. Open quote sent 12 July, not opened. ' +
    'No contract in place — deal has been at proposal stage since May. ' +
    'No recent service tickets. Risk: going cold.',
}

export function lookupAccount(name: string): string {
  const needle = name.toLowerCase()
  for (const [key, value] of Object.entries(ACCOUNTS)) {
    if (key.split('|').some((variant) => needle.includes(variant))) return value
  }
  return `No account matched "${name}". Check the spelling or search by company name in the CRM.`
}
