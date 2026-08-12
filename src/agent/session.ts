import type { HookOptions } from '@elevenlabs/react'

/**
 * Connection setup.
 *
 * ElevenLabs' SessionConfig is a discriminated union — you supply exactly one of
 * `agentId` (public agent), `signedUrl` (private, WebSocket) or
 * `conversationToken` (private, WebRTC). The other two are typed `never`.
 *
 * Two modes:
 *
 * - **public** — connect with a bare `agentId` straight from the browser. No
 *   server needed. Anyone with the agent id can talk on our credits, so this is
 *   for development only, guarded by a domain allowlist on the agent.
 *
 * - **private** — fetch a short-lived conversation token from `/api/token`,
 *   which holds ELEVENLABS_API_KEY server-side. Required before any public
 *   demo. Tokens must be *used* within 15 minutes of minting; the session
 *   itself may then run longer.
 */

export type ConnectionMode = 'public' | 'private'

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined

/**
 * `private` unless explicitly told otherwise, so the insecure path is opt-in
 * rather than the thing you forget to change before demoing.
 */
export const CONNECTION_MODE: ConnectionMode =
  (import.meta.env.VITE_CONNECTION_MODE as ConnectionMode | undefined) ?? 'private'

export class SessionConfigError extends Error {}

export function getAgentId(): string {
  if (!AGENT_ID) {
    throw new SessionConfigError(
      'VITE_ELEVENLABS_AGENT_ID is not set. Create an agent in the ElevenLabs ' +
        'dashboard and put its id in .env.',
    )
  }
  return AGENT_ID
}

type TokenResponse = { token?: string; error?: string }

async function fetchConversationToken(): Promise<string> {
  let response: Response
  try {
    response = await fetch('/api/token')
  } catch {
    throw new SessionConfigError(
      'Could not reach /api/token. Run `vercel dev` (not `vite dev`) to serve ' +
        'the serverless function, or set VITE_CONNECTION_MODE=public for a ' +
        'browser-only dev session.',
    )
  }

  let body: TokenResponse = {}
  try {
    body = (await response.json()) as TokenResponse
  } catch {
    // Fall through to the status-based error below.
  }

  if (!response.ok || !body.token) {
    throw new SessionConfigError(
      body.error ?? `/api/token returned ${response.status} with no token.`,
    )
  }
  return body.token
}

/**
 * Builds the connection half of the session options. Context (dynamic
 * variables) is layered on by the caller.
 */
export async function buildConnectionOptions(): Promise<HookOptions> {
  if (CONNECTION_MODE === 'public') {
    return { agentId: getAgentId(), connectionType: 'webrtc' }
  }
  return { conversationToken: await fetchConversationToken(), connectionType: 'webrtc' }
}
