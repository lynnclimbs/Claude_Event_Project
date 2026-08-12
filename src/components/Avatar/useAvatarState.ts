import { useEffect, useRef, useState } from 'react'
import { useConversationControls, useConversationMode, useConversationStatus } from '@elevenlabs/react'

/**
 * Derives the avatar's visual state from the conversation.
 *
 * Kept separate from rendering so the character's look can be replaced wholesale
 * when design lands, without touching state logic.
 */

export type AvatarState = 'offline' | 'connecting' | 'idle' | 'listening' | 'speaking' | 'error'

export function useAvatarState(): AvatarState {
  const { status } = useConversationStatus()
  const { isSpeaking, isListening } = useConversationMode()

  if (status === 'error') return 'error'
  if (status === 'disconnected') return 'offline'
  if (status === 'connecting') return 'connecting'
  if (isSpeaking) return 'speaking'
  if (isListening) return 'listening'
  return 'idle'
}

/**
 * Output amplitude, 0..1, sampled on every animation frame while the agent
 * speaks. Drives mouth movement.
 *
 * `getOutputVolume()` throws when no conversation is active, so calls are
 * guarded and failures collapse to silence rather than crashing the render.
 */
export function useOutputAmplitude(active: boolean): number {
  const { getOutputVolume } = useConversationControls()
  const [amplitude, setAmplitude] = useState(0)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!active) {
      setAmplitude(0)
      return
    }

    let smoothed = 0
    const tick = () => {
      let raw = 0
      try {
        raw = getOutputVolume()
      } catch {
        raw = 0
      }
      if (!Number.isFinite(raw)) raw = 0
      // Asymmetric smoothing: open fast, close slower. Reads as speech rather
      // than as a flickering meter.
      const target = Math.min(1, Math.max(0, raw))
      smoothed = target > smoothed ? target : smoothed * 0.8 + target * 0.2
      setAmplitude(smoothed)
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
    }
  }, [active, getOutputVolume])

  return amplitude
}
