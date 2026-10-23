import test from 'node:test'
import assert from 'node:assert/strict'

// Import built modules or test prompt generation and logic
import {
  SUPPORTED_LANGUAGES,
  getLanguageByCode,
  buildLanguagePrompt
} from '../src/main/ai/languages.ts'
import { buildSystemPrompt } from '../src/main/ai/personas.ts'
import { generateBasicOfflineRewrite } from '../src/main/ai/local-fallback.ts'

test('Bilingual: All 21 required languages are supported', () => {
  const requiredCodes = [
    'auto',
    'en',
    'es',
    'fr',
    'de',
    'pt',
    'it',
    'ru',
    'uk',
    'ar',
    'hi',
    'bn',
    'zh-CN',
    'zh-TW',
    'ja',
    'ko',
    'tr',
    'nl',
    'pl',
    'id',
    'vi'
  ]

  const availableCodes = SUPPORTED_LANGUAGES.map((l) => l.code)
  for (const code of requiredCodes) {
    assert.ok(
      availableCodes.includes(code),
      `Required language code "${code}" must be present in SUPPORTED_LANGUAGES`
    )
  }
})

test('Bilingual: Default language is Auto', () => {
  const def = getLanguageByCode()
  assert.equal(def.code, 'auto')
  assert.equal(def.isAuto, true)
})

test('Bilingual: Auto mode prompt builds correct detection instructions', () => {
  const prompt = buildLanguagePrompt('auto')
  assert.match(prompt, /OUTPUT LANGUAGE REQUIREMENT \(AUTO-DETECT\)/)
  assert.match(prompt, /Detect the primary language of the user's draft/)
  assert.match(prompt, /Write the complete rewritten output in that detected language/)
  assert.match(prompt, /Do NOT translate into English merely because system or application instructions are in English/)
})

test('Bilingual: Explicit language prompt builds correct mandate instructions', () => {
  // Russian test
  const ruPrompt = buildLanguagePrompt('ru')
  assert.match(ruPrompt, /OUTPUT MANDATE: RUSSIAN/)
  assert.match(ruPrompt, /Write the complete rewritten output in \*\*Russian\*\*/)
  assert.match(ruPrompt, /translate and rewrite it into Russian naturally and idiomatically/)
  assert.match(ruPrompt, /Keep proper names, URLs, code, and content that should not be translated unchanged/)

  // Hindi test
  const hiPrompt = buildLanguagePrompt('hi')
  assert.match(hiPrompt, /OUTPUT MANDATE: HINDI/)
  assert.match(hiPrompt, /Write the complete rewritten output in \*\*Hindi\*\*/)

  // Japanese test
  const jaPrompt = buildLanguagePrompt('ja')
  assert.match(jaPrompt, /OUTPUT MANDATE: JAPANESE/)
  assert.match(jaPrompt, /Write the complete rewritten output in \*\*Japanese\*\*/)
})

test('Bilingual: System prompt incorporates both persona and language instructions independently', () => {
  const prompt1 = buildSystemPrompt('executive', 'bold', undefined, 'ru')
  assert.match(prompt1, /Executive \/ CEO tone/)
  assert.match(prompt1, /OUTPUT MANDATE: RUSSIAN/)

  const prompt2 = buildSystemPrompt('friendly', 'balanced', undefined, 'auto')
  assert.match(prompt2, /Friendly tone/)
  assert.match(prompt2, /AUTO-DETECT/)

  const prompt3 = buildSystemPrompt('diplomatic', 'subtle', undefined, 'hi')
  assert.match(prompt3, /Diplomatic tone/)
  assert.match(prompt3, /OUTPUT MANDATE: HINDI/)
})

test('Bilingual: Offline fallback throws clear honest limitation for unsupported language', () => {
  // Explicit Russian in offline mode
  assert.throws(
    () => {
      generateBasicOfflineRewrite('Please send the report by Friday.', 'executive', 'balanced', undefined, 'ru')
    },
    (err) => {
      assert.match(
        err.message,
        /Multilingual rewriting \(Russian\) is unavailable in offline fallback\. Reconnect to an AI provider or choose a supported offline language\./
      )
      return true
    }
  )

  // Explicit Hindi in offline mode
  assert.throws(
    () => {
      generateBasicOfflineRewrite('I am sorry for the delay.', 'diplomatic', 'balanced', undefined, 'hi')
    },
    (err) => {
      assert.match(err.message, /Multilingual rewriting \(Hindi\) is unavailable in offline fallback/)
      return true
    }
  )
})

test('Bilingual: Offline fallback works for English / Latin in Auto and English mode', () => {
  const resEn = generateBasicOfflineRewrite(
    'Please send the report by Friday.',
    'executive',
    'balanced',
    undefined,
    'en'
  )
  assert.equal(resEn.provider, 'local')
  assert.match(resEn.text, /Bottom line:/)
  assert.match(resEn.text, /Please send the report by Friday/)

  const resAuto = generateBasicOfflineRewrite(
    'Please send the report by Friday.',
    'friendly',
    'balanced',
    undefined,
    'auto'
  )
  assert.equal(resAuto.provider, 'local')
  assert.match(resAuto.text, /Hi there!/)
})
