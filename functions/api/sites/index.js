import {cleanDomain,json,normalizeFiles,randomToken,sha256} from './_utils.js'
export async function onRequestPost({request,env}){
 if(!env.DB)return json({error:'D1 no está configurado. Vincula una base de datos con el binding DB.'},503)
 try{
  const body=await request.json(),domain=cleanDomain(body.domain)
  if(!domain)return json({error:'dominio inválido o reservado'},400)
  const name=String(body.name||domain).slice(0,120),type=String(body.type||'static').slice(0,32),entry=String(body.entry||'index.html').replace(/^\/+/, '')
  const files=normalizeFiles(body.files)
  if(!files.some(f=>f.path===entry))return json({error:'el archivo de entrada no existe'},400)
  const existing=await env.DB.prepare('SELECT token_hash FROM sites WHERE domain=?').bind(domain).first()
  const supplied=String(request.headers.get('x-publish-token')||'')
  let token=null
  if(existing){
   if(!supplied||await sha256(supplied)!==existing.token_hash)return json({error:'este dominio ya está publicado y requiere su token de publicación'},409)
  }else token=randomToken()
  const now=Date.now(),tokenHash=existing?existing.token_hash:await sha256(token)
  await env.DB.batch([
   env.DB.prepare('INSERT INTO sites(domain,name,type,entry,token_hash,created_at,updated_at,published) VALUES(?,?,?,?,?,?,?,1) ON CONFLICT(domain) DO UPDATE SET name=excluded.name,type=excluded.type,entry=excluded.entry,updated_at=excluded.updated_at,published=1').bind(domain,name,type,entry,tokenHash,now,now),
   env.DB.prepare('DELETE FROM site_files WHERE domain=?').bind(domain),
   ...files.map(f=>env.DB.prepare('INSERT INTO site_files(domain,path,encoding,content) VALUES(?,?,?,?)').bind(domain,f.path,f.encoding,f.content))
  ])
  return json({ok:true,domain,name,type,entry,publicUrl:new URL('/sites/'+encodeURIComponent(domain),request.url).href,token:token||undefined,updatedAt:now})
 }catch(error){return json({error:error?.message||'no se pudo publicar'},400)}
}
