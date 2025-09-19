export function getAuthHeader(){
  const b64 = sessionStorage.getItem('adminBasic')
  return b64 ? { Authorization: `Basic ${b64}` } : {}
}
export async function ensureAuth(){
  let b64 = sessionStorage.getItem('adminBasic')
  if (b64) return
  const user = window.prompt('Login admin Basic Auth :','admin'); if(user===null) throw new Error('Auth annulée')
  const pass = window.prompt('Mot de passe admin :','');          if(pass===null) throw new Error('Auth annulée')
  b64 = btoa(`${user}:${pass}`)
  sessionStorage.setItem('adminBasic', b64)
}
export function clearAuth(){ sessionStorage.removeItem('adminBasic') }
