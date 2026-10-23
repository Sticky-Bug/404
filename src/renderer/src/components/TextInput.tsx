import React, { useState, useRef, useEffect } from 'react'

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
        onSubmit()
      }
    }
  }

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onChange('')
    inputRef.current?.focus()
  }

  const charCount = value.length
  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="sketch-input-module">
      <div
        className={`sketch-input-container ${isFocused ? 'focused' : ''} ${
          disabled ? 'disabled' : ''
        }`}
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
          placeholder={PROMPT_HINTS[hintIndex]}
          disabled={disabled || isSubmitting}
          aria-label="Draft text to rewrite"
          id="main-vibewrite-input"
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

        {/* Tactile Hand-Drawn Paper-Plane / Send Button */}
        <button
          type="button"
          className="sketch-send-button"
          onClick={(e) => {
            e.stopPropagation()
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

      {/* Under-Input Stat Ribbon (Discrete words & character limits) */}
      <div className="sketch-input-ribbon">
        <span className="ribbon-counter">
          {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} / 10,000
        </span>
        {charCount > 9000 && <span className="ribbon-warning">Approaching character limit</span>}
      </div>
    </div>
  )
}
