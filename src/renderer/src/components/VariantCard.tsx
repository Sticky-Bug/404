import React, { useState } from 'react'
import type { PersonaId, ProviderName } from '../types/vibewrite-api'
import { PERSONAS } from '../data/personas'
import { DiffView } from './DiffView'
import { countWords } from '../lib/diff'

export interface VariantState {
  personaId: PersonaId
  status: 'idle' | 'loading' | 'success' | 'error'
  text?: string
  provider?: ProviderName
  model?: string
  fallbackUsed?: boolean
  error?: string
  providersAttempted?: string[]
}

interface VariantCardProps {
  variant: VariantState
  originalDraft: string
  onCopy: (text: string, personaName: string) => void
  onTryOffline: (personaId: PersonaId) => void
}

export const VariantCard: React.FC<VariantCardProps> = ({
  variant,
  originalDraft,
  onCopy,
  onTryOffline
}) => {
  const [viewMode, setViewMode] = useState<'rewrite' | 'changes'>('rewrite')
  const [copySuccess, setCopySuccess] = useState(false)

  const personaDef = PERSONAS.find((p) => p.id === variant.personaId)
  const personaName = personaDef ? personaDef.name : variant.personaId

  const handleCopy = (): void => {
    if (!variant.text) return
    onCopy(variant.text, personaName)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const wordCount = variant.text ? countWords(variant.text) : 0
  const isOffline = variant.provider === 'local'

  return (
    <article
      className={`variant-card ${variant.status === 'loading' ? 'loading' : ''}`}
      aria-label={`Variant for ${personaName}`}
    >
      <header className="variant-header">
        <div className="variant-meta">
          <span className="variant-persona-title">{personaName}</span>

          {variant.status === 'success' && (
            <>
              {isOffline ? (
                <span className="variant-attribution offline-notice">Offline Basic Template</span>
              ) : (
                <span
                  className={`variant-attribution ${variant.fallbackUsed ? 'fallback-used' : ''}`}
                >
                  {variant.provider} ({variant.model}){variant.fallbackUsed && ' • Failover'}
                </span>
              )}
              <span className="variant-attribution">{wordCount} words</span>
            </>
          )}
        </div>

        <div className="variant-controls">
          {variant.status === 'success' && (
            <>
              <div className="view-mode-toggle" role="group" aria-label="Display mode">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'rewrite' ? 'active' : ''}`}
                  onClick={() => setViewMode('rewrite')}
                  id={`mode-rewrite-${variant.personaId}`}
                >
                  Rewrite
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'changes' ? 'active' : ''}`}
                  onClick={() => setViewMode('changes')}
                  id={`mode-changes-${variant.personaId}`}
                >
                  Changes
                </button>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleCopy}
                id={`copy-btn-${variant.personaId}`}
                aria-label={`Copy rewritten text for ${personaName}`}
              >
                {copySuccess ? 'Copied' : 'Copy'}
              </button>
            </>
          )}
        </div>
      </header>

      {variant.status === 'loading' && (
        <div className="variant-body" aria-busy="true">
          <p style={{ color: 'var(--text-tertiary)' }}>Generating rewrite for {personaName}...</p>
        </div>
      )}

      {variant.status === 'error' && (
        <div className="variant-error-state" role="alert">
          <p className="variant-error-text">
            <strong>Rewrite unavailable:</strong> {variant.error || 'All cloud providers failed.'}
            {variant.providersAttempted && variant.providersAttempted.length > 0 && (
              <span> (Attempted: {variant.providersAttempted.join(', ')})</span>
            )}
          </p>
          <div className="variant-error-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onTryOffline(variant.personaId)}
              id={`offline-retry-btn-${variant.personaId}`}
            >
              Try basic offline rewrite
            </button>
          </div>
        </div>
      )}

      {variant.status === 'success' && (
        <>
          <div className="variant-body">
            {viewMode === 'rewrite' ? (
              variant.text
            ) : (
              <DiffView originalText={originalDraft} rewrittenText={variant.text || ''} />
            )}
          </div>
          {isOffline && (
            <footer className="variant-footer">
              <span>Notice: Local rule-based output without cloud language model assistance.</span>
            </footer>
          )}
        </>
      )}
    </article>
  )
}
