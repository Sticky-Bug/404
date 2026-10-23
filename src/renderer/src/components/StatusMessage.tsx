import React from 'react'

export interface StatusToast {
  type: 'info' | 'warning' | 'error'
  message: string
}

interface StatusMessageProps {
  toast: StatusToast | null
  onDismiss: () => void
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ toast, onDismiss }) => {
  if (!toast) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast-banner ${toast.type}`}
      id="status-banner"
    >
      <span>{toast.message}</span>
      <button
        type="button"
        className="btn-ghost"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        Dismiss
      </button>
    </div>
  )
}
