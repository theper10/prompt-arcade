import { generatedCartridgeSchema, type GeneratedCartridge } from './schemas'

export type SanitizedCartridge = GeneratedCartridge & {
  engineNotes: string
  qualityWarnings: string[]
}

export class SafetyValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafetyValidationError'
  }
}

const forbiddenChecks: Array<{ label: string; test: (value: string) => boolean }> = [
  { label: 'fetch(', test: (value) => value.toLowerCase().includes('fetch(') },
  { label: 'XMLHttpRequest', test: (value) => value.toLowerCase().includes('xmlhttprequest') },
  { label: 'WebSocket', test: (value) => value.toLowerCase().includes('websocket') },
  { label: 'EventSource', test: (value) => value.toLowerCase().includes('eventsource') },
  { label: 'localStorage', test: (value) => value.toLowerCase().includes('localstorage') },
  { label: 'sessionStorage', test: (value) => value.toLowerCase().includes('sessionstorage') },
  { label: 'indexedDB', test: (value) => value.toLowerCase().includes('indexeddb') },
  { label: 'document.cookie', test: (value) => value.toLowerCase().includes('document.cookie') },
  { label: 'eval(', test: (value) => value.toLowerCase().includes('eval(') },
  { label: 'new Function', test: (value) => /\bnew\s+Function\s*\(/.test(value) },
  { label: 'Function(', test: (value) => /\bFunction\s*\(/.test(value) },
  { label: 'document.write', test: (value) => value.toLowerCase().includes('document.write') },
  { label: 'window.top', test: (value) => value.toLowerCase().includes('window.top') },
  { label: 'top.', test: (value) => value.toLowerCase().includes('top.') },
  { label: 'parent.location', test: (value) => value.toLowerCase().includes('parent.location') },
  { label: 'window.location', test: (value) => value.toLowerCase().includes('window.location') },
  { label: 'location.href', test: (value) => value.toLowerCase().includes('location.href') },
  { label: '<script', test: (value) => value.toLowerCase().includes('<script') },
  { label: '</script', test: (value) => value.toLowerCase().includes('</script') },
  { label: 'import ', test: (value) => /\bimport\s/i.test(value) },
  { label: 'import(', test: (value) => value.toLowerCase().includes('import(') },
  { label: 'require(', test: (value) => value.toLowerCase().includes('require(') },
  { label: 'navigator.sendBeacon', test: (value) => value.toLowerCase().includes('navigator.sendbeacon') },
  { label: 'ServiceWorker', test: (value) => value.toLowerCase().includes('serviceworker') },
  { label: 'SharedWorker', test: (value) => value.toLowerCase().includes('sharedworker') },
  { label: 'Worker(', test: (value) => /\bWorker\s*\(/.test(value) },
  { label: 'BroadcastChannel', test: (value) => value.toLowerCase().includes('broadcastchannel') },
]

function extractJson(raw: string) {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    const firstBrace = raw.indexOf('{')
    const lastBrace = raw.lastIndexOf('}')

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as unknown
    }

    throw new SafetyValidationError('The model did not return valid JSON.')
  }
}

function stripScriptTags(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '').replace(/<script\b[^>]*\/?>/gi, '')
}

function assertNoForbiddenContent(label: string, value: string) {
  const failed = forbiddenChecks.find((check) => check.test(value))

  if (failed) {
    throw new SafetyValidationError(`${label} contains forbidden content: ${failed.label}`)
  }
}

function assertHtmlSafe(html: string) {
  if (/\son[a-z]+\s*=/i.test(html)) {
    throw new SafetyValidationError('HTML contains inline event handler attributes.')
  }

  assertNoForbiddenContent('HTML', html)
}

