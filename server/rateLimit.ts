const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 20

const requestsByIp = new Map<string, number[]>()

function prune(now: number) {
  for (const [ip, timestamps] of requestsByIp.entries()) {
    const active = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS)

    if (active.length === 0) {
      requestsByIp.delete(ip)
    } else {
      requestsByIp.set(ip, active)
    }
  }
}

export function checkRateLimit(ip: string) {
  const now = Date.now()
  const timestamps = requestsByIp.get(ip)?.filter((timestamp) => now - timestamp < WINDOW_MS) ?? []

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = Math.min(...timestamps)
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000)

    return {
      ok: false,
      retryAfterSeconds,
    }
  }

  timestamps.push(now)
  requestsByIp.set(ip, timestamps)

  return {
    ok: true,
    retryAfterSeconds: 0,
  }
}

const cleanupTimer = setInterval(() => prune(Date.now()), 10 * 60 * 1000)
cleanupTimer.unref()
