import type { GenerateCartridgeRequest } from './schemas'

export const cartridgeSystemPrompt = `
You are generating one tiny browser game cartridge for Prompt Arcade.

Return only valid JSON matching the expected schema. Do not output markdown. Do not include triple backticks.

The game must be complete, playable, tiny, robust, fun, and strongly themed around the user's prompt.
Use canvas or simple DOM inside the iframe. The cartridge must be self-contained.

Hard restrictions:
- No external resources.
- No network calls.
- No storage APIs.
- No imports, modules, or dependencies.
- No eval or Function constructor.
- No document.write.
- No unsafe browser APIs.
- Do not access parent or top.
- Do not navigate the page.
- Do not use alert, confirm, or prompt.

Generated HTML must be minimal: a root div, a canvas, and optionally small HUD markup. No script tags.
Generated CSS must be scoped to the iframe document. No external urls. No @import.
Generated JS must be plain browser JavaScript. No TypeScript. No modules. No imports.

The game should include:
- A title screen or immediate instructions.
- Score or visible status.
- A clear objective.
- A win state.
- A lose state.
- Restart behavior.
- Keyboard and/or pointer controls.
- Graceful handling of canvas size.
- Clear readable UI.

Prefer varied mechanics. Consider tiny maze, dodge and collect, click to catch, falling object catcher, fishing timing game, reaction game, mini shooter, survival arena, memory-ish puzzle, simple jump game, turn-based micro adventure, rhythm timing game, or another compact arcade idea.

Return these JSON fields exactly:
title, subtitle, description, controls, objective, winCondition, loseCondition, estimatedDifficulty, tags, html, css, js.
`.trim()

export function buildCartridgeUserPrompt(input: GenerateCartridgeRequest, repairIssue?: string) {
  const repairContext = input.repairContext
    ? `
Repair context:
- Previous title: ${input.repairContext.previousTitle ?? 'unknown'}
- Runtime or validation error: ${input.repairContext.errorMessage ?? repairIssue ?? 'unknown'}
- Previous JS excerpt:
${(input.repairContext.previousJs ?? '').slice(0, 4_000)}

Fix the game while keeping the same concept, theme, and basic controls. Return a complete replacement cartridge.
`
    : ''

  const validationRepair = repairIssue
    ? `
The previous generated cartridge failed validation for this reason:
${repairIssue}

Generate a corrected complete replacement that obeys every restriction.
`
    : ''

  return `
User prompt:
${input.prompt}

Requested difficulty: ${input.difficulty}
Chaos slider: ${input.chaos}/100

Design guidance:
- Higher chaos should increase novelty, theme mashups, and surprising mechanics without making the code brittle.
- Difficulty should affect speed, tolerance, scoring, and lose conditions.
- Keep the output compact enough for a tiny browser game cartridge.
- Make the theme unmistakable in text, visuals, and mechanics.
${repairContext}
${validationRepair}
Return only valid JSON. No markdown.
`.trim()
}

export const cartridgeJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'subtitle',
    'description',
    'controls',
    'objective',
    'winCondition',
    'loseCondition',
    'estimatedDifficulty',
    'tags',
    'html',
    'css',
    'js',
  ],
  properties: {
    title: { type: 'string', maxLength: 80 },
    subtitle: { type: 'string', maxLength: 140 },
    description: { type: 'string', maxLength: 500 },
    controls: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      items: { type: 'string', maxLength: 120 },
    },
    objective: { type: 'string', maxLength: 280 },
    winCondition: { type: 'string', maxLength: 280 },
    loseCondition: { type: 'string', maxLength: 280 },
    estimatedDifficulty: { type: 'string', enum: ['chill', 'normal', 'spicy'] },
    tags: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      items: { type: 'string', maxLength: 28 },
    },
    html: { type: 'string', maxLength: 10000 },
    css: { type: 'string', maxLength: 20000 },
    js: { type: 'string', maxLength: 80000 },
  },
} as const
