export interface LanguageOption {
  code: string
  label: string
  englishName: string
  nativeName: string
  isAuto?: boolean
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
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

export function getLanguageByCode(code?: string): LanguageOption {
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
