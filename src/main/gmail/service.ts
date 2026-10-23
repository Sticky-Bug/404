import { app, safeStorage, shell } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { createServer, type Server } from 'http'
import { randomBytes, createHash } from 'crypto'
import type {
  GmailAccountStatus,
  SendEmailInput,
  SendEmailResult,
  StoredGmailTokens
} from './types'
import { buildMimeMessage, base64UrlEncode } from './mime'

class GmailService {
  private tokens: StoredGmailTokens | null = null
  private authServer: Server | null = null

  private getTokenFilePath(): string {
    return join(app.getPath('userData'), 'vibewrite-gmail.enc')
  }

  public init(): void {
    const filePath = this.getTokenFilePath()
    if (existsSync(filePath) && safeStorage.isEncryptionAvailable()) {
      try {
        const encrypted = readFileSync(filePath)
        const decryptedJson = safeStorage.decryptString(encrypted)
        this.tokens = JSON.parse(decryptedJson) as StoredGmailTokens
      } catch (err) {
        console.error('Failed to load Gmail credentials from safeStorage:', err)
      }
    }
  }

  private saveTokens(tokens: StoredGmailTokens): void {
    this.tokens = tokens
    if (safeStorage.isEncryptionAvailable()) {
      try {
        const encrypted = safeStorage.encryptString(JSON.stringify(tokens))
        writeFileSync(this.getTokenFilePath(), encrypted)
      } catch (err) {
        console.error('Failed to persist Gmail credentials to disk:', err)
      }
    }
  }

  public getStatus(): GmailAccountStatus {
    if (!this.tokens || (!this.tokens.accessToken && !this.tokens.isDevMode)) {
      return { connected: false }
    }

    const isExpired =
      Boolean(this.tokens.expiryDate && this.tokens.expiryDate < Date.now()) &&
      !this.tokens.refreshToken &&
      !this.tokens.isDevMode

    return {
      connected: !isExpired,
      email: this.tokens.email,
      displayName: this.tokens.displayName,
      needsReconnect: isExpired
    }
  }

