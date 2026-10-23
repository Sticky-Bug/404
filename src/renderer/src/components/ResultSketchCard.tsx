import React, { useState } from 'react'
import { DiffView } from './DiffView'
import { countWords } from '../lib/diff'

export interface RewriteResultData {
  toneLabel: string
  originalDraft: string
  rewrittenText: string
  provider: string
  model: string
  fallbackUsed: boolean
  isOffline: boolean
  error?: string
}

interface ResultSketchCardProps {
  result: RewriteResultData | null
  isLoading: boolean
  onCopy: (text: string) => void
  onDismiss: () => void
  onTryOffline?: () => void
}

export const ResultSketchCard: React.FC<ResultSketchCardProps> = ({
  result,
  isLoading,
  onCopy,
  onDismiss,
  onTryOffline
}) => {
  const [viewMode, setViewMode] = useState<'rewrite' | 'changes'>('rewrite')
  const [copied, setCopied] = useState(false)

  if (!isLoading && !result) return null

  const handleCopy = (): void => {
    if (!result?.rewrittenText) return
    onCopy(result.rewrittenText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = result?.rewrittenText ? countWords(result.rewrittenText) : 0

  return (
    <div
      className="sketch-result-card"
      role="region"
      aria-label="Rewrite Result"
      id="sketch-rewrite-result"
    >
      <div className="sketch-result-header">
        <div className="result-header-left">
          <span className="sketch-result-pin">📌</span>
          <span className="sketch-result-title">
            {result ? `${result.toneLabel} Vibe` : 'Rewriting...'}
          </span>
          {result && !result.error && (
            <span className="sketch-result-tag">
              {result.isOffline ? 'Offline Basic Mode' : `${result.provider} (${result.model})`}
              {result.fallbackUsed && ' • Fallback'}
            </span>
          )}
          {result && !result.error && <span className="sketch-result-tag">{wordCount} words</span>}
        </div>

        <div className="result-header-actions">
          {result && !result.error && (
            <>
              <div className="sketch-view-toggle" role="group" aria-label="View toggle">
                <button
                  type="button"
                  className={`sketch-toggle-btn ${viewMode === 'rewrite' ? 'active' : ''}`}
                  onClick={() => setViewMode('rewrite')}
                >
                  Rewrite
                </button>
                <button
                  type="button"
                  className={`sketch-toggle-btn ${viewMode === 'changes' ? 'active' : ''}`}
                  onClick={() => setViewMode('changes')}
                >
                  Changes
                </button>
              </div>

              <button
                type="button"
                className="sketch-action-btn"
                onClick={handleCopy}
                aria-label="Copy rewrite text"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </>
          )}

          <button
            type="button"
            className="sketch-action-btn close"
            onClick={onDismiss}
            aria-label="Close result"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="sketch-result-content">
        {isLoading && (
          <div className="sketch-loading-state" aria-busy="true">
            <span className="loading-spinner-ink" />
            <p>Illustrating and drafting your rewrite...</p>
          </div>
        )}

        {result?.error && (
          <div className="sketch-error-state" role="alert">
            <p>
              <strong>Rewrite couldn&apos;t be completed:</strong> {result.error}
            </p>
            {onTryOffline && (
              <button
                type="button"
                className="sketch-action-btn"
                onClick={onTryOffline}
                style={{ marginTop: '12px' }}
              >
                Try basic offline rewrite
              </button>
            )}
          </div>
        )}

        {result && !result.error && !isLoading && (
          <div className="sketch-result-body">
            {viewMode === 'rewrite' ? (
              <p className="sketch-result-text">{result.rewrittenText}</p>
            ) : (
              <DiffView originalText={result.originalDraft} rewrittenText={result.rewrittenText} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
