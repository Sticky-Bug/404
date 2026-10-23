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
  language?: string
}

export type RewriteResponse =
  | { ok: true; text: string; provider: ProviderName; model: string; fallbackUsed: boolean }
  | { ok: false; error: string; providersAttempted: ProviderId[] }

export type ApiMode = 'automatic' | 'custom'

export type ProviderStatus = {
  provider: ProviderId
  configured: boolean
  isCustom?: boolean
  mode?: ApiMode
  lastStatus: 'ok' | 'error' | 'rate-limited' | 'not-tested'
  message?: string
}

export type OperationResult = { success: boolean; message: string }

export type RecipientType = 'to' | 'cc' | 'bcc'

export interface EmailParticipant {
  id: string
  email: string
  type: RecipientType
  displayName?: string
}

export interface GmailAccountStatus {
  connected: boolean
  email?: string
  displayName?: string
  needsReconnect?: boolean
  error?: string
}

export interface SendEmailInput {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  errorCode?: string
  userMessage?: string
}

export interface VibeWriteBridge {
  getProviderStatus(): Promise<ProviderStatus[]>
  getApiMode(): Promise<ApiMode>
  setApiMode(mode: ApiMode): Promise<{ success: boolean; mode: ApiMode }>
  generateRewrite(request: RewriteRequest): Promise<RewriteResponse>
  generateOfflineRewrite(request: RewriteRequest): Promise<RewriteResponse>
  setApiKey(input: { provider: ProviderId; key: string }): Promise<OperationResult>
  clearApiKey(input: { provider: ProviderId }): Promise<OperationResult>
  testProvider(input: { provider: ProviderId }): Promise<OperationResult>
  gmailGetStatus(): Promise<GmailAccountStatus>
  gmailConnect(credentials?: {
    clientId?: string
    clientSecret?: string
  }): Promise<GmailAccountStatus>
  gmailDisconnect(): Promise<{ success: boolean }>
  gmailSendEmail(input: SendEmailInput): Promise<SendEmailResult>
  gmailSaveDraft(
    input: SendEmailInput
  ): Promise<{ success: boolean; draftId?: string; error?: string }>
  openMicrophoneSettings?(): Promise<{ success: boolean }>
  getMicrophoneStatus?(): Promise<string>
}

declare global {
  interface Window {
    vibewrite?: VibeWriteBridge
  }
}
