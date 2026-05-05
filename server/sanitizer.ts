import { generatedCartridgeSchema, type GeneratedCartridge } from './schemas'

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

function normalizeStringArray(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

export function sanitizeModelOutput(raw: string): GeneratedCartridge {
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

  return finalPass.data
}
