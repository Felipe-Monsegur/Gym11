const ATTEMPT_KEY = 'gym11-build-reload-attempts'
const MAX_ATTEMPTS = 2

async function fetchRemoteBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { buildId?: string }
    return data.buildId || null
  } catch {
    return null
  }
}

function forceFreshNavigation(buildId: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set('_bid', buildId)
  window.location.replace(url.toString())
}

/** Si el hosting tiene un build más nuevo, recarga forzando bypass de caché. */
export async function ensureFreshBuild(): Promise<void> {
  const remoteId = await fetchRemoteBuildId()
  if (!remoteId || remoteId === __BUILD_ID__) {
    try {
      sessionStorage.removeItem(ATTEMPT_KEY)
    } catch {
      // ignore
    }
    return
  }

  let attempts = 0
  try {
    attempts = Number(sessionStorage.getItem(ATTEMPT_KEY) || '0')
  } catch {
    attempts = 0
  }

  if (attempts >= MAX_ATTEMPTS) return

  try {
    sessionStorage.setItem(ATTEMPT_KEY, String(attempts + 1))
  } catch {
    // ignore
  }

  forceFreshNavigation(remoteId)
}

export function watchForNewBuilds(): void {
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        void reg.unregister()
      })
    })
  }

  if (typeof caches !== 'undefined') {
    void caches.keys().then((keys) => {
      keys.forEach((key) => {
        void caches.delete(key)
      })
    })
  }

  void ensureFreshBuild()

  window.addEventListener('pageshow', () => {
    void ensureFreshBuild()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void ensureFreshBuild()
    }
  })
}
