import { buildSystemPrompt, type PersonaId, type ToneIntensity } from '../personas'

let cachedGroqModel: string | null = null

const GROQ_CANDIDATES = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192'
]

async function discoverGroqModel(apiKey: string): Promise<string> {
  if (cachedGroqModel) return cachedGroqModel

  try {
    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '')
    const listRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${cleanKey}`
      }
    })

    if (listRes.ok) {
      const data = (await listRes.json()) as { data?: Array<{ id: string; active?: boolean }> }
      const available = (data.data || []).map((m) => m.id)

      for (const candidate of GROQ_CANDIDATES) {
        if (available.includes(candidate)) {
          cachedGroqModel = candidate
          return candidate
        }
      }

      const anyChatModel = available.find((id) => id.includes('llama') || id.includes('mixtral'))
      if (anyChatModel) {
        cachedGroqModel = anyChatModel
        return anyChatModel
      }
    }
  } catch {
    // ignore discovery failure and use standard default
  }

  return 'llama-3.1-8b-instant'
}

async function executeGroqRequest(
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  draft: string
): Promise<{ text: string; model: string }> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '')
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `Original Draft:\n"""\n${draft}\n"""` }
        ],
        temperature: 0.7,
        max_tokens: 512
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
      const err = new Error(`Groq error (${res.status}): ${parsedMsg}`)
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
      throw new Error('Groq returned an empty response.')
    }

    return {
      text: content.trim(),
      model: modelName
    }
  } catch (err: unknown) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Groq request timed out after 20 seconds.', { cause: err })
    }
    throw err
  }
}

export async function callGroq(
  apiKey: string,
  draft: string,
  personaId: PersonaId,
  intensity: ToneIntensity,
  customInstruction?: string
): Promise<{ text: string; model: string }> {
  const systemInstruction = buildSystemPrompt(personaId, intensity, customInstruction)
  const primaryModel = await discoverGroqModel(apiKey)

  try {
    return await executeGroqRequest(apiKey, primaryModel, systemInstruction, draft)
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 404) {
      for (const fallback of GROQ_CANDIDATES) {
        if (fallback === primaryModel) continue
        try {
          const res = await executeGroqRequest(apiKey, fallback, systemInstruction, draft)
          cachedGroqModel = fallback
          return res
        } catch {
          // try next
        }
      }
    }
    throw err
  }
}

export async function testGroq(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    cachedGroqModel = null // force refresh on test
    const res = await callGroq(apiKey, 'Hello, testing connection.', 'executive', 'subtle')
    if (res.text) {
      return { success: true, message: `Groq connected successfully (${res.model}).` }
    }
    return { success: false, message: 'No output received from Groq test.' }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Groq connection test failed.'
    }
  }
}
