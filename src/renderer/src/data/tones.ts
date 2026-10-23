import type { ToneItem } from '../components/ToneButton'

export const TONES_CONFIG: ToneItem[] = [
  // Row 1
  { id: 'ceo', label: 'CEO', iconType: 'sparkles', row: 1 },
  { id: 'gen-z', label: 'Gen Z', iconType: 'star', row: 1 },
  { id: 'lawyer', label: 'Lawyer', iconType: 'scale', row: 1 },
  { id: 'professional', label: 'Professional', iconType: 'briefcase', row: 1 },

  // Row 2
  { id: 'friendly', label: 'Friendly', iconType: 'smile', row: 2 },
  { id: 'roast', label: 'Roast', iconType: 'flame', row: 2 },
  { id: 'romantic', label: 'Romantic', iconType: 'heart', row: 2 },
  { id: 'motivational', label: 'Motivational', iconType: 'crown', row: 2 }
]
