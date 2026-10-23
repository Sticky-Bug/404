import { buildSystemPrompt, type PersonaId, type ToneIntensity } from '../personas'

export async function callOpenRouter(
  apiKey: string,
  draft: string,
  personaId: PersonaId,
  intensity: ToneIntensity,
  customInstruction?: string
): Promise<{ text: string; model: string }> {
  const model = 'meta-llama/llama-3.2-3b-instruct:free'
  const systemInstruction = buildSystemPrompt(personaId, intensity, customInstruction)
  const endpoint = 'https://openrouter.ai/api/v1/chat/completions'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
        'HTTP-Referer': 'https://vibewrite.app',
        'X-Title': 'VibeWrite'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `Original Draft:\n"""\n${draft}\n"""` }
        ],
        temperature: 0.7
      })
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const errText = await res.text()
      let parsedMsg = `HTTP ${res.status}`
      try {
        const errJson = JSON.parse(errText)
        if (errJson.error?.message) {
          parsedMsg = errJson.error.message
        }
      } catch {
        parsedMsg = errText.slice(0, 150)
      }
      throw new Error(`OpenRouter error (${res.status}): ${parsedMsg}`)
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }

    const content = data.choices?.[0]?.message?.content
    if (!content || !content.trim()) {
      throw new Error('OpenRouter returned an empty response.')
    }

    return {
      text: content.trim(),
      model
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('OpenRouter request timed out after 20 seconds.', { cause: err })
    }
    throw err
  }
}

export async function testOpenRouter(
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await callOpenRouter(apiKey, 'Hello, testing connection.', 'executive', 'subtle')
    if (res.text) {
      return { success: true, message: 'OpenRouter connected successfully.' }
    }
    return { success: false, message: 'No output received from OpenRouter test.' }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'OpenRouter connection test failed.'
    }
  }
}
