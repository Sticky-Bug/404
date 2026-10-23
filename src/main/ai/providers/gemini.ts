import { buildSystemPrompt, type PersonaId, type ToneIntensity } from '../personas'

let cachedGeminiModel: string | null = null

const GEMINI_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-pro'
]

async function discoverGeminiModel(apiKey: string): Promise<string> {
  if (cachedGeminiModel) return cachedGeminiModel

  try {
    const listEndpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
      apiKey.trim()
    )}`
    const res = await fetch(listEndpoint, { method: 'GET' })
    if (res.ok) {
      const data = (await res.json()) as {
        models?: Array<{ name: string; supportedGenerationMethods?: string[] }>
      }
      const available =
        data.models
          ?.filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          ?.map((m) => m.name.replace(/^models\//, '')) || []

      for (const pref of GEMINI_CANDIDATES) {
        if (available.includes(pref)) {
          cachedGeminiModel = pref
          return pref
        }
      }

      if (available.length > 0) {
        cachedGeminiModel = available[0]
        return available[0]
      }
    }
  } catch {
    // ignore list error and fallback to default candidate
  }

  return 'gemini-2.0-flash'
}

async function executeGeminiRequest(
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  draft: string
): Promise<{ text: string; model: string }> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '')
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
    cleanKey
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
      const err = new Error(`Gemini error (${res.status}): ${parsedMsg}`)
      ;(err as { status?: number }).status = res.status
      throw err
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
      model: modelName
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Gemini request timed out after 22 seconds.', { cause: err })
    }
    throw err
  }
}

export async function callGemini(
  apiKey: string,
  draft: string,
  personaId: PersonaId,
  intensity: ToneIntensity,
  customInstruction?: string
): Promise<{ text: string; model: string }> {
  const systemInstruction = buildSystemPrompt(personaId, intensity, customInstruction)
  const primaryModel = await discoverGeminiModel(apiKey)

  try {
    return await executeGeminiRequest(apiKey, primaryModel, systemInstruction, draft)
  } catch (err: unknown) {
    // If model not found (404), iterate through other candidates
    const status = (err as { status?: number })?.status
    if (status === 404) {
      for (const fallbackModel of GEMINI_CANDIDATES) {
        if (fallbackModel === primaryModel) continue
        try {
          const res = await executeGeminiRequest(apiKey, fallbackModel, systemInstruction, draft)
          cachedGeminiModel = fallbackModel
          return res
        } catch {
          // continue to next candidate
        }
      }
    }
    throw err
  }
}

export async function testGemini(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    cachedGeminiModel = null // force redetection on test
    const res = await callGemini(apiKey, 'Hello, testing connection.', 'executive', 'subtle')
    if (res.text) {
      return { success: true, message: `Google Gemini connected successfully (${res.model}).` }
    }
    return { success: false, message: 'No output received from Gemini test.' }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Gemini connection test failed.'
    }
  }
}
