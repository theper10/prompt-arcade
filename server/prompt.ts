import type { GenerateCartridgeRequest } from './schemas'

export const cartridgeSystemPrompt = `
You are generating one tiny browser game cartridge for Prompt Arcade.

Return only valid JSON matching the expected schema. Do not output markdown. Do not include triple backticks.

The game must be complete, playable, tiny, robust, fun, and strongly themed around the user's prompt.
Use canvas 2D or simple DOM inside the iframe. The cartridge must be self-contained.

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
Prefer one self-contained IIFE: (function () { ... })();
Avoid TypeScript syntax, module syntax, top-level await, and async unless it is truly necessary.

Reliability-first defaults:
- Be boringly reliable first and creative second.
- Strongly prefer canvas 2D, one clear root/canvas, one main loop, and 150-350 lines of readable JavaScript.
- Use readable variable names, defensive checks, simple collision/math, clear state flags, and capped arrays.
- Do not use external assets, advanced architecture, giant code, or complex physics unless explicitly requested.
- If a requested idea is complex, implement a very simple reliable version instead of a fragile simulation.
- Prefer reliable mechanics: dodge and collect, shoot visible targets, click visible objects, catch falling objects, simple maze with walls, memory/matching with click-to-flip, timing bar minigame, or simple fishing timing game.

Stable viewport contract:
- The internal game resolution is exactly WIDTH = 800 and HEIGHT = 500.
- Canvas width must be 800 and canvas height must be 500.
- Game logic must use WIDTH = 800 and HEIGHT = 500, not window.innerWidth or window.innerHeight.
- CSS may visually scale the canvas with max-width/aspect-ratio, but logic and spawning must stay in the 800x500 game area.
- Keep player, enemies, hazards, collectibles, projectiles, buttons, HUD text, and important objects inside 800x500.
- Avoid parent-page assumptions. Do not create overlays that depend on browser window size.

The game should include:
- A title screen or immediate instructions.
- Score or visible status.
- A clear objective.
- A win state.
- A lose state.
- Restart behavior.
- Desktop-first keyboard and/or pointer controls.
- Graceful visual scaling while preserving fixed 800x500 logic.
- Clear readable UI.

Robustness requirements:
- It is better to make a simple but playable arcade game than a complex broken one.
- Create or find canvas/root elements safely, and handle missing elements gracefully.
- Wait for DOMContentLoaded or run only after the DOM is ready.
- Avoid throwing uncaught errors.
- Use simple, reliable mechanics.
- Use requestAnimationFrame carefully and do not create multiple runaway loops.
- Cleanly handle canvas resizing.
- Clamp player positions to the visible play area.
- Avoid infinite object growth; cap bullets, particles, enemies, pickups, and effects.
- Avoid extremely small or huge speeds.
- Avoid referencing variables before declaration.
- Avoid complex physics that often breaks.
- Avoid APIs blocked by the sanitizer.
- Use defensive checks around DOM lookups and canvas context creation.

Desktop-first input requirements:
- Every real-time game with movement must support both WASD and Arrow keys.
- When movement exists, the controls array must include a clear item like "Move: WASD or Arrow keys".
- If the game has a primary action such as jump, shoot, cast, fish, dash, interact, or start, use Space when relevant and mention it clearly in controls.
- Add mouse or pointer controls when they fit the mechanic.
- Do not add touch controls by default.
- Do not add on-screen mobile buttons by default.
- Do not use touchstart unless Touch Friendly is explicitly requested.
- Do not mix touchstart and click handlers.
- Prefer one input model per action.
- For canvas pointer actions, prefer pointerdown.
- If using pointerdown for an action, do not also use click, mousedown, or touchstart for the same action.
- If using click for an action, do not also use pointerdown, mousedown, or touchstart for the same action.
- Do not bind the same shoot/action function to multiple input events unless it is guarded by a cooldown.
- Add a lastActionTime or cooldown check for shooting, attacking, fishing, casting, dashing, or interacting.
- Use cooldowns around 150-250ms for primary actions.
- Avoid duplicate input triggers.
- Generated JS should prevent default browser behavior for gameplay keys it uses, especially arrows and Space, while avoiding interference with text inputs.
- Track movement using keydown/keyup key state.
- Space should not trigger repeatedly from key repeat unless intentionally designed and explained.
- Space actions should use a cooldown, pressed-state, or edge-trigger.
- Canvas or root game elements should be focusable where useful, and pointerdown should focus the game element.

Gameplay quality requirements:
- No instant loss. Add a short grace period when needed, spawn hazards away from the player, and make the initial state playable.
- Visible actions. Bullets/projectiles must be clear and contrasting. Attacks need visual feedback. Sorting, dragging, placing, matching, and clicking must visibly change game state.
- Controls must match implementation. Every listed control must work, and no hidden required controls should exist.
- Core loop must be playable: the player can start, act, see results, make progress, win, lose fairly, and restart.
- Avoid UI-only mechanics. Complex genres like sorting, drag-and-drop, crafting, inventory, platforming, or physics must be very simple and actually interactive.
- Clear feedback: visible player or interaction target, visible objective, visible hazards/challenges, visible score/progress/status, visible win/lose message, and visible restart option.
- Fair spawning: do not spawn enemies/hazards directly on the player, do not spawn objectives off-screen, and use minimum starting distances.
- Reasonable tuning: controllable player speed, fair enemy speed, playable timers, achievable score targets, and cooldowns that feel responsive.
- Visual clarity: contrasting colors, important objects at least 8-12 pixels, readable text, and no important text outside the canvas.

Before returning JSON, silently complete this playability checklist:
- Can the player start?
- Can the player act?
- Can the player see the result of the action?
- Can the player make progress?
- Can the player win?
- Can the player lose fairly?
- Can the player restart?
- Are controls, objective, win condition, and lose condition accurate?

Return these JSON fields exactly:
title, subtitle, description, controls, objective, winCondition, loseCondition, estimatedDifficulty, tags, html, css, js.
`.trim()

