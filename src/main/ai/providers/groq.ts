import { buildSystemPrompt, type PersonaId, type ToneIntensity } from '../personas'

export async function callGroq(
  apiKey: string,
  draft: string,
  personaId: PersonaId,
  intensity: ToneIntensity,
  customInstruction?: string
): Promise<{ text: string; model: string }> {
  const model = 'llama-3.3-70b-versatile'
  const systemInstruction = buildSystemPrompt(personaId, intensity, customInstruction)
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `Original Draft:\n"""\n${draft}\n"""` }
        ],
        temperature: 0.7,
        max_tokens: 2048
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
      throw new Error(`Groq error (${res.status}): ${parsedMsg}`)
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
      throw new Error('Groq returned an empty response.')
    }

    return {
      text: content.trim(),
      model
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Groq request timed out after 20 seconds.', { cause: err })
    }
    throw err
  }
}

export async function testGroq(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await callGroq(apiKey, 'Hello, testing connection.', 'executive', 'subtle')
    if (res.text) {
      return { success: true, message: 'Groq connected successfully.' }
    }
    return { success: false, message: 'No output received from Groq test.' }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Groq connection test failed.'
    }
  }
}
