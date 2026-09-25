const MAX_FILES=500
const MAX_FILE_BYTES=1400000
const MAX_TOTAL_BYTES=8*1024*1024
const RESERVED=new Set(['home','create','bookmarks','history','projects','settings','develope.it','api','sites'])
export function cleanDomain(value){
 const d=String(value||'').trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0]
 if(!/^[a-z0-9](?:[a-z0-9.-]{0,61}[a-z0-9])?$/.test(d)||d.includes('..')||RESERVED.has(d))return null
 return d
}
export function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export async function sha256(value){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')
}
export function randomToken(){
 const bytes=new Uint8Array(32);crypto.getRandomValues(bytes)
 return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('')
}
function base64(bytes){let out='';for(let i=0;i<bytes.length;i+=0x8000)out+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(out)}
export function normalizeFiles(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('files inválidos')
 const entries=Object.entries(input)
 if(!entries.length||entries.length>MAX_FILES)throw Error('el proyecto debe tener entre 1 y 500 archivos')
 let total=0;const files=[]
 for(const [rawPath,value] of entries){
  const path=rawPath.replace(/^\/+|\/+$/g,'')
  if(!path||path.includes('..')||path.split('/').some(x=>!x||x==='.'||x.includes('\\')))throw Error('ruta de archivo inválida')
  if(typeof value!=='string'&&(!value||typeof value!=='object'||!Array.isArray(value.data)))throw Error('contenido de archivo inválido')
  const encoding=typeof value==='string'?'utf8':'base64'
  const bytes=encoding==='utf8'?new TextEncoder().encode(value):new Uint8Array(value.data)
  if(bytes.byteLength>MAX_FILE_BYTES)throw Error('un archivo supera el límite público de 1.4 MB')
  total+=bytes.byteLength
  if(total>MAX_TOTAL_BYTES)throw Error('el proyecto supera el límite público de 12 MB')
  const content=encoding==='utf8'?value:base64(bytes)
  files.push({path,encoding,content})
 }
 return files
}
const MIME={html:'text/html; charset=utf-8',htm:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',json:'application/json; charset=utf-8',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',ico:'image/x-icon',txt:'text/plain; charset=utf-8',xml:'application/xml; charset=utf-8',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',map:'application/json; charset=utf-8'}
export function contentType(path){return MIME[(path.split('.').pop()||'').toLowerCase()]||'application/octet-stream'}
