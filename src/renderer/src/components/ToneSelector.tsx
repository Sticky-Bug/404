import React from 'react'
import { ToneButton } from './ToneButton'
import { TONES_CONFIG } from '../data/tones'

interface ToneSelectorProps {
  selectedToneId: string
  onSelectTone: (id: string) => void
  disabled?: boolean
}

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  selectedToneId,
  onSelectTone,
  disabled = false
}) => {
  const row1 = TONES_CONFIG.filter((t) => t.row === 1)
  const row2 = TONES_CONFIG.filter((t) => t.row === 2)

  return (
    <section className="sketch-tones-section" aria-label="Personality and Tone Selection">
      {/* Row 1 */}
      <div className="sketch-tones-row" role="group" aria-label="Tone options row 1">
        {row1.map((tone) => (
          <ToneButton
            key={tone.id}
            tone={tone}
            isSelected={selectedToneId === tone.id}
            onClick={onSelectTone}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Row 2 */}
      <div className="sketch-tones-row" role="group" aria-label="Tone options row 2">
        {row2.map((tone) => (
          <ToneButton
            key={tone.id}
            tone={tone}
            isSelected={selectedToneId === tone.id}
            onClick={onSelectTone}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  )
}
