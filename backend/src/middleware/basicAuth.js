import { Buffer } from 'node:buffer'
export function basicAuth(user, pass) {
  const U = String(user||'').trim(), P = String(pass||'').trim()
  if (!U || !P) {
    console.warn('[basicAuth] ADMIN_USER/ADMIN_PASS non définis → protection désactivée')
    return (_req,_res,next)=>next()
  }
  return (req,res,next)=>{
    const h = req.headers.authorization || ''
    if (!h.startsWith('Basic ')) return ask()
    try {
      const [u,p] = Buffer.from(h.slice(6),'base64').toString('utf8').split(':')
      if (u===U && p===P) return next()
    } catch {}
    return ask()
    function ask(){
      res.set('WWW-Authenticate','Basic realm="Admin", charset="UTF-8"')
      res.status(401).json({error:'Unauthorized'})
    }
  }
}
