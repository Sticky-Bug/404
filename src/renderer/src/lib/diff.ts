import { diffWordsWithSpace, type Change } from 'diff'

export interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

export interface DiffAnalysis {
  parts: DiffPart[]
  originalWordCount: number
  rewrittenWordCount: number
  addedWordCount: number
  removedWordCount: number
  unchangedWordCount: number
  approximateEditRate: number
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

export function computeDiff(original: string, rewritten: string): DiffAnalysis {
  const changes: Change[] = diffWordsWithSpace(original, rewritten)

  let addedWordCount = 0
  let removedWordCount = 0
  let unchangedWordCount = 0

  const parts: DiffPart[] = changes.map((part) => {
    const words = countWords(part.value)
    if (part.added) {
      addedWordCount += words
      return { value: part.value, added: true }
    } else if (part.removed) {
      removedWordCount += words
      return { value: part.value, removed: true }
    } else {
      unchangedWordCount += words
      return { value: part.value }
    }
  })

  const originalWordCount = countWords(original)
  const rewrittenWordCount = countWords(rewritten)

  let approximateEditRate: number
  if (originalWordCount === 0) {
    approximateEditRate = rewrittenWordCount > 0 ? 100 : 0
  } else {
    approximateEditRate = Math.min(
      999,
      Math.round(((addedWordCount + removedWordCount) / originalWordCount) * 100 * 10) / 10
    )
  }

  return {
    parts,
    originalWordCount,
    rewrittenWordCount,
    addedWordCount,
    removedWordCount,
    unchangedWordCount,
    approximateEditRate
  }
}
