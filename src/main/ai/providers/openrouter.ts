import { buildSystemPrompt, type PersonaId, type ToneIntensity } from '../personas'

const OPENROUTER_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'mistralai/mistral-7b-instruct:free',
  'openrouter/auto'
]

async function executeOpenRouterRequest(
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  draft: string
): Promise<{ text: string; model: string }> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '')
  const endpoint = 'https://openrouter.ai/api/v1/chat/completions'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
        'HTTP-Referer': 'https://vibewrite.app',
        'X-Title': 'VibeWrite'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
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

      if (res.status === 401) {
        throw new Error(
          `OpenRouter authentication error (401): "${parsedMsg}". Please verify your key at openrouter.ai/keys (should start with sk-or-v1-).`
        )
      }

      const err = new Error(`OpenRouter error (${res.status}): ${parsedMsg}`)
      ;(err as { status?: number }).status = res.status
      throw err
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
      model: modelName
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('OpenRouter request timed out after 20 seconds.', { cause: err })
    }
    throw err
  }
}

export async function callOpenRouter(
  apiKey: string,
  draft: string,
  personaId: PersonaId,
  intensity: ToneIntensity,
  customInstruction?: string
): Promise<{ text: string; model: string }> {
  const systemInstruction = buildSystemPrompt(personaId, intensity, customInstruction)
  const primaryModel = OPENROUTER_MODELS[0]

  try {
    return await executeOpenRouterRequest(apiKey, primaryModel, systemInstruction, draft)
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 404) {
      for (let i = 1; i < OPENROUTER_MODELS.length; i++) {
        try {
          return await executeOpenRouterRequest(
            apiKey,
            OPENROUTER_MODELS[i],
            systemInstruction,
            draft
          )
        } catch {
          // try next model
        }
      }
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
      return { success: true, message: `OpenRouter connected successfully (${res.model}).` }
    }
    return { success: false, message: 'No output received from OpenRouter test.' }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'OpenRouter connection test failed.'
    }
  }
}
