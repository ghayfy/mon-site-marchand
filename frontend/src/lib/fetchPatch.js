import { ensureAuth, getAuthHeader } from './adminAuth.js'
const _orig = window.fetch.bind(window)
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url
  let cfg = init || {}
  if (url && url.includes('/api/admin')) {
    await ensureAuth()
    const _h = { ...(cfg.headers||{}), ...getAuthHeader() }
    cfg = { ...cfg, headers: _h }
  }
  return _orig(input, cfg)
}
