import type { AiCartridge, ApiErrorResponse, GenerateCartridgePayload } from '../types/cartridge'

const defaultApiBase = 'http://localhost:8787'

export class PromptArcadeApiError extends Error {
  code: ApiErrorResponse['error']['code']

  constructor(code: ApiErrorResponse['error']['code'], message: string) {
    super(message)
    this.name = 'PromptArcadeApiError'
    this.code = code
  }
}

function apiBase() {
  return (import.meta.env.VITE_AI_API_BASE as string | undefined)?.replace(/\/$/, '') || defaultApiBase
}

async function parseApiError(response: Response) {
  try {
    const body = (await response.json()) as ApiErrorResponse

    if (body.error?.code && body.error.message) {
      return new PromptArcadeApiError(body.error.code, body.error.message)
    }
  } catch {
    // Fall through to a friendly generic error below.
  }

  return new PromptArcadeApiError('UNKNOWN_ERROR', 'The arcade API returned an unexpected error.')
}

export async function generateCartridge(payload: GenerateCartridgePayload): Promise<AiCartridge> {
  const response = await fetch(`${apiBase()}/api/generate-cartridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  const body = (await response.json()) as { cartridge?: AiCartridge }

  if (!body.cartridge) {
    throw new PromptArcadeApiError('UNKNOWN_ERROR', 'The arcade API did not return a cartridge.')
  }

  return body.cartridge
}

export function getApiBase() {
  return apiBase()
}