function isTouchFriendlyRequested(input: GenerateCartridgeRequest) {
  const requestedText = `${input.prompt} ${input.repairContext?.note ?? ''}`

  return /\b(touch friendly|touch-friendly|mobile controls|mobile friendly|touch controls|on-screen controls)\b/i.test(
    requestedText,
  )
}

export function buildCartridgeUserPrompt(input: GenerateCartridgeRequest, repairIssue?: string) {
  const touchFriendlyRequested = isTouchFriendlyRequested(input)
  const repairContext = input.repairContext
    ? `
Repair context:
- Repair intent: ${input.repairContext.intent ?? 'repair'}
- Previous title: ${input.repairContext.previousTitle ?? 'unknown'}
- Runtime or validation error: ${input.repairContext.errorMessage ?? repairIssue ?? 'unknown'}
- Previous controls: ${(input.repairContext.previousControls ?? []).join('; ') || 'unknown'}
- Previous objective: ${input.repairContext.previousObjective ?? 'unknown'}
- Additional note: ${input.repairContext.note ?? 'none'}
- Previous JS excerpt:
${(input.repairContext.previousJs ?? '').slice(0, 4_000)}

If intent is repair: keep the same game concept and theme, fix the runtime error, simplify if necessary, preserve WASD/arrow support, and avoid the error that occurred.
If intent is variant: use the same prompt/settings but make a fresh cartridge with different mechanics.
If intent is simplify: the previous cartridge was too fragile or too complex; generate a simpler, more reliable version of the same idea.
If intent is gameplay_fix: keep the theme, fix the gameplay issue, simplify the mechanic if needed, make the game visibly playable, ensure controls match instructions, ensure the player can make progress, ensure win/loss conditions are fair, ensure important actions have visual feedback, and do not add touch/mobile controls unless explicitly requested.
Return a complete replacement cartridge.
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
Touch Friendly explicitly requested: ${touchFriendlyRequested ? 'yes' : 'no'}

Design guidance:
- Higher chaos should increase novelty, theme mashups, and surprising mechanics without making the code brittle.
- Difficulty should affect speed, tolerance, scoring, and lose conditions.
- Keep the output compact enough for a tiny browser game cartridge.
- Make the theme unmistakable in text, visuals, and mechanics.
- Make the control instructions accurate: mention WASD and Arrow keys for movement, Space for primary action if used, and pointer or mouse support if included.
- Unless "Touch Friendly explicitly requested" is yes, do not mention or implement touch/mobile controls.
- Use fixed WIDTH = 800 and HEIGHT = 500 for all gameplay logic.
- Avoid window.innerWidth/window.innerHeight as game dimensions.
- Use exactly one primary event type for each pointer/mouse action, and add cooldowns for shooting/attacking/interacting.
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
