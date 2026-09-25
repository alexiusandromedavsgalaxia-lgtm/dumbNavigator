export async function onRequest(context){
  const {request,env}=context
  const response=await context.next()
  if(response.status!==404)return response

  const path=new URL(request.url).pathname
  if(path==='/api' || path.startsWith('/api/'))return response
  if(path==='/sites' || path.startsWith('/sites/'))return response

  const home=await env.ASSETS.fetch(new URL('/',request.url))
  if(!home.ok)return response
  return new Response(home.body,home)
}