function assertCssSafe(css: string) {
  if (/url\s*\(/i.test(css)) {
    throw new SafetyValidationError('CSS contains url(), which could load external resources.')
  }

  if (/@import\b/i.test(css)) {
    throw new SafetyValidationError('CSS contains @import.')
  }

  assertNoForbiddenContent('CSS', css)
}

function assertJsSafe(js: string) {
  assertNoForbiddenContent('JavaScript', js)
}

function hasRootOrCanvas(html: string) {
  return /<(canvas|div|main|section|button)\b/i.test(html)
}

function assertNoParentUi(html: string) {
  const lower = html.toLowerCase()
  const forbiddenParentUi = ['game focused', 'click game to focus', 'keyboard captured', 'press esc to release']
  const found = forbiddenParentUi.find((phrase) => lower.includes(phrase))

  if (found) {
    throw new SafetyValidationError(`HTML appears to include parent runner UI: ${found}`)
  }
}

function assertNoObviousJsSyntaxLeak(js: string) {
  if (/```/.test(js)) {
    throw new SafetyValidationError('JavaScript contains markdown fences.')
  }

  if (/^\s*(import|export)\s/m.test(js)) {
    throw new SafetyValidationError('JavaScript contains import/export syntax.')
  }

  if (
    /\b(function\s+\w*\s*\([^)]*:\s*\w+)/.test(js) ||
    /\([^)]*:\s*(number|string|boolean|unknown|any|void)\s*[),]/.test(js) ||
    /\b(?:let|const|var)\s+\w+\s*:\s*(number|string|boolean|unknown|any)\b/.test(js)
  ) {
    throw new SafetyValidationError('JavaScript appears to contain TypeScript type annotations.')
  }
}

function runStaticQualityChecks(cartridge: GeneratedCartridge) {
  const warnings: string[] = []
  const combinedMetadata = [
    cartridge.title,
    cartridge.subtitle,
    cartridge.description,
    cartridge.objective,
    cartridge.winCondition,
    cartridge.loseCondition,
    cartridge.controls.join(' '),
    cartridge.tags.join(' '),
  ].join(' ')
  const combinedCode = `${cartridge.html}\n${cartridge.css}\n${cartridge.js}`
  const js = cartridge.js
  const hasClickHandler = /addEventListener\s*\(\s*['"]click['"]|\.onclick\s*=/.test(js)
  const hasPointerDownHandler = /addEventListener\s*\(\s*['"]pointerdown['"]|\.onpointerdown\s*=/.test(js)
  const hasMouseDownHandler = /addEventListener\s*\(\s*['"]mousedown['"]|\.onmousedown\s*=/.test(js)
  const hasTouchStartHandler = /addEventListener\s*\(\s*['"]touchstart['"]|\.ontouchstart\s*=/.test(js)

  if (!hasRootOrCanvas(cartridge.html)) {
    throw new SafetyValidationError('HTML must include a root element or canvas.')
  }

  assertNoParentUi(cartridge.html)
  assertNoObviousJsSyntaxLeak(cartridge.js)

  if (cartridge.js.length < 600) {
    throw new SafetyValidationError('JavaScript is too small to be a complete playable cartridge.')
  }

  if (!/(requestAnimationFrame|addEventListener|setInterval|onclick|onpointer|onkeydown)/i.test(cartridge.js)) {
    throw new SafetyValidationError('JavaScript does not contain a clear loop or interaction path.')
  }

  if (!/(score|status|win|lose|game over|victory|objective|health|lives|time|timer)/i.test(`${combinedMetadata}\n${cartridge.js}`)) {
    throw new SafetyValidationError('Cartridge lacks obvious score, status, win, or lose handling.')
  }

  if (!/\b(function\s*\(\)\s*\{|=>|DOMContentLoaded|addEventListener\(['"]load|addEventListener\(['"]DOMContentLoaded)/.test(cartridge.js)) {
    warnings.push('JS does not clearly wrap startup in a self-contained function or DOM-ready handler.')
  }

  if (!/requestAnimationFrame/i.test(cartridge.js)) {
    warnings.push('No requestAnimationFrame loop detected; this may be interaction-only.')
  }

  if (!/(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|KeyW|KeyA|KeyS|KeyD|WASD|wasd)/.test(combinedCode)) {
    warnings.push('Keyboard movement support is not obvious in the cartridge code.')
  }

  if (!/(Space|event\.key === ['"] ['"]|event\.code === ['"]Space['"])/.test(combinedCode)) {
    warnings.push('Space primary-action support is not obvious.')
  }

  if (!/(pointer|mouse|click)/i.test(combinedCode)) {
    warnings.push('Pointer or mouse support is not obvious.')
  }

  if (hasClickHandler && hasPointerDownHandler) {
    warnings.push('Quality repair trigger: JS contains both click and pointerdown handlers, which can duplicate one action.')
  }

  if (hasMouseDownHandler && hasPointerDownHandler) {
    warnings.push('Quality repair trigger: JS contains both mousedown and pointerdown handlers, which can duplicate one action.')
  }

  if (hasTouchStartHandler) {
    warnings.push('Quality repair trigger: JS contains touchstart even though touch/mobile controls are opt-in only.')
  }

  if (hasTouchStartHandler && (hasClickHandler || hasPointerDownHandler || hasMouseDownHandler)) {
    warnings.push('Quality repair trigger: JS mixes touchstart with mouse/pointer/click handlers.')
  }

  if (hasClickHandler && hasMouseDownHandler) {
    warnings.push('Quality repair trigger: JS contains both click and mousedown handlers, which can duplicate one action.')
  }

  if (/window\.inner(?:Width|Height)/.test(js)) {
    warnings.push('Quality repair trigger: JS uses window.innerWidth or window.innerHeight for game dimensions instead of fixed 800x500 logic.')
  }

  return warnings
    .toSorted((left, right) => {
      const leftIsRepair = left.startsWith('Quality repair trigger:')
      const rightIsRepair = right.startsWith('Quality repair trigger:')

      if (leftIsRepair === rightIsRepair) {
        return 0
      }

      return leftIsRepair ? -1 : 1
    })
    .slice(0, 6)
}

function normalizeStringArray(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

export function sanitizeModelOutput(raw: string): SanitizedCartridge {
  const parsed = extractJson(raw)
  const firstPass = generatedCartridgeSchema.safeParse(parsed)

  if (!firstPass.success) {
    const issue = firstPass.error.issues[0]
    throw new SafetyValidationError(issue?.message ?? 'The model returned an invalid cartridge shape.')
  }

  const cartridge = {
    ...firstPass.data,
    title: firstPass.data.title.trim(),
    subtitle: firstPass.data.subtitle.trim(),
    description: firstPass.data.description.trim(),
    controls: normalizeStringArray(firstPass.data.controls),
    objective: firstPass.data.objective.trim(),
    winCondition: firstPass.data.winCondition.trim(),
    loseCondition: firstPass.data.loseCondition.trim(),
    tags: normalizeStringArray(firstPass.data.tags).slice(0, 8),
    html: stripScriptTags(firstPass.data.html.trim()),
    css: firstPass.data.css.trim(),
    js: firstPass.data.js.trim(),
  }

  const finalPass = generatedCartridgeSchema.safeParse(cartridge)

  if (!finalPass.success) {
    const issue = finalPass.error.issues[0]
    throw new SafetyValidationError(issue?.message ?? 'The sanitized cartridge is invalid.')
  }

  assertHtmlSafe(finalPass.data.html)
  assertCssSafe(finalPass.data.css)
  assertJsSafe(finalPass.data.js)
  const qualityWarnings = runStaticQualityChecks(finalPass.data)

  return {
    ...finalPass.data,
    engineNotes: 'Validated with Prompt Arcade safety and static quality checks.',
    qualityWarnings,
  }
}
