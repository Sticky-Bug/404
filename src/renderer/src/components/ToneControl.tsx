import React from 'react'
import type { ToneIntensity } from '../types/vibewrite-api'

interface ToneControlProps {
  intensity: ToneIntensity
  onChange: (val: ToneIntensity) => void
  disabled?: boolean
}

const TONES: { id: ToneIntensity; label: string; desc: string }[] = [
  { id: 'subtle', label: 'Subtle', desc: 'Gentle nudges, retains draft phrasing closely' },
  {
    id: 'balanced',
    label: 'Balanced',
    desc: 'Harmonious blend of persona voice and original text'
  },
  { id: 'bold', label: 'Bold', desc: 'Deep stylistic rewrite with maximum persona personality' }
]

export const ToneControl: React.FC<ToneControlProps> = ({
  intensity,
  onChange,
  disabled = false
}) => {
  return (
    <div className="tone-control-group">
      <span className="section-label" id="tone-control-label">
        Tone Intensity
      </span>
      <div className="tone-buttons" role="radiogroup" aria-labelledby="tone-control-label">
        {TONES.map((t) => {
          const isActive = intensity === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`tone-btn ${isActive ? 'active' : ''}`}
              onClick={() => onChange(t.id)}
              disabled={disabled}
              id={`tone-btn-${t.id}`}
              title={t.desc}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
