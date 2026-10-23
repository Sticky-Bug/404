# Bilingual / Multilingual Output Feature --- VibeWrite

## 1. Goal

Add a language-aware generation feature to VibeWrite. It must support
two modes:

1.  **Auto** --- detect the language of the user's draft and generate
    the rewritten output in that same language.
2.  **A specific language** --- generate the rewritten output in the
    selected language, even when the input draft is written in a
    different language. The output must be translated and rewritten
    naturally in the selected language.

Example: - Draft: `Please send me the report today.` - Language: `Auto`
→ output remains English. - Language: `Russian` → output is rewritten
naturally in Russian.

This setting controls the **output language** and is independent of
persona/tone selection.

## 2. UI requirements

Add a language selector **beside the existing "Convert to Persona"
button** in the main drafting interface.

Suggested layout:

`[ Convert to Persona ]  [ 🌐 Language: Auto ▾ ]`

Use the existing design system, spacing, typography, colors, hover/focus
states, and responsive behavior. Do not redesign the entire interface
just to add this control.

### Selector behavior

- Default selection: **Auto**.
- Clicking it opens a searchable menu or compact dropdown.
- Include at least: Auto, English, Spanish, French, German,
  Portuguese, Italian, Russian, Ukrainian, Arabic, Hindi, Bengali,
  Chinese (Simplified), Chinese (Traditional), Japanese, Korean,
  Turkish, Dutch, Polish, Indonesian, and Vietnamese.
- Keep the language list easy to extend.
- Clearly show the selected language.
- Make it keyboard accessible with an accessible name such as
  `Output language`.
- A globe icon is fine. Do not rely on flags as the only language
  indicator.
- Keep the choice for the current session. Persist it across restarts
  only if that matches the app's existing settings conventions.

## 3. Core behavior

### Mode A --- Auto

When `Auto` is selected:

1.  Detect the primary language of the draft, preferably through the
    configured LLM/provider's language understanding rather than a
    brittle hand-written detector.
2.  Generate the persona rewrite in the detected language.
3.  Preserve the original language unless the user explicitly asks for
    translation in the draft.
4.  For mixed-language drafts, use the dominant language for the main
    output and preserve meaningful names, quoted text, and code as
    appropriate.
5.  For very short or ambiguous drafts, infer the language from context.
    Do not claim certainty if the language cannot be determined.

**Auto must not default every draft to English.**

### Mode B --- Explicit language selected

When a specific language is selected:

1.  Treat it as the required **output language**.
2.  Translate and rewrite the draft into that language in the same
    generation request whenever possible.
3.  Preserve meaning, intent, facts, names, numbers, dates, URLs, and
    requested actions.
4.  Apply the chosen persona and tone in the selected language.
5.  Use natural, idiomatic wording rather than word-for-word
    translation.
6.  Do not leave ordinary sentences in the input language unless the
    user asks for bilingual output or the text should remain unchanged
    (for example, a quoted passage).
7.  If the input is already in the selected language, rewrite it
    naturally without unnecessary translation.
8.  Do not translate proper names, product names, URLs, code, or other
    content that should remain unchanged.

Example: English draft + Russian selected + Professional persona → a
professional Russian rewrite, not an English rewrite or awkward literal
translation.

## 4. Relationship to persona conversion

Language selection and persona selection are independent:

- **Persona** determines how the message sounds and how it adapts to
  the audience.
- **Output language** determines the language of the final variant.
- Both settings must be applied in the same generation operation.

Examples: - Friendly + Russian → friendly Russian output. - Lawyer /
Legal-style + Hindi → formal Hindi output without inventing legal advice
or changing facts. - Gen Z + Auto + Spanish draft → casual Spanish
output. - Professional + Auto + French draft → professional French
output.

Changing language must not silently change the persona, and changing
persona must not reset the language.

## 5. Generation prompt requirements

Update the shared prompt-building layer so every configured provider
receives consistent language instructions. Avoid implementing separate
language logic in each provider.

### If output language is Auto

Use instructions equivalent to:

> Detect the primary language of the user's draft. Write the complete
> rewritten output in that language. Preserve the original meaning,
> intent, facts, names, numbers, dates, and requested actions. Apply the
> selected persona and tone naturally in that language. Do not translate
> into English merely because system or application instructions are in
> English. If the draft contains multiple languages, use its dominant
> language unless the user explicitly requests otherwise.

### If a specific output language is selected

Use instructions equivalent to:

> Write the complete rewritten output in **{selectedLanguage}**. If the
> source draft is in another language, translate and rewrite it into
> {selectedLanguage} naturally and idiomatically. Apply the selected
> persona and tone in {selectedLanguage}. Preserve the source's meaning,
> intent, facts, names, numbers, dates, and requested actions. Do not
> return the main rewritten message in the source language. Keep proper
> names, URLs, code, and content that should not be translated
> unchanged.

Safely interpolate only a language from the app's supported-language
list. Treat draft content as data, not trusted system instructions. Do
not let the draft override the selected output language or other system
constraints.

## 6. Output structure and UI compatibility

- Keep the existing result format and persona-variant structure
  compatible with the feature.
- If multiple persona variants are generated, every variant must use
  the selected output language.
