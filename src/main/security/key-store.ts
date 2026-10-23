import { app, safeStorage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'

export type ProviderId = 'gemini' | 'groq' | 'openrouter'
export type ApiMode = 'automatic' | 'custom'

export interface ProviderStatus {
  provider: ProviderId
  configured: boolean
  isCustom: boolean
  mode: ApiMode
  lastStatus: 'ok' | 'error' | 'rate-limited' | 'not-tested'
  message?: string
}

function loadDefaultKeys(): Record<ProviderId, string> {
  const candidates = [
    join(__dirname, 'default-keys.json'),
    join(process.cwd(), 'src', 'main', 'security', 'default-keys.json'),
    join(app.getPath('userData'), 'default-keys.json')
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, 'utf-8')
        return JSON.parse(raw) as Record<ProviderId, string>
      } catch {
        // continue
      }
    }
  }
  return {
    gemini: process.env.GEMINI_API_KEY || '',
    groq: process.env.GROQ_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || ''
  }
}

class KeyStore {
  private apiMode: ApiMode = 'automatic'
  private defaultKeys: Record<ProviderId, string> = { gemini: '', groq: '', openrouter: '' }
  private memoryKeys: Map<ProviderId, string> = new Map()
  private statuses: Map<
    ProviderId,
    { lastStatus: ProviderStatus['lastStatus']; message?: string }
  > = new Map([
    ['gemini', { lastStatus: 'not-tested' }],
    ['groq', { lastStatus: 'not-tested' }],
    ['openrouter', { lastStatus: 'not-tested' }]
  ])

  private getFilePath(): string {
    return join(app.getPath('userData'), 'vibewrite-keys.enc')
  }

  private getModeFilePath(): string {
    return join(app.getPath('userData'), 'vibewrite-mode.json')
  }

  public init(): void {
    this.defaultKeys = loadDefaultKeys()

    // Load mode
    const modePath = this.getModeFilePath()
    if (existsSync(modePath)) {
      try {
        const raw = readFileSync(modePath, 'utf-8')
        const parsed = JSON.parse(raw) as { mode?: ApiMode }
        if (parsed.mode === 'automatic' || parsed.mode === 'custom') {
          this.apiMode = parsed.mode
        }
      } catch (err) {
        console.error('Failed to read api mode file:', err)
      }
    }

    const filePath = this.getFilePath()
    if (existsSync(filePath) && safeStorage.isEncryptionAvailable()) {
      try {
        const encryptedData = readFileSync(filePath)
        const decryptedJson = safeStorage.decryptString(encryptedData)
        const parsed = JSON.parse(decryptedJson) as Record<string, string>
        for (const [provider, key] of Object.entries(parsed)) {
          if (key && (provider === 'gemini' || provider === 'groq' || provider === 'openrouter')) {
            this.memoryKeys.set(provider as ProviderId, key)
          }
        }
      } catch (err) {
        console.error('Failed to load encrypted keys from disk:', err)
      }
    }
  }

  public getApiMode(): ApiMode {
    return this.apiMode
  }

  public setApiMode(mode: ApiMode): { success: boolean; mode: ApiMode } {
    this.apiMode = mode
    try {
      writeFileSync(this.getModeFilePath(), JSON.stringify({ mode }), 'utf-8')
    } catch (err) {
      console.error('Failed to save api mode:', err)
    }
    return { success: true, mode: this.apiMode }
  }

  public setKey(provider: ProviderId, key: string): { success: boolean; message: string } {
    const trimmed = key
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim()
    if (!trimmed) {
      return { success: false, message: 'Key cannot be empty.' }
    }

    this.memoryKeys.set(provider, trimmed)
    this.statuses.set(provider, { lastStatus: 'not-tested', message: 'Custom key saved.' })

    if (safeStorage.isEncryptionAvailable()) {
      try {
        const allKeys: Record<string, string> = {}
        for (const [p, k] of this.memoryKeys.entries()) {
          allKeys[p] = k
        }
        const encrypted = safeStorage.encryptString(JSON.stringify(allKeys))
        writeFileSync(this.getFilePath(), encrypted)
        return { success: true, message: `${provider} key securely saved in safeStorage.` }
      } catch {
        return {
          success: true,
          message: `${provider} key saved in memory for this session (disk encryption failed).`
        }
      }
    }

    return {
      success: true,
      message: `${provider} key saved in session memory (OS safeStorage unavailable).`
    }
  }

  public getKey(provider: ProviderId): string | undefined {
    if (this.apiMode === 'custom') {
      const customKey = this.memoryKeys.get(provider)
      if (customKey) return customKey
      return undefined
    }

    // Automatic mode: use built-in keys
    return this.defaultKeys[provider] || loadDefaultKeys()[provider]
  }

  public clearKey(provider: ProviderId): { success: boolean; message: string } {
    this.memoryKeys.delete(provider)
    this.statuses.set(provider, { lastStatus: 'not-tested', message: undefined })

    if (safeStorage.isEncryptionAvailable()) {
      try {
        const allKeys: Record<string, string> = {}
        for (const [p, k] of this.memoryKeys.entries()) {
          allKeys[p] = k
        }
        if (Object.keys(allKeys).length === 0) {
          const filePath = this.getFilePath()
          if (existsSync(filePath)) {
            unlinkSync(filePath)
          }
        } else {
          const encrypted = safeStorage.encryptString(JSON.stringify(allKeys))
          writeFileSync(this.getFilePath(), encrypted)
        }
      } catch (err) {
        console.error('Failed to persist cleared key:', err)
      }
    }

    return { success: true, message: `${provider} custom key removed.` }
  }

  public updateStatus(
    provider: ProviderId,
    lastStatus: ProviderStatus['lastStatus'],
    message?: string
  ): void {
    this.statuses.set(provider, { lastStatus, message })
  }

  public getStatusList(): ProviderStatus[] {
    const providers: ProviderId[] = ['gemini', 'groq', 'openrouter']
    return providers.map((provider) => {
      const hasCustom = Boolean(this.memoryKeys.get(provider))
      const isCustomMode = this.apiMode === 'custom'
      const configured = isCustomMode
        ? hasCustom
        : Boolean(this.defaultKeys[provider] || loadDefaultKeys()[provider])
      const statusInfo = this.statuses.get(provider) || { lastStatus: 'not-tested' }

      return {
        provider,
        configured,
        isCustom: hasCustom,
        mode: this.apiMode,
        lastStatus: statusInfo.lastStatus,
        message: statusInfo.message
      }
    })
  }
}

export const keyStore = new KeyStore()
