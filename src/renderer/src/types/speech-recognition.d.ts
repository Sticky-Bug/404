export interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

export interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message?: string
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => void) | null
  onaudioend: ((this: ISpeechRecognition, ev: Event) => void) | null
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onnomatch: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => void) | null
  onsoundend: ((this: ISpeechRecognition, ev: Event) => void) | null
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => void) | null
  onspeechend: ((this: ISpeechRecognition, ev: Event) => void) | null
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null
}

export interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}
