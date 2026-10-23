import type { PersonaId } from '../types/vibewrite-api'

export interface PersonaDefinition {
  id: PersonaId
  name: string
  tagline: string
  description: string
  iconName: string
  badgeLabel: string
}

export const PERSONAS: PersonaDefinition[] = [
  {
    id: 'executive',
    name: 'Executive / CEO',
    tagline: 'Decisive & succinct',
    description:
      'Outcome-oriented, high-leverage brevity, focuses on decisions and bottom-line impact.',
    iconName: 'Briefcase',
    badgeLabel: 'High Leverage'
  },
  {
    id: 'supportive',
    name: 'Supportive peer',
    tagline: 'Encouraging & collaborative',
    description:
      'Empathetic, validates colleagues, boosts morale with warm and actionable feedback.',
    iconName: 'HeartHandshake',
    badgeLabel: 'Empathetic'
  },
  {
    id: 'legal',
    name: 'Legal / compliance',
    tagline: 'Objective & risk-aware',
    description: 'Neutral, carefully phrased, minimizes ambiguity and prevents over-commitment.',
    iconName: 'Scale',
    badgeLabel: 'Objective'
  },
  {
    id: 'gen-z',
    name: 'Gen Z / casual',
    tagline: 'Modern & breezy',
    description: 'Conversational, lowercase-friendly, direct, unpretentious everyday rhythm.',
    iconName: 'Sparkles',
    badgeLabel: 'Casual'
  },
  {
    id: 'diplomatic',
    name: 'Diplomatic',
    tagline: 'Tactful & de-escalating',
    description: 'Bridges conflicting perspectives, constructive framing, softens defensive edges.',
    iconName: 'ShieldCheck',
    badgeLabel: 'De-escalating'
  },
  {
    id: 'friendly',
    name: 'Friendly',
    tagline: 'Warm & approachable',
    description: 'Cheerful, approachable everyday voice, sets an inviting and collegial tone.',
    iconName: 'Smile',
    badgeLabel: 'Approach'
  },
  {
    id: 'persuasive',
    name: 'Persuasive',
    tagline: 'Compelling & action-driving',
    description:
      'Emphasizes clear benefits, urgency, and calls to action that move projects forward.',
    iconName: 'Flame',
    badgeLabel: 'Action-First'
  },
  {
    id: 'custom',
    name: 'Custom',
    tagline: 'Tailored instruction',
    description: 'Define your own specialized persona, style guidelines, or specific target voice.',
    iconName: 'Sliders',
    badgeLabel: 'User-Defined'
  }
]
