import {cleanDomain,json,sha256} from './_utils.js'
export async function onRequestGet({request,env,params}){
 if(!env.DB)return json({published:false},503)
 const domain=cleanDomain(params.domain);if(!domain)return json({published:false},404)
 const site=await env.DB.prepare('SELECT domain,name,type,entry,updated_at FROM sites WHERE domain=? AND published=1').bind(domain).first()
 if(!site)return json({published:false},404)
 return json({published:true,...site,publicUrl:new URL('/sites/'+encodeURIComponent(domain),request.url).href})
}
export async function onRequestDelete({request,env,params}){
 if(!env.DB)return json({error:'D1 no está configurado'},503)
 const domain=cleanDomain(params.domain),token=String(request.headers.get('x-publish-token')||'')
 if(!domain||!token)return json({error:'dominio o token inválido'},400)
 const site=await env.DB.prepare('SELECT token_hash FROM sites WHERE domain=?').bind(domain).first()
 if(!site||await sha256(token)!==site.token_hash)return json({error:'token de publicación incorrecto'},403)
 await env.DB.batch([env.DB.prepare('DELETE FROM site_files WHERE domain=?').bind(domain),env.DB.prepare('DELETE FROM sites WHERE domain=?').bind(domain)])
 return json({ok:true})
}
