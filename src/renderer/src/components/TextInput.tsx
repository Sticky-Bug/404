import React, { useState, useRef } from 'react'

interface TextInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  disabled?: boolean
  placeholder?: string
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  disabled = false,
  placeholder = 'Enter your text here...'
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isSubmitting && !disabled) {
        onSubmit()
      }
    }
  }

  const handleContainerClick = (): void => {
    inputRef.current?.focus()
  }

  return (
    <div
      className={`sketch-input-container ${isFocused ? 'focused' : ''} ${
        disabled ? 'disabled' : ''
      }`}
      onClick={handleContainerClick}
      role="search"
    >
      <input
        ref={inputRef}
        type="text"
        className="sketch-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        aria-label="Input draft text to rewrite"
        id="main-vibewrite-input"
        maxLength={10000}
      />

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
        title="Send and rewrite text"
        id="main-send-btn"
      >
        {/* Hand-Drawn Paper-Plane / Send Icon in Pure SVG matching reference */}
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
  )
}
