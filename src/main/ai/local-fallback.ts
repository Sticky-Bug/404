import type { PersonaId, ToneIntensity } from './personas'
import { getLanguageByCode } from './languages'

export function generateBasicOfflineRewrite(
  draft: string,
  personaId: PersonaId,
  _intensity: ToneIntensity,
  customInstruction?: string,
  languageCode = 'auto'
): { text: string; provider: 'local'; model: string; fallbackUsed: boolean } {
  const lang = getLanguageByCode(languageCode)

  // 1. If an explicit non-English language was requested, reject with honest limitation message
  if (!lang.isAuto && lang.code !== 'en') {
    throw new Error(
      `Multilingual rewriting (${lang.label}) is unavailable in offline fallback. Reconnect to an AI provider or choose a supported offline language.`
    )
  }

  // 2. If Auto mode is selected, check if draft contains non-Latin scripts (Cyrillic, Devanagari, Arabic, CJK, etc.)
  const hasNonLatinScript =
    /\p{Script=Cyrillic}|\p{Script=Devanagari}|\p{Script=Arabic}|\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(
      draft
    )
  if (lang.isAuto && hasNonLatinScript) {
    throw new Error(
      'Multilingual rewriting is unavailable in offline fallback. Reconnect to an AI provider or choose a supported offline language.'
    )
  }

  const trimmed = draft.trim()
  const firstSentence = trimmed.split(/[.!?]\s+/)[0] || trimmed

  let transformed: string

  switch (personaId) {
    case 'executive':
      transformed = `Bottom line: ${trimmed}\n\nKey Action Required: Please review the above and confirm approval.`
      break
    case 'supportive':
      transformed = `Thanks so much for putting this together! Great foundation here: "${firstSentence}". Let's team up to push this across the finish line: ${trimmed}`
      break
    case 'legal':
      transformed = `Please note the following communication for your records and review:\n\n${trimmed}\n\nSubject to final confirmation and mutual agreement.`
      break
    case 'gen-z':
      transformed = `ngl here is the rundown: ${trimmed.toLowerCase()} — let me know what you think!`
      break
    case 'diplomatic':
      transformed = `Thank you for sharing your thoughts on this matter. In reviewing the details, here is the balanced perspective:\n\n${trimmed}\n\nWe look forward to finding a mutually constructive next step.`
      break
    case 'friendly':
      transformed = `Hi there! Hope you're having a wonderful day. Wanted to share a quick update with you:\n\n${trimmed}\n\nTalk soon!`
      break
    case 'persuasive':
      transformed = `Here is why this matters now:\n\n${trimmed}\n\nTaking action today will ensure immediate momentum and maximum results.`
      break
    case 'custom':
      transformed = `[Style note: ${customInstruction || 'Custom'}]\n\n${trimmed}`
      break
    default:
      transformed = trimmed
  }

  return {
    text: transformed,
    provider: 'local',
    model: 'basic-template',
    fallbackUsed: true
  }
}
