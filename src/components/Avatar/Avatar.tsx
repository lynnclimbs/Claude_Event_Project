import { useAvatarState, useOutputAmplitude, type AvatarState } from './useAvatarState'

/**
 * The character.
 *
 * Deliberately crude — an inline SVG head whose eyes and mouth respond to
 * conversation state and speech amplitude. The point is that the *state
 * contract* is right, not that it looks good. When design lands, replace the
 * SVG body of this component (or swap in Rive/Lottie/3D) and keep
 * `useAvatarState` untouched.
 */

const PALETTE: Record<AvatarState, { ring: string; face: string; label: string }> = {
  offline: { ring: '#475569', face: '#64748b', label: 'Offline' },
  connecting: { ring: '#eab308', face: '#94a3b8', label: 'Connecting…' },
  idle: { ring: '#38bdf8', face: '#cbd5e1', label: 'Ready' },
  listening: { ring: '#22c55e', face: '#e2e8f0', label: 'Listening' },
  speaking: { ring: '#a855f7', face: '#f1f5f9', label: 'Speaking' },
  error: { ring: '#ef4444', face: '#94a3b8', label: 'Error' },
}

export function Avatar() {
  const state = useAvatarState()
  const amplitude = useOutputAmplitude(state === 'speaking')
  const colors = PALETTE[state]

  // Mouth opens with amplitude while speaking; a thin line otherwise.
  const mouthHeight = state === 'speaking' ? 3 + amplitude * 26 : 3
  // Eyes narrow slightly while listening — reads as attention.
  const eyeHeight = state === 'listening' ? 5 : 9
  const breathing = state === 'idle' || state === 'listening'

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 200 200"
        className={`h-56 w-56 ${breathing ? 'animate-pulse-slow' : ''}`}
        role="img"
        aria-label={`Assistant is ${colors.label}`}
      >
        {/* Amplitude halo — only meaningful while speaking */}
        <circle
          cx="100"
          cy="100"
          r={82 + amplitude * 14}
          fill="none"
          stroke={colors.ring}
          strokeWidth="2"
          opacity={state === 'speaking' ? 0.35 : 0}
        />
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={colors.ring}
          strokeWidth="3"
          opacity="0.9"
        />
        <circle cx="100" cy="100" r="70" fill={colors.face} opacity="0.12" />

        {/* Eyes */}
        <rect x="68" y={92 - eyeHeight / 2} width="12" height={eyeHeight} rx="5" fill={colors.face} />
        <rect x="120" y={92 - eyeHeight / 2} width="12" height={eyeHeight} rx="5" fill={colors.face} />

        {/* Mouth */}
        <rect
          x="80"
          y={128 - mouthHeight / 2}
          width="40"
          height={mouthHeight}
          rx={mouthHeight / 2}
          fill={colors.face}
        />
      </svg>

      <div className="flex items-center gap-2 text-sm">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: colors.ring }}
          aria-hidden="true"
        />
        <span className="text-slate-400">{colors.label}</span>
      </div>
    </div>
  )
}
