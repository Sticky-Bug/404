import React, { useState, useEffect, useCallback } from 'react'
import type {
  PersonaId,
  ToneIntensity,
  ProviderStatus,
  RewriteResponse
} from './types/vibewrite-api'
import { Header } from './components/Header'
import { DraftEditor } from './components/DraftEditor'
import { PersonaPicker } from './components/PersonaPicker'
import { ToneControl } from './components/ToneControl'
import { VariantCard, type VariantState } from './components/VariantCard'
import { SettingsDialog } from './components/SettingsDialog'
import { StatusMessage, type StatusToast } from './components/StatusMessage'
import { PERSONAS } from './data/personas'

export function App(): React.JSX.Element {
  const [draft, setDraft] = useState<string>('')
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaId[]>(['executive', 'supportive'])
  const [customInstruction, setCustomInstruction] = useState<string>('')
  const [intensity, setIntensity] = useState<ToneIntensity>('balanced')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [variants, setVariants] = useState<VariantState[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([])
  const [toast, setToast] = useState<StatusToast | null>(null)

  const hasBridge = typeof window !== 'undefined' && Boolean(window.vibewrite)

  const refreshProviderStatuses = useCallback(async (): Promise<void> => {
    if (window.vibewrite) {
      try {
        const statuses = await window.vibewrite.getProviderStatus()
        setProviderStatuses(statuses)
      } catch (err) {
        console.error('Failed to query provider status:', err)
      }
    }
  }, [])

  useEffect(() => {
    refreshProviderStatuses()
  }, [refreshProviderStatuses])

  const handleTogglePersona = (id: PersonaId): void => {
    setSelectedPersonas((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id)
      }
      if (prev.length >= 3) {
        return prev
      }
      return [...prev, id]
    })
  }

  const handleClearDraft = (): void => {
    setDraft('')
  }

  // Copy text to clipboard with error handling
  const copyToClipboard = async (text: string, label: string): Promise<void> => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API is unavailable in this environment.')
      }
      await navigator.clipboard.writeText(text)
      setToast({
        type: 'info',
        message: `Copied ${label} to clipboard.`
      })
    } catch (err) {
      setToast({
        type: 'error',
        message: `Failed to copy ${label} to clipboard: ${err instanceof Error ? err.message : 'Unknown clipboard error'}`
      })
    }
  }

  // Copy All action
  const handleCopyAll = async (): Promise<void> => {
    const successfulVariants = variants.filter((v) => v.status === 'success' && v.text)
    if (successfulVariants.length === 0) return

    const combinedText = successfulVariants
      .map((v) => {
        const def = PERSONAS.find((p) => p.id === v.personaId)
        const name = def ? def.name : v.personaId
        return `=== ${name.toUpperCase()} REWRITE ===\n\n${v.text}\n`
      })
      .join('\n')

    await copyToClipboard(combinedText, 'all generated variants')
  }

  // Sequential generation across up to 3 selected personas
  const handleGenerate = async (): Promise<void> => {
    const trimmedDraft = draft.trim()
    if (!trimmedDraft || selectedPersonas.length === 0) return

    if (trimmedDraft.length > 10000) {
      setToast({
        type: 'error',
        message: 'Draft exceeds the 10,000 character maximum limit.'
      })
      return
    }

    if (!window.vibewrite) {
      setToast({
        type: 'warning',
        message:
          'Electron bridge (window.vibewrite) is not yet active. Please check that User 2 has launched the IPC bridge.'
      })
      return
    }

    setIsGenerating(true)

    // Initialize variant slots as loading or idle
    const initialVariants: VariantState[] = selectedPersonas.map((id) => ({
      personaId: id,
      status: 'idle'
    }))
    setVariants(initialVariants)

    // Execute sequentially to prevent cloud rate-limits and show clear progress
    for (const personaId of selectedPersonas) {
      setVariants((prev) =>
        prev.map((v) => (v.personaId === personaId ? { ...v, status: 'loading' } : v))
      )

      try {
        const response: RewriteResponse = await window.vibewrite.generateRewrite({
          draft: trimmedDraft,
          personaId,
          intensity,
          customInstruction: personaId === 'custom' ? customInstruction.trim() : undefined
        })

        if (response.ok) {
          setVariants((prev) =>
            prev.map((v) =>
              v.personaId === personaId
                ? {
                    personaId,
                    status: 'success',
                    text: response.text,
                    provider: response.provider,
                    model: response.model,
                    fallbackUsed: response.fallbackUsed
                  }
                : v
            )
          )
        } else {
          setVariants((prev) =>
            prev.map((v) =>
              v.personaId === personaId
                ? {
                    personaId,
                    status: 'error',
                    error: response.error,
                    providersAttempted: response.providersAttempted
                  }
                : v
            )
          )
        }
      } catch (err: unknown) {
        setVariants((prev) =>
          prev.map((v) =>
            v.personaId === personaId
              ? {
                  personaId,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'Unknown rewrite error'
                }
              : v
          )
        )
      }
    }

    setIsGenerating(false)
  }

  // Trigger offline rule-based fallback rewrite
  const handleTryOffline = async (personaId: PersonaId): Promise<void> => {
    if (!window.vibewrite) {
      setToast({
        type: 'error',
        message: 'VibeWrite bridge is unavailable.'
      })
      return
    }

    setVariants((prev) =>
      prev.map((v) => (v.personaId === personaId ? { ...v, status: 'loading' } : v))
    )

    try {
      const res = await window.vibewrite.generateOfflineRewrite({
        draft: draft.trim(),
        personaId,
        intensity,
        customInstruction: personaId === 'custom' ? customInstruction.trim() : undefined
      })

      if (res.ok) {
        setVariants((prev) =>
          prev.map((v) =>
            v.personaId === personaId
              ? {
                  personaId,
                  status: 'success',
                  text: res.text,
                  provider: res.provider,
                  model: res.model,
                  fallbackUsed: res.fallbackUsed
                }
              : v
          )
        )
      } else {
        setVariants((prev) =>
          prev.map((v) =>
            v.personaId === personaId
              ? {
                  personaId,
                  status: 'error',
                  error: res.error
                }
              : v
          )
        )
      }
    } catch (err) {
      setVariants((prev) =>
        prev.map((v) =>
          v.personaId === personaId
            ? {
                personaId,
                status: 'error',
                error: err instanceof Error ? err.message : 'Offline rewrite failed'
              }
            : v
        )
      )
    }
  }

  const hasDraft = draft.trim().length > 0
  const isDraftOverLimit = draft.length > 10000
  const canGenerate = hasDraft && !isDraftOverLimit && selectedPersonas.length > 0 && !isGenerating

  const successfulVariantsCount = variants.filter(
    (v) => v.status === 'success' && Boolean(v.text)
  ).length

  return (
    <div className="app-container">
      <Header
        hasBridge={hasBridge}
        providerStatuses={providerStatuses}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <StatusMessage toast={toast} onDismiss={() => setToast(null)} />

      <main className="workspace-grid">
        {/* Left Column: Draft Input & Persona Selection */}
        <section className="panel" aria-label="Draft and Configuration">
          <DraftEditor
            draft={draft}
            onChange={setDraft}
            onClear={handleClearDraft}
            disabled={isGenerating}
            maxLength={10000}
          />

          <PersonaPicker
            selectedPersonas={selectedPersonas}
            onTogglePersona={handleTogglePersona}
            customInstruction={customInstruction}
            onCustomInstructionChange={setCustomInstruction}
            disabled={isGenerating}
            maxSelection={3}
          />

          <ToneControl intensity={intensity} onChange={setIntensity} disabled={isGenerating} />

          <div className="generate-action-bar">
            <button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!canGenerate}
              id="generate-variants-btn"
            >
              {isGenerating
                ? 'Generating variants sequentially...'
                : `Generate ${selectedPersonas.length} variant${
                    selectedPersonas.length === 1 ? '' : 's'
                  }`}
            </button>
            <p className="privacy-notice">
              Drafts are sent to configured AI providers only upon clicking Generate. Do not paste
              sensitive confidential data on unmanaged free tier accounts.
            </p>
          </div>
        </section>

        {/* Right Column: Results & Comparison */}
        <section className="panel" aria-label="Generated Variants and Comparison">
          <div className="panel-header">
            <h2 className="panel-title">
              <span>Persona Results</span>
              {successfulVariantsCount > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    fontWeight: 400
                  }}
                >
                  ({successfulVariantsCount} completed)
                </span>
              )}
            </h2>

            {successfulVariantsCount > 1 && (
              <div className="results-header-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyAll}
                  id="copy-all-btn"
                >
                  Copy all
                </button>
              </div>
            )}
          </div>

          {variants.length === 0 ? (
            <div className="empty-state-card">
              <h3 className="empty-state-title">No variants generated yet</h3>
              <p className="empty-state-subtitle">
                Enter your unpolished draft on the left, pick up to three target personas, and click
                Generate to see side-by-side rewrites and word-level diffs.
              </p>
            </div>
          ) : (
            <div className="results-list">
              {variants.map((v) => (
                <VariantCard
                  key={v.personaId}
                  variant={v}
                  originalDraft={draft}
                  onCopy={copyToClipboard}
                  onTryOffline={handleTryOffline}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStatusUpdate={refreshProviderStatuses}
      />
    </div>
  )
}

export default App
