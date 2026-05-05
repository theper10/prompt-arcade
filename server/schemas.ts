import { z } from 'zod'

export const difficultySchema = z.enum(['chill', 'normal', 'spicy'])

export type Difficulty = z.infer<typeof difficultySchema>

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

export const repairContextSchema = z
  .object({
    previousTitle: z.string().trim().max(80).optional(),
    previousJs: z.string().max(80_000).optional(),
    errorMessage: z.string().trim().max(1_000).optional(),
  })
  .strict()

export const generateCartridgeRequestSchema = z
  .object({
    prompt: z.string().trim().min(1).max(300),
    chaos: z.coerce.number().min(0).max(100),
    difficulty: difficultySchema,
    repairContext: repairContextSchema.optional(),
  })
  .strict()

export type GenerateCartridgeRequest = z.infer<typeof generateCartridgeRequestSchema>

export const generatedCartridgeSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    subtitle: z.string().trim().min(1).max(140),
    description: z.string().trim().min(1).max(500),
    controls: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
    objective: z.string().trim().min(1).max(280),
    winCondition: z.string().trim().min(1).max(280),
    loseCondition: z.string().trim().min(1).max(280),
    estimatedDifficulty: difficultySchema,
    tags: z.array(z.string().trim().min(1).max(28)).min(1).max(8),
    html: z.string().trim().min(1).max(10_000),
    css: z.string().trim().max(20_000),
    js: z.string().trim().min(1).max(80_000),
  })
  .strict()

export type GeneratedCartridge = z.infer<typeof generatedCartridgeSchema>

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'RATE_LIMITED'
  | 'MISSING_API_KEY'
  | 'OPENAI_ERROR'
  | 'SAFETY_VALIDATION_FAILED'
  | 'UNKNOWN_ERROR'

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
  }
}
