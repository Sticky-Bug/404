import React from 'react'
import type { PersonaId } from '../types/vibewrite-api'
import { PERSONAS } from '../data/personas'

interface PersonaPickerProps {
  selectedPersonas: PersonaId[]
  onTogglePersona: (id: PersonaId) => void
  customInstruction: string
  onCustomInstructionChange: (val: string) => void
  disabled?: boolean
  maxSelection?: number
}

export const PersonaPicker: React.FC<PersonaPickerProps> = ({
  selectedPersonas,
  onTogglePersona,
  customInstruction,
  onCustomInstructionChange,
  disabled = false,
  maxSelection = 3
}) => {
  const isCustomSelected = selectedPersonas.includes('custom')
  const count = selectedPersonas.length

  return (
    <div className="persona-picker-section">
      <div className="section-label-row">
        <span className="section-label" id="persona-group-label">
          Target Personas ({count}/{maxSelection} selected)
        </span>
        <span className={`selection-limit-hint ${count === maxSelection ? 'maxed' : ''}`}>
          {count === maxSelection
            ? 'Maximum 3 personas selected'
            : `Select up to ${maxSelection} personas`}
        </span>
      </div>

      <div className="personas-grid" role="group" aria-labelledby="persona-group-label">
        {PERSONAS.map((p) => {
          const isSelected = selectedPersonas.includes(p.id)
          const isAtLimit = count >= maxSelection && !isSelected

          return (
            <button
              key={p.id}
              type="button"
              className={`persona-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onTogglePersona(p.id)}
              disabled={disabled || isAtLimit}
              aria-pressed={isSelected}
              id={`persona-btn-${p.id}`}
            >
              <div className="persona-card-header">
                <span className="persona-name">{p.name}</span>
                <span className="persona-badge">{p.badgeLabel}</span>
              </div>
              <span className="persona-tagline">{p.tagline}</span>
              <p className="persona-desc">{p.description}</p>
            </button>
          )
        })}
      </div>

      {isCustomSelected && (
        <div className="custom-instruction-box">
          <label htmlFor="custom-persona-input" className="section-label">
            Custom Persona Style & Guidelines
          </label>
          <input
            id="custom-persona-input"
            type="text"
            className="custom-instruction-input"
            placeholder="e.g. Sarcastic tech founder, or Victorian formal novelist, or kindergarten teacher..."
            value={customInstruction}
            onChange={(e) => onCustomInstructionChange(e.target.value)}
            disabled={disabled}
            maxLength={250}
          />
        </div>
      )}
    </div>
  )
}