- Do not insert language-detection commentary or translation notes
  into the rewritten message unless the product already displays
  explanations separately.
- Titles, summaries, and rationale fields should follow the existing
  localization convention. The actual generated message must follow
  the selected output language.
- The comparison/diff view must still work when the languages differ.
  Make clear that a cross-language diff is a comparison, not a
  word-for-word edit history.
- Copy actions must copy only the generated message, not prompt
  instructions or language metadata.

## 7. Offline fallback

When cloud providers are unavailable:

- Preserve the selected language setting.
- In Auto mode, do not claim the fallback can reliably detect and
  rewrite every language if it only uses English-oriented rules.
- For an explicitly selected language, do not present an English-only
  rule-based rewrite as a successful translation.
- If the offline engine cannot safely produce the requested language,
  show a clear message such as:
  `Multilingual rewriting is unavailable in offline fallback. Reconnect to an AI provider or choose a supported offline language.`
- Only claim offline multilingual support for languages and behaviors
  actually implemented and tested.
- A configured local model may be used if it supports the selected
  language and fits the app's provider fallback rules.

## 8. Error handling and edge cases

Handle these cases without crashing:

- Empty or whitespace-only drafts.
- Very short or ambiguous drafts (for example, `OK` or `No`).
- Mixed-language drafts.
- Names, dates, numbers, URLs, email addresses, code, and quoted text.
- Unsupported or unavailable language choices.
- Provider failures, timeouts, and malformed model output.
- A provider returning the wrong language.
- The language changing while generation is in progress.

For wrong-language output, use a limited validation/retry strategy if
supported. Do not retry indefinitely. If the result still violates the
selected language, show a clear warning or error instead of silently
claiming success.

Capture the selected language at the start of each generation request
and associate it with that request's result, so a change made
mid-generation does not cause stale or mismatched state.

## 9. Suggested implementation approach

1.  Inspect the current renderer and locate the existing
    `Convert to Persona` button.
2.  Add a reusable `OutputLanguageSelector` beside it.
3.  Define a typed language option list. Example values include `auto`,
    `en`, `es`, `fr`, `de`, `pt`, `it`, `ru`, `uk`, `ar`, `hi`, `bn`,
    `zh-CN`, `zh-TW`, `ja`, `ko`, `tr`, `nl`, `pl`, `id`, and `vi`.
4.  Store the selection in the same state/settings layer used by
    existing generation controls.
5.  Pass the language through the renderer → preload → main-process IPC
    contract using a validated, typed field.
6.  Update the shared prompt builder so Auto and explicit-language
    instructions are consistent across providers.
7.  Ensure every persona variant follows the selected output-language
    rule.
8.  Implement honest offline fallback behavior for unsupported
    multilingual cases.
9.  Add tests before considering the feature complete.

Do not expose API keys or move provider calls into the renderer. Follow
the existing secure Electron IPC architecture.

## 10. Acceptance criteria

- [ ] The language selector appears beside `Convert to Persona`.
- [ ] Default value is `Auto`.
- [ ] Auto mode produces Spanish output for a Spanish draft, Russian
      for Russian, and Hindi for Hindi, assuming the configured provider
      supports those languages.
- [ ] Selecting Russian and entering an English draft produces a
      natural Russian rewrite.
- [ ] Selecting Hindi and entering an English draft produces a natural
      Hindi rewrite.
- [ ] Selecting the source language rewrites naturally without
      needlessly translating it.
- [ ] Every persona variant follows the selected language.
- [ ] Language selection does not reset or override the persona.
- [ ] Persona selection does not reset the language.
- [ ] Facts, names, numbers, dates, deadlines, and requests remain
      intact.
- [ ] Empty drafts show a clear validation message.
- [ ] Provider errors and wrong-language outputs are handled
      gracefully.
- [ ] An English-only offline fallback never claims to have translated
      into Russian, Hindi, or another unsupported language.
- [ ] The selector is keyboard accessible and visually consistent with
      the app.
- [ ] Tests cover Auto mode, explicit translation, persona/language
      combinations, and offline limitations.

## 11. Test cases

---

Input draft Selected language Persona Expected result

---

`Please send the report by Friday.` Auto Professional Professional English;
Friday preserved

Spanish draft Auto Friendly Friendly Spanish

Russian draft Auto Professional Professional Russian

`Please send the report by Friday.` Russian Professional Professional Russian;
deadline preserved

`I am sorry for the delay.` Hindi Diplomatic Diplomatic Hindi;
apology preserved

French draft English Direct Direct English
translation/rewrite

English draft with URL and order Japanese Professional Japanese output; URL
number and order number
preserved

Any draft Auto Multiple personas Every variant follows
detected input
language

English draft Russian Any persona, Clear
offline limitation/error; no
English-only false claim of
fallback Russian translation
-----------------------------------------------------------------------------------------------

## 12. Definition of done

The feature is complete when the selector is integrated beside
`Convert to Persona`, the selected language reaches the secure
generation layer, Auto mode follows the input language, explicit
selection translates and rewrites into the chosen language, all persona
variants respect the language setting, and acceptance tests pass. UI and
documentation must accurately describe language and offline limitations.
