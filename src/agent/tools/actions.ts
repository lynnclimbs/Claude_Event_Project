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
