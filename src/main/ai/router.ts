import { keyStore, type ProviderId } from '../security/key-store'
import type { PersonaId, ToneIntensity } from './personas'
import { callGemini } from './providers/gemini'
import { callGroq } from './providers/groq'
import { callOpenRouter } from './providers/openrouter'

export type ProviderName = ProviderId | 'local'

export type RewriteResult =
  | { ok: true; text: string; provider: ProviderName; model: string; fallbackUsed: boolean }
  | { ok: false; error: string; providersAttempted: ProviderId[] }

export async function executeRewrite(
  draft: string,
  personaId: PersonaId,
  intensity: ToneIntensity,
  customInstruction?: string
): Promise<RewriteResult> {
  const providerOrder: ProviderId[] = ['gemini', 'groq', 'openrouter']
  const attempted: ProviderId[] = []
  const errorMessages: string[] = []

  let isFirstProvider = true

  for (const provider of providerOrder) {
    const key = keyStore.getKey(provider)
    if (!key) {
      continue
    }

    attempted.push(provider)

    try {
      let res: { text: string; model: string }

      if (provider === 'gemini') {
        res = await callGemini(key, draft, personaId, intensity, customInstruction)
      } else if (provider === 'groq') {
        res = await callGroq(key, draft, personaId, intensity, customInstruction)
      } else {
        res = await callOpenRouter(key, draft, personaId, intensity, customInstruction)
      }

      keyStore.updateStatus(provider, 'ok', 'Last call succeeded')

      return {
        ok: true,
        text: res.text,
        provider,
        model: res.model,
        fallbackUsed: !isFirstProvider
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown provider error'
      errorMessages.push(`${provider}: ${errMsg}`)

      const isRateLimit = errMsg.includes('429') || errMsg.toLowerCase().includes('rate')
      keyStore.updateStatus(provider, isRateLimit ? 'rate-limited' : 'error', errMsg.slice(0, 100))

      isFirstProvider = false
    }
  }

  if (attempted.length === 0) {
    return {
      ok: false,
      error: 'No AI providers are configured. Please enter a Gemini or Groq key in Settings.',
      providersAttempted: []
    }
  }

  return {
    ok: false,
    error: errorMessages.join(' | '),
    providersAttempted: attempted
  }
}
