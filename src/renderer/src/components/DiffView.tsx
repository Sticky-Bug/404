import React, { useMemo } from 'react'
import { computeDiff } from '../lib/diff'

interface DiffViewProps {
  originalText: string
  rewrittenText: string
}

export const DiffView: React.FC<DiffViewProps> = ({ originalText, rewrittenText }) => {
  const analysis = useMemo(
    () => computeDiff(originalText, rewrittenText),
    [originalText, rewrittenText]
  )

  return (
    <div className="diff-container" aria-label="Word-level comparison view">
      <div className="diff-stats-bar">
        <div className="diff-stat-item">
          <span className="diff-stat-label">Original</span>
          <span className="diff-stat-val">{analysis.originalWordCount} words</span>
        </div>
        <div className="diff-stat-item">
          <span className="diff-stat-label">Rewritten</span>
          <span className="diff-stat-val">{analysis.rewrittenWordCount} words</span>
        </div>
        <div className="diff-stat-item">
          <span className="diff-stat-label">Words Added</span>
          <span className="diff-stat-val added">+{analysis.addedWordCount}</span>
        </div>
        <div className="diff-stat-item">
          <span className="diff-stat-label">Words Removed</span>
          <span className="diff-stat-val removed">-{analysis.removedWordCount}</span>
        </div>
        <div className="diff-stat-item">
          <span className="diff-stat-label">Approx. Edit Rate</span>
          <span className="diff-stat-val">{analysis.approximateEditRate}%</span>
        </div>
      </div>

      <p className="diff-edit-rate-note">
        * <strong>Approximate text edit rate</strong> measures raw word modifications, not a
        semantic similarity score or guarantee of preserved meaning. For cross-language rewrites,
        this view highlights structural and textual comparisons rather than word-for-word translation history.
      </p>

      <div className="diff-text-flow" role="region" aria-label="Visual diff comparison">
        {analysis.parts.map((part, index) => {
          if (part.added) {
            return (
              <ins key={index} className="diff-part-added">
                <span className="sr-only">[Added] </span>
                {part.value}
                <span className="sr-only"> [/Added]</span>
              </ins>
            )
          }
          if (part.removed) {
            return (
              <del key={index} className="diff-part-removed">
                <span className="sr-only">[Removed] </span>
                {part.value}
                <span className="sr-only"> [/Removed]</span>
              </del>
            )
          }
          return <span key={index}>{part.value}</span>
        })}
      </div>
    </div>
  )
}
