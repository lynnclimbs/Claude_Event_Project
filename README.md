# Schraube

Voice-first sales assistant for a fictional German fastener manufacturer selling into B2B
Mittelstand. A visible character is the primary UI; [ElevenLabs Agents](https://elevenlabs.io/docs/eleven-agents/overview)
carries the voice loop.

Vite + React + TypeScript + Tailwind v4. Full architecture and rationale: **[docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md)**.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in the agent id
npm run dev
```

The app renders and the stage selector works without any credentials. You need an agent id before
`Start session` will connect.

## Setup checklist

Two things are needed before the voice loop runs:

1. **An ElevenLabs agent.** Create one in the dashboard. Set its system prompt to the block shown
   under *Show assembled context* in the app's debug panel — it references the four dynamic
   variables this repo supplies. Set voice to **Eric** (`cjVigY5qzO86Huf0OWal`) and language to
   English. Put the agent id in `.env` as `VITE_ELEVENLABS_AGENT_ID`.

2. **The six client tools**, declared on the agent with names matching `ACTIONS` in
   `src/agent/stages.ts` exactly — `log_note`, `create_followup_task`, `schedule_meeting`,
   `lookup_product`, `prepare_quote`, `set_sales_stage`. Names are **case-sensitive**; a mismatch
   fails silently (the agent simply never calls the tool).

> ⚠️ The current API key is scoped to text-to-speech only — it lacks `convai_read`/`convai_write`,
> so it cannot create agents or mint conversation tokens. Regenerate it with ConvAI scopes to use
> `VITE_CONNECTION_MODE=private`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server. `/api/token` is **not** served — use `VITE_CONNECTION_MODE=public` |
| `vercel dev` | Serves the app *and* `/api/token`, for the private connection path |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint |

## How context reaches the agent

The four markdown files in `src/agent/context/` are the source of truth and live in git. They are
injected as **dynamic variables** at session start, not baked into the dashboard prompt — so
changing the assistant's knowledge is a commit, not a dashboard click.

```
context/company.md       → {{company_context}}
context/persona.md       → {{user_persona}}
context/avatar.md        → {{avatar_behavior}}
context/sales-process.md → {{stage_directive}}   (current stage's section only)
```

`sales-process.md` has one `## <stage_id>` heading per stage, and the ids must match
`SALES_STAGES` in `src/agent/stages.ts`. `buildPrompt.ts` slices out only the active stage, so the
model gets one stage's directive instead of the whole playbook. The debug panel warns if a stage
has no matching section.

**Dynamic variables are fixed for the life of a session** — switching stage mid-conversation
requires reconnecting for the new directive to reach the model.

## Layout

```
src/
  agent/
    context/*.md          # source of truth, provided by the team
    buildPrompt.ts        # md + stage → dynamic variables
    stages.ts             # stages, action names (contract with the dashboard)
    session.ts            # public agentId vs private token connection
    tools/                # client tool handlers → activity feed
  components/
    Avatar/               # character; state logic split from rendering
    VoiceControls.tsx     # start/end/mute, text input
    Transcript.tsx
    ActivityFeed.tsx      # visible proof actions fired
    DebugPanel.tsx        # stage selector, context inspector
  state/AppState.tsx      # sits above ConversationProvider
api/token.ts              # mints WebRTC token; keeps the API key server-side
```

## Notes for whoever picks this up

- **Text mode is on by default.** Iterating the context pipeline by typing is much faster than
  talking, and it needs no microphone permission. Untick it for the real voice loop.
- **Actions are mocked** into the activity feed rather than hitting a CRM. On stage it demos
  identically and cannot break on someone else's API.
- **Design is deliberately crude.** `Avatar.tsx` is a swappable SVG; `useAvatarState.ts` holds the
  state contract. Replace the former, keep the latter.
- **Never prefix the API key with `VITE_`** — that bundles it into the browser. It stays in
  `ELEVENLABS_API_KEY`, read only by `api/token.ts`.

## Team

```bash
git clone https://github.com/Handschug/Claude_Event_Project.git
cd Claude_Event_Project
npm install && npm run dev
```
