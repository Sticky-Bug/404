import React, { useState, useEffect } from 'react'
import type { ProviderId, ProviderStatus } from '../types/vibewrite-api'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: () => void
}

interface ProviderConfigState {
  keyInput: string
  isTesting: boolean
  isSaving: boolean
  isClearing: boolean
  message?: string
  statusType?: 'ok' | 'error' | 'info'
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [statuses, setStatuses] = useState<Record<ProviderId, ProviderStatus>>({
    gemini: { provider: 'gemini', configured: false, lastStatus: 'not-tested' },
    groq: { provider: 'groq', configured: false, lastStatus: 'not-tested' },
    openrouter: { provider: 'openrouter', configured: false, lastStatus: 'not-tested' }
  })

  const [formState, setFormState] = useState<Record<ProviderId, ProviderConfigState>>({
    gemini: { keyInput: '', isTesting: false, isSaving: false, isClearing: false },
    groq: { keyInput: '', isTesting: false, isSaving: false, isClearing: false },
    openrouter: { keyInput: '', isTesting: false, isSaving: false, isClearing: false }
  })

  // Load existing configuration status on open
  useEffect(() => {
    if (!isOpen) return

    const loadStatuses = async (): Promise<void> => {
      if (window.vibewrite) {
        try {
          const list = await window.vibewrite.getProviderStatus()
          setStatuses((prev) => {
            const map: Record<ProviderId, ProviderStatus> = { ...prev }
            list.forEach((item) => {
              map[item.provider] = item
            })
            return map
          })
        } catch (err) {
          console.error('Failed to get provider statuses:', err)
        }
      }
    }

    loadStatuses()
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleKeyChange = (provider: ProviderId, val: string): void => {
    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], keyInput: val }
    }))
  }

  const handleSave = async (provider: ProviderId): Promise<void> => {
    const key = formState[provider].keyInput.trim()
    if (!key) return

    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], isSaving: true, message: undefined }
    }))

    try {
      if (!window.vibewrite) {
        throw new Error('VibeWrite bridge is unavailable in this environment.')
      }

      const res = await window.vibewrite.setApiKey({ provider, key })
      setFormState((prev) => ({
        ...prev,
        [provider]: {
          keyInput: '',
          isSaving: false,
          message: res.message,
          statusType: res.success ? 'ok' : 'error'
        }
      }))

      const updated = await window.vibewrite.getProviderStatus()
      setStatuses((prev) => {
        const map = { ...prev }
        updated.forEach((item) => {
          map[item.provider] = item
        })
        return map
      })
      onStatusUpdate()
    } catch (err: unknown) {
      setFormState((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isSaving: false,
          message: err instanceof Error ? err.message : 'Failed to save key',
          statusType: 'error'
        }
      }))
    }
  }

  const handleClear = async (provider: ProviderId): Promise<void> => {
    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], isClearing: true, message: undefined }
    }))

    try {
      if (!window.vibewrite) {
        throw new Error('VibeWrite bridge is unavailable.')
      }

      const res = await window.vibewrite.clearApiKey({ provider })
      setFormState((prev) => ({
        ...prev,
        [provider]: {
          keyInput: '',
          isClearing: false,
          message: res.message,
          statusType: res.success ? 'ok' : 'error'
        }
      }))

      const updated = await window.vibewrite.getProviderStatus()
      setStatuses((prev) => {
        const map = { ...prev }
        updated.forEach((item) => {
          map[item.provider] = item
        })
        return map
      })
      onStatusUpdate()
    } catch (err: unknown) {
      setFormState((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isClearing: false,
          message: err instanceof Error ? err.message : 'Failed to clear key',
          statusType: 'error'
        }
      }))
    }
  }

  const handleTest = async (provider: ProviderId): Promise<void> => {
    setFormState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], isTesting: true, message: undefined }
    }))

    try {
      if (!window.vibewrite) {
        throw new Error('VibeWrite bridge is unavailable.')
      }

      const res = await window.vibewrite.testProvider({ provider })
      setFormState((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isTesting: false,
          message: res.message,
          statusType: res.success ? 'ok' : 'error'
        }
      }))

      const updated = await window.vibewrite.getProviderStatus()
      setStatuses((prev) => {
        const map = { ...prev }
        updated.forEach((item) => {
          map[item.provider] = item
        })
        return map
      })
      onStatusUpdate()
    } catch (err: unknown) {
      setFormState((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isTesting: false,
          message: err instanceof Error ? err.message : 'Test failed',
          statusType: 'error'
        }
      }))
    }
  }

  const providerList: { id: ProviderId; name: string; priority: string; placeholder: string }[] = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      priority: 'Primary Provider (Priority 1)',
      placeholder: 'Enter Gemini API Key...'
    },
    {
      id: 'groq',
      name: 'Groq',
      priority: 'High-speed Fallback (Priority 2)',
      placeholder: 'Enter Groq API Key...'
    },
    {
      id: 'openrouter',
      name: 'OpenRouter (Optional)',
      priority: 'Tertiary Fallback (Priority 3)',
      placeholder: 'Enter OpenRouter API Key...'
    }
  ]

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="settings-dialog-title" className="modal-title">
            AI Provider Settings
          </h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            aria-label="Close settings"
            id="close-settings-x-btn"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            API keys are handled securely by Electron&apos;s native process and safeStorage. Keys
            are never stored in localStorage, cookies, or renderer memory.
          </p>

          {providerList.map((p) => {
            const status = statuses[p.id]
            const state = formState[p.id]
            const isConfigured = status?.configured

            return (
              <section key={p.id} className="settings-provider-group">
                <div className="settings-provider-header">
                  <div>
                    <h3 className="settings-provider-title">{p.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {p.priority}
                    </span>
                  </div>
                  <span
                    className="bridge-status-pill"
                    style={{
                      backgroundColor: isConfigured
                        ? 'var(--status-ok-bg)'
                        : 'var(--bg-surface-subtle)',
                      color: isConfigured ? 'var(--status-ok-text)' : 'var(--text-tertiary)'
                    }}
                  >
                    <span className={`status-dot ${isConfigured ? 'active' : ''}`} />
                    {isConfigured ? 'Configured' : 'Not Set'}
                  </span>
                </div>

                <div className="settings-key-input-row">
                  <input
                    type="password"
                    className="input-text"
                    placeholder={isConfigured ? '•••••••••••••••••••• (Key saved)' : p.placeholder}
                    value={state.keyInput}
                    onChange={(e) => handleKeyChange(p.id, e.target.value)}
                    disabled={state.isSaving || state.isTesting}
                    id={`key-input-${p.id}`}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleSave(p.id)}
                    disabled={!state.keyInput.trim() || state.isSaving}
                    id={`save-key-btn-${p.id}`}
                  >
                    {state.isSaving ? 'Saving...' : 'Save'}
                  </button>
                  {isConfigured && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleClear(p.id)}
                      disabled={state.isClearing}
                      id={`clear-key-btn-${p.id}`}
                      style={{ color: 'var(--status-err-text)' }}
                    >
                      {state.isClearing ? 'Clearing...' : 'Clear'}
                    </button>
                  )}
                  {isConfigured && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleTest(p.id)}
                      disabled={state.isTesting}
                      id={`test-key-btn-${p.id}`}
                    >
                      {state.isTesting ? 'Testing...' : 'Test'}
                    </button>
                  )}
                </div>

                {state.message && (
                  <p
                    className={`settings-status-note ${state.statusType === 'ok' ? 'ok' : 'error'}`}
                  >
                    {state.message}
                  </p>
                )}
              </section>
            )
          })}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} id="close-settings-btn">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
