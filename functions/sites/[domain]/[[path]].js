import {cleanDomain,contentType} from '../../api/sites/_utils.js'
function decodeBase64(value){const binary=atob(value),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes}
function rewriteRootUrls(text,domain,path){
 const prefix='/sites/'+encodeURIComponent(domain)
 const rewrite=value=>!value||/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|data:|mailto:|tel:)/i.test(value)?value:value.startsWith('/')?prefix+value:value
 if(/\.html?$/i.test(path))return text.replace(/\b(href|src|action)=(["'])(\/[^"']*)\2/gi,(m,a,q,v)=>a+'='+q+rewrite(v)+q)
 if(/\.css$/i.test(path))return text.replace(/url\((["']?)(\/[^)'"]+)\1\)/gi,(m,q,v)=>'url('+q+rewrite(v)+q+')')
 return text
}
export async function onRequest({request,env,params}){
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method Not Allowed',{status:405})
 if(!env.DB)return new Response('D1 is not configured',{status:503})
 const domain=cleanDomain(params.domain);if(!domain)return new Response('Not found',{status:404})
 let path=Array.isArray(params.path)?params.path.join('/'):String(params.path||'')
 path=decodeURIComponent(path).replace(/^\/+|\/+$/g,'')
 const site=await env.DB.prepare('SELECT domain,entry FROM sites WHERE domain=? AND published=1').bind(domain).first()
 if(!site)return new Response('Site not found',{status:404,headers:{'Cache-Control':'no-store'}})
 if(!path)path=site.entry
 if(path.includes('..')||path.split('/').some(x=>!x||x==='.'||x==='..'))return new Response('Bad path',{status:400})
 let file=await env.DB.prepare('SELECT encoding,content FROM site_files WHERE domain=? AND path=?').bind(domain,path).first()
 if(!file&&(!path.includes('.')||path.endsWith('/')))file=await env.DB.prepare('SELECT encoding,content FROM site_files WHERE domain=? AND path=?').bind(domain,site.entry).first()
 if(!file)return new Response('File not found',{status:404})
 let body=file.encoding==='base64'?decodeBase64(file.content):file.content
 if(typeof body==='string'&&(/\.html?$/i.test(path)||/\.css$/i.test(path)))body=rewriteRootUrls(body,domain,path)
 const headers={'Content-Type':contentType(path),'Cache-Control':'public, max-age=60, s-maxage=300','Content-Security-Policy':"sandbox allow-scripts allow-forms allow-modals; frame-ancestors 'self'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}
 return request.method==='HEAD'?new Response(null,{status:200,headers}):new Response(body,{status:200,headers})
}
