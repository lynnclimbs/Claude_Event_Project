# Schraube — Technical Plan

Voice-first sales assistant for a fictional screw manufacturer selling into German B2B Mittelstand.
A visible character is the primary UI; ElevenLabs carries the voice loop.

Design and context content are explicitly **not** in scope yet. This plan is about making the
technical surface ready so both can be dropped in without rework.

---

## 1. Platform decision

Use **ElevenLabs Agents** (the "ElevenAgents" product), not raw TTS.

The agent platform handles speech-to-text, the LLM turn, text-to-speech, turn-taking,
interruption, and voice activity detection as one managed realtime loop. Building that from
TTS + our own STT would consume the whole hackathon and produce worse latency.

The four things we need map directly onto features it already has:

| Our requirement | Platform feature |
| --- | --- |
| Company / persona / avatar-behavior context | Dynamic variables + (optionally) prompt overrides |
| Sales-stage-dependent behavior | Dynamic variable for the stage |
| Actions the assistant performs | Client tools |
| Visible character reacting to speech | SDK status/mode state (`isSpeaking`, `isListening`) |

**Package:** `@elevenlabs/react` (v1.0+). Note v1.0 was a ground-up re-architecture — most
tutorials and blog posts online predate it and will not compile.

---

## 2. Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (Vite + React)                     │
│                                             │
│  ConversationProvider                       │
│    ├── <Avatar/>        ← mode/isSpeaking   │
│    ├── <VoiceControls/> ← start/end/mute    │
│    ├── <Transcript/>    ← debug + fallback  │
│    └── <DebugPanel/>    ← stage selector    │
│                                             │
│  agent/                                     │
│    context/*.md   (source of truth)         │
│    buildPrompt.ts → dynamicVariables        │
│    tools/registry.ts → client tool handlers │
└──────────────┬──────────────────────────────┘
               │ WebRTC / WebSocket
               ▼
      ElevenLabs Agent  ── config lives in dashboard
               ▲
               │ token request (Phase 5)
┌──────────────┴──────────────────────────────┐
│  Tiny server — holds ELEVENLABS_API_KEY     │
└─────────────────────────────────────────────┘
```

### Proposed file layout

```
src/
  main.tsx                    # wraps app in ConversationProvider
  App.tsx
  agent/
    context/                  # the .md files, provided later
      company.md              # screw company, B2B Mittelstand
      persona.md              # who the user is
      avatar.md               # how the AI avatar behaves
      sales-process.md        # stages → required actions
    loadContext.ts            # Vite `?raw` imports → typed ContextBundle
    buildPrompt.ts            # ContextBundle + stage → dynamicVariables
    stages.ts                 # SalesStage union + per-stage action ids
    tools/
      registry.ts             # tool id → handler (must match dashboard names)
      actions.ts              # demo action implementations
  components/
    Avatar/                   # state-driven, design-agnostic
    VoiceControls.tsx
    Transcript.tsx
    DebugPanel.tsx
server/
  token.ts                    # Phase 5 — mints conversation token
```

---

## 3. The context pipeline — the core design decision

Four `.md` files arrive later. The question is how they reach the model.

The platform offers three injection paths, and they are **not** interchangeable:

| Path | Mechanism | Good for | Constraint |
| --- | --- | --- | --- |
| **Dynamic variables** | `{{var}}` placeholders filled at session start | Values that change per session | **Strings, numbers, booleans only.** Reserved `system__` prefix. This is the platform's *recommended* path. |
| **Prompt override** | Replace the whole system prompt at runtime | Repo as source of truth | **Disabled by default** — must be enabled per-field in the agent's Security tab. Security risk, see §6. |
| **Knowledge base** | RAG over uploaded documents | Large reference material | Slower to iterate; retrieval isn't guaranteed to fire |

### Recommendation

**Hybrid, weighted toward dynamic variables.**

1. Put the agent's *stable* skeleton in the dashboard system prompt — the role, the tone rules,
   the instruction to consult the injected blocks. This part rarely changes.
2. Reference the four context files as dynamic variables inside that prompt:
   `{{company_context}}`, `{{user_persona}}`, `{{avatar_behavior}}`, `{{stage_directive}}`.
3. Fill them at `startSession` from the `.md` files, which stay in the repo as the source of truth.

This keeps the repo authoritative (which matters when the context files are still churning),
avoids needing overrides enabled at all, and means a context edit is a git commit rather than a
dashboard click.

`stage_directive` is the interesting one: rather than shipping the entire sales-process document,
`buildPrompt.ts` selects only the current stage's section and its action list. The model gets
"you are pre-meeting, here is what to do" instead of the full playbook every turn — cheaper,
sharper, and far less prone to the model acting on the wrong stage.

### Escalation path

If the context documents turn out large enough that stuffing them into every session's prompt
hurts latency or cost, move `company_context` specifically to the **knowledge base** and keep the
smaller, more behavioral files as variables. Decide this once we see the real file sizes — not
before.

---

## 4. Actions (the sales-stage behaviors)

Actions become **client tools**. Two halves that must be kept in sync:

1. **Dashboard/API side** — each tool declared with name, description, `expects_response`, and a
   parameter schema.
2. **Code side** — a handler registered under the *exact same name*.

Names are **case-sensitive and must match**. A mismatch fails silently at the worst possible
moment, so `tools/registry.ts` should be the single list both sides are generated from or checked
against.

For the demo, actions should be **mocked into a visible activity feed** rather than writing to a
real CRM. "Assistant logged a follow-up task" rendering on screen demos identically to a real
integration and cannot break on stage.

Register via `useConversationClientTool(name, handler)` where a component owns the action — it ties
registration to component lifecycle and always uses the latest closure, avoiding stale-state bugs.

---

## 5. The character / avatar

The requirement is "a character is visible" with design deferred. The way to honour that is to
make the avatar a **pure function of conversation state**, with the visual representation swappable.

```
type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking'
```

Derive it from the SDK's `status`, `isListening`, `isSpeaking`, and `mode`. Build it first as
crude coloured shapes. When design lands, only the renderer changes — no state logic moves.

**Resolved:** lip-sync data *is* available in v1.0. `useConversationControls()` exposes
`getOutputVolume()`, `getOutputByteFrequencyData()`, and the input equivalents. `useAvatarState.ts`
drives mouth height from `getOutputVolume()` on an animation frame, with asymmetric smoothing
(open fast, close slow) so it reads as speech rather than as a flickering meter. The call is
guarded — it throws when no conversation is active — so amplitude collapses to silence rather than
crashing the render.

---

## 6. Technical gaps — what is actually missing

Ordered by how likely each is to hurt.

### 6.1 There is no server, and we will need one

Vite builds a static SPA. But a **private** agent requires a server endpoint to mint either a
signed URL (WebSocket) or a conversation token (WebRTC), because that call needs the
`ELEVENLABS_API_KEY` — which must never reach the browser. Signed URLs expire after **15 minutes**
(the session may run longer; it just has to *start* inside that window).

Options:
- **Public agent + domain allowlist** (up to 10 hostnames, exact match, no subdomain wildcards).
  No server at all. Fastest way to get talking today.
- **Add a minimal server** in-repo (Hono/Express) with one token endpoint.
- **Serverless function** if deploying to Vercel/Netlify.

**Recommendation:** start public to unblock development, add the token endpoint in Phase 5 before
anything is shown publicly. Do not ship a public agent past the hackathon — anyone with the agent
ID can talk to it on our credits.

### 6.2 Public agent + enabled overrides is a genuine hole

If we enable prompt overrides *and* the agent is public, anyone holding the agent ID can replace
our system prompt entirely. The §3 recommendation avoids this by not needing overrides — worth
sticking to for that reason alone.

### 6.3 Where does the sales stage come from?

Unspecified, and it changes the build. For a *demo*, an explicit stage selector in the debug panel
is better than inference: deterministic, and it lets us show off each stage on demand. Add a
`set_sales_stage` client tool later if we want the agent to advance itself.

### 6.4 Voice is slow to iterate against

Talking to the app for every test will destroy our velocity. The SDK has a `textOnly` mode plus
`sendUserMessage(text)`. **Build text mode first**, get the whole context and action pipeline
correct through typing, then switch on audio. This is the single biggest schedule saver here.

### 6.5 Mic permissions and HTTPS

`getUserMedia` needs a secure context. `localhost` is fine; testing on a phone over LAN needs
HTTPS. Also handle permission *denied* explicitly — a dead mic with no error message reads as
"the app is broken" during a demo.

### 6.6 Agent config drifts from the repo

Prompt, tools, and voice settings live in the dashboard; our context lives in git. These will
diverge. ElevenLabs offers CLI/API management of agent config — worth evaluating so the agent
definition can be version-controlled alongside the code. Low priority for the hackathon, high
priority the moment more than one person edits the agent.

### 6.7 Context files ship to the browser

Vite `?raw` imports bundle the `.md` content into client JS — readable by anyone who opens
devtools. Fine for fictional demo context. Not fine if any real customer data ever lands in those
files. If that changes, the context assembly has to move server-side.

### 6.8 German language

The company sells into German Mittelstand. Voice, language setting, and the context documents'
language need to be a deliberate choice, including whether the demo runs in German or English.
Voice quality and STT accuracy both depend on getting `language` set correctly rather than relying
on a default.

---

## 7. Build order

| Phase | Goal | Done when |
| --- | --- | --- |
| **0** | Agent exists; hello-world voice loop | You can talk to it in the browser and hear a reply |
| **1** | Text mode + transcript panel | Full loop testable by typing |
| **2** | Context pipeline with placeholder `.md` | Swapping a placeholder file visibly changes behavior |
| **3** | Avatar state machine, crude visuals | Character reacts to listening/speaking |
| **4** | Client tools + activity feed | Stage-appropriate actions fire and render |
| **5** | Token server, lock down agent | No API key in the bundle; agent no longer public |
| **6** | Design swap; real context files | Ship |

Phases 0–1 are the risk-retiring ones. Everything after is additive, which is what we want going
into a time-boxed build.

---

## 8. Decisions taken

| Question | Decision |
| --- | --- |
| Deployment | **Vercel** — `/api/token.ts` is an edge function |
| Language | **English** |
| Voice | **Eric — Smooth, Trustworthy** (`cjVigY5qzO86Huf0OWal`). Alternative: Lauren (`dGku3wKAuA20JBmsCsXv`), German-accented English, if we want more Mittelstand authenticity |
| Context injection | Dynamic variables, repo as source of truth (§3) |
| Connection mode | `public` for now, `private` via `/api/token` before any demo |

### Blocked

**The API key is scoped to text-to-speech only.** It has `voices` access but is missing
`convai_read` and `convai_write`:

```
GET /v1/convai/agents                     401  missing permission convai_read
GET /v1/convai/conversation/token          401  missing permission convai_write
GET /v1/convai/conversation/get-signed-url 401  missing permission convai_write
```

Consequences:
- The agent **cannot be created via API** — it must be created in the dashboard, or the key
  regenerated with ConvAI scopes.
- `/api/token` **cannot mint tokens**, so the private connection path is unavailable until the key
  is fixed. The code is written and will work unchanged once it is.

Everything else in Phases 0–4 is built and does not depend on this.

---

## Sources

- [React SDK](https://elevenlabs.io/docs/eleven-agents/libraries/react)
- [ElevenAgents React SDK v1.0](https://elevenlabs.io/blog/elevenagents-react-sdk-v1-0)
- [Dynamic variables](https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables)
- [Overrides](https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides)
- [Client tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools)
- [Agent authentication](https://elevenlabs.io/docs/eleven-agents/customization/authentication)
