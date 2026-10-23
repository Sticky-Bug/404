import React from 'react'
import type { ProviderStatus } from '../types/vibewrite-api'

interface HeaderProps {
  hasBridge: boolean
  providerStatuses: ProviderStatus[]
  onOpenSettings: () => void
}

export const Header: React.FC<HeaderProps> = ({ hasBridge, providerStatuses, onOpenSettings }) => {
  const configuredCount = providerStatuses.filter((p) => p.configured).length

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-mark" aria-hidden="true">
          V
        </div>
        <div>
          <span className="brand-name">VibeWrite</span>
          <span className="brand-tagline">Persona Rewrite Studio</span>
        </div>
      </div>

      <div className="header-actions">
        <div
          className="bridge-status-pill"
          id="bridge-status-indicator"
          title={
            hasBridge
              ? `Electron bridge active (${configuredCount} provider${
                  configuredCount === 1 ? '' : 's'
                } configured)`
              : 'Standalone preview (window.vibewrite bridge not detected)'
          }
        >
          <span
            className={`status-dot ${hasBridge ? (configuredCount > 0 ? 'active' : 'warning') : 'danger'}`}
          />
          <span>
            {hasBridge
              ? configuredCount > 0
                ? `${configuredCount} AI Provider${configuredCount > 1 ? 's' : ''}`
                : 'No Cloud Keys'
              : 'Bridge Inactive'}
          </span>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onOpenSettings}
          id="open-settings-btn"
          aria-label="Open provider settings"
        >
          Settings
        </button>
      </div>
    </header>
  )
}
