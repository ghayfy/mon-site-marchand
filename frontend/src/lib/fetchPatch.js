import { ensureAuth, getAuthHeader, clearAuth } from './adminAuth.js'
const _orig = window.fetch.bind(window)

window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url
  let cfg = init || {}

  const isAdmin = url && url.includes('/api/admin')
  if (isAdmin) {
    await ensureAuth()
    cfg = { ...cfg, headers: { ...(cfg.headers||{}), ...getAuthHeader() } }
  }

  let res = await _orig(input, cfg)
  if (isAdmin && res.status === 401 && !cfg.__retried) {
    // re-prompt une seule fois
    clearAuth()
    await ensureAuth()
    const cfg2 = { ...cfg, __retried: true, headers: { ...(cfg.headers||{}), ...getAuthHeader() } }
    res = await _orig(input, cfg2)
  }
  return res
}
