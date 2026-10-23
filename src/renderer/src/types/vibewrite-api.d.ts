export type ProviderId = 'gemini' | 'groq' | 'openrouter'
export type PersonaId =
  | 'executive'
  | 'supportive'
  | 'legal'
  | 'gen-z'
  | 'diplomatic'
  | 'friendly'
  | 'persuasive'
  | 'custom'
export type ToneIntensity = 'subtle' | 'balanced' | 'bold'
export type ProviderName = ProviderId | 'local'

export type RewriteRequest = {
  draft: string
  personaId: PersonaId
  intensity: ToneIntensity
  customInstruction?: string
}

export type RewriteResponse =
  | { ok: true; text: string; provider: ProviderName; model: string; fallbackUsed: boolean }
  | { ok: false; error: string; providersAttempted: ProviderId[] }

export type ProviderStatus = {
  provider: ProviderId
  configured: boolean
  lastStatus: 'ok' | 'error' | 'rate-limited' | 'not-tested'
  message?: string
}

export type OperationResult = { success: boolean; message: string }

export interface VibeWriteBridge {
  getProviderStatus(): Promise<ProviderStatus[]>
  generateRewrite(request: RewriteRequest): Promise<RewriteResponse>
  generateOfflineRewrite(request: RewriteRequest): Promise<RewriteResponse>
  setApiKey(input: { provider: ProviderId; key: string }): Promise<OperationResult>
  clearApiKey(input: { provider: ProviderId }): Promise<OperationResult>
  testProvider(input: { provider: ProviderId }): Promise<OperationResult>
}

declare global {
  interface Window {
    vibewrite?: VibeWriteBridge
  }
}
