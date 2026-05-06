import crypto from 'node:crypto'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { ZodError } from 'zod'
import { generateCartridgeWithOpenAI } from './openaiClient'
import { checkRateLimit } from './rateLimit'
import {
  generateCartridgeRequestSchema,
  type AiCartridge,
  type ApiErrorBody,
  type ApiErrorCode,
  type GenerateCartridgeRequest,
  type GeneratedCartridge,
} from './schemas'
import { sanitizeModelOutput, SafetyValidationError } from './sanitizer'
import { createMockCartridge } from './mockCartridge'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 8787)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

function isMockMode() {
  return process.env.USE_MOCK_AI === 'true'
}

function sendError(
  res: express.Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  headers?: Record<string, string>,
) {
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value)
    }
  }

  const body: ApiErrorBody = {
    error: {
      code,
      message,
    },
  }

  return res.status(status).json(body)
}

function ipForRequest(req: express.Request) {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function buildCartridge(input: GenerateCartridgeRequest, generated: GeneratedCartridge): AiCartridge {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    prompt: input.prompt,
    engineNotes: 'Validated with Prompt Arcade safety and static quality checks.',
    qualityWarnings: [],
    ...generated,
  }
}

function shouldAttemptQualityRepair(generated: GeneratedCartridge & { qualityWarnings?: string[] }) {
  return generated.qualityWarnings?.some((warning) => warning.startsWith('Quality repair trigger:')) ?? false
}

function qualityRepairIssue(generated: GeneratedCartridge & { qualityWarnings?: string[] }) {
  const warnings = generated.qualityWarnings?.filter((warning) => warning.startsWith('Quality repair trigger:')) ?? []

  return `Static quality checks found likely gameplay input or viewport problems:
${warnings.map((warning) => `- ${warning.replace(/^Quality repair trigger:\s*/, '')}`).join('\n')}

Generate a complete replacement cartridge that keeps the theme but fixes these issues. Prefer desktop-first controls, one input event type per action, 150-250ms action cooldowns, and fixed WIDTH = 800 / HEIGHT = 500 gameplay logic.`
}

async function generateAndSanitize(input: GenerateCartridgeRequest) {
  if (isMockMode()) {
    return createMockCartridge(input)
  }

  let raw = await generateCartridgeWithOpenAI(input)

  try {
    const generated = sanitizeModelOutput(raw)

    if (!shouldAttemptQualityRepair(generated)) {
      return generated
    }

    try {
      const repairedRaw = await generateCartridgeWithOpenAI(input, qualityRepairIssue(generated))

      return sanitizeModelOutput(repairedRaw)
    } catch {
      return generated
    }
  } catch (error) {
    if (!(error instanceof SafetyValidationError)) {
      throw error
    }

    raw = await generateCartridgeWithOpenAI(input, error.message)
    return sanitizeModelOutput(raw)
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'prompt-arcade-api',
  })
})

app.post('/api/generate-cartridge', async (req, res) => {
  const parsed = generateCartridgeRequestSchema.safeParse(req.body)

  if (!parsed.success) {
    return sendError(
      res,
      400,
      'INVALID_REQUEST',
      parsed.error.issues[0]?.message ?? 'Please check your prompt and settings.',
    )
  }

  const rate = checkRateLimit(ipForRequest(req))

  if (!rate.ok) {
    return sendError(res, 429, 'RATE_LIMITED', 'Too many cartridges generated. Try again soon.', {
      'Retry-After': String(rate.retryAfterSeconds),
    })
  }

  if (!isMockMode() && !process.env.OPENAI_API_KEY) {
    return sendError(
      res,
      500,
      'MISSING_API_KEY',
      'The arcade backend needs an OPENAI_API_KEY before it can generate games.',
    )
  }

  try {
    const generated = await generateAndSanitize(parsed.data)

    res.json({
      cartridge: buildCartridge(parsed.data, generated),
    })
  } catch (error) {
    if (error instanceof SafetyValidationError || error instanceof ZodError) {
      return sendError(
        res,
        422,
        'SAFETY_VALIDATION_FAILED',
        'The generated cartridge did not pass the sandbox safety checks. Please try again.',
      )
    }

    if (error instanceof Error) {
      console.error('[openai]', error.message)
      return sendError(res, 502, 'OPENAI_ERROR', 'OpenAI could not generate a cartridge right now.')
    }

    console.error('[unknown]', error)
    return sendError(res, 500, 'UNKNOWN_ERROR', 'Something unexpected happened in the arcade backend.')
  }
})

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof SyntaxError) {
    sendError(res, 400, 'INVALID_REQUEST', 'Request body must be valid JSON.')
    return
  }

  console.error('[express]', error)
  sendError(res, 500, 'UNKNOWN_ERROR', 'Something unexpected happened in the arcade backend.')
})

app.use((_req, res) => {
  sendError(res, 404, 'INVALID_REQUEST', 'That Prompt Arcade API route does not exist.')
})

app.listen(port, () => {
  console.log(`Prompt Arcade API listening on http://localhost:${port}`)
  if (isMockMode()) {
    console.log('Mock AI mode is enabled.')
  }
})
