export type Difficulty = 'chill' | 'normal' | 'spicy'

export interface AiCartridge {
  id: string
  createdAt: string
  prompt: string
  title: string
  subtitle: string
  description: string
  controls: string[]
  objective: string
  winCondition: string
  loseCondition: string
  estimatedDifficulty: Difficulty
  tags: string[]
  html: string
  css: string
  js: string
}

export interface CartridgeSettings {
  chaos: number
  difficulty: Difficulty
}

export interface RepairContext {
  previousTitle?: string
  previousJs?: string
  errorMessage?: string
}

export interface GenerateCartridgePayload extends CartridgeSettings {
  prompt: string
  repairContext?: RepairContext
}

export interface ApiErrorResponse {
  error: {
    code:
      | 'INVALID_REQUEST'
      | 'RATE_LIMITED'
      | 'MISSING_API_KEY'
      | 'OPENAI_ERROR'
      | 'SAFETY_VALIDATION_FAILED'
      | 'UNKNOWN_ERROR'
    message: string
  }
}
