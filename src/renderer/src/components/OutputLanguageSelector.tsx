import React, { useState, useRef, useEffect, useId } from 'react'
import {
  SUPPORTED_LANGUAGES,
  getLanguageByCode,
  type LanguageOption
} from '../data/languages'

interface OutputLanguageSelectorProps {
  selectedCode: string
  onSelectLanguage: (code: string) => void
  disabled?: boolean
}

export const OutputLanguageSelector: React.FC<OutputLanguageSelectorProps> = ({
  selectedCode,
  onSelectLanguage,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const listboxId = useId()
  const currentLang = getLanguageByCode(selectedCode)

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      lang.label.toLowerCase().includes(q) ||
      lang.englishName.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    )
  })

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeItem = listRef.current.children[
        highlightedIndex
      ] as HTMLElement
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleToggle = (): void => {
    if (disabled) return
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        setHighlightedIndex(0)
      }
      return next
    })
    setSearchQuery('')
  }

  const handleSelect = (lang: LanguageOption): void => {
    onSelectLanguage(lang.code)
    setIsOpen(false)
    setSearchQuery('')
    buttonRef.current?.focus()
  }

  const handleButtonKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>
  ): void => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setHighlightedIndex(0)
      setIsOpen(true)
    }
  }

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setSearchQuery('')
      buttonRef.current?.focus()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredLanguages.length - 1 ? prev + 1 : 0
      )
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredLanguages.length - 1
      )
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const item = filteredLanguages[highlightedIndex]
      if (item) {
        handleSelect(item)
      }
    }
  }

  return (
    <div
      className="output-language-selector-container"
      ref={containerRef}
      style={{ position: 'relative' }}
    >
      <button
        ref={buttonRef}
        type="button"
        id="output-language-selector-btn"
        className={`output-language-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleButtonKeyDown}
        disabled={disabled}
        aria-label="Output language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        title={`Current output language: ${currentLang.label}. Click to change.`}
      >
        <span className="lang-globe-icon" aria-hidden="true">
          🌐
        </span>
        <span className="lang-trigger-label">
          Language: <strong>{currentLang.label}</strong>
        </span>
        <span
          className={`lang-trigger-chevron ${isOpen ? 'up' : 'down'}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="output-language-dropdown" role="dialog" aria-modal="true">
          {/* Search Box */}
          <div className="lang-search-wrapper">
            <span className="lang-search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="lang-search-input"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setHighlightedIndex(0)
              }}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search output languages"
            />
            {searchQuery && (
              <button
                type="button"
                className="lang-search-clear-btn"
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                title="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Languages List */}
          <ul
            ref={listRef}
            id={listboxId}
            className="lang-options-list"
            role="listbox"
            aria-label="Available output languages"
          >
            {filteredLanguages.length === 0 ? (
              <li className="lang-empty-state" role="presentation">
                No matching language found
              </li>
            ) : (
              filteredLanguages.map((lang, index) => {
                const isSelected =
                  lang.code.toLowerCase() === selectedCode.toLowerCase()
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    key={lang.code}
                    role="option"
                    aria-selected={isSelected}
                    className={`lang-option-item ${isSelected ? 'selected' : ''} ${
                      isHighlighted ? 'highlighted' : ''
                    }`}
                    onClick={() => handleSelect(lang)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="lang-item-main">
                      <span className="lang-item-label">{lang.label}</span>
                      {lang.nativeName && lang.nativeName !== lang.label && (
                        <span className="lang-item-native">
                          ({lang.nativeName})
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="lang-check-badge" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
