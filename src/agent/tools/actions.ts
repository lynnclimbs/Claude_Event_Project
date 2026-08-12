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
 * Strip German umlauts and lowercase so ASR transcription variants
 * ("Müller", "Muller", "Mueller") all match the same key.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ä/g, 'a')
    .replace(/ß/g, 'ss')
}

/**
 * Build account strings with all intervals computed relative to today.
 * Call at lookup time so the numbers stay accurate across demo days — no
 * more "47 days" becoming "31 days" because someone ran the demo a fortnight
 * late.
 *
 * Keys are pipe-separated ASR aliases (all pre-normalized, no umlauts).
 * Add every plausible STT variant the MC might say before a live demo.
 */
function buildAccounts(): Record<string, string> {
  const now = new Date()

  function daysUntil(n: number): string {
    const d = new Date(now)
    d.setDate(d.getDate() + n)
    return `${n} days (${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })})`
  }

  function weeksAgo(n: number): string {
    return `${n} week${n !== 1 ? 's' : ''} ago`
  }

  function daysAgo(n: number): string {
    return `${n} day${n !== 1 ? 's' : ''} ago`
  }

  function pastDate(daysBack: number): string {
    const d = new Date(now)
    d.setDate(d.getDate() - daysBack)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  }

  return {
    'muller|mueller|miller|mullar':
      `Müller Maschinenbau. Last contact ${weeksAgo(3)} (M12 tolerances, unresolved). ` +
      `Contract expires in ${daysUntil(47)}. 4 service tickets in the last fortnight — delivery delays. ` +
      `New head of procurement since March: Katrin Weiss. Open quote from ${pastDate(61)}, not yet opened.`,

    'bauer|bower|bawer':
      `Bauer AG. Last contact ${weeksAgo(8)}. Maintenance contract EUR 85,000/year expires in ` +
      `${daysUntil(28)} — no renewal conversation started. 2 open service tickets, both in progress. ` +
      `Recent order: 2 spare-parts batches totalling EUR 12,000.`,

    'hoffmann|hoffman|hofmann|huffman':
      `Hoffmann GmbH. Last contact ${daysAgo(5)} (routine check-in). Contract healthy, renews in 9 months. ` +
      `No open tickets. LinkedIn signal: purchasing contact connected with a competitor rep last week — ` +
      `worth monitoring.`,

    'schneider|schnieder|snider|snyder':
      `Schneider Industrie. Last contact ${weeksAgo(6)}. No active contract — prospect stage. ` +
      `Just announced a new production line in Bavaria; expansion aligns with DIN 931/933 range. ` +
      `No open quote. Good moment to initiate contact.`,

    'kellner|kelner|kellener':
      `Kellner GmbH. Last contact ${daysAgo(35)}. Open quote sent ${pastDate(30)}, not opened. ` +
      `No contract in place — deal has been at proposal stage since May. ` +
      `No recent service tickets. Risk: going cold.`,
  }
}

export function lookupAccount(name: string): string {
  const needle = normalize(name)
  for (const [key, value] of Object.entries(buildAccounts())) {
    if (key.split('|').some((variant) => needle.includes(variant))) return value
  }
  return `No account matched "${name}". Check the spelling or search by company name in the CRM.`
}
