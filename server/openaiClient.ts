import OpenAI from 'openai'
import { cartridgeJsonSchema, cartridgeSystemPrompt, buildCartridgeUserPrompt } from './prompt'
import type { GenerateCartridgeRequest } from './schemas'

let client: OpenAI | null = null

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return client
}

export async function generateCartridgeWithOpenAI(input: GenerateCartridgeRequest, repairIssue?: string) {
  const response = await getClient().responses.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
    instructions: cartridgeSystemPrompt,
    input: buildCartridgeUserPrompt(input, repairIssue),
    temperature: Math.min(1, 0.45 + input.chaos / 180),
    max_output_tokens: 7_500,
    text: {
      verbosity: 'medium',
      format: {
        type: 'json_schema',
        name: 'prompt_arcade_cartridge',
        description: 'A tiny playable browser game cartridge generated as safe HTML, CSS, and JavaScript.',
        strict: true,
        schema: cartridgeJsonSchema,
      },
    },
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  if (!response.output_text) {
    throw new Error('OpenAI returned an empty response.')
  }

  return response.output_text
}
