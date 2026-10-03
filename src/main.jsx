import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import"./styles.css";
import{loadProjects,saveProject,deleteProject}from"./storage.js";

const PROTOCOLS=[
 {id:"httc",label:"HTTC",region:"Universal",symbol:"◎",description:"Universal web layer"},
 {id:"amwp",label:"AMWP",region:"Americas",symbol:"◉",description:"American web layer"},
 {id:"euwp",label:"EUWP",region:"Europe",symbol:"◇",description:"European web layer"},
 {id:"aswp",label:"ASWP",region:"Asia",symbol:"◈",description:"Asian web layer"},
 {id:"afwp",label:"AFWP",region:"Africa",symbol:"◆",description:"African web layer"},
 {id:"ocwp",label:"OCWP",region:"Oceania",symbol:"◌",description:"Oceanian web layer"}
];
const P=new Map(PROTOCOLS.map(x=>[x.id,x]));
const INTERNAL={home:"httc://home",develope:"httc://develope",projects:"httc://projects",bookmarks:"httc://bookmarks",history:"httc://history",protocols:"httc://protocols",settings:"httc://settings"};
const uid=()=>crypto.randomUUID();
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function parse(url){try{const u=new URL(url);return{protocol:u.protocol.slice(0,-1).toLowerCase(),host:u.hostname.toLowerCase(),path:u.pathname||"/",query:u.searchParams}}catch{return null}}
function normal(raw){let s=String(raw||"").trim();if(!s)return INTERNAL.home;if(/^[a-z][a-z0-9+.-]*:\/\//i.test(s)){const p=parse(s);if(p&&P.has(p.protocol))return s.replace(/^([A-Z]+):/i,(_,x)=>x.toLowerCase()+":");if(/^https?:/i.test(s))return s;return INTERNAL.home}if(/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(s))return"httc://"+s;if(/^\/\//.test(s))return"httc:"+s;return"httc://search/?q="+encodeURIComponent(s)}
function internalKey(url){return Object.entries(INTERNAL).find(([,v])=>v===url.replace(/\/$/,""))?.[0]||""}
function protocolOf(url){return parse(url)?.protocol||"httc"}
function displayTitle(url,projects){const k=internalKey(url);if(k)return k==="develope"?"Develope":k[0].toUpperCase()+k.slice(1);const p=parse(url);return projects.find(x=>x.domain===p?.host)?.name||p?.host||"Nueva pestaña"}

function App(){
 const[projects,setProjects]=useState([]),[loaded,setLoaded]=useState(false);
 const[tabs,setTabs]=useState(()=>get("dn.tabs",[ {id:uid(),url:INTERNAL.home,title:"Inicio"} ]));
 const[active,setActive]=useState(0),[bookmarks,setBookmarks]=useState(()=>get("dn.bookmarks",[])),[history,setHistory]=useState(()=>get("dn.history",[]));
 useEffect(()=>{loadProjects().then(setProjects).finally(()=>setLoaded(true))},[]);
 useEffect(()=>put("dn.tabs",tabs),[tabs]);useEffect(()=>put("dn.bookmarks",bookmarks),[bookmarks]);useEffect(()=>put("dn.history",history),[history]);
 const url=tabs[active]?.url||INTERNAL.home;
 const go=raw=>{const next=normal(raw),title=displayTitle(next,projects);setTabs(ts=>ts.map((t,i)=>i===active?{...t,url:next,title}:t));setHistory(h=>[{url:next,title,time:Date.now()},...h.filter(x=>x.url!==next)].slice(0,120))};
 const addTab=()=>{setTabs(ts=>[...ts,{id:uid(),url:INTERNAL.home,title:"Inicio"}]);setActive(tabs.length)};
 const closeTab=i=>{if(tabs.length===1)return;setTabs(ts=>ts.filter((_,n)=>n!==i));setActive(a=>a>i?a-1:Math.min(a,tabs.length-2))};
 if(!loaded)return <div className="boot"><div className="mark">d</div><p>loading navigator</p></div>;
 return <><Chrome tabs={tabs}active={active}setActive={setActive}closeTab={closeTab}addTab={addTab}url={url}go={go}bookmarks={bookmarks}setBookmarks={setBookmarks}/><main className="viewport"><Route url={url}projects={projects}setProjects={setProjects}go={go}bookmarks={bookmarks}setBookmarks={setBookmarks}history={history}/></main></>
}

function Chrome({tabs,active,setActive,closeTab,addTab,url,go,bookmarks,setBookmarks}){
 const[value,setValue]=useState(url),[open,setOpen]=useState(false);useEffect(()=>setValue(url),[url]);
 const p=protocolOf(url),saved=bookmarks.some(x=>x.url===url);
 return <header className="chrome">
  <div className="topline"><div className="brand">d</div><div className="tabstrip">{tabs.map((t,i)=><button className={"tab "+(i===active?"active":"")}key={t.id}onClick={()=>setActive(i)}><span>{t.title}</span>{tabs.length>1&&<i onClick={e=>{e.stopPropagation();closeTab(i)}}>×</i>}</button>)}<button className="addtab"onClick={addTab}>+</button></div><div className="traffic"><span></span><span></span><span></span></div></div>
  <div className="navline"><button onClick={()=>window.history.back()}>‹</button><button onClick={()=>window.history.forward()}>›</button><button onClick={()=>go(url)}>↻</button><form onSubmit={e=>{e.preventDefault();go(value)}}><span className="scheme">{p.toUpperCase()}</span><input value={value}onChange={e=>setValue(e.target.value)}spellCheck="false"/><button>↵</button></form><button onClick={()=>setBookmarks(saved?bookmarks.filter(x=>x.url!==url):[...bookmarks,{url,title:url}])}>{saved?"★":"☆"}</button><button onClick={()=>setOpen(!open)}>•••</button></div>
  {open&&<div className="command"><div><b>Navigator</b><small>protocol-first browser</small></div>{PROTOCOLS.map(x=><button key={x.id}onClick={()=>{setOpen(false);go(x.id+"://example.com")}}><b>{x.symbol}</b><span><strong>{x.label}</strong><small>{x.region}</small></span></button>)}<hr/>{Object.entries(INTERNAL).map(([k,v])=><button key={k}onClick={()=>{setOpen(false);go(v)}}><b>·</b><span>{k==="develope"?"Develope":k[0].toUpperCase()+k.slice(1)}</span></button>)}</div>}
 </header>
}

function Route({url,projects,setProjects,go,bookmarks,setBookmarks,history}){
 const key=internalKey(url),p=parse(url);
 if(key==="home")return <Home go={go}projects={projects}/>;
 if(key==="develope")return <Develope go={go}setProjects={setProjects}/>;
 if(key==="projects")return <Projects go={go}projects={projects}setProjects={setProjects}/>;
 if(key==="bookmarks")return <Bookmarks go={go}items={bookmarks}setItems={setBookmarks}/>;
 if(key==="history")return <History go={go}items={history}/>;
 if(key==="protocols")return <ProtocolHub go={go}/>;
 if(key==="settings")return <Settings/>;
 if(p?.protocol==="httc"){const project=projects.find(x=>x.domain===p.host);if(project)return <LocalSite project={project}url={url}go={go}/>;if(p.host==="search")return <Search url={url}go={go}/>}
 if(P.has(p?.protocol))return <ProtocolView url={url}/>;
 if(/^https?$/.test(p?.protocol))return <External url={url}/>;
 return <NotFound go={go}/>;
}

function Home({go,projects}){const[q,setQ]=useState("");return <div className="home"><div className="hero"><div className="hero-copy"><div className="kicker">DUMBNAVIGATOR / NEW WEB</div><h1>the web<br/><span>has doors.</span></h1><p>Una interfaz completamente nueva alrededor de los protocolos HTTC, AMWP, EUWP, ASWP, AFWP y OCWP. El esquema de navegación es parte del producto, no decoración.</p><form onSubmit={e=>{e.preventDefault();go(q)}}><span>⌕</span><input value={q}onChange={e=>setQ(e.target.value)}placeholder="Search or enter an address"/><button>→</button></form><div className="quick"><button onClick={()=>go(INTERNAL.develope)}>Develope <small>build</small></button><button onClick={()=>go(INTERNAL.protocols)}>Protocols <small>explore</small></button><button onClick={()=>go(INTERNAL.projects)}>Projects <small>{projects.length} local</small></button></div></div><div className="hero-art"><div className="ring r1"></div><div className="ring r2"></div><div className="ring r3"></div><div className="core">d</div><div className="art-label"><small>ACTIVE PROTOCOL</small><b>HTTC</b><span>universal / secure route</span></div></div></div><section className="manifest"><div><small>PROTOCOL MANIFEST</small><h2>six routes.<br/>one navigator.</h2></div><div className="manifest-grid">{PROTOCOLS.map(x=><button key={x.id}onClick={()=>go(x.id+"://example.com")}><span>{x.symbol}</span><b>{x.label}</b><small>{x.region}</small></button>)}</div></section></div>}

function ProtocolHub({go}){return <div className="page darkpage"><div className="pagehead"><small>NETWORK / ARCHITECTURE</small><h1>Protocols</h1><p>Estos son los esquemas que entiende el navegador. No existe un esquema interno alternativo para ocultar la navegación.</p></div><div className="protocol-list">{PROTOCOLS.map(x=><article key={x.id}><div className="proto-num">{x.symbol}</div><div className="proto-body"><div><small>{x.region}</small><h2>{x.label}<em>://</em></h2></div><p>{x.description}</p><button onClick={()=>go(x.id+"://example.com")}>Open route <span>↗</span></button></div></article>)}</div></div>}

function ProtocolView({url}){const p=parse(url),m=P.get(p.protocol);return <div className="protocol-view"><div className="protocol-card"><div className="large-symbol">{m.symbol}</div><small>{m.region} / {m.label}</small><h1>{p.host}</h1><p>Esta dirección está dentro del espacio <b>{m.label}</b>. dumbNavigator mantiene el esquema visible y traduce el destino al transporte web configurado.</p><code>{url}</code><a href={"https://"+p.host+p.path+(p.query?.toString()?"?"+p.query:"")}target="_blank"rel="noreferrer">Open destination ↗</a></div></div>}

function External({url}){return <div className="protocol-view"><div className="protocol-card"><div className="large-symbol">↗</div><small>EXTERNAL WEB / HTTPS</small><h1>{parse(url)?.host}</h1><p>Destino web externo.</p><code>{url}</code><a href={url}target="_blank"rel="noreferrer">Open destination ↗</a></div></div>}

function Search({url,go}){const q=parse(url)?.query.get("q")||"";return <div className="searchpage"><small>HTTC / SEARCH</small><h1>Search</h1><p>Consulta preparada para <b>{q}</b>.</p><a href={"https://www.google.com/search?q="+encodeURIComponent(q)}target="_blank"rel="noreferrer">Continue to search ↗</a><button onClick={()=>go(INTERNAL.home)}>Back home</button></div>}

function Projects({go,projects,setProjects}){return <div className="page darkpage"><div className="pagehead rowhead"><div><small>LOCAL / WORKSPACE</small><h1>Projects</h1></div><button onClick={()=>go(INTERNAL.develope)}>＋ New project</button></div>{projects.map(p=><div className="listrow"key={p.id}onClick={()=>go("httc://"+p.domain+"/")}><span className="avatar">{p.name?.[0]||"W"}</span><div><b>{p.name}</b><small>httc://{p.domain}/</small></div><button onClick={async e=>{e.stopPropagation();await deleteProject(p.id);setProjects(await loadProjects())}}>×</button></div>)}{!projects.length&&<div className="empty">No projects yet.</div>}</div>}

function Bookmarks({go,items,setItems}){return <div className="page darkpage"><div className="pagehead"><small>LIBRARY</small><h1>Bookmarks</h1></div>{items.map(x=><div className="listrow"key={x.url}onClick={()=>go(x.url)}><span className="avatar">☆</span><div><b>{x.title||x.url}</b><small>{x.url}</small></div><button onClick={e=>{e.stopPropagation();setItems(items.filter(y=>y.url!==x.url))}}>×</button></div>)}{!items.length&&<div className="empty">No bookmarks yet.</div>}</div>}

function History({go,items}){return <div className="page darkpage"><div className="pagehead"><small>LIBRARY</small><h1>History</h1></div>{items.map(x=><button className="historyrow"key={x.time}onClick={()=>go(x.url)}><time>{new Date(x.time).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</time><span><b>{x.title}</b><small>{x.url}</small></span></button>)}{!items.length&&<div className="empty">History is empty.</div>}</div>}

function Settings(){return <div className="page darkpage"><div className="pagehead"><small>SYSTEM / CONFIGURATION</small><h1>Settings</h1></div><div className="settings-grid"><article><small>ENGINE</small><b>Protocol-first</b><p>Las direcciones internas usan HTTC y los protocolos definidos por el navegador.</p></article><article><small>LOCAL DATA</small><b>IndexedDB</b><p>Los proyectos locales siguen separados de la base pública.</p></article><article><small>PUBLIC DATA</small><b>Cloudflare D1</b><p>La capa de publicación utiliza la base existente.</p></article></div></div>}

function Develope({go,setProjects}){const fresh=()=>({id:uid(),name:"My web",domain:"my-web",entry:"index.html",files:{"index.html":"<!doctype html>\\n<html><head><meta charset=\\"utf-8\\"><meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1\\"><link rel=\\"stylesheet\\" href=\\"style.css\\"></head><body><main><span>DUMBNAVIGATOR</span><h1>Hello, web.</h1><p>Your new project.</p></main></body></html>","style.css":"body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d12;color:#f5f6f8;font-family:system-ui}main{width:min(700px,85vw)}span{font:10px monospace;letter-spacing:.2em;color:#7f8997}h1{font-size:clamp(48px,9vw,110px);letter-spacing:-.08em;margin:.2em 0}p{color:#89929f}"}})();
 const[project,setProject]=useState(fresh),[file,setFile]=useState("index.html"),[status,setStatus]=useState("");
 const patch=x=>setProject(p=>({...p,...x})),files=Object.keys(project.files).sort();
 const persist=async()=>{const p={...project,name:project.name.trim()||"My web",domain:project.domain.toLowerCase().replace(/[^a-z0-9.-]/g,"")||"my-web",updatedAt:Date.now()};await saveProject(p);setProjects(await loadProjects());setProject(p);setStatus("saved locally")};
 const publish=async()=>{const p={...project,name:project.name.trim()||"My web",domain:project.domain.toLowerCase().replace(/[^a-z0-9.-]/g,"")||"my-web",updatedAt:Date.now()};const token=localStorage.getItem("dn.token."+p.domain)||"";const r=await fetch("/api/sites",{method:"POST",headers:{"content-type":"application/json",...(token?{"x-publish-token":token}:{})},body:JSON.stringify(p)});const d=await r.json();if(!r.ok){setStatus(d.error||"publish failed");return}if(d.token)localStorage.setItem("dn.token."+p.domain,d.token);await saveProject(p);setProjects(await loadProjects());setProject(p);setStatus("published · "+d.publicUrl)};
 const add=()=>{const n=prompt("File name","script.js");if(n&&!project.files[n]){patch({files:{...project.files,[n]:""}});setFile(n)}};
 return <div className="studio"><aside><div className="studio-brand"><span>d</span><div><b>develope</b><small>studio / v2</small></div></div><label>PROJECT NAME<input value={project.name}onChange={e=>patch({name:e.target.value})}/></label><label>DOMAIN<input value={project.domain}onChange={e=>patch({domain:e.target.value})}/></label><button className="fileadd"onClick={add}>＋ add file</button><nav>{files.map(f=><button className={file===f?"selected":""}key={f}onClick={()=>setFile(f)}>{f}</button>)}</nav><button className="studio-back"onClick={()=>go(INTERNAL.home)}>← navigator</button></aside><section><header><div><small>DEPLOYMENT STUDIO</small><h2>{project.name}</h2></div><div><button onClick={persist}>Save</button><button className="primary"onClick={publish}>Publish</button></div></header><div className="workspace"><div className="editor"><div className="editorbar">{file}</div><textarea value={project.files[file]}onChange={e=>patch({files:{...project.files,[file]:e.target.value}})}spellCheck="false"/></div><div className="preview"><div className="editorbar">LIVE PREVIEW</div>{file.endsWith(".html")?<iframe title="preview"sandbox="allow-scripts allow-forms allow-modals"srcDoc={project.files[file]}/>:<pre>{project.files[file]}</pre>}</div></div>{status&&<div className="status">{status}</div>}</section></div>}

function LocalSite({project,url}){const p=parse(url),path=decodeURIComponent((p?.path||"/").replace(/^\/+/,""))||project.entry,source=project.files[path]??project.files[project.entry];if(source==null)return <NotFound/>;return path.endsWith(".html")?<iframe className="siteframe"title={project.name}sandbox="allow-scripts allow-forms allow-modals"srcDoc={source}/>:<pre className="rawfile">{source}</pre>}
function NotFound({go}){return <div className="notfound"><small>404 / ROUTE NOT FOUND</small><h1>Nothing here.</h1><button onClick={()=>go?.(INTERNAL.home)}>Back to home</button></div>}
createRoot(document.getElementById("root")).render(<App/>);