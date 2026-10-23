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

export interface StoredGmailTokens {
  accessToken?: string
  refreshToken?: string
  expiryDate?: number
  email?: string
  displayName?: string
  isDevMode?: boolean
}
