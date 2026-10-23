import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  ISpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from '../types/speech-recognition'

export interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean
  isListening: boolean
  error: string | null
  permissionDenied: boolean
  setPermissionDenied: (denied: boolean) => void
  clearError: () => void
  requestMicrophonePermission: () => Promise<boolean>
  startListening: (callbacks?: {
    onInterim?: (interim: string) => void
    onFinal?: (final: string) => void
    onTranscript?: (fullTranscript: string, isFinal: boolean) => void
  }) => Promise<void>
  stopListening: () => void
  toggleListening: () => Promise<void>
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang, continuous = true, interimResults = true } = options

  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const callbacksRef = useRef<{
    onInterim?: (interim: string) => void
    onFinal?: (final: string) => void
    onTranscript?: (fullTranscript: string, isFinal: boolean) => void
  }>({})

  // Determine browser / client-side support safely
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  const clearError = useCallback(() => {
    setError(null)
    setPermissionDenied(false)
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Recognition might already be stopped
      }
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // Explicitly prompt the user/browser for microphone access using getUserMedia
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return true
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Permission granted: immediately release the stream so audio device is free
      stream.getTracks().forEach((track) => track.stop())
      setPermissionDenied(false)
      setError(null)
      return true
    } catch (err: unknown) {
      console.warn('Microphone permission request was denied or blocked:', err)
      setPermissionDenied(true)
      setError('Microphone access denied. Please grant microphone permission.')
      return false
    }
  }, [])

  const startListening = useCallback(
    async (callbacks = {}) => {
      clearError()

      if (!isSupported) {
        setError('Speech recognition is not supported in this browser or environment.')
        return
      }

      // Pre-flight check: ensure user has granted microphone permission
      const hasPermission = await requestMicrophonePermission()
      if (!hasPermission) {
        setIsListening(false)
        return
      }

      // If an existing session is running, stop it first to prevent duplicates
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore abort errors
        }
        recognitionRef.current = null
      }

      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognitionClass) {
        setError('Speech recognition constructor is unavailable.')
        return
      }

      try {
        const recognition = new SpeechRecognitionClass()
        recognitionRef.current = recognition
        callbacksRef.current = callbacks

        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.lang =
          lang ||
          (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US')

        let accumulatedFinal = ''

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
          setPermissionDenied(false)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentFinalChunk = ''
          let currentInterimChunk = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i]
            const transcript = res[0]?.transcript || ''
            if (res.isFinal) {
              currentFinalChunk += transcript
            } else {
              currentInterimChunk += transcript
            }
          }

          if (currentFinalChunk) {
            accumulatedFinal += (accumulatedFinal ? ' ' : '') + currentFinalChunk.trim()
            callbacksRef.current.onFinal?.(currentFinalChunk.trim())
          }

          if (currentInterimChunk) {
            callbacksRef.current.onInterim?.(currentInterimChunk.trim())
          }

          const combined = [accumulatedFinal, currentInterimChunk.trim()]
            .filter(Boolean)
            .join(' ')
            .trim()

          callbacksRef.current.onTranscript?.(combined, Boolean(currentFinalChunk))
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errCode = event.error
          if (errCode === 'aborted') {
            // User aborted or stopped recognition intentionally
            return
          }

          let friendlyMessage: string
          switch (errCode) {
            case 'not-allowed':
              friendlyMessage = 'Microphone access denied. Please allow microphone permissions.'
              setPermissionDenied(true)
              break
            case 'no-speech':
              friendlyMessage = 'No speech was detected. Please try speaking again.'
              break
            case 'audio-capture':
              friendlyMessage = 'No microphone was found or microphone is unavailable.'
              break
            case 'network':
              friendlyMessage =
                'Speech recognition service unreachable. Please check your network connection.'
              break
            default:
              friendlyMessage = `Voice recognition error: ${errCode || 'Unknown error'}`
              break
          }

          setError(friendlyMessage)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
          recognitionRef.current = null
        }

        recognition.start()
      } catch (err: unknown) {
        setIsListening(false)
        recognitionRef.current = null
        setError(
          err instanceof Error
            ? `Failed to start microphone: ${err.message}`
            : 'Could not activate microphone'
        )
      }
    },
    [clearError, continuous, interimResults, isSupported, lang, requestMicrophonePermission]
  )

  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening()
    } else {
      await startListening()
    }
  }, [isListening, startListening, stopListening])

  // Cleanup on unmount to avoid runaway recognition sessions
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore cleanup errors
        }
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isSupported,
    isListening,
    error,
    permissionDenied,
    setPermissionDenied,
    clearError,
    requestMicrophonePermission,
    startListening,
    stopListening,
    toggleListening
  }
}
