import React, { useState, useEffect } from 'react'
import type {
  EmailParticipant,
  GmailAccountStatus,
  RecipientType,
  SendEmailResult
} from '../types/vibewrite-api'

interface EmailDeliveryPanelProps {
  currentVibeText?: string
  currentVibeTone?: string
  onToast: (toast: { type: 'info' | 'error'; message: string }) => void
}

export const EmailDeliveryPanel: React.FC<EmailDeliveryPanelProps> = ({
  currentVibeText,
  currentVibeTone,
  onToast
}) => {
  const [accountStatus, setAccountStatus] = useState<GmailAccountStatus>({ connected: false })
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)

  // Recipients state
  const [participants, setParticipants] = useState<EmailParticipant[]>([
    { id: 'p-1', email: '', type: 'to' }
  ])

  // Email content
  const [subject, setSubject] = useState<string>('')
  const [body, setBody] = useState<string>('')

  // Delivery action states
  const [isSending, setIsSending] = useState<boolean>(false)
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false)
  const [sendResult, setSendResult] = useState<SendEmailResult | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [showOAuthModal, setShowOAuthModal] = useState<boolean>(false)

  // Custom OAuth Credentials inputs
  const [oauthClientId, setOauthClientId] = useState<string>('')
  const [oauthClientSecret, setOauthClientSecret] = useState<string>('')

  // Load account status on mount
  useEffect(() => {
    const fetchStatus = async (): Promise<void> => {
      if (window.vibewrite?.gmailGetStatus) {
        try {
          const status = await window.vibewrite.gmailGetStatus()
          setAccountStatus(status)
        } catch (err) {
          console.error('Failed to query Gmail status:', err)
        } finally {
          setIsCheckingAuth(false)
        }
      } else {
        setIsCheckingAuth(false)
      }
    }
    fetchStatus()
  }, [])

  // Auto-populate email body when a new vibe rewrite is generated (if body is empty)
  useEffect(() => {
    if (currentVibeText) {
      // Defer to avoid cascading renders warning
      const timer = setTimeout(() => {
        setBody((prev) => (prev.trim() ? prev : currentVibeText))
      }, 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [currentVibeText])

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  const handleAddParticipant = (): void => {
    const newId = `p-${Date.now()}`
    setParticipants((prev) => [...prev, { id: newId, email: '', type: 'to' }])
  }

  const handleRemoveParticipant = (id: string): void => {
    if (participants.length <= 1) {
      setParticipants([{ id: 'p-1', email: '', type: 'to' }])
      return
    }
    setParticipants((prev) => prev.filter((p) => p.id !== id))
  }

  const handleParticipantChange = (
    id: string,
    field: 'email' | 'type',
    value: string
  ): void => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const handleConnect = async (): Promise<void> => {
    if (!window.vibewrite?.gmailConnect) {
      onToast({ type: 'error', message: 'Gmail bridge not available in standalone preview.' })
      return
    }

    setIsConnecting(true)
    try {
      const credentials =
        oauthClientId.trim()
          ? { clientId: oauthClientId.trim(), clientSecret: oauthClientSecret.trim() }
          : undefined

      const status = await window.vibewrite.gmailConnect(credentials)
      setAccountStatus(status)
      setShowOAuthModal(false)
      if (status.connected) {
        onToast({ type: 'info', message: `Connected to Gmail as ${status.email}!` })
      } else {
        onToast({ type: 'error', message: 'Gmail connection was cancelled.' })
      }
    } catch (err: unknown) {
      onToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to connect Gmail account.'
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (): Promise<void> => {
    if (!window.vibewrite?.gmailDisconnect) return
    try {
      await window.vibewrite.gmailDisconnect()
      setAccountStatus({ connected: false })
      onToast({ type: 'info', message: 'Gmail account disconnected.' })
    } catch {
      onToast({ type: 'error', message: 'Failed to disconnect Gmail.' })
    }
  }

  // Pre-send validation
  const getValidationErrors = (): string[] => {
    const errors: string[] = []

    const toRecipients = participants
      .filter((p) => p.type === 'to' && p.email.trim())
      .map((p) => p.email.trim().toLowerCase())

    if (toRecipients.length === 0) {
      errors.push('At least one valid "To" recipient is required.')
    }

    // Check invalid emails
    const activeEmails = participants.filter((p) => p.email.trim())
    for (const p of activeEmails) {
      if (!isValidEmail(p.email)) {
        errors.push(`"${p.email}" is not a valid email address.`)
      }
    }

    // Check duplicates
    const unique = new Set<string>()
    for (const p of activeEmails) {
      const lower = p.email.trim().toLowerCase()
      if (unique.has(lower)) {
        errors.push(`Duplicate recipient address: ${p.email}`)
      }
      unique.add(lower)
    }

    if (!subject.trim()) {
      errors.push('Please enter an email subject line.')
    }

    if (!body.trim()) {
      errors.push('The email message body cannot be empty.')
    }

    return errors
  }

  const handleInitiateSend = (): void => {
    const errors = getValidationErrors()
    if (errors.length > 0) {
      onToast({ type: 'error', message: errors[0] })
      return
    }

    if (!accountStatus.connected) {
      onToast({
        type: 'error',
        message: 'Connect a Gmail account to send directly, or use Copy/Mailto fallback.'
      })
      return
    }

    setShowConfirmModal(true)
  }

  const handleConfirmSend = async (): Promise<void> => {
    setShowConfirmModal(false)
    setIsSending(true)
    setSendResult(null)

    const to = participants.filter((p) => p.type === 'to' && p.email.trim()).map((p) => p.email.trim())
    const cc = participants.filter((p) => p.type === 'cc' && p.email.trim()).map((p) => p.email.trim())
    const bcc = participants.filter((p) => p.type === 'bcc' && p.email.trim()).map((p) => p.email.trim())

    try {
      if (!window.vibewrite?.gmailSendEmail) {
        throw new Error('VibeWrite bridge not found.')
      }

      const res = await window.vibewrite.gmailSendEmail({
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject: subject.trim(),
        body: body.trim()
      })

      setSendResult(res)
      if (res.success) {
        onToast({ type: 'info', message: 'Email sent successfully via Gmail!' })
      } else {
        onToast({ type: 'error', message: res.userMessage || 'Failed to send email.' })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Send request failed.'
      setSendResult({ success: false, userMessage: msg })
      onToast({ type: 'error', message: msg })
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveDraft = async (): Promise<void> => {
    if (!accountStatus.connected) {
      onToast({ type: 'error', message: 'Connect Gmail to save drafts.' })
      return
    }

    setIsSavingDraft(true)
    const to = participants.filter((p) => p.type === 'to' && p.email.trim()).map((p) => p.email.trim())
    const cc = participants.filter((p) => p.type === 'cc' && p.email.trim()).map((p) => p.email.trim())
    const bcc = participants.filter((p) => p.type === 'bcc' && p.email.trim()).map((p) => p.email.trim())

    try {
      if (!window.vibewrite?.gmailSaveDraft) {
        throw new Error('Gmail bridge unavailable.')
      }

      const res = await window.vibewrite.gmailSaveDraft({
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject: subject.trim() || '(Draft)',
        body: body.trim()
      })

      if (res.success) {
        onToast({ type: 'info', message: 'Draft saved in your Gmail account!' })
      } else {
        onToast({ type: 'error', message: res.error || 'Failed to save draft.' })
      }
    } catch (err: unknown) {
      onToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error saving draft.'
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Fallback Copy to Clipboard
  const handleCopyEmail = async (): Promise<void> => {
    const to = participants.filter((p) => p.type === 'to' && p.email.trim()).map((p) => p.email.trim())
    const formatted = `To: ${to.join(', ')}\nSubject: ${subject}\n\n${body}`
    try {
      await navigator.clipboard.writeText(formatted)
      onToast({ type: 'info', message: 'Complete email copied to clipboard!' })
    } catch {
      onToast({ type: 'error', message: 'Clipboard access denied.' })
    }
  }

  // Fallback mailto: link
  const handleOpenMailto = (): void => {
    const to = participants.filter((p) => p.type === 'to' && p.email.trim()).map((p) => p.email.trim()).join(',')
    const cc = participants.filter((p) => p.type === 'cc' && p.email.trim()).map((p) => p.email.trim()).join(',')
    const bcc = participants.filter((p) => p.type === 'bcc' && p.email.trim()).map((p) => p.email.trim()).join(',')

    const params = new URLSearchParams()
    if (cc) params.set('cc', cc)
    if (bcc) params.set('bcc', bcc)
    if (subject) params.set('subject', subject)
    if (body) params.set('body', body)

    const mailtoUrl = `mailto:${to}?${params.toString()}`
    window.open(mailtoUrl, '_blank')
  }

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0

  return (
    <section
      className="sketch-delivery-panel"
      aria-labelledby="delivery-panel-heading"
      id="email-delivery-panel"
    >
      {/* Tape Header Banner */}
      <div className="delivery-panel-tape" aria-hidden="true">
        <span>✉ EMAIL PARTICIPANTS &amp; DELIVERY</span>
      </div>

      <div className="delivery-panel-inner">
        {/* Panel Header & Sender Account Status */}
        <div className="delivery-sender-row">
          <div className="sender-account-info">
            <span className="sender-label">SENDER ACCOUNT:</span>
            {isCheckingAuth ? (
              <span className="sender-status-pill">Checking...</span>
            ) : accountStatus.connected ? (
              <span className="sender-status-pill connected">
                <span className="status-ink-dot active" />
                <span>{accountStatus.email}</span>
                {accountStatus.displayName && (
                  <span className="sender-name-hint">({accountStatus.displayName})</span>
                )}
              </span>
            ) : (
              <span className="sender-status-pill disconnected">
                <span className="status-ink-dot" />
                <span>Not Connected</span>
              </span>
            )}
          </div>

          <div className="sender-actions-group">
            {accountStatus.connected ? (
              <button
                type="button"
                className="sketch-btn-pill danger"
                onClick={handleDisconnect}
                id="gmail-disconnect-btn"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                className="sketch-btn-pill primary"
                onClick={() => setShowOAuthModal(true)}
                disabled={isConnecting}
                id="gmail-connect-btn"
              >
                {isConnecting ? 'Connecting...' : 'Connect Gmail'}
              </button>
            )}
          </div>
        </div>

        {/* Informational notice when not connected */}
        {!accountStatus.connected && (
          <div className="delivery-offline-banner">
            <div className="delivery-banner-icon">ℹ</div>
            <div className="delivery-banner-text">
              <p>
                <strong>Gmail direct sending is currently inactive.</strong> You can connect your
                Google account above, or use the <em>Copy to Clipboard</em> / <em>Open in Mail App</em>{' '}
                fallback buttons below to send through your default email client.
              </p>
            </div>
          </div>
        )}

        {/* 1. Recipient Management Table */}
        <div className="delivery-recipients-box">
          <div className="recipients-box-header">
            <span className="sub-heading-label">Participants:</span>
            <button
              type="button"
              className="sketch-btn-pill"
              onClick={handleAddParticipant}
              id="add-participant-btn"
            >
              + Add Participant
            </button>
          </div>

          <div className="recipients-list">
            {participants.map((p, idx) => {
              const isInvalid = Boolean(p.email.trim() && !isValidEmail(p.email))

              return (
                <div key={p.id} className="participant-item-row">
                  <select
                    className="participant-type-select"
                    value={p.type}
                    onChange={(e) =>
                      handleParticipantChange(p.id, 'type', e.target.value as RecipientType)
                    }
                    aria-label={`Recipient type for participant ${idx + 1}`}
                  >
                    <option value="to">To:</option>
                    <option value="cc">Cc:</option>
                    <option value="bcc">Bcc:</option>
                  </select>

                  <div className="participant-input-wrapper">
                    <input
                      type="email"
                      className={`participant-email-input ${isInvalid ? 'invalid' : ''}`}
                      placeholder={
                        p.type === 'to'
                          ? 'recipient@example.com (Required)'
                          : `${p.type.toUpperCase()} recipient address...`
                      }
                      value={p.email}
                      onChange={(e) => handleParticipantChange(p.id, 'email', e.target.value)}
                      id={`participant-input-${idx}`}
                    />
                    {isInvalid && (
                      <span className="input-validation-msg">Invalid email format</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="participant-delete-btn"
                    onClick={() => handleRemoveParticipant(p.id)}
                    aria-label={`Remove participant ${idx + 1}`}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. Subject Line */}
        <div className="delivery-subject-box">
          <label htmlFor="delivery-subject-input" className="sub-heading-label">
            Subject:
          </label>
          <input
            id="delivery-subject-input"
            type="text"
            className="sketch-subject-input"
            placeholder="e.g. Project Update & Next Steps..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* 3. Final Message Body Review & Editor */}
        <div className="delivery-body-box">
          <div className="body-box-header">
            <label htmlFor="delivery-body-textarea" className="sub-heading-label">
              Final Message Body:
            </label>
            <div className="body-actions-hint">
              {currentVibeText && (
                <button
                  type="button"
                  className="sync-vibe-btn"
                  onClick={() => setBody(currentVibeText)}
                  title="Replace message body with latest generated persona draft"
                >
                  ↻ Sync with {currentVibeTone ? `${currentVibeTone} Vibe` : 'Generated Draft'}
                </button>
              )}
              <span className="body-counter">{wordCount} words</span>
            </div>
          </div>

          <textarea
            id="delivery-body-textarea"
            className="sketch-body-textarea"
            rows={5}
            placeholder="Type or review the final message body before sending..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        {/* 4. Action Buttons (Functionally & Visually Separate from Tone Generation) */}
        <div className="delivery-actions-footer">
          <div className="fallback-actions-group">
            <button
              type="button"
              className="sketch-btn-pill"
              onClick={handleCopyEmail}
              id="copy-email-btn"
              title="Copy formatted email to clipboard"
            >
              📋 Copy to Clipboard
            </button>
            <button
              type="button"
              className="sketch-btn-pill"
              onClick={handleOpenMailto}
              id="open-mailto-btn"
              title="Open draft in system default email application"
            >
              ✉ Open in Mail App
            </button>
          </div>

          <div className="primary-delivery-group">
            {accountStatus.connected && (
              <button
                type="button"
                className="sketch-btn-pill"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSending}
                id="save-draft-btn"
              >
                {isSavingDraft ? 'Saving Draft...' : 'Save as Gmail Draft'}
              </button>
            )}

            <button
              type="button"
              className={`sketch-btn-pill send-primary-btn ${
                !accountStatus.connected ? 'disabled-hint' : ''
              }`}
              onClick={handleInitiateSend}
              disabled={isSending}
              id="send-email-main-btn"
            >
              {isSending ? (
                <span>Sending...</span>
              ) : (
                <>
                  <span>Send Email via Gmail</span>
                  <span className="send-plane-icon" aria-hidden="true">
                    ✈
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delivery State Feedback */}
        {sendResult && (
          <div
            className={`delivery-result-banner ${sendResult.success ? 'success' : 'error'}`}
            role="alert"
          >
            <span className="result-icon">{sendResult.success ? '✓' : '⚠'}</span>
            <div className="result-text">
              <p>
                <strong>
                  {sendResult.success ? 'Delivery Confirmed:' : 'Delivery Failed:'}
                </strong>{' '}
                {sendResult.userMessage}
              </p>
              {sendResult.messageId && (
                <span className="message-id-badge">ID: {sendResult.messageId}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- SEND CONFIRMATION STEP MODAL --- */}
      {showConfirmModal && (
        <div
          className="sketch-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="sketch-modal-card confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-tape-decoration">
              <span>CONFIRM EMAIL TRANSMISSION</span>
            </div>

            <div className="sketch-modal-header">
              <h3 id="confirm-modal-title" className="sketch-modal-title">
                Ready to Send via Gmail?
              </h3>
              <button
                type="button"
                className="sketch-close-btn"
                onClick={() => setShowConfirmModal(false)}
                aria-label="Cancel"
              >
                ✕
              </button>
            </div>

            <div className="sketch-modal-body">
              <div className="confirm-details-list">
                <div className="confirm-row">
                  <span className="confirm-label">From:</span>
                  <span className="confirm-val highlight">{accountStatus.email}</span>
                </div>

                <div className="confirm-row">
                  <span className="confirm-label">To:</span>
                  <span className="confirm-val">
                    {participants
                      .filter((p) => p.type === 'to' && p.email.trim())
                      .map((p) => p.email.trim())
                      .join(', ')}
                  </span>
                </div>

                {participants.some((p) => p.type === 'cc' && p.email.trim()) && (
                  <div className="confirm-row">
                    <span className="confirm-label">Cc:</span>
                    <span className="confirm-val">
                      {participants
                        .filter((p) => p.type === 'cc' && p.email.trim())
                        .map((p) => p.email.trim())
                        .join(', ')}
                    </span>
                  </div>
                )}

                {participants.some((p) => p.type === 'bcc' && p.email.trim()) && (
                  <div className="confirm-row">
                    <span className="confirm-label">Bcc:</span>
                    <span className="confirm-val bcc-val">
                      {participants
                        .filter((p) => p.type === 'bcc' && p.email.trim())
                        .map((p) => p.email.trim())
                        .join(', ')}{' '}
                      <em>(Hidden from recipients)</em>
                    </span>
                  </div>
                )}

                <div className="confirm-row">
                  <span className="confirm-label">Subject:</span>
                  <span className="confirm-val font-bold">{subject}</span>
                </div>

                <div className="confirm-body-preview">
                  <span className="confirm-label">Message Preview:</span>
                  <div className="preview-body-box">{body}</div>
                </div>
              </div>
            </div>

            <div className="sketch-modal-footer">
              <button
                type="button"
                className="sketch-btn-pill"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sketch-btn-pill send-primary-btn"
                onClick={handleConfirmSend}
                id="confirm-send-now-btn"
              >
                Confirm &amp; Send Now ✈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GOOGLE OAUTH CONNECTION MODAL --- */}
      {showOAuthModal && (
        <div
          className="sketch-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="oauth-modal-title"
        >
          <div className="sketch-modal-card oauth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-tape-decoration">
              <span>GOOGLE OAUTH CONNECTION</span>
            </div>

            <div className="sketch-modal-header">
              <h3 id="oauth-modal-title" className="sketch-modal-title">
                Connect Google Account
              </h3>
              <button
                type="button"
                className="sketch-close-btn"
                onClick={() => setShowOAuthModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="sketch-modal-body">
              <div className="oauth-intro-text">
                <p>
                  VibeWrite connects securely via Google OAuth 2.0 PKCE. Your password is never
                  handled or stored by VibeWrite.
                </p>
              </div>

              <div className="sketch-provider-box" style={{ background: '#fff' }}>
                <h4 style={{ margin: '0 0 6px 0', fontFamily: 'var(--font-display)' }}>
                  Quick One-Click Demo Mode
                </h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: 'var(--ink-light)' }}>
                  No Google Cloud project configured? Connect as a verified demo account to test the
                  complete participant validation, confirmation modal, and delivery flow instantly.
                </p>
                <button
                  type="button"
                  className="sketch-btn-pill primary"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  id="connect-demo-account-btn"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Demo Account (1-Click)'}
                </button>
              </div>

              <div style={{ margin: '14px 0 6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ink-light)', fontWeight: 700 }}>
                  — OR CONNECT WITH CUSTOM GOOGLE CLOUD OAUTH CREDENTIALS —
                </span>
              </div>

              <div className="sketch-provider-box">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label
                      htmlFor="oauth-client-id-input"
                      style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block' }}
                    >
                      Google Client ID:
                    </label>
                    <input
                      id="oauth-client-id-input"
                      type="text"
                      className="sketch-key-input"
                      style={{ width: '100%', marginTop: '3px' }}
                      placeholder="e.g. 547290595362-xxxx.apps.googleusercontent.com"
                      value={oauthClientId}
                      onChange={(e) => setOauthClientId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="oauth-client-secret-input"
                      style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block' }}
                    >
                      Google Client Secret (Optional for Desktop PKCE):
                    </label>
                    <input
                      id="oauth-client-secret-input"
                      type="password"
                      className="sketch-key-input"
                      style={{ width: '100%', marginTop: '3px' }}
                      placeholder="Paste Client Secret if required by your client..."
                      value={oauthClientSecret}
                      onChange={(e) => setOauthClientSecret(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="sketch-btn-pill"
                    onClick={handleConnect}
                    disabled={!oauthClientId.trim() || isConnecting}
                    id="connect-custom-oauth-btn"
                    style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                  >
                    {isConnecting ? 'Opening Google Login...' : 'Launch Google Browser Login'}
                  </button>
                </div>
              </div>
            </div>

            <div className="sketch-modal-footer">
              <button
                type="button"
                className="sketch-btn-pill"
                onClick={() => setShowOAuthModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
