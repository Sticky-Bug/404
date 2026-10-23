export interface LanguageDefinition {
  code: string
  label: string
  englishName: string
  nativeName: string
  isAuto?: boolean
}

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = [
  {
    code: 'auto',
    label: 'Auto',
    englishName: 'Auto (Detect)',
    nativeName: 'Auto Detect',
    isAuto: true
  },
  { code: 'en', label: 'English', englishName: 'English', nativeName: 'English' },
  { code: 'es', label: 'Spanish', englishName: 'Spanish', nativeName: 'Español' },
  { code: 'fr', label: 'French', englishName: 'French', nativeName: 'Français' },
  { code: 'de', label: 'German', englishName: 'German', nativeName: 'Deutsch' },
  { code: 'pt', label: 'Portuguese', englishName: 'Portuguese', nativeName: 'Português' },
  { code: 'it', label: 'Italian', englishName: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', label: 'Russian', englishName: 'Russian', nativeName: 'Русский' },
  { code: 'uk', label: 'Ukrainian', englishName: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ar', label: 'Arabic', englishName: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', label: 'Hindi', englishName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', englishName: 'Bengali', nativeName: 'বাংলা' },
  {
    code: 'zh-CN',
    label: 'Chinese (Simplified)',
    englishName: 'Simplified Chinese',
    nativeName: '简体中文'
  },
  {
    code: 'zh-TW',
    label: 'Chinese (Traditional)',
    englishName: 'Traditional Chinese',
    nativeName: '繁體中文'
  },
  { code: 'ja', label: 'Japanese', englishName: 'Japanese', nativeName: '日本語' },
  { code: 'ko', label: 'Korean', englishName: 'Korean', nativeName: '한국어' },
  { code: 'tr', label: 'Turkish', englishName: 'Turkish', nativeName: 'Türkçe' },
  { code: 'nl', label: 'Dutch', englishName: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', label: 'Polish', englishName: 'Polish', nativeName: 'Polski' },
  {
    code: 'id',
    label: 'Indonesian',
    englishName: 'Indonesian',
    nativeName: 'Bahasa Indonesia'
  },
  { code: 'vi', label: 'Vietnamese', englishName: 'Vietnamese', nativeName: 'Tiếng Việt' }
]

export function getLanguageByCode(code?: string): LanguageDefinition {
  if (!code || code === 'auto') return SUPPORTED_LANGUAGES[0]
  const clean = code.trim().toLowerCase()
  const found = SUPPORTED_LANGUAGES.find(
    (l) =>
      l.code.toLowerCase() === clean ||
      l.label.toLowerCase() === clean ||
      l.englishName.toLowerCase() === clean
  )
  return found || SUPPORTED_LANGUAGES[0]
}

export function buildLanguagePrompt(languageCode = 'auto'): string {
  const lang = getLanguageByCode(languageCode)

  if (lang.isAuto) {
    return `OUTPUT LANGUAGE REQUIREMENT (AUTO-DETECT):
- Detect the primary language of the user's draft.
- Write the complete rewritten output in that detected language.
- Preserve the original meaning, intent, facts, names, numbers, dates, and requested actions.
- Apply the selected persona and tone naturally in that language.
- Do NOT translate into English merely because system or application instructions are in English.
- If the draft contains multiple languages, use its dominant language unless the user explicitly requests otherwise.`
  }

  return `OUTPUT LANGUAGE REQUIREMENT (OUTPUT MANDATE: ${lang.englishName.toUpperCase()}):
- Write the complete rewritten output in **${lang.englishName}**.
- If the source draft is in another language, translate and rewrite it into ${lang.englishName} naturally and idiomatically.
- Apply the selected persona and tone in ${lang.englishName}.
- Preserve the source's meaning, intent, facts, names, numbers, dates, and requested actions.
- Do NOT return the main rewritten message in the source language.
- Keep proper names, URLs, code, and content that should not be translated unchanged.`
}
