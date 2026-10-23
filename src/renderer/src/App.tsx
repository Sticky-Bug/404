import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import type {
  PersonaId,
  ToneIntensity,
  ProviderStatus,
  RewriteResponse
} from './types/vibewrite-api'
import { BackgroundDoodles } from './components/BackgroundDoodles'
import { LaptopIllustration } from './components/LaptopIllustration'
import { TextInput } from './components/TextInput'
import { VibathonHeading } from './components/VibathonHeading'
import { ToneSelector } from './components/ToneSelector'
import { TONES_CONFIG } from './data/tones'
import { ResultSketchCard, type RewriteResultData } from './components/ResultSketchCard'
import { SettingsDialog } from './components/SettingsDialog'
import { StatusMessage, type StatusToast } from './components/StatusMessage'

export function App(): React.JSX.Element {
  const [draft, setDraft] = useState<string>('')
  const [selectedToneId, setSelectedToneId] = useState<string>('ceo')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [result, setResult] = useState<RewriteResultData | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([])
  const [toast, setToast] = useState<StatusToast | null>(null)

  const hasBridge = typeof window !== 'undefined' && Boolean(window.vibewrite)

  useEffect(() => {
    let isMounted = true
    const fetchStatuses = async (): Promise<void> => {
      if (window.vibewrite) {
        try {
          const statuses = await window.vibewrite.getProviderStatus()
          if (isMounted) {
            setProviderStatuses(statuses)
          }
        } catch (err) {
          console.error('Failed to query provider status:', err)
        }
      }
    }
    fetchStatuses()
    return () => {
      isMounted = false
    }
  }, [])

  const handleRefreshStatuses = async (): Promise<void> => {
    if (window.vibewrite) {
      try {
        const statuses = await window.vibewrite.getProviderStatus()
        setProviderStatuses(statuses)
      } catch (err) {
        console.error('Failed to query provider status:', err)
      }
    }
  }

  // Map 8 Vibathon tones to bridge persona & instructions
  const getPersonaMapping = (
    toneId: string
  ): { personaId: PersonaId; intensity: ToneIntensity; customInstruction?: string } => {
    switch (toneId) {
      case 'ceo':
        return { personaId: 'executive', intensity: 'bold' }
      case 'gen-z':
        return { personaId: 'gen-z', intensity: 'balanced' }
      case 'lawyer':
        return { personaId: 'legal', intensity: 'bold' }
      case 'professional':
        return {
          personaId: 'diplomatic',
          intensity: 'balanced',
          customInstruction: 'Crisp, structured corporate professional phrasing'
        }
      case 'friendly':
        return { personaId: 'friendly', intensity: 'balanced' }
      case 'roast':
        return {
          personaId: 'persuasive',
          intensity: 'bold',
          customInstruction: 'Witty, playful roasting style with humorous observations'
        }
      case 'romantic':
        return {
          personaId: 'custom',
          intensity: 'balanced',
          customInstruction: 'Warm, poetic, affectionately romantic expression'
        }
      case 'motivational':
        return {
          personaId: 'supportive',
          intensity: 'bold',
          customInstruction: 'High-energy, uplifting motivational coaching tone'
        }
      default:
        return { personaId: 'executive', intensity: 'balanced' }
    }
  }

  const handleCopyText = async (text: string): Promise<void> => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard is unavailable.')
      }
      await navigator.clipboard.writeText(text)
      setToast({ type: 'info', message: 'Copied rewritten vibe to clipboard!' })
    } catch {
      setToast({ type: 'error', message: 'Failed to copy to clipboard.' })
    }
  }

  const handleSend = async (): Promise<void> => {
    const trimmed = draft.trim()
    if (!trimmed) return

    const activeTone = TONES_CONFIG.find((t) => t.id === selectedToneId)
    const toneLabel = activeTone ? activeTone.label : selectedToneId
    const mapping = getPersonaMapping(selectedToneId)

    setIsGenerating(true)
    setResult(null)

    if (!window.vibewrite) {
      // Standalone preview fallback when running without Electron bridge
      setTimeout(() => {
        setIsGenerating(false)
        setResult({
          toneLabel,
          originalDraft: trimmed,
          rewrittenText: `[${toneLabel} Vibe]: ${trimmed} (Standalone preview mode: Electron bridge not detected. Connect to User 2 bridge for live AI rewrites).`,
          provider: 'local',
          model: 'preview-engine',
          fallbackUsed: false,
          isOffline: true
        })
      }, 700)
      return
    }

    try {
      const response: RewriteResponse = await window.vibewrite.generateRewrite({
        draft: trimmed,
        personaId: mapping.personaId,
        intensity: mapping.intensity,
        customInstruction: mapping.customInstruction
      })

      setIsGenerating(false)

      if (response.ok) {
        setResult({
          toneLabel,
          originalDraft: trimmed,
          rewrittenText: response.text,
          provider: response.provider,
          model: response.model,
          fallbackUsed: response.fallbackUsed,
          isOffline: response.provider === 'local'
        })

        // Celebratory confetti burst
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.75 },
          colors: ['#11100D', '#E6D7BC', '#D7C19E', '#7C4A3A']
        })
      } else {
        setResult({
          toneLabel,
          originalDraft: trimmed,
          rewrittenText: '',
          provider: 'none',
          model: 'none',
          fallbackUsed: false,
          isOffline: false,
          error: `${response.error} (Attempted: ${response.providersAttempted.join(', ')})`
        })
      }
    } catch (err: unknown) {
      setIsGenerating(false)
      setResult({
        toneLabel,
        originalDraft: trimmed,
        rewrittenText: '',
        provider: 'none',
        model: 'none',
        fallbackUsed: false,
        isOffline: false,
        error: err instanceof Error ? err.message : 'Unknown generation error'
      })
    }
  }

  const handleTryOffline = async (): Promise<void> => {
    if (!window.vibewrite || !draft.trim()) return

    const activeTone = TONES_CONFIG.find((t) => t.id === selectedToneId)
    const toneLabel = activeTone ? activeTone.label : selectedToneId
    const mapping = getPersonaMapping(selectedToneId)

    setIsGenerating(true)

    try {
      const res = await window.vibewrite.generateOfflineRewrite({
        draft: draft.trim(),
        personaId: mapping.personaId,
        intensity: mapping.intensity,
        customInstruction: mapping.customInstruction
      })

      setIsGenerating(false)

      if (res.ok) {
        setResult({
          toneLabel,
          originalDraft: draft.trim(),
          rewrittenText: res.text,
          provider: res.provider,
          model: res.model,
          fallbackUsed: res.fallbackUsed,
          isOffline: true
        })
      } else {
        setResult({
          toneLabel,
          originalDraft: draft.trim(),
          rewrittenText: '',
          provider: 'local',
          model: 'basic',
          fallbackUsed: false,
          isOffline: true,
          error: res.error
        })
      }
    } catch (err) {
      setIsGenerating(false)
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Offline rewrite failed'
      })
    }
  }

  const configuredCount = providerStatuses.filter((p) => p.configured).length

  return (
    <div className="vibathon-page-container">
      {/* Decorative Background Ink Doodles in Corners */}
      <BackgroundDoodles />

      {/* Discreet Navigation / Secret Bar */}
      <nav className="vibathon-nav-bar" aria-label="Application toolbar">
        <div className="brand-handwritten">
          <span>✎ VibeWrite</span>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="sketch-pill-btn"
            onClick={() => setIsSettingsOpen(true)}
            id="open-settings-nav-btn"
            title="Configure AI API keys"
          >
            ⚙ Settings {hasBridge && configuredCount > 0 ? `(${configuredCount} ready)` : ''}
          </button>
        </div>
      </nav>

      {/* Status Toasts */}
      <StatusMessage toast={toast} onDismiss={() => setToast(null)} />

      {/* Main Interactive Stage */}
      <main className="vibathon-main-stage">
        {/* 1. Laptop and Emerging Hand Illustration */}
        <section className="laptop-stage-area">
          <LaptopIllustration />
        </section>

        {/* 2. Central Beige Pill Input */}
        <TextInput
          value={draft}
          onChange={setDraft}
          onSubmit={handleSend}
          isSubmitting={isGenerating}
          placeholder="Enter your text here..."
        />

        {/* 3. Section Title: "OUR VIBATHON" */}
        <VibathonHeading />

        {/* 4. Eight Tone Pills in 2 Centered Rows */}
        <ToneSelector
          selectedToneId={selectedToneId}
          onSelectTone={setSelectedToneId}
          disabled={isGenerating}
        />

        {/* 5. Rewritten Result / Diff View Card */}
        <ResultSketchCard
          result={result}
          isLoading={isGenerating}
          onCopy={handleCopyText}
          onDismiss={() => setResult(null)}
          onTryOffline={handleTryOffline}
        />
      </main>

      {/* Modal Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStatusUpdate={handleRefreshStatuses}
      />
    </div>
  )
}

export default App
