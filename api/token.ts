/**
 * Mints a short-lived WebRTC conversation token so the browser never sees
 * ELEVENLABS_API_KEY.
 *
 * Runs as a Vercel serverless function. Locally, `vercel dev` serves this
 * alongside Vite; plain `vite dev` does not, so `/api/token` will 404 — use
 * VITE_CONNECTION_MODE=public for browser-only development.
 *
 * ⚠️ Requires an API key with the `convai_write` permission. A key scoped to
 * text-to-speech only returns 401 `missing_permissions` here.
 *
 * Tokens must be *used* within 15 minutes of minting; the resulting session may
 * then run longer than that.
 */

export const config = { runtime: 'edge' }

const ELEVENLABS_TOKEN_URL = 'https://api.elevenlabs.io/v1/convai/conversation/token'

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      // A token is per-session and short-lived — never let a proxy cache it.
      'cache-control': 'no-store',
    },
  })
}

export default async function handler(): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.ELEVENLABS_AGENT_ID

  if (!apiKey) {
    return json({ error: 'ELEVENLABS_API_KEY is not set on the server.' }, 500)
  }
  if (!agentId) {
    return json({ error: 'ELEVENLABS_AGENT_ID is not set on the server.' }, 500)
  }

  let upstream: Response
  try {
    upstream = await fetch(`${ELEVENLABS_TOKEN_URL}?agent_id=${encodeURIComponent(agentId)}`, {
      headers: { 'xi-api-key': apiKey },
    })
  } catch (error) {
    return json({ error: `Could not reach ElevenLabs: ${String(error)}` }, 502)
  }

  const text = await upstream.text()

  if (!upstream.ok) {
    // Surface ElevenLabs' own message — it distinguishes a missing permission
    // from a bad agent id, which is exactly what you need while setting this up.
    return json(
      { error: `ElevenLabs returned ${upstream.status}: ${text.slice(0, 400)}` },
      upstream.status === 401 ? 500 : 502,
    )
  }

  let parsed: { token?: string } = {}
  try {
    parsed = JSON.parse(text) as { token?: string }
  } catch {
    return json({ error: 'ElevenLabs returned a non-JSON response.' }, 502)
  }

  if (!parsed.token) {
    return json({ error: 'ElevenLabs response contained no token.' }, 502)
  }

  return json({ token: parsed.token }, 200)
}
