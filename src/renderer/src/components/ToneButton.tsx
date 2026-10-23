import React from 'react'

export interface ToneItem {
  id: string
  label: string
  iconType: 'sparkles' | 'star' | 'scale' | 'briefcase' | 'smile' | 'flame' | 'heart' | 'crown'
  row: 1 | 2
}

interface ToneButtonProps {
  tone: ToneItem
  isSelected: boolean
  onClick: (id: string) => void
  disabled?: boolean
}

export const ToneButton: React.FC<ToneButtonProps> = ({
  tone,
  isSelected,
  onClick,
  disabled = false
}) => {
  const renderIcon = (): React.JSX.Element => {
    switch (tone.iconType) {
      case 'sparkles':
        // Sparkle outline for CEO
        return (
          <svg viewBox="0 0 24 24" className="tone-icon-svg" aria-hidden="true">
            <path
              d="M 12,2 Q 12,9 5,12 Q 12,12 12,22 Q 12,12 19,12 Q 12,12 12,2 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
        )
      case 'star':
        // Five-point star outline for Gen Z
        return (
          <svg viewBox="0 0 24 24" className="tone-icon-svg" aria-hidden="true">
            <path
              d="M 12,2 L 15,8.5 L 22,9.2 L 17,14 L 18.5,21 L 12,17.5 L 5.5,21 L 7,14 L 2,9.2 L 9,8.5 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )
      case 'scale':
        // Scales of justice outline for Lawyer
        return (
          <svg viewBox="0 0 24 24" className="tone-icon-svg" aria-hidden="true">
            <line
              x1="12"
              y1="3"
              x2="12"
              y2="21"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path d="M 5,6 L 19,6" stroke="#11100D" strokeWidth="2.2" strokeLinecap="round" />
            <path
              d="M 3,13 C 3,17 7,17 7,13 L 5,6 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M 17,13 C 17,17 21,17 21,13 L 19,6 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M 9,21 L 15,21" stroke="#11100D" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )
      case 'briefcase':
        // Briefcase outline for Professional
        return (
          <svg viewBox="0 0 24 24" className="tone-icon-svg" aria-hidden="true">
            <rect
              x="3"
              y="7"
              width="18"
              height="13"
              rx="2"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.2"
            />
            <path
              d="M 8,7 L 8,4 C 8,3 9,3 10,3 L 14,3 C 15,3 16,3 16,4 L 16,7"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.2"
            />
            <line x1="3" y1="12" x2="21" y2="12" stroke="#11100D" strokeWidth="2" />
            <rect x="10.5" y="11" width="3" height="3" fill="#11100D" />
          </svg>
        )
      case 'smile':
        // Friendly smile outline
        return (
          <svg viewBox="0 0 24 24" className="tone-icon-svg" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="#11100D" strokeWidth="2.2" />
            <circle cx="9" cy="10" r="1.3" fill="#11100D" />
            <circle cx="15" cy="10" r="1.3" fill="#11100D" />
            <path
              d="M 8,14 C 9.5,17 14.5,17 16,14"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )
      case 'flame':
        // Roast flame outline
        return (
          <svg viewBox="0 0 24 24" className="tone-icon-svg" aria-hidden="true">
            <path
              d="M 12,2 C 12,6 8,8 8,13 C 8,17 10,20 12,20 C 14,20 16,17 16,13 C 16,10 14,8 14,6 C 17,8 19,11 19,14 C 19,19 15.5,22 12,22 C 7.5,22 5,18 5,13 C 5,7 10,4 12,2 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
        )
      case 'heart':
        // Romantic heart outline
        return (
          <svg viewBox="0 0 24 24" className="tone-icon-svg" aria-hidden="true">
            <path
              d="M 12,20 C 12,20 3,14 3,8.5 C 3,5.5 5.5,3 8.5,3 C 10.5,3 11.5,4 12,5 C 12.5,4 13.5,3 15.5,3 C 18.5,3 21,5.5 21,8.5 C 21,14 12,20 12,20 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
        )
      case 'crown':
        // Motivational crown outline
        return (
          <svg viewBox="0 0 24 24" className="tone-icon-svg" aria-hidden="true">
            <path
              d="M 4,18 L 20,18 L 22,7 L 16,12 L 12,4 L 8,12 L 2,7 Z"
              fill="none"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <line
              x1="4"
              y1="20"
              x2="20"
              y2="20"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )
      default:
        return <div className="tone-icon-fallback" />
    }
  }

  return (
    <button
      type="button"
      className={`sketch-tone-pill ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(tone.id)}
      disabled={disabled}
      aria-pressed={isSelected}
      id={`tone-pill-${tone.id}`}
    >
      <span className="tone-pill-icon">{renderIcon()}</span>
      <span className="tone-pill-label">{tone.label}</span>
    </button>
  )
}
