let instancePromise=null
let activeProcess=null
let activeProjectId=null
let activeUrl=''
let activeServerHandler=null
const readyListeners=new Set()
async function getInstance(){
 if(!instancePromise){
  const mod=await import('@webcontainer/api')
  instancePromise=mod.WebContainer.boot({coep:'require-corp',forwardPreviewErrors:'exceptions-only'})
 }
 return instancePromise
}
function emit(url){activeUrl=url;readyListeners.forEach(fn=>fn(url))}
export function onRuntimeReady(fn){readyListeners.add(fn);return()=>readyListeners.delete(fn)}
function tree(files){
 const root={}
 for(const [path,value] of Object.entries(files)){
  const parts=path.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean);let node=root
  parts.forEach((part,i)=>{if(i===parts.length-1){node[part]={file:{contents:typeof value==='string'?value:new Uint8Array(value?.data||value||[])}}}else{node[part]??={directory:{}};node=node[part].directory}})
 }
 return root
}
export async function startProject(project,onLog=()=>{}){
 const wc=await getInstance()
 if(activeProcess){try{activeProcess.kill()}catch{}}
 if(activeServerHandler&&instancePromise){try{(await instancePromise).off?.('server-ready',activeServerHandler)}catch{}}
 activeServerHandler=null;activeProcess=null;activeProjectId=null;activeUrl='';emit('')
 try{await wc.fs.rm('/workspace',{recursive:true,force:true})}catch{}
 await wc.fs.mkdir('/workspace',{recursive:true})
 await wc.mount(tree(project.files),{mountPoint:'/workspace'})
 let pkg=null
 try{pkg=project.files['package.json']?JSON.parse(typeof project.files['package.json']==='string'?project.files['package.json']:''):null}catch{throw Error('package.json no es JSON válido')}
 if(!pkg)throw Error('este proyecto no tiene package.json')
 const install=await wc.spawn('npm',['install','--no-audit','--no-fund'],{cwd:'/workspace'})
 install.output.pipeTo(new WritableStream({write:data=>onLog(String(data))})).catch(()=>{})
 if(await install.exit!==0)throw Error('npm install terminó con error')
 const scripts=pkg.scripts||{}
 const command=scripts.dev?'dev':scripts.start?'start':scripts.serve?'serve':null
 if(!command)throw Error('no encuentro un script dev, start o serve en package.json')
 activeProjectId=project.id
 const process=await wc.spawn('npm',['run',command],{cwd:'/workspace'})
 activeProcess=process
 process.output.pipeTo(new WritableStream({write:data=>onLog(String(data))})).catch(()=>{})
 activeServerHandler=(port,url)=>{if(activeProjectId===project.id)emit(url)}
 wc.on('server-ready',activeServerHandler)
 return {wc,process}
}
export async function stopProject(){
 if(activeProcess){try{activeProcess.kill()}catch{}}
 activeProcess=null;activeProjectId=null;activeUrl='';emit('')
}
export function getRuntimeUrl(){return activeUrl}