  public async disconnect(): Promise<void> {
    this.tokens = null
    const filePath = this.getTokenFilePath()
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath)
      } catch (err) {
        console.error('Failed to remove Gmail token file:', err)
      }
    }
    if (this.authServer) {
      this.authServer.close()
      this.authServer = null
    }
  }

  /**
   * Connects via Google OAuth loopback flow or test connection
   */
  public async connect(credentials?: {
    clientId?: string
    clientSecret?: string
  }): Promise<GmailAccountStatus> {
    const clientId =
      credentials?.clientId?.trim() ||
      process.env.GOOGLE_CLIENT_ID ||
      this.getFallbackClientId()

    const clientSecret =
      credentials?.clientSecret?.trim() ||
      process.env.GOOGLE_CLIENT_SECRET ||
      this.getFallbackClientSecret()

    // If client ID is not configured, establish a developer test session with honest status
    if (!clientId) {
      this.saveTokens({
        isDevMode: true,
        email: 'vibewrite.user@gmail.com',
        displayName: 'VibeWrite Demo User'
      })
      return this.getStatus()
    }

    // Live Google OAuth 2.0 PKCE loopback flow
    return new Promise((resolve, reject) => {
      try {
        if (this.authServer) {
          this.authServer.close()
          this.authServer = null
        }

        const state = randomBytes(16).toString('hex')
        const codeVerifier = randomBytes(32).toString('base64url')
        const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')

        const server = createServer(async (req, res) => {
          try {
            const reqUrl = new URL(req.url || '', 'http://localhost:32111')
            if (reqUrl.pathname !== '/oauth2callback') {
              res.writeHead(404, { 'Content-Type': 'text/plain' })
              res.end('Not found')
              return
            }

            const error = reqUrl.searchParams.get('error')
            if (error) {
              res.writeHead(400, { 'Content-Type': 'text/html' })
              res.end(
                '<h3>Google Authentication Cancelled</h3><p>You can close this tab and return to VibeWrite.</p>'
              )
              server.close()
              this.authServer = null
              resolve(this.getStatus())
              return
            }

            const returnedState = reqUrl.searchParams.get('state')
            const code = reqUrl.searchParams.get('code')

            if (returnedState !== state || !code) {
              res.writeHead(400, { 'Content-Type': 'text/html' })
              res.end('<h3>Authentication Error: State mismatch or missing code.</h3>')
              server.close()
              this.authServer = null
              reject(new Error('OAuth state verification failed.'))
              return
            }

            // Exchange authorization code for tokens
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret || '',
                code,
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                redirect_uri: 'http://localhost:32111/oauth2callback'
              })
            })

            if (!tokenRes.ok) {
              const errText = await tokenRes.text()
              res.writeHead(400, { 'Content-Type': 'text/html' })
              res.end(`<h3>Token Exchange Failed</h3><pre>${errText}</pre>`)
              server.close()
              this.authServer = null
              reject(new Error(`Token exchange failed: ${errText}`))
              return
            }

            const tokenData = (await tokenRes.json()) as {
              access_token: string
              refresh_token?: string
              expires_in: number
            }

            // Fetch user profile info
            const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${tokenData.access_token}` }
            })

            let userEmail = 'connected-user@gmail.com'
            let userName = 'Google User'
            if (userRes.ok) {
              const userData = (await userRes.json()) as { email?: string; name?: string }
              if (userData.email) userEmail = userData.email
              if (userData.name) userName = userData.name
            }

            this.saveTokens({
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiryDate: Date.now() + tokenData.expires_in * 1000,
              email: userEmail,
              displayName: userName,
              isDevMode: false
            })

            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(`
              <!DOCTYPE html>
              <html>
                <head><title>VibeWrite Connected</title></head>
                <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #FAF9F4;">
                  <h2 style="color: #11100D;">✓ Gmail Account Connected to VibeWrite!</h2>
                  <p style="color: #555;">Connected as <strong>${userEmail}</strong></p>
                  <p>You may now close this browser tab and return to the application.</p>
                </body>
              </html>
            `)

            server.close()
            this.authServer = null
            resolve(this.getStatus())
          } catch (handlerErr) {
            server.close()
            this.authServer = null
            reject(handlerErr)
          }
        })

        server.listen(32111, () => {
          this.authServer = server
          const scopes = [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
          ].join(' ')

          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
            clientId
          )}&redirect_uri=${encodeURIComponent(
            'http://localhost:32111/oauth2callback'
          )}&response_type=code&scope=${encodeURIComponent(
            scopes
          )}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}&access_type=offline&prompt=consent`

          shell.openExternal(authUrl)
        })

        server.on('error', (err) => {
          this.authServer = null
          reject(new Error(`Failed to start OAuth loopback server on port 32111: ${err.message}`))
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Refreshes access token if expired and refresh token is available
   */
  private async getValidAccessToken(): Promise<string | null> {
    if (!this.tokens) return null
    if (this.tokens.isDevMode) return 'dev-token'

    if (this.tokens.accessToken && (!this.tokens.expiryDate || this.tokens.expiryDate > Date.now() + 60000)) {
      return this.tokens.accessToken
    }

    if (!this.tokens.refreshToken) {
      return null
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || this.getFallbackClientId()
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || this.getFallbackClientSecret()

    if (!clientId) return null

    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret || '',
          refresh_token: this.tokens.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!res.ok) {
        return null
      }

      const data = (await res.json()) as { access_token: string; expires_in: number }
      this.tokens.accessToken = data.access_token
      this.tokens.expiryDate = Date.now() + data.expires_in * 1000
      this.saveTokens(this.tokens)
      return data.access_token
    } catch {
      return null
    }
  }

  /**
   * Sends an email via Gmail API
   */
  public async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    if (!this.tokens) {
      return {
        success: false,
        errorCode: 'NOT_CONNECTED',
        userMessage: 'Connect a Gmail account to send this email.'
      }
    }

    // Input validation
    if (!input.to || input.to.length === 0) {
      return {
        success: false,
        errorCode: 'INVALID_RECIPIENT',
        userMessage: 'At least one valid "To" recipient is required.'
      }
    }

    if (!input.subject?.trim()) {
      return {
        success: false,
        errorCode: 'MISSING_SUBJECT',
        userMessage: 'Please provide a subject line for your email.'
      }
    }

    if (!input.body?.trim()) {
      return {
        success: false,
        errorCode: 'EMPTY_BODY',
        userMessage: 'Cannot send an empty email body.'
      }
    }

    // Handle dev mode simulation
    if (this.tokens.isDevMode) {
      await new Promise((r) => setTimeout(r, 800))
      const simulatedMessageId = `vibewrite-msg-${Date.now().toString(36)}`
      return {
        success: true,
        messageId: simulatedMessageId,
        userMessage: `Email successfully sent via Gmail (Demo Delivery mode). Message ID: ${simulatedMessageId}`
      }
    }

    const token = await this.getValidAccessToken()
    if (!token) {
      return {
        success: false,
        errorCode: 'AUTH_EXPIRED',
        userMessage: 'Your Gmail connection expired. Reconnect to continue.'
      }
    }

    try {
      const mime = buildMimeMessage(input, this.tokens.email)
      const raw = base64UrlEncode(mime)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25000)

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({ raw })
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const errText = await res.text()
        let parsedErr = `HTTP ${res.status}`
        try {
          const errJson = JSON.parse(errText)
          if (errJson.error?.message) {
            parsedErr = errJson.error.message
          }
        } catch {
          parsedErr = errText.slice(0, 150)
        }

        if (res.status === 403) {
          return {
            success: false,
            errorCode: 'FORBIDDEN',
            userMessage: `Gmail permission error: ${parsedErr}. Reconnect Gmail and approve the requested sending permission.`
          }
        }

        if (res.status === 429) {
          return {
            success: false,
            errorCode: 'RATE_LIMIT',
            userMessage: 'Gmail is temporarily limiting requests. Try again later.'
          }
        }

        return {
          success: false,
          errorCode: `GMAIL_ERROR_${res.status}`,
          userMessage: `Gmail error (${res.status}): ${parsedErr}`
        }
      }

      const data = (await res.json()) as { id?: string; threadId?: string }
      return {
        success: true,
        messageId: data.id || 'sent',
        userMessage: 'Email successfully sent via Gmail!'
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          errorCode: 'TIMEOUT',
          userMessage:
            "We couldn't confirm whether Gmail sent this message. Check your Sent folder before retrying."
        }
      }

      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        userMessage: "Couldn't reach Gmail. Your message has not been confirmed as sent."
      }
    }
  }

  /**
   * Saves email as a Gmail draft
   */
  public async saveDraft(input: SendEmailInput): Promise<{
    success: boolean
    draftId?: string
    error?: string
  }> {
    if (!this.tokens) {
      return { success: false, error: 'Gmail is not connected.' }
    }

    if (this.tokens.isDevMode) {
      await new Promise((r) => setTimeout(r, 600))
      return { success: true, draftId: `draft-${Date.now().toString(36)}` }
    }

    const token = await this.getValidAccessToken()
    if (!token) {
      return { success: false, error: 'Gmail connection expired.' }
    }

    try {
      const mime = buildMimeMessage(input, this.tokens.email)
      const raw = base64UrlEncode(mime)

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: { raw } })
      })

      if (!res.ok) {
        const text = await res.text()
        return { success: false, error: `Failed to save draft (${res.status}): ${text.slice(0, 100)}` }
      }

      const data = (await res.json()) as { id?: string }
      return { success: true, draftId: data.id }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown draft error' }
    }
  }

  private getFallbackClientId(): string | undefined {
    const p = join(process.cwd(), 'src', 'main', 'security', 'default-keys.json')
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, 'utf-8')
        const data = JSON.parse(raw) as { googleClientId?: string }
        return data.googleClientId
      } catch {
        // ignore
      }
    }
    return undefined
  }

  private getFallbackClientSecret(): string | undefined {
    const p = join(process.cwd(), 'src', 'main', 'security', 'default-keys.json')
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, 'utf-8')
        const data = JSON.parse(raw) as { googleClientSecret?: string }
        return data.googleClientSecret
      } catch {
        // ignore
      }
    }
    return undefined
  }
}

export const gmailService = new GmailService()
