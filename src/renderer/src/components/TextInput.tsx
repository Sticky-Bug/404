import React, { useState, useRef, useEffect } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

interface TextInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  disabled?: boolean
  placeholder?: string
}

const PROMPT_HINTS = [
  'Draft an unpolished email or proposal here...',
  'Paste a blunt message you want to soften...',
  'Type a quick idea to make it punchy & executive...',
  'Drop in rough thoughts to turn into a clean brief...',
  'Enter your draft text here...'
]

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Track the text segments before and after the cursor at the moment dictation started
  const speechPrefixRef = useRef<string>('')
  const speechSuffixRef = useRef<string>('')

  const {
    isSupported,
    isListening,
    error: sttError,
    permissionDenied,
    setPermissionDenied,
    clearError,
    requestMicrophonePermission,
    startListening,
    stopListening
  } = useSpeechRecognition()

  // Subtle rotation of placeholder hints if input is empty
  useEffect(() => {
    if (value.trim()) return
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % PROMPT_HINTS.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isSubmitting && !disabled) {
        if (isListening) {
          stopListening()
        }
        onSubmit()
      }
    }
  }

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (isListening) {
      stopListening()
    }
    onChange('')
    inputRef.current?.focus()
  }

  const triggerVoiceStart = (): void => {
    // Capture cursor insertion point and existing text
    const inputEl = inputRef.current
    const selStart =
      inputEl && typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : value.length
    const selEnd =
      inputEl && typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : value.length

    const beforeText = value.slice(0, selStart)
    const afterText = value.slice(selEnd)

    // Add sensible spacing if existing text doesn't end/start with whitespace
    const padBefore = beforeText.length > 0 && !/\s$/.test(beforeText) ? ' ' : ''
    const padAfter = afterText.length > 0 && !/^\s/.test(afterText) ? ' ' : ''

    speechPrefixRef.current = beforeText + padBefore
    speechSuffixRef.current = padAfter + afterText

    startListening({
      onTranscript: (fullTranscript: string) => {
        const updated = speechPrefixRef.current + fullTranscript + speechSuffixRef.current
        onChange(updated)
      }
    })
  }

  const handleMicToggle = (e: React.MouseEvent): void => {
    e.stopPropagation()

    if (isListening) {
      stopListening()
      inputRef.current?.focus()
      return
    }

    triggerVoiceStart()
  }

  const charCount = value.length
  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0

  const micAriaLabel = isListening
    ? 'Stop voice typing (Listening...)'
    : !isSupported
      ? 'Voice typing unsupported in this browser'
      : 'Start voice typing'

  const micTitle = isListening
    ? 'Listening... Click to stop voice typing'
    : !isSupported
      ? 'Speech recognition is not supported in this browser'
      : 'Click microphone to dictate text'

  return (
    <div className="sketch-input-module">
      {/* Interactive Microphone Permission Dialog if access is blocked */}
      {permissionDenied && (
        <div
          className="sketch-permission-prompt-card"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="mic-permission-title"
        >
          <div className="permission-prompt-header">
            <span className="permission-prompt-icon" aria-hidden="true">
              🎙️
            </span>
            <div className="permission-prompt-titles">
              <h4 id="mic-permission-title" className="permission-prompt-title">
                Microphone Access Needed
              </h4>
              <span className="permission-prompt-subtitle">
                Enable voice dictation for Mail B.I.T
              </span>
            </div>
            <button
              type="button"
              className="permission-close-btn"
              onClick={() => setPermissionDenied(false)}
              title="Close dialog"
              aria-label="Close permission prompt"
            >
              ✕
            </button>
          </div>

          <div className="permission-prompt-body">
            <p className="permission-prompt-text">
              <strong>Mail B.I.T</strong> needs microphone permission to transcribe your speech into
              the draft.
            </p>
            <ol className="permission-steps-list">
              <li>
                Click <strong>&quot;Allow / Prompt Again&quot;</strong> below and click Allow when
                prompted.
              </li>
              <li>
                <strong>Windows users:</strong> If Windows blocks desktop apps, open{' '}
                <em>Windows Settings &gt; Privacy &amp; security &gt; Microphone</em> and ensure{' '}
                <strong>&quot;Let desktop apps access your microphone&quot;</strong> is switched{' '}
                <strong>ON</strong>.
              </li>
            </ol>
          </div>

          <div className="permission-prompt-actions">
            <button
              type="button"
              className="permission-primary-btn"
              onClick={async (e) => {
                e.stopPropagation()
                const granted = await requestMicrophonePermission()
                if (granted) {
                  triggerVoiceStart()
                }
              }}
            >
              🎙️ Allow / Prompt Again
            </button>

            {typeof window !== 'undefined' && window.vibewrite?.openMicrophoneSettings && (
              <button
                type="button"
                className="permission-secondary-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  window.vibewrite?.openMicrophoneSettings?.()
                }}
                title="Open Windows Microphone Privacy Settings"
              >
                ⚙️ Open Windows Mic Settings
              </button>
            )}

            <button
              type="button"
              className="permission-cancel-btn"
              onClick={(e) => {
                e.stopPropagation()
                setPermissionDenied(false)
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div
        className={`sketch-input-container ${isFocused ? 'focused' : ''} ${
          disabled ? 'disabled' : ''
        } ${isListening ? 'listening-border' : ''}`}
        onClick={() => inputRef.current?.focus()}
        role="search"
      >
        {/* Decorative sketch caret mark on far left */}
        <div className="sketch-input-pen-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <path
              d="M 3,17 L 7,16 L 16,7 L 12,3 L 3,12 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line x1="10" y1="5" x2="14" y2="9" stroke="#11100D" strokeWidth="2" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          className="sketch-text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isListening ? 'Listening to speech...' : PROMPT_HINTS[hintIndex]}
          disabled={disabled || isSubmitting}
          aria-label="Draft text for Mail B.I.T"
          id="main-mailbit-input"
          maxLength={10000}
        />

        {/* Quick Clear Action when text exists */}
        {value.length > 0 && !disabled && !isSubmitting && (
          <button
            type="button"
            className="sketch-clear-text-btn"
            onClick={handleClear}
            title="Clear text"
            aria-label="Clear text input"
          >
            ✕
          </button>
        )}

        {/* Voice Dictation (STT) Microphone Button */}
        <button
          type="button"
          className={`sketch-mic-button ${isListening ? 'is-listening' : ''} ${
            !isSupported ? 'is-unsupported' : ''
          }`}
          onClick={handleMicToggle}
          disabled={disabled || isSubmitting}
          aria-label={micAriaLabel}
          title={micTitle}
          id="main-mic-btn"
        >
          {isListening ? (
            <svg
              viewBox="0 0 24 24"
              className="mic-svg mic-active-pulse"
              width="22"
              height="22"
              aria-hidden="true"
            >
              <rect
                x="8.5"
                y="2.5"
                width="7"
                height="11"
                rx="3.5"
                fill="#7F1D1D"
                stroke="#7F1D1D"
                strokeWidth="1.6"
              />
              <path
                d="M 5,10 C 5,14 8,17 12,17 C 16,17 19,14 19,10"
                fill="none"
                stroke="#7F1D1D"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="17"
                x2="12"
                y2="21"
                stroke="#7F1D1D"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1="8"
                y1="21"
                x2="16"
                y2="21"
                stroke="#7F1D1D"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="mic-svg" width="22" height="22" aria-hidden="true">
              <rect
                x="8.5"
                y="2.5"
                width="7"
                height="11"
                rx="3.5"
                fill="none"
                stroke="#11100D"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 5,10 C 5,14 8,17 12,17 C 16,17 19,14 19,10"
                fill="none"
                stroke="#11100D"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="17"
                x2="12"
                y2="21"
                stroke="#11100D"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1="8"
                y1="21"
                x2="16"
                y2="21"
                stroke="#11100D"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        {/* Tactile Hand-Drawn Paper-Plane / Send Button */}
        <button
          type="button"
          className="sketch-send-button"
          onClick={(e) => {
            e.stopPropagation()
            if (isListening) {
              stopListening()
            }
            if (value.trim() && !isSubmitting && !disabled) {
              onSubmit()
            }
          }}
          disabled={!value.trim() || isSubmitting || disabled}
          aria-label="Send text"
          title="Send and rewrite in selected tone (Press Enter)"
          id="main-send-btn"
        >
          <svg viewBox="0 0 42 42" className="send-plane-svg" aria-hidden="true">
            <path
              d="M 6,21 L 34,7 L 23,35 L 18,24 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 34,7 L 18,24"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Under-Input Stat Ribbon & Voice Status */}
      <div className="sketch-input-ribbon">
        {isListening ? (
          <div className="ribbon-stt-status listening" aria-live="polite">
            <span className="stt-pulsing-dot" aria-hidden="true" />
            <span className="stt-status-text">Listening... Speak now</span>
            <span className="stt-status-hint">(Click mic to finish)</span>
          </div>
        ) : sttError ? (
          <div className="ribbon-stt-status error" role="alert">
            <span className="stt-error-icon" aria-hidden="true">
              ⚠️
            </span>
            <span className="stt-error-text">{sttError}</span>
            <button
              type="button"
              className="stt-retry-prompt-btn"
              onClick={() => setPermissionDenied(true)}
              title="Fix microphone permission"
            >
              Fix Permission
            </button>
            <button
              type="button"
              className="stt-clear-error-btn"
              onClick={clearError}
              title="Dismiss error"
              aria-label="Dismiss error message"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="ribbon-counter">
            {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} / 10,000
          </span>
        )}

        {charCount > 9000 && <span className="ribbon-warning">Approaching character limit</span>}
      </div>
    </div>
  )
}
