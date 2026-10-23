import { buildSystemPrompt, type PersonaId, type ToneIntensity } from '../personas'

export async function callGemini(
  apiKey: string,
  draft: string,
  personaId: PersonaId,
  intensity: ToneIntensity,
  customInstruction?: string
): Promise<{ text: string; model: string }> {
  const model = 'gemini-1.5-flash'
  const systemInstruction = buildSystemPrompt(personaId, intensity, customInstruction)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 22000)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Original Draft:\n"""\n${draft}\n"""` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
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
      throw new Error(`Gemini error (${res.status}): ${parsedMsg}`)
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    }

    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!candidate || !candidate.trim()) {
      throw new Error('Gemini returned an empty response.')
    }

    return {
      text: candidate.trim(),
      model
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Gemini request timed out after 22 seconds.', { cause: err })
    }
    throw err
  }
}

export async function testGemini(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await callGemini(apiKey, 'Hello, testing connection.', 'executive', 'subtle')
    if (res.text) {
      return { success: true, message: 'Google Gemini connected successfully.' }
    }
    return { success: false, message: 'No output received from Gemini test.' }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Gemini connection test failed.'
    }
  }
}
