import React from 'react'

interface TitleBarProps {
  configuredCount: number
  hasBridge: boolean
  onOpenSettings: () => void
}

export const TitleBar: React.FC<TitleBarProps> = ({
  configuredCount,
  hasBridge,
  onOpenSettings
}) => {
  return (
    <header className="sketch-titlebar" role="banner">
      {/* Brand & Hand-Drawn Logo */}
      <div className="titlebar-brand">
        {/* Hand-Drawn VibeWrite Logo: Pen nib + vibe sparkle in ink style */}
        <div className="sketch-logo-container" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="sketch-logo-svg">
            {/* Pen nib outline */}
            <path
              d="M 6,30 L 12,14 L 22,24 L 6,30 Z"
              fill="#E6D7BC"
              stroke="#11100D"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Nib center slit and breather hole */}
            <line
              x1="6"
              y1="30"
              x2="15"
              y2="21"
              stroke="#11100D"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="15.5" cy="20.5" r="1.5" fill="#11100D" />

            {/* Sparkle vibe wave bursting from nib tip */}
            <path
              d="M 25,6 Q 25,12 19,12 Q 25,12 25,18 Q 25,12 31,12 Q 25,12 25,6 Z"
              fill="#FAF9F4"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Mini sound/vibe arcs */}
            <path
              d="M 28,21 C 31,19 33,16 34,12"
              stroke="#7C4A3A"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 21,28 C 24,31 27,33 31,34"
              stroke="#11100D"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <div className="titlebar-text">
          <span className="app-title-main">VibeWrite</span>
          <span className="app-title-badge">Notebook Edition</span>
        </div>
      </div>

      {/* Right Controls: Provider Status Pill & Themed Settings Button */}
      <div className="titlebar-actions">
        <div
          className="titlebar-status-pill"
          title={
            hasBridge
              ? `${configuredCount} AI Provider${configuredCount === 1 ? '' : 's'} Ready`
              : 'Standalone Preview Mode'
          }
        >
          <span className={`status-ink-dot ${hasBridge && configuredCount > 0 ? 'active' : ''}`} />
          <span className="status-text">
            {hasBridge
              ? configuredCount > 0
                ? `${configuredCount} Provider${configuredCount > 1 ? 's' : ''}`
                : 'Keys Needed'
              : 'Preview Mode'}
          </span>
        </div>

        <button
          type="button"
          className="sketch-settings-btn"
          onClick={onOpenSettings}
          id="titlebar-settings-trigger"
          aria-label="Open AI Provider Settings"
        >
          <svg viewBox="0 0 24 24" className="settings-gear-svg" aria-hidden="true">
            <circle cx="12" cy="12" r="3.5" fill="none" stroke="#11100D" strokeWidth="2.2" />
            <path
              d="M 12,2 L 12,5 M 12,19 L 12,22 M 2,12 L 5,12 M 19,12 L 22,12 M 4.9,4.9 L 7.1,7.1 M 16.9,16.9 L 19.1,19.1 M 4.9,19.1 L 7.1,16.9 M 16.9,7.1 L 19.1,4.9"
              stroke="#11100D"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </header>
  )
}
