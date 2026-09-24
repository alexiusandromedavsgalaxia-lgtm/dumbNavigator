import React,{useEffect,useMemo,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import './styles.css'
import {getProjects,putProject,deleteProject} from './store'
import {startProject,onRuntimeReady,getRuntimeUrl} from './runtime'

const HOME='dumb://home'
const CREATE='dumb://create'
const DEVELOPE='dumb://uuu.develope.it'
const RESERVED=new Set(['home','create','bookmarks','history','uuu.develope.it'])
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)??'null')??d}catch{return d}}
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
const normalize=input=>{let s=input.trim();if(!s)return HOME;if(/^https?:\/\//i.test(s))return HOME;if(!s.includes('://'))s='dumb://'+s;try{const u=new URL(s);if(u.protocol!=='dumb:'||!u.hostname)return HOME;return 'dumb://'+u.hostname.toLowerCase()+(u.pathname&&u.pathname!=='/'?u.pathname:'')+(u.search||'')+(u.hash||'')}catch{return HOME}}
const visible=url=>{if(!url||url===HOME)return '';try{const u=new URL(url);return u.protocol==='dumb:'?u.hostname+(u.pathname&&u.pathname!=='/'?u.pathname:'')+(u.search||'')+(u.hash||''):''}catch{return ''}}
const domain=url=>{try{return new URL(url).hostname.toLowerCase()}catch{return ''}}
const pathOf=url=>{try{return decodeURIComponent(new URL(url).pathname||'/')}catch{return '/'}}
const extMime=p=>({html:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',ico:'image/x-icon',txt:'text/plain',xml:'application/xml'})[(p.split('.').pop()||'').toLowerCase()]||'text/plain'
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
const rewriteStatic=(html,project,basePath)=>{
  const resolve=(src)=>{if(!src||/^(data:|mailto:|tel:|#|https?:|\/\/)/i.test(src))return src;const parts=(basePath+'/'+src).split('/');const out=[];for(const p of parts){if(!p||p==='.'){continue}if(p==='..')out.pop();else out.push(p)}return '/'+out.join('/')}
  return html.replace(/\b(href|src)=(["'])([^"']+)\2/gi,(m,a,q,v)=>{const p=resolve(v);if(!project.files[p.slice(1)])return m;const file=project.files[p.slice(1)];if(/\.(css)$/i.test(p))return a+'='+q+'data:text/css;charset=utf-8,'+encodeURIComponent(file)+q;if(/\.(js|mjs)$/i.test(p))return a+'='+q+'data:text/javascript;charset=utf-8,'+encodeURIComponent(file)+q;if(/\.(png|jpe?g|gif|webp|svg)$/i.test(p))return a+'='+q+'data:'+extMime(p)+';base64,'+btoa(unescape(encodeURIComponent(file)))+q;return a+'='+q+'data:text/html;charset=utf-8,'+encodeURIComponent(file)+q})
}
function detectType(files){
  const p=files['package.json']
  if(!p)return 'static'
  try{const j=JSON.parse(p);const all={...(j.dependencies||{}),...(j.devDependencies||{})};if(all['@angular/core'])return 'angular';if(all.react)return 'react';if(all.vite)return 'vite';if(all.express||all.fastify)return 'node';return 'node'}catch{return 'node'}
}
function newProject(domainName,files={},name='Mi proyecto'){
  return {id:crypto.randomUUID(),name,domain:domainName,type:detectType(files),entry:'index.html',files,createdAt:Date.now(),updatedAt:Date.now()}
}
const sampleFiles={'index.html':'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi web</title></head><body><h1>Hola desde dumbNavigator</h1><p>Esta web vive dentro de este navegador.</p></body></html>'}

function Setup({done}){
 const [lang,setLang]=useState('es')
 const finish=()=>{write('dumbSetup',{language:lang,accent:'#8b7cff',style:'dark'});done()}
 return <div className="setup"><div className="setupCard"><div className="brandMark">d</div><span className="eyebrow">DUMBNAVIGATOR</span><h1>tu navegador.<br/><i>tu internet local.</i></h1><p>crea webs, importa proyectos y ejecuta Node.js dentro del navegador.</p><select value={lang} onChange={e=>setLang(e.target.value)}><option value="es">Español</option><option value="en">English</option></select><button onClick={finish}>Entrar →</button></div></div>
}
function Home({projects,navigate}){
 return <div className="homePage"><div className="hero"><span className="eyebrow">LOCAL WEB ENGINE</span><h1>tu web vive<br/><em>aquí.</em></h1><p>HTML, carpetas, React, Vite, Angular y Node.js. Todo queda dentro de dumbNavigator.</p><div className="homeActions"><button className="primary" onClick={()=>navigate(CREATE)}>＋ Crear proyecto</button><button onClick={()=>navigate(DEVELOPE)}>Abrir DevelopE</button></div></div><section><div className="sectionHead"><h2>Tus proyectos</h2><span>{projects.length}</span></div>{projects.length===0?<div className="empty"><b>todavía no hay webs</b><p>crea una desde cero o importa una carpeta / repo de GitHub.</p></div>:<div className="projectGrid">{projects.map(p=><button className="projectCard" key={p.id} onClick={()=>navigate('dumb://'+p.domain)}><span className="projectIcon">{p.type[0].toUpperCase()}</span><div><strong>{p.name}</strong><small>{p.domain}</small></div><i>↗</i></button>)}</div>}</section></div>
}
function Creator({projects,setProjects,navigate,initialProject}){
 const [project,setProject]=useState(initialProject||newProject('miweb.local',sampleFiles))
 const [selected,setSelected]=useState(Object.keys(project.files)[0]||'index.html')
 const [code,setCode]=useState(project.files[selected]||'')
 const [logs,setLogs]=useState([])
 const [runtimeUrl,setRuntimeUrl]=useState(getRuntimeUrl())
 const fileInput=useRef(null)
 const folderInput=useRef(null)
 useEffect(()=>{setCode(project.files[selected]||'')},[selected,project.id])
 useEffect(()=>onRuntimeReady(setRuntimeUrl),[])
 const updateCode=value=>{setCode(value);setProject(p=>({...p,files:{...p.files,[selected]:value},updatedAt:Date.now()}))}
 const save=async()=>{await putProject({...project,type:detectType(project.files)});setProjects(await getProjects())}
 const publish=async()=>{if(!project.domain||RESERVED.has(project.domain))return;await save();navigate('dumb://'+project.domain)}
 const addFiles=async(files)=>{const next={...project.files};for(const f of files){if(f.size>2*1024*1024)continue;const text=await f.text();const rel=f.webkitRelativePath||f.name;next[rel.replace(/^[^/]+\//,'')]=text}const np={...project,files:next,type:detectType(next),updatedAt:Date.now()};setProject(np);await putProject(np);setProjects(await getProjects())}
 const importGithub=async()=>{const raw=prompt('URL de un repositorio GitHub público');if(!raw)return;const m=raw.match(/github\.com\/([^/]+)\/([^/#?]+)/i);if(!m)return alert('URL de GitHub no válida');const repo=m[1],name=m[2].replace(/\.git$/,'');const meta=await fetch('https://api.github.com/repos/'+repo+'/'+name).then(r=>r.json());if(!meta.default_branch)throw new Error(meta.message||'No se pudo leer el repositorio');const tree=await fetch('https://api.github.com/repos/'+repo+'/'+name+'/git/trees/'+meta.default_branch+'?recursive=1').then(r=>r.json());const blobs=(tree.tree||[]).filter(x=>x.type==='blob'&&x.size<2*1024*1024&&!/(node_modules|dist|build|\.git)\//.test(x.path)).slice(0,250);const files={};for(const item of blobs){const b=await fetch('https://api.github.com/repos/'+repo+'/'+name+'/git/blobs/'+item.sha).then(r=>r.json());if(b.encoding==='base64')files[item.path]=decodeURIComponent(escape(atob(b.content.replaceAll('\n',''))))}const np=newProject((meta.name||name)+'.local',files,meta.name||name);setProject(np);setSelected(Object.keys(files)[0]||'index.html');await putProject(np);setProjects(await getProjects())}
 const run=async()=>{await save();setLogs([]);try{await startProject(project,x=>setLogs(l=>[...l,String(x)].slice(-120)))}catch(e){setLogs(l=>[...l,'ERROR: '+e.message])}}
 const isRuntime=['react','vite','angular','node'].includes(project.type)
 return <div className="studio"><aside className="studioSide"><div className="studioBrand"><b>DEVELOPE</b><span>local studio</span></div><label>DOMINIO<input value={project.domain} onChange={e=>setProject({...project,domain:e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g,'')})}/></label><div className="fileActions"><button onClick={()=>fileInput.current?.click()}>＋ archivos</button><button onClick={()=>folderInput.current?.click()}>＋ carpeta</button><button onClick={importGithub}>◈ GitHub</button><input hidden ref={fileInput} type="file" multiple onChange={e=>addFiles([...e.target.files])}/><input hidden ref={folderInput} type="file" webkitdirectory="" directory="" multiple onChange={e=>addFiles([...e.target.files])}/></div><div className="tree">{Object.keys(project.files).sort().map(f=><button className={selected===f?'active':''} key={f} onClick={()=>setSelected(f)}>{f}</button>)}</div><button className="saveBtn" onClick={save}>Guardar</button></aside><main className="studioMain"><header><div><span className="eyebrow">PROJECT / {project.type.toUpperCase()}</span><h2>{project.name}</h2></div><div className="studioBtns"><button onClick={()=>navigate('dumb://'+project.domain)}>Abrir</button>{isRuntime&&<button className="primary" onClick={run}>▶ Ejecutar servidor</button>}</div></header><div className="editorGrid"><section className="editorPane"><div className="paneHead"><span>{selected}</span><span>local</span></div><textarea value={code} onChange={e=>updateCode(e.target.value)} spellCheck="false"/></section><section className="previewPane"><div className="paneHead"><span>PREVIEW</span><span>{runtimeUrl?'RUNNING':'IDLE'}</span></div>{runtimeUrl&&isRuntime?<iframe title="runtime" src={runtimeUrl} className="runtimeFrame"/>:<div className="staticPreview"><iframe title="static" srcDoc={selected.endsWith('.html')?rewriteStatic(code,project,'/'): '<pre>'+esc(code)+'</pre>'}/></div>}</section></div>{logs.length>0&&<pre className="terminal">{logs.join('')}</pre>}</main></div>
}
function Browser({url,projects,navigate}){
 const p=projects.find(x=>x.domain===domain(url))
 const [src,setSrc]=useState('')
 useEffect(()=>{if(!p){setSrc('');return}if(['react','vite','angular','node'].includes(p.type)){setSrc(getRuntimeUrl());return}const path=pathOf(url).replace(/^\//,'')||p.entry;const file=p.files[path]||p.files[p.entry];if(file)setSrc(rewriteStatic(file,p,'/'+path.split('/').slice(0,-1).join('/')))},[url,p])
 if(!p)return <div className="notFound"><span>404 / LOCAL</span><h1>esta web no existe aquí.</h1><p>ese dominio no está creado o importado en dumbNavigator.</p><button onClick={()=>navigate(CREATE)}>Crear / importar web</button></div>
 if(['react','vite','angular','node'].includes(p.type)&&!src)return <div className="notFound"><span>SERVER OFFLINE</span><h1>el servidor está apagado.</h1><p>abre DevelopE y pulsa «Ejecutar servidor».</p><button onClick={()=>navigate(CREATE)}>Abrir proyecto</button></div>
 return <iframe title={visible(url)} src={src} className="siteFrame" sandbox="allow-scripts allow-forms allow-same-origin"/>
}
function App(){
 const [setup,setSetup]=useState(()=>read('dumbSetup',null))
 const [projects,setProjects]=useState([])
 const [url,setUrl]=useState(HOME)
 const [address,setAddress]=useState('')
 const [page,setPage]=useState('browser')
 const [projectId,setProjectId]=useState(null)
 const [menu,setMenu]=useState(false)
 useEffect(()=>{getProjects().then(setProjects)},[])
 const navigate=next=>{const u=normalize(next);setUrl(u);setAddress(visible(u));setPage(u===CREATE||u===DEVELOPE?'creator':'browser');if(u!==HOME)write('dumbHistory',[...(read('dumbHistory',[]))].slice(-49),u])}
 const submit=e=>{e.preventDefault();navigate(address)}
 const currentProject=projects.find(p=>p.domain===domain(url))||null
 const openCreator=id=>{setProjectId(id);navigate(id?CREATE:CREATE)}
 if(!setup)return <Setup done={()=>setSetup(read('dumbSetup',{}))}/>
 return <div className="app"><header className="browserChrome"><button className="chromeBtn" onClick={()=>navigate(HOME)}>d</button><button className="chromeBtn" onClick={()=>window.history.back()}>‹</button><button className="chromeBtn" onClick={()=>window.history.forward()}>›</button><form onSubmit={submit} className="address"><span>⌕</span><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="buscar o escribir un dominio local"/><button type="submit">↵</button></form><button className="chromeBtn" onClick={()=>setMenu(!menu)}>☰</button></header>{menu&&<div className="menu"><button onClick={()=>{setMenu(false);navigate(CREATE)}}>＋ Crear / importar proyecto</button><button onClick={()=>{setMenu(false);setPage('projects')}}>Tus proyectos</button></div>}<div className="browserBody">{page==='creator'?<Creator projects={projects} setProjects={setProjects} navigate={navigate} initialProject={projectId?currentProject:null}/>:page==='projects'?<div className="projectsPage"><div className="sectionHead"><h1>tus proyectos</h1><button className="primary" onClick={()=>navigate(CREATE)}>＋ Nuevo</button></div><div className="projectGrid">{projects.map(p=><button className="projectCard" key={p.id} onClick={()=>navigate('dumb://'+p.domain)}><strong>{p.name}</strong><small>{p.domain} · {p.type}</small></button>)}</div></div>:url===HOME?<Home projects={projects} navigate={navigate}/>:<Browser url={url} projects={projects} navigate={navigate}/>}</div></div>
}
createRoot(document.getElementById('root')).render(<App/>)
