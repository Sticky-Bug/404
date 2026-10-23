import { ipcMain } from 'electron'
import { z } from 'zod'
import { keyStore, type ProviderId } from '../security/key-store'
import { executeRewrite } from '../ai/router'
import { generateBasicOfflineRewrite } from '../ai/local-fallback'
import { testGemini } from '../ai/providers/gemini'
import { testGroq } from '../ai/providers/groq'
import { testOpenRouter } from '../ai/providers/openrouter'

const RewriteRequestSchema = z.object({
  draft: z.string().min(1).max(10000),
  personaId: z.enum([
    'executive',
    'supportive',
    'legal',
    'gen-z',
    'diplomatic',
    'friendly',
    'persuasive',
    'custom'
  ]),
  intensity: z.enum(['subtle', 'balanced', 'bold']),
  customInstruction: z.string().max(300).optional()
})

const SetApiKeySchema = z.object({
  provider: z.enum(['gemini', 'groq', 'openrouter']),
  key: z.string().min(1).max(500)
})

const ProviderOnlySchema = z.object({
  provider: z.enum(['gemini', 'groq', 'openrouter'])
})

export function registerIpcHandlers(): void {
  // Provider status
  ipcMain.handle('vibewrite:getProviderStatus', async () => {
    return keyStore.getStatusList()
  })

  // Set API key
  ipcMain.handle('vibewrite:setApiKey', async (_, input) => {
    const parsed = SetApiKeySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, message: 'Invalid provider or key format.' }
    }
    return keyStore.setKey(parsed.data.provider as ProviderId, parsed.data.key)
  })

  // Clear API key
  ipcMain.handle('vibewrite:clearApiKey', async (_, input) => {
    const parsed = ProviderOnlySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, message: 'Invalid provider.' }
    }
    return keyStore.clearKey(parsed.data.provider as ProviderId)
  })

  // Test provider
  ipcMain.handle('vibewrite:testProvider', async (_, input) => {
    const parsed = ProviderOnlySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, message: 'Invalid provider.' }
    }
    const provider = parsed.data.provider as ProviderId
    const key = keyStore.getKey(provider)
    if (!key) {
      return { success: false, message: `No key found for ${provider}.` }
    }

    if (provider === 'gemini') {
      return testGemini(key)
    } else if (provider === 'groq') {
      return testGroq(key)
    } else {
      return testOpenRouter(key)
    }
  })

  // Cloud AI rewrite
  ipcMain.handle('vibewrite:generateRewrite', async (_, input) => {
    const parsed = RewriteRequestSchema.safeParse(input)
    if (!parsed.success) {
      return {
        ok: false,
        error: 'Invalid request payload (check draft length or persona selection).',
        providersAttempted: []
      }
    }

    const { draft, personaId, intensity, customInstruction } = parsed.data
    return executeRewrite(draft, personaId, intensity, customInstruction)
  })

  // Offline basic rewrite
  ipcMain.handle('vibewrite:generateOfflineRewrite', async (_, input) => {
    const parsed = RewriteRequestSchema.safeParse(input)
    if (!parsed.success) {
      return {
        ok: false,
        error: 'Invalid request payload for offline rewrite.',
        providersAttempted: []
      }
    }

    const { draft, personaId, intensity, customInstruction } = parsed.data
    const res = generateBasicOfflineRewrite(draft, personaId, intensity, customInstruction)
    return {
      ok: true,
      text: res.text,
      provider: res.provider,
      model: res.model,
      fallbackUsed: res.fallbackUsed
    }
  })
}
