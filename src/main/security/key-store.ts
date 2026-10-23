import { app, safeStorage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'

export type ProviderId = 'gemini' | 'groq' | 'openrouter'

export interface ProviderStatus {
  provider: ProviderId
  configured: boolean
  lastStatus: 'ok' | 'error' | 'rate-limited' | 'not-tested'
  message?: string
}

class KeyStore {
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

  public init(): void {
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

  public setKey(provider: ProviderId, key: string): { success: boolean; message: string } {
    const trimmed = key.trim().replace(/^["']|["']$/g, '').trim()
    if (!trimmed) {
      return { success: false, message: 'Key cannot be empty.' }
    }

    this.memoryKeys.set(provider, trimmed)
    this.statuses.set(provider, { lastStatus: 'not-tested', message: 'Key saved.' })

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
    return this.memoryKeys.get(provider)
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

    return { success: true, message: `${provider} key cleared.` }
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
      const configured = Boolean(this.memoryKeys.get(provider))
      const statusInfo = this.statuses.get(provider) || { lastStatus: 'not-tested' }
      return {
        provider,
        configured,
        lastStatus: statusInfo.lastStatus,
        message: statusInfo.message
      }
    })
  }
}

export const keyStore = new KeyStore()
