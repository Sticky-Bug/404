import React from 'react'
import { countWords } from '../lib/diff'

interface DraftEditorProps {
  draft: string
  onChange: (val: string) => void
  onClear: () => void
  disabled?: boolean
  maxLength?: number
}

export const DraftEditor: React.FC<DraftEditorProps> = ({
  draft,
  onChange,
  onClear,
  disabled = false,
  maxLength = 10000
}) => {
  const charCount = draft.length
  const wordCount = countWords(draft)
  const isNearLimit = charCount > maxLength * 0.85
  const isOverLimit = charCount > maxLength

  return (
    <div className="editor-container">
      <div className="section-label-row">
        <label htmlFor="draft-textarea" className="section-label">
          Rough Draft
        </label>
        {draft.length > 0 && (
          <button
            type="button"
            className="btn-ghost"
            onClick={onClear}
            disabled={disabled}
            id="clear-draft-btn"
          >
            Clear draft
          </button>
        )}
      </div>

      <div className="editor-textarea-wrapper">
        <textarea
          id="draft-textarea"
          className="editor-textarea"
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or type your unpolished email, proposal, note, or message here..."
          disabled={disabled}
          maxLength={maxLength + 500} // allow typing slightly past to show limit warning
          rows={9}
          aria-describedby="editor-counter-status"
        />
      </div>

      <div className="editor-footer" id="editor-counter-status">
        <div className="editor-counters">
          <span>{wordCount} words</span>
          <span>•</span>
          <span
            className={isOverLimit ? 'counter-danger' : isNearLimit ? 'counter-warn' : undefined}
          >
            {charCount.toLocaleString()} / {maxLength.toLocaleString()} characters
          </span>
        </div>

        {isOverLimit && (
          <span className="counter-danger" role="alert">
            Draft exceeds 10,000 character maximum limit. Please shorten before generating.
          </span>
        )}
      </div>
    </div>
  )
}
