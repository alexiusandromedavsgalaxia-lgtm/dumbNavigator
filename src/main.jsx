import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import './styles.css'
import {getProjects,putProject,deleteProject} from './store'
import {startProject,stopProject,onRuntimeReady,getRuntimeUrl} from './runtime'

const HOME='dumb://home'
const CREATE='dumb://create'
const DEVELOPE='dumb://uuu.develope.it'
const RESERVED=new Set(['home','create','bookmarks','history','settings','uuu.develope.it'])
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)??'null')??d}catch{return d}}
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
const normalize=input=>{
 let s=String(input??'').trim()
 if(!s)return HOME
 if(/^https?:\/\//i.test(s))return HOME
 if(!s.includes('://'))s='dumb://'+s
 try{const u=new URL(s);if(u.protocol!=='dumb:'||!u.hostname)return HOME;return 'dumb://'+u.hostname.toLowerCase()+(u.pathname&&u.pathname!=='/'?u.pathname:'/')+(u.search||'')+(u.hash||'')}
 catch{return HOME}
}
const visible=url=>{try{const u=new URL(url);return u.protocol==='dumb:'?(u.hostname+(u.pathname&&u.pathname!=='/'?u.pathname:'')+(u.search||'')+(u.hash||'')):''}catch{return ''}}
const domain=url=>{try{return new URL(url).hostname.toLowerCase()}catch{return ''}}
const pathOf=url=>{try{return decodeURIComponent(new URL(url).pathname||'/')}catch{return '/'}}
const isRuntimeType=p=>['react','vite','angular','node'].includes(p?.type)
const ext=p=>(p.split('.').pop()||'').toLowerCase()
const mime=p=>({html:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',ico:'image/x-icon',txt:'text/plain',xml:'application/xml',woff:'font/woff',woff2:'font/woff2'})[ext(p)]||'text/plain'
const bytesToBase64=b=>{let s='';const a=b instanceof Uint8Array?b:new Uint8Array(b);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode(...a.subarray(i,i+0x8000));return btoa(s)}
const fileText=v=>typeof v==='string'?v:''
const fileData=v=>typeof v==='string'?v:new Uint8Array(v?.data||v||[])
const fileUrl=(path,value)=>{
 if(typeof value==='string' && /^(data:|blob:|https?:)/i.test(value))return value
 if(typeof value==='string')return 'data:'+mime(path)+';charset=utf-8,'+encodeURIComponent(value)
 return 'data:'+mime(path)+';base64,'+bytesToBase64(fileData(value))
}
const rewriteStatic=(html,project,basePath)=>{
 const resolve=src=>{if(!src||/^(data:|mailto:|tel:|#|https?:|\/\/)/i.test(src))return src;const raw=(basePath+'/'+src).split('/');const out=[];for(const p of raw){if(!p||p==='.'){continue}if(p==='..')out.pop();else out.push(p)}return out.join('/')}
 return String(html).replace(/\b(href|src)=(["'])([^"']+)\2/gi,(m,a,q,v)=>{const p=resolve(v).replace(/^\//,'');const f=project.files[p];return f===undefined?m:a+'='+q+fileUrl(p,f)+q})
}
function detectType(files){
 const p=fileText(files['package.json']);if(!p)return 'static'
 try{const j=JSON.parse(p),all={...(j.dependencies||{}),...(j.devDependencies||{})};if(all['@angular/core'])return 'angular';if(all.react)return 'react';if(all.vite)return 'vite';if(all.express||all.fastify)return 'node';return 'node'}catch{return 'node'}
}
function newProject(domainName,files={},name='Mi proyecto'){return{id:crypto.randomUUID(),name,domain:domainName,type:detectType(files),entry:'index.html',files,createdAt:Date.now(),updatedAt:Date.now()}}
const sampleFiles={'index.html':'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi web</title></head><body><main><h1>Hola desde dumbNavigator</h1><p>Esta web vive dentro de este navegador.</p></main></body></html>'}

function Icon({name}){return <span className="icon" aria-hidden>{name}</span>}
function Setup({done}){const [lang,setLang]=useState('es');return <div className="setup"><div className="setupGlow"/><div className="setupCard"><div className="logoMark">d</div><span className="eyebrow">DUMBNAVIGATOR</span><h1>un navegador<br/><i>para tu internet</i></h1><p>una mezcla de Safari, Chrome y Opera para explorar y construir tu pequeño internet local</p><label>IDIOMA<select value={lang} onChange={e=>setLang(e.target.value)}><option value="es">Español</option><option value="en">English</option></select></label><button className="primary big" onClick={()=>{write('dumbSetup',{language:lang,version:2});done()}}>Entrar <b>↵</b></button></div></div>}

function Home({projects,navigate}){
 const [query,setQuery]=useState('')
 const filtered=projects.filter(p=>(p.name+' '+p.domain).toLowerCase().includes(query.toLowerCase()))
 return <div className="page homePage"><div className="homeHero"><span className="eyebrow">DUMBNAVIGATOR 2.0</span><h1>el navegador<br/><em>que se construye</em> contigo</h1><p>pestañas, espacios, proyectos locales y un estudio web integrado. todo en una sola app.</p><div className="homeSearch"><Icon name="⌕"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="buscar en tus webs o escribir un dominio"/><button onClick={()=>navigate(query||HOME)}>→</button></div></div><div className="quickGrid"><button className="quick featured" onClick={()=>navigate(CREATE)}><span>✦</span><b>nuevo proyecto</b><small>crea una web desde cero</small><strong>＋</strong></button><button className="quick" onClick={()=>navigate(DEVELOPE)}><span>⌘</span><b>develope</b><small>editor + terminal + preview</small><strong>↗</strong></button><button className="quick" onClick={()=>navigate('dumb://bookmarks')}><span>☆</span><b>marcadores</b><small>tus sitios favoritos</small><strong>↗</strong></button></div><section className="siteSection"><header><div><span className="eyebrow">LOCAL INTERNET</span><h2>tus webs</h2></div><span className="count">{projects.length}</span></header>{filtered.length?<div className="siteGrid">{filtered.map((p,i)=><button className="siteCard" key={p.id} onClick={()=>navigate('dumb://'+p.domain)}><span className="siteNo">{String(i+1).padStart(2,'0')}</span><span className="siteAvatar">{p.name.slice(0,1).toUpperCase()}</span><span className="siteInfo"><b>{p.name}</b><small>{p.domain} · {p.type}</small></span><span>↗</span></button>)}</div>:<div className="empty"><span>◎</span><div><b>{query?'no hay coincidencias':'todavía no hay webs'}</b><p>{query?'prueba otro nombre o dominio':'crea una o importa un repo de github para empezar'}</p></div></div>}</section></div>
}

function Projects({projects,navigate,setProjects}){
 const remove=async(id,e)=>{e.stopPropagation();if(confirm('¿borrar este proyecto?')){await deleteProject(id);setProjects(await getProjects())}}
 return <div className="page fullPage"><header className="pageHeader"><div><span className="eyebrow">LIBRARY</span><h1>tus proyectos</h1><p>todo lo que has creado en este navegador</p></div><button className="primary" onClick={()=>navigate(CREATE)}>＋ nuevo</button></header><div className="projectList">{projects.map((p,i)=><button className="projectRow" key={p.id} onClick={()=>navigate('dumb://'+p.domain)}><span>{String(i+1).padStart(2,'0')}</span><i>{p.name.slice(0,1).toUpperCase()}</i><div><b>{p.name}</b><small>{p.domain} · {p.type}</small></div><button className="ghost danger" onClick={e=>remove(p.id,e)}>×</button></button>)}{!projects.length&&<div className="empty dark"><span>＋</span><b>tu biblioteca está vacía</b><button className="primary" onClick={()=>navigate(CREATE)}>crear proyecto</button></div>}</div></div>
}

function Bookmarks({navigate}){
 const [items,setItems]=useState(()=>read('dumbBookmarks',[]))
 const remove=url=>{const next=items.filter(x=>x.url!==url);setItems(next);write('dumbBookmarks',next)}
 return <div className="page fullPage"><header className="pageHeader"><div><span className="eyebrow">BOOKMARKS</span><h1>marcadores</h1><p>tus accesos rápidos</p></div></header><div className="bookmarkGrid">{items.map(x=><button className="bookmarkCard" key={x.url} onClick={()=>navigate(x.url)}><span>☆</span><div><b>{x.title||x.url}</b><small>{x.url}</small></div><i onClick={e=>{e.stopPropagation();remove(x.url)}}>×</i></button>)}{!items.length&&<div className="empty dark"><span>☆</span><b>sin marcadores todavía</b><p>pulsa la estrella de la barra para guardar una web</p></div>}</div></div>
}

function Creator({projects,setProjects,navigate,initialProject}){
 const [project,setProject]=useState(initialProject||newProject('miweb.local',sampleFiles))
 const [selected,setSelected]=useState(Object.keys(project.files)[0]||'index.html')
 const [code,setCode]=useState(fileText(project.files[selected]))
 const [logs,setLogs]=useState([])
 const [runtimeUrl,setRuntimeUrl]=useState(getRuntimeUrl())
 const [running,setRunning]=useState(!!getRuntimeUrl())
 const fileInput=useRef(null),folderInput=useRef(null)
 useEffect(()=>setCode(fileText(project.files[selected])),[selected,project.id])
 useEffect(()=>onRuntimeReady(url=>{setRuntimeUrl(url);setRunning(!!url)}),[])
 const updateCode=value=>{setCode(value);setProject(p=>({...p,files:{...p.files,[selected]:value},updatedAt:Date.now()}))}
 const save=async()=>{const next={...project,type:detectType(project.files),updatedAt:Date.now()};setProject(next);await putProject(next);setProjects(await getProjects())}
 const addFiles=async(files)=>{const next={...project.files};for(const f of files){if(f.size>8*1024*1024)continue;const rel=(f.webkitRelativePath||f.name).replace(/^[^/]+\//,'');const binary=!/^text\/(plain|css|html|javascript|xml)|application\/(json|javascript|xml)|image\/(svg\+xml)$/i.test(f.type);next[rel]=binary?{data:Array.from(new Uint8Array(await f.arrayBuffer())),mime:f.type||mime(rel)}:await f.text()}const np={...project,files:next,type:detectType(next),updatedAt:Date.now()};setProject(np);await putProject(np);setProjects(await getProjects())}
 const importGithub=async()=>{try{const raw=prompt('URL de un repositorio GitHub público');if(!raw)return;const m=raw.match(/github\.com\/([^/]+)\/([^/#?]+)/i);if(!m)throw Error('URL de GitHub no válida');const repo=m[1],name=m[2].replace(/\.git$/,'');const base='https://api.github.com/repos/'+repo+'/'+name;const meta=await fetch(base).then(r=>{if(!r.ok)throw Error('repositorio no encontrado');return r.json()});const tree=await fetch(base+'/git/trees/'+meta.default_branch+'?recursive=1').then(r=>{if(!r.ok)throw Error('no se pudo leer el árbol del repo');return r.json()});const blobs=(tree.tree||[]).filter(x=>x.type==='blob'&&x.size<=8*1024*1024&&!/(^|\/)(node_modules|dist|build|\.git)(\/|$)/.test(x.path)).slice(0,500);const files={};for(const item of blobs){const b=await fetch(base+'/git/blobs/'+item.sha).then(r=>r.json());if(b.encoding==='base64'){const rawBytes=Uint8Array.from(atob(b.content.replaceAll('\n','')),c=>c.charCodeAt(0));files[item.path]=/\.(png|jpe?g|gif|webp|ico|woff2?|ttf)$/i.test(item.path)?{data:Array.from(rawBytes),mime:mime(item.path)}:new TextDecoder().decode(rawBytes)}}const np=newProject((meta.name||name).toLowerCase().replace(/[^a-z0-9.-]/g,'-')+'.local',files,meta.name||name);setProject(np);setSelected(Object.keys(files)[0]||'index.html');await putProject(np);setProjects(await getProjects())}catch(e){alert(e.message||'no se pudo importar el repo')}}
 const run=async()=>{await save();setLogs([]);setRunning(true);try{await startProject(project,x=>setLogs(l=>[...l,String(x)].slice(-100)))}catch(e){setRunning(false);setLogs(l=>[...l,'ERROR: '+e.message])}}
 const stop=async()=>{await stopProject();setRunning(false);setRuntimeUrl('')}
 const isRuntime=isRuntimeType(project)
 return <div className="studio"><aside className="studioSide"><div className="studioBrand"><div className="studioLogo">d</div><div><b>develope</b><small>local studio</small></div></div><label className="field">DOMINIO<input value={project.domain} onChange={e=>setProject({...project,domain:e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g,'')})}/></label><div className="fileActions"><button onClick={()=>fileInput.current?.click()}>＋ archivo</button><button onClick={()=>folderInput.current?.click()}>＋ carpeta</button><button onClick={importGithub}>⌘ github</button><input hidden ref={fileInput} type="file" multiple onChange={e=>addFiles([...e.target.files])}/><input hidden ref={folderInput} type="file" webkitdirectory="" directory="" multiple onChange={e=>addFiles([...e.target.files])}/></div><div className="tree">{Object.keys(project.files).sort().map(f=><button className={selected===f?'active':''} key={f} onClick={()=>setSelected(f)}><span>{ext(f)==='js'||ext(f)==='jsx'?'◈':ext(f)==='css'?'◇':ext(f)==='html'?'□':'·'}</span>{f}</button>)}</div><div className="sideBottom"><button className="ghost" onClick={()=>navigate(HOME)}>← navegador</button><button className="primary" onClick={save}>guardar</button></div></aside><main className="studioMain"><header className="studioHeader"><div><span className="eyebrow">PROJECT / {project.type.toUpperCase()}</span><h2>{project.name}</h2></div><div className="studioBtns"><button className="ghost" onClick={()=>navigate('dumb://'+project.domain)}>abrir</button>{isRuntime&&!running&&<button className="primary" onClick={run}>▶ ejecutar</button>}{isRuntime&&running&&<button className="stop" onClick={stop}>■ detener</button>}</div></header><div className="editorGrid"><section className="editorPane"><div className="paneHead"><span>{selected}</span><small>{typeof project.files[selected]==='string'?'UTF-8':'BINARY'}</small></div><textarea value={code} onChange={e=>updateCode(e.target.value)} spellCheck="false" disabled={typeof project.files[selected]!=='string'} placeholder="selecciona un archivo de texto"/></section><section className="previewPane"><div className="paneHead"><span>PREVIEW</span><small>{running?'RUNNING':'IDLE'}</small></div>{running&&runtimeUrl&&isRuntime?<iframe title="runtime" src={runtimeUrl} className="runtimeFrame"/>:<iframe title="static" srcDoc={selected.endsWith('.html')?rewriteStatic(code,project,'/'):('<pre style="padding:20px">'+String(code).replaceAll('<','&lt;')+'</pre>')} className="runtimeFrame"/>}</section></div>{logs.length>0&&<pre className="terminal">{logs.join('')}</pre>}</main></div>
}

function Browser({url,projects,navigate}){
 const p=projects.find(x=>x.domain===domain(url))
 const [src,setSrc]=useState('')
 useEffect(()=>{if(!p){setSrc('');return}if(isRuntimeType(p)){setSrc(getRuntimeUrl());return}const path=pathOf(url).replace(/^\//,'')||p.entry;const file=p.files[path]??p.files[p.entry];if(file!==undefined)setSrc(fileUrl(path,file))},[url,p])
 if(!p)return <div className="notFound"><span>404 / LOCAL</span><h1>esta web no existe aquí</h1><p>ese dominio no está creado o importado en dumbNavigator</p><button className="primary" onClick={()=>navigate(CREATE)}>crear / importar web</button></div>
 if(isRuntimeType(p)&&!src)return <div className="notFound"><span>SERVER OFFLINE</span><h1>el servidor está apagado</h1><p>abre develope y pulsa ejecutar</p><button className="primary" onClick={()=>navigate(CREATE)}>abrir proyecto</button></div>
 return <iframe title={visible(url)} src={src} className="siteFrame" sandbox="allow-scripts allow-forms allow-same-origin allow-modals"/>
}

function Menu({navigate,close,projects}){
 return <div className="browserMenu"><div className="menuHead"><b>dumbNavigator</b><span>{projects.length} webs</span></div><button onClick={()=>{close();navigate('dumb://projects')}}>▦ <span>proyectos</span><small>library</small></button><button onClick={()=>{close();navigate('dumb://bookmarks')}}>☆ <span>marcadores</span><small>saved</small></button><button onClick={()=>{close();navigate(CREATE)}}>＋ <span>nuevo proyecto</span><small>develope</small></button><button onClick={()=>{close();navigate('dumb://settings')}}>⚙ <span>ajustes</span><small>preferences</small></button></div>
}

function Settings({navigate}){
 const [accent,setAccent]=useState(()=>read('dumbAccent','#8b7cff'))
 useEffect(()=>document.documentElement.style.setProperty('--accent',accent),[accent])
 return <div className="page fullPage"><header className="pageHeader"><div><span className="eyebrow">SETTINGS</span><h1>ajustes</h1><p>personaliza la experiencia</p></div></header><div className="settingsCard"><b>color de acento</b><div className="accentRow">{['#8b7cff','#ff4668','#36c7ff','#39d98a','#ffb84d'].map(c=><button key={c} className={accent===c?'chosen':''} style={{background:c}} onClick={()=>{setAccent(c);write('dumbAccent',c)}}/> )}</div><p>la interfaz está optimizada para Cloudflare Pages y navegadores modernos</p></div><button className="primary backBtn" onClick={()=>navigate(HOME)}>← volver</button></div>
}

function App(){
 const [setup,setSetup]=useState(()=>read('dumbSetup',null)),[projects,setProjects]=useState([]),[url,setUrl]=useState(HOME),[address,setAddress]=useState(''),[menu,setMenu]=useState(false),[sidebar,setSidebar]=useState(false),[tabs,setTabs]=useState([{id:crypto.randomUUID(),url:HOME}]),[activeTab,setActiveTab]=useState(0),[accent]=useState(()=>read('dumbAccent','#8b7cff'))
 useEffect(()=>{document.documentElement.style.setProperty('--accent',accent);getProjects().then(setProjects)},[accent])
 useEffect(()=>setAddress(visible(url)),[url])
 const current=useMemo(()=>tabs[activeTab],[tabs,activeTab])
 const navigate=useCallback(next=>{const u=normalize(next);setUrl(u);setTabs(ts=>ts.map((t,i)=>i===activeTab?{...t,url:u}:t));setMenu(false);const history=read('dumbHistory',[]);write('dumbHistory',[...history.filter(x=>x!==u),u].slice(-100))},[activeTab])
 const submit=e=>{e.preventDefault();navigate(address)}
 const newTab=()=>{const t={id:crypto.randomUUID(),url:HOME};setTabs(ts=>[...ts,t]);setActiveTab(tabs.length);setUrl(HOME)}
 const closeTab=i=>{if(tabs.length===1)return;const next=tabs.filter((_,n)=>n!==i);const idx=Math.min(i,next.length-1);setTabs(next);setActiveTab(idx);setUrl(next[idx].url)}
 const selectTab=i=>{setActiveTab(i);setUrl(tabs[i].url)}
 const toggleBookmark=()=>{const items=read('dumbBookmarks',[]),exists=items.some(x=>x.url===url);const next=exists?items.filter(x=>x.url!==url):[...items,{url,title:domain(url)||'dumbNavigator',createdAt:Date.now()}];write('dumbBookmarks',next)}
 const goHome=()=>navigate(HOME)
 if(!setup)return <Setup done={()=>setSetup(read('dumbSetup',{}))}/>
 const path=domain(url)
 const page=url===HOME?'home':path==='projects'?'projects':path==='bookmarks'?'bookmarks':path==='settings'?'settings':(url===CREATE||url===DEVELOPE)?'creator':'browser'
 return <div className="app"><header className="browserChrome"><div className="traffic"><i/><i/><i/></div><button className="brandBtn" onClick={goHome}>d</button><div className="tabs">{tabs.map((t,i)=><button key={t.id} className={'tab '+(i===activeTab?'active':'')} onClick={()=>selectTab(i)}><span>{domain(t.url)||'inicio'}</span>{tabs.length>1&&<b onClick={e=>{e.stopPropagation();closeTab(i)}}>×</b>}</button>)}<button className="newTab" onClick={newTab}>＋</button></div><button className="windowBtn" onClick={()=>setMenu(v=>!v)}>☰</button></header><div className="toolbar"><div className="navButtons"><button onClick={()=>window.history.back()}>‹</button><button onClick={()=>window.history.forward()}>›</button><button onClick={goHome}>⌂</button></div><form className="address" onSubmit={submit}><span>⌕</span><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="buscar o escribir un dominio"/><button type="button" onClick={toggleBookmark}>☆</button><button type="submit">↵</button></form><div className="toolbarRight"><button onClick={()=>setSidebar(v=>!v)}>☷</button><button onClick={()=>setMenu(v=>!v)}>⋯</button></div></div>{menu&&<Menu navigate={navigate} close={()=>setMenu(false)} projects={projects}/>}<main className="browserBody">{page==='home'?<Home projects={projects} navigate={navigate}/>:page==='projects'?<Projects projects={projects} setProjects={setProjects} navigate={navigate}/>:page==='bookmarks'?<Bookmarks navigate={navigate}/>:page==='settings'?<Settings navigate={navigate}/>:<Browser url={url} projects={projects} navigate={navigate}/>}</main>{sidebar&&<aside className="sidePanel"><header><b>sidebar</b><button onClick={()=>setSidebar(false)}>×</button></header><button onClick={()=>navigate('dumb://bookmarks')}>☆ <span>marcadores</span></button><button onClick={()=>navigate('dumb://projects')}>▦ <span>proyectos</span></button><button onClick={()=>navigate(DEVELOPE)}>⌘ <span>develope</span></button><div className="sideHint">dumbNavigator<br/><small>tu internet local</small></div></aside>}</div>
}
createRoot(document.getElementById('root')).render(<App/>)
