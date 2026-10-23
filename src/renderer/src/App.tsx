import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import type {
  PersonaId,
  ToneIntensity,
  ProviderStatus,
  RewriteResponse
} from './types/vibewrite-api'
import { BackgroundDoodles } from './components/BackgroundDoodles'
import { TitleBar } from './components/TitleBar'
import { LaptopIllustration } from './components/LaptopIllustration'
import { TextInput } from './components/TextInput'
import { VibathonHeading } from './components/VibathonHeading'
import { ToneSelector } from './components/ToneSelector'
import { TONES_CONFIG } from './data/tones'
import { getLanguageByCode } from './data/languages'
import { ResultSketchCard, type RewriteResultData } from './components/ResultSketchCard'
import { OutputLanguageSelector } from './components/OutputLanguageSelector'
import { EmailDeliveryPanel } from './components/EmailDeliveryPanel'
import { SettingsDialog } from './components/SettingsDialog'
import { StatusMessage, type StatusToast } from './components/StatusMessage'

export function App(): React.JSX.Element {
  const [draft, setDraft] = useState<string>('')
  const [selectedToneId, setSelectedToneId] = useState<string>('ceo')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto')
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
    const currentLanguage = selectedLanguage
    const langOption = getLanguageByCode(currentLanguage)

    setIsGenerating(true)
    setResult(null)

    if (!window.vibewrite) {
      // Standalone preview fallback when running without Electron bridge
      setTimeout(() => {
        setIsGenerating(false)
        setResult({
          toneLabel,
          originalDraft: trimmed,
          rewrittenText: `[${toneLabel} Vibe${langOption.isAuto ? '' : ` (${langOption.label})`}]: ${trimmed} (Standalone preview mode: Electron bridge not detected. Connect to User 2 bridge for live AI rewrites).`,
          provider: 'local',
          model: 'preview-engine',
          fallbackUsed: false,
          isOffline: true,
          language: currentLanguage,
          languageLabel: langOption.isAuto ? undefined : langOption.label
        })
      }, 700)
      return
    }

    try {
      const response: RewriteResponse = await window.vibewrite.generateRewrite({
        draft: trimmed,
        personaId: mapping.personaId,
        intensity: mapping.intensity,
        customInstruction: mapping.customInstruction,
        language: currentLanguage
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
          isOffline: response.provider === 'local',
          language: currentLanguage,
          languageLabel: langOption.isAuto ? undefined : langOption.label
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
          language: currentLanguage,
          languageLabel: langOption.isAuto ? undefined : langOption.label,
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
        language: currentLanguage,
        languageLabel: langOption.isAuto ? undefined : langOption.label,
        error: err instanceof Error ? err.message : 'Unknown generation error'
      })
    }
  }

  const handleTryOffline = async (): Promise<void> => {
    if (!window.vibewrite || !draft.trim()) return

    const activeTone = TONES_CONFIG.find((t) => t.id === selectedToneId)
    const toneLabel = activeTone ? activeTone.label : selectedToneId
    const mapping = getPersonaMapping(selectedToneId)
    const currentLanguage = selectedLanguage
    const langOption = getLanguageByCode(currentLanguage)

    setIsGenerating(true)

    try {
      const res = await window.vibewrite.generateOfflineRewrite({
        draft: draft.trim(),
        personaId: mapping.personaId,
        intensity: mapping.intensity,
        customInstruction: mapping.customInstruction,
        language: currentLanguage
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
          isOffline: true,
          language: currentLanguage,
          languageLabel: langOption.isAuto ? undefined : langOption.label
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
          language: currentLanguage,
          languageLabel: langOption.isAuto ? undefined : langOption.label,
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

      {/* Themed Notebook Title Bar with Logo & Actions */}
      <TitleBar
        configuredCount={configuredCount}
        hasBridge={hasBridge}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

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

        {/* 2b. Drafting Action Row: Convert to Persona + Output Language Selector */}
        <div className="drafting-actions-bar" role="toolbar" aria-label="Drafting actions">
          <button
            type="button"
            className="convert-persona-primary-btn"
            id="convert-to-persona-btn"
            onClick={handleSend}
            disabled={!draft.trim() || isGenerating}
            title="Convert draft into selected persona (or press Enter)"
            aria-label="Convert to Persona"
          >
            <span className="sparkle-icon" aria-hidden="true">
              ✨
            </span>
            <span>{isGenerating ? 'Converting...' : 'Convert to Persona'}</span>
          </button>

          <OutputLanguageSelector
            selectedCode={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            disabled={isGenerating}
          />
        </div>

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

        {/* 6. Email Participants & Delivery Panel (RFC 2822 & Gmail API) */}
        <EmailDeliveryPanel
          currentVibeText={result?.rewrittenText}
          currentVibeTone={result?.toneLabel}
          onToast={setToast}
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
