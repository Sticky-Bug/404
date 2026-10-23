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
        throw new Error('VibeWrite bridge is unavailable in standalone mode.')
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
      priority: 'Priority 1 (Primary Model)',
      placeholder: 'Paste your Gemini API key...'
    },
    {
      id: 'groq',
      name: 'Groq Cloud',
      priority: 'Priority 2 (High-Speed Fallback)',
      placeholder: 'Paste your Groq API key...'
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      priority: 'Priority 3 (Optional Extended Fallback)',
      placeholder: 'Paste your OpenRouter API key...'
    }
  ]

  return (
    <div
      className="sketch-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sketch-settings-title"
      onClick={onClose}
    >
      <div className="sketch-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Notebook Tape / Pin Decoration */}
        <div className="modal-tape-decoration" aria-hidden="true">
          <span>✎ SETTINGS NOTEBOOK</span>
        </div>

        <div className="sketch-modal-header">
          <div className="modal-title-group">
            <h2 id="sketch-settings-title" className="sketch-modal-title">
              AI Provider Setup
            </h2>
            <p className="sketch-modal-subtitle">
              Keys are encrypted with native safeStorage and never sent to cloud telemetry.
            </p>
          </div>

          <button
            type="button"
            className="sketch-close-btn"
            onClick={onClose}
            aria-label="Close settings"
            id="close-sketch-settings-btn"
          >
            ✕
          </button>
        </div>

        <div className="sketch-modal-body">
          {providerList.map((p) => {
            const status = statuses[p.id]
            const state = formState[p.id]
            const isConfigured = status?.configured

            return (
              <section key={p.id} className="sketch-provider-box">
                <div className="provider-box-header">
                  <div>
                    <h3 className="provider-name">{p.name}</h3>
                    <span className="provider-priority">{p.priority}</span>
                  </div>

                  <span className={`provider-status-badge ${isConfigured ? 'configured' : ''}`}>
                    <span className={`status-ink-dot ${isConfigured ? 'active' : ''}`} />
                    {isConfigured ? 'Ready & Saved' : 'Not Configured'}
                  </span>
                </div>

                <div className="provider-input-row">
                  <input
                    type="password"
                    className="sketch-key-input"
                    placeholder={
                      isConfigured ? '•••••••••••••••••••• (Saved in safeStorage)' : p.placeholder
                    }
                    value={state.keyInput}
                    onChange={(e) => handleKeyChange(p.id, e.target.value)}
                    disabled={state.isSaving || state.isTesting}
                    id={`sketch-key-input-${p.id}`}
                    autoComplete="off"
                  />

                  <div className="provider-actions-group">
                    <button
                      type="button"
                      className="sketch-btn-pill primary"
                      onClick={() => handleSave(p.id)}
                      disabled={!state.keyInput.trim() || state.isSaving}
                      id={`save-btn-${p.id}`}
                    >
                      {state.isSaving ? 'Saving...' : 'Save Key'}
                    </button>

                    {isConfigured && (
                      <button
                        type="button"
                        className="sketch-btn-pill"
                        onClick={() => handleTest(p.id)}
                        disabled={state.isTesting}
                        id={`test-btn-${p.id}`}
                      >
                        {state.isTesting ? 'Testing...' : 'Test'}
                      </button>
                    )}

                    {isConfigured && (
                      <button
                        type="button"
                        className="sketch-btn-pill danger"
                        onClick={() => handleClear(p.id)}
                        disabled={state.isClearing}
                        id={`clear-btn-${p.id}`}
                      >
                        {state.isClearing ? 'Clearing...' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                {state.message && (
                  <div
                    className={`sketch-status-feedback ${
                      state.statusType === 'ok' ? 'ok' : 'error'
                    }`}
                  >
                    <span>{state.statusType === 'ok' ? '✓' : '⚠'}</span>
                    <span>{state.message}</span>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <div className="sketch-modal-footer">
          <button
            type="button"
            className="sketch-btn-pill done"
            onClick={onClose}
            id="done-sketch-settings-btn"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
