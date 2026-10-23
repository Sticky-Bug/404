import React, { useState, useEffect } from 'react'
import type { ProviderId, ProviderStatus, ApiMode } from '../types/vibewrite-api'

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
  const [activeTab, setActiveTab] = useState<ApiMode>('automatic')
  const [statuses, setStatuses] = useState<Record<ProviderId, ProviderStatus>>({
    gemini: {
      provider: 'gemini',
      configured: true,
      isCustom: false,
      mode: 'automatic',
      lastStatus: 'not-tested'
    },
    groq: {
      provider: 'groq',
      configured: true,
      isCustom: false,
      mode: 'automatic',
      lastStatus: 'not-tested'
    },
    openrouter: {
      provider: 'openrouter',
      configured: true,
      isCustom: false,
      mode: 'automatic',
      lastStatus: 'not-tested'
    }
  })

  const [formState, setFormState] = useState<Record<ProviderId, ProviderConfigState>>({
    gemini: { keyInput: '', isTesting: false, isSaving: false, isClearing: false },
    groq: { keyInput: '', isTesting: false, isSaving: false, isClearing: false },
    openrouter: { keyInput: '', isTesting: false, isSaving: false, isClearing: false }
  })

  // Load existing configuration status & mode on open
  useEffect(() => {
    if (!isOpen) return

    const loadData = async (): Promise<void> => {
      if (window.vibewrite) {
        try {
          if (window.vibewrite.getApiMode) {
            const currentMode = await window.vibewrite.getApiMode()
            setActiveTab(currentMode)
          }

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

    loadData()
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

  const handleModeSwitch = async (mode: ApiMode): Promise<void> => {
    setActiveTab(mode)
    if (window.vibewrite?.setApiMode) {
      try {
        await window.vibewrite.setApiMode(mode)
        const updated = await window.vibewrite.getProviderStatus()
        setStatuses((prev) => {
          const map = { ...prev }
          updated.forEach((item) => {
            map[item.provider] = item
          })
          return map
        })
        onStatusUpdate()
      } catch (err) {
        console.error('Failed to change api mode:', err)
      }
    }
  }

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

  const autoProviders = [
    {
      id: 'gemini' as ProviderId,
      name: 'Google Gemini',
      priority: 'Priority 1 (Primary Model)',
      model: 'gemini-3.8-flash',
      desc: 'Built-in managed key loaded • Nuanced rewrites & fact preservation'
    },
    {
      id: 'groq' as ProviderId,
      name: 'Groq Cloud',
      priority: 'Priority 2 (High-Speed Fallback)',
      model: 'llama-3.1-8b-instant',
      desc: 'Built-in managed key loaded • Instant <500ms response speed'
    },
    {
      id: 'openrouter' as ProviderId,
      name: 'OpenRouter',
      priority: 'Priority 3 (Extended Fallback)',
      model: 'llama-3.2-3b-instruct / auto',
      desc: 'Built-in managed key loaded • Failover router safety net'
    }
  ]

  const customProviders = [
    {
      id: 'gemini' as ProviderId,
      name: 'Google Gemini',
      priority: 'Priority 1 (Primary Model)',
      placeholder: 'Paste your Gemini API key...'
    },
    {
      id: 'groq' as ProviderId,
      name: 'Groq Cloud',
      priority: 'Priority 2 (High-Speed Fallback)',
      placeholder: 'Paste your Groq API key (gsk_...)...'
    },
    {
      id: 'openrouter' as ProviderId,
      name: 'OpenRouter',
      priority: 'Priority 3 (Optional Extended Fallback)',
      placeholder: 'Paste your OpenRouter API key (sk-or-v1-...)...'
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
              {activeTab === 'automatic'
                ? 'Automatic managed mode active — zero configuration needed to write.'
                : 'Custom BYOK mode — use personal API keys encrypted in safeStorage.'}
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

        {/* Tab Switcher: Automatic vs Custom */}
        <div className="sketch-tabs-nav">
          <button
            type="button"
            className={`sketch-tab-btn ${activeTab === 'automatic' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('automatic')}
            id="tab-automatic-mode"
          >
            <span>⚡ Automatic</span>
            <span className="sketch-tab-badge">Managed AI</span>
          </button>

          <button
            type="button"
            className={`sketch-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('custom')}
            id="tab-custom-mode"
          >
            <span>⚙ Custom Keys</span>
            <span className="sketch-tab-badge">BYOK</span>
          </button>
        </div>

        <div className="sketch-modal-body">
          {activeTab === 'automatic' ? (
            /* --- AUTOMATIC MODE PAGE (Zero API ask for users) --- */
            <>
              <div className="auto-mode-banner">
                <span className="auto-banner-icon">✨</span>
                <div className="auto-banner-content">
                  <h4>Managed AI is Active</h4>
                  <p>
                    You don&apos;t need to supply any API keys! VibeWrite automatically routes
                    requests through our pre-configured Google Gemini, Groq, and OpenRouter
                    pipelines with offline fallback.
                  </p>
                </div>
              </div>

              {autoProviders.map((p) => {
                const state = formState[p.id]

                return (
                  <section key={p.id} className="sketch-provider-box">
                    <div className="provider-box-header">
                      <div className="auto-provider-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 className="provider-name">{p.name}</h3>
                          <span className="auto-model-tag">{p.model}</span>
                        </div>
                        <span className="provider-priority">{p.priority}</span>
                      </div>

                      <span className="provider-status-badge configured">
                        <span className="status-ink-dot active" />
                        Managed & Ready
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span className="auto-provider-model">{p.desc}</span>
                      <button
                        type="button"
                        className="sketch-btn-pill"
                        onClick={() => handleTest(p.id)}
                        disabled={state.isTesting}
                        id={`test-auto-btn-${p.id}`}
                      >
                        {state.isTesting ? 'Testing...' : 'Test Connection'}
                      </button>
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

              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  className="sketch-btn-pill"
                  onClick={() => handleModeSwitch('custom')}
                  style={{ fontSize: '0.85rem' }}
                >
                  Need to use personal API keys? Switch to Custom Page →
                </button>
              </div>
            </>
          ) : (
            /* --- CUSTOM MODE PAGE (Option for setting custom API keys) --- */
            <>
              <div style={{ padding: '0 4px', marginBottom: '4px' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'var(--ink-light)',
                    fontFamily: 'var(--font-hand)'
                  }}
                >
                  Provide your own keys below to override the automatic pipeline and use your own
                  rate limits.
                </p>
              </div>

              {customProviders.map((p) => {
                const status = statuses[p.id]
                const state = formState[p.id]
                const isCustomConfigured = Boolean(status?.isCustom)

                return (
                  <section key={p.id} className="sketch-provider-box">
                    <div className="provider-box-header">
                      <div>
                        <h3 className="provider-name">{p.name}</h3>
                        <span className="provider-priority">{p.priority}</span>
                      </div>

                      <span
                        className={`provider-status-badge ${isCustomConfigured ? 'configured' : ''}`}
                      >
                        <span className={`status-ink-dot ${isCustomConfigured ? 'active' : ''}`} />
                        {isCustomConfigured ? 'Custom Key Saved' : 'Not Configured'}
                      </span>
                    </div>

                    <div className="provider-input-row">
                      <input
                        type="password"
                        className="sketch-key-input"
                        placeholder={
                          isCustomConfigured
                            ? '•••••••••••••••••••• (Saved in safeStorage)'
                            : p.placeholder
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

                        {isCustomConfigured && (
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

                        {isCustomConfigured && (
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
            </>
          )}
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
