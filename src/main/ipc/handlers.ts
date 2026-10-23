import { ipcMain, shell, systemPreferences } from 'electron'
import { z } from 'zod'
import { keyStore, type ProviderId } from '../security/key-store'
import { executeRewrite } from '../ai/router'
import { generateBasicOfflineRewrite } from '../ai/local-fallback'
import { testGemini } from '../ai/providers/gemini'
import { testGroq } from '../ai/providers/groq'
import { testOpenRouter } from '../ai/providers/openrouter'
import { gmailService } from '../gmail/service'

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
  customInstruction: z.string().max(300).optional(),
  language: z.string().max(50).optional()
})

const SetApiKeySchema = z.object({
  provider: z.enum(['gemini', 'groq', 'openrouter']),
  key: z.string().min(1).max(500)
})

const ProviderOnlySchema = z.object({
  provider: z.enum(['gemini', 'groq', 'openrouter'])
})

const SendEmailSchema = z.object({
  to: z
    .array(z.string().email('Please enter a valid "To" email address'))
    .min(1, 'At least one recipient is required'),
  cc: z.array(z.string().email('Please enter a valid "Cc" email address')).optional(),
  bcc: z.array(z.string().email('Please enter a valid "Bcc" email address')).optional(),
  subject: z.string().min(1, 'Subject line cannot be empty').max(500),
  body: z.string().min(1, 'Email body cannot be empty').max(50000)
})

const GmailConnectSchema = z
  .object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional()
  })
  .optional()

export function registerIpcHandlers(): void {
  // Get API Mode (automatic or custom)
  ipcMain.handle('vibewrite:getApiMode', async () => {
    return keyStore.getApiMode()
  })

  // Set API Mode (automatic or custom)
  ipcMain.handle('vibewrite:setApiMode', async (_, mode) => {
    if (mode === 'automatic' || mode === 'custom') {
      return keyStore.setApiMode(mode)
    }
    return { success: false, mode: keyStore.getApiMode() }
  })

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

    const { draft, personaId, intensity, customInstruction, language } = parsed.data
    return executeRewrite(draft, personaId, intensity, customInstruction, language)
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

    try {
      const { draft, personaId, intensity, customInstruction, language } = parsed.data
      const res = generateBasicOfflineRewrite(
        draft,
        personaId,
        intensity,
        customInstruction,
        language
      )
      return {
        ok: true,
        text: res.text,
        provider: res.provider,
        model: res.model,
        fallbackUsed: res.fallbackUsed
      }
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Offline rewrite failed',
        providersAttempted: []
      }
    }
  })

  // Gmail integration handlers
  ipcMain.handle('vibewrite:gmailGetStatus', async () => {
    return gmailService.getStatus()
  })

  ipcMain.handle('vibewrite:gmailConnect', async (_, input) => {
    const parsed = GmailConnectSchema.safeParse(input)
    return gmailService.connect(parsed.success ? parsed.data : undefined)
  })

  ipcMain.handle('vibewrite:gmailDisconnect', async () => {
    await gmailService.disconnect()
    return { success: true }
  })

  ipcMain.handle('vibewrite:gmailSendEmail', async (_, input) => {
    const parsed = SendEmailSchema.safeParse(input)
    if (!parsed.success) {
      const issueMsg = parsed.error.issues[0]?.message || 'Invalid email data'
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        userMessage: `Validation failed: ${issueMsg}`
      }
    }
    return gmailService.sendEmail(parsed.data)
  })

  ipcMain.handle('vibewrite:gmailSaveDraft', async (_, input) => {
    const parsed = SendEmailSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Invalid draft data' }
    }
    return gmailService.saveDraft(parsed.data)
  })

  ipcMain.handle('vibewrite:openMicrophoneSettings', async () => {
    if (process.platform === 'win32') {
      await shell.openExternal('ms-settings:privacy-microphone')
    } else if (process.platform === 'darwin') {
      await shell.openExternal(
        'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'
      )
    }
    return { success: true }
  })

  ipcMain.handle('vibewrite:getMicrophoneStatus', async () => {
    if (process.platform === 'darwin' || process.platform === 'win32') {
      try {
        return systemPreferences.getMediaAccessStatus('microphone')
      } catch {
        return 'unknown'
      }
    }
    return 'granted'
  })
}
