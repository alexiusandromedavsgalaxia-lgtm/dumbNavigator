import React,{useEffect,useState}from"react";
import{createRoot}from"react-dom/client";
import"./styles.css";
import{loadProjects,saveProject,deleteProject}from"./storage.js";

const PROTOCOLS=[
 {id:"httc",label:"HTTC",title:"HyperText Transfer for the Common Web",scope:"Universal",symbol:"◎"},
 {id:"amwp",label:"AMWP",title:"American Web Protocol",scope:"Americas",symbol:"◉"},
 {id:"euwp",label:"EUWP",title:"European Web Protocol",scope:"Europe",symbol:"◇"},
 {id:"aswp",label:"ASWP",title:"Asian Web Protocol",scope:"Asia",symbol:"◈"},
 {id:"afwp",label:"AFWP",title:"African Web Protocol",scope:"Africa",symbol:"◆"},
 {id:"ocwp",label:"OCWP",title:"Oceania Web Protocol",scope:"Oceania",symbol:"◌"}
];
const P=new Map(PROTOCOLS.map(x=>[x.id,x]));
const SYSTEM=["home","new","projects","bookmarks","history","protocols","settings"];
const uid=()=>crypto.randomUUID();
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const proto=u=>String(u).match(/^([a-z][a-z0-9+.-]*):\/\//i)?.[1]?.toLowerCase()||"";
const host=u=>{try{return new URL(u).hostname.toLowerCase()}catch{return""}};
const isInternal=u=>u.startsWith("httc://");
const normalize=v=>{
 let s=String(v||"").trim(); if(!s)return"httc://home";
 if(/^dumb:\/\//i.test(s))return"httc://"+s.slice(7);
 if(/^(https?|httc|amwp|euwp|aswp|afwp|ocwp):\/\//i.test(s))return s.replace(/^([A-Z]+):/i,(_,x)=>x.toLowerCase()+":");
 if(/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(s))return"httc://"+s;
 return"https://www.google.com/search?q="+encodeURIComponent(s);
};
const external=u=>P.has(proto(u))?"https://"+u.replace(/^[a-z]+:\/\//i,""):u;
const titleFor=(u,projects=[])=>{
 const h=host(u); if(h==="home")return"Inicio"; if(h==="new")return"Develope";
 if(SYSTEM.includes(h))return h[0].toUpperCase()+h.slice(1);
 return projects.find(x=>x.domain===h)?.name||h||"Nueva pestaña";
};

function App(){
 const[projects,setProjects]=useState([]);
 const[active,setActive]=useState(0);
 const[tabs,setTabs]=useState(()=>read("dn.tabs",[{id:uid(),url:"httc://home",title:"Inicio"}]));
 const[bookmarks,setBookmarks]=useState(()=>read("dn.bookmarks",[]));
 const[history,setHistory]=useState(()=>read("dn.history",[]));
 const ready=useProjects(setProjects);
 useEffect(()=>write("dn.tabs",tabs),[tabs]);useEffect(()=>write("dn.bookmarks",bookmarks),[bookmarks]);useEffect(()=>write("dn.history",history),[history]);
 const url=tabs[active]?.url||"httc://home";
 const navigate=u=>{
   const next=normalize(u);
   setTabs(t=>t.map((x,i)=>i===active?{...x,url:next,title:titleFor(next,projects)}:x));
   setHistory(h=>[{url:next,title:titleFor(next,projects),time:Date.now()},...h.filter(x=>x.url!==next)].slice(0,100));
 };
 const newTab=()=>{setTabs(t=>[...t,{id:uid(),url:"httc://home",title:"Inicio"}]);setActive(tabs.length)};
 const closeTab=i=>{if(tabs.length===1)return;setTabs(t=>t.filter((_,n)=>n!==i));setActive(a=>a>i?a-1:Math.min(a,tabs.length-2))};
 if(!ready)return <div className="loading"><b>d</b><span>iniciando dumbNavigator</span></div>;
 return <div className="app">
  <BrowserBar tabs={tabs}active={active}onTab={setActive}onNew={newTab}onClose={closeTab}url={url}navigate={navigate}bookmarks={bookmarks}setBookmarks={setBookmarks}/>
  <div className="content"><Router url={url}projects={projects}setProjects={setProjects}bookmarks={bookmarks}setBookmarks={setBookmarks}history={history}navigate={navigate}/></div>
 </div>
}
function useProjects(set){
 const[ready,setReady]=useState(false);
 useEffect(()=>{loadProjects().then(set).finally(()=>setReady(true))},[set]);return ready;
}
function BrowserBar({tabs,active,onTab,onNew,onClose,url,navigate,bookmarks,setBookmarks}){
 const[value,setValue]=useState(url);const[menu,setMenu]=useState(false);useEffect(()=>setValue(url),[url]);
 const marked=bookmarks.some(x=>x.url===url);
 const submit=e=>{e.preventDefault();navigate(value)};
 return <header className="browser">
  <div className="tabs"><button className="logo"onClick={()=>navigate("httc://home")}>d</button>{tabs.map((t,i)=><button className={"tab "+(i===active?"selected":"")}key={t.id}onClick={()=>onTab(i)}><span>{t.title}</span>{tabs.length>1&&<i onClick={e=>{e.stopPropagation();onClose(i)}}>×</i>}</button>)}<button className="plus"onClick={onNew}>+</button></div>
  <div className="toolbar"><button onClick={()=>history.back()}>‹</button><button onClick={()=>history.forward()}>›</button><button onClick={()=>navigate(url)}>↻</button><form onSubmit={submit}><span className={P.has(proto(value))||isInternal(value)?"live":""}></span><input value={value}onChange={e=>setValue(e.target.value)}spellCheck="false"/><kbd>enter</kbd></form><button onClick={()=>setBookmarks(marked?bookmarks.filter(x=>x.url!==url):[...bookmarks,{url,title:url}])}>{marked?"★":"☆"}</button><button onClick={()=>setMenu(!menu)}>☰</button></div>
  {menu&&<div className="menu">{[["⌂","Inicio","httc://home"],["✦","Develope","httc://new"],["▦","Proyectos","httc://projects"],["☆","Marcadores","httc://bookmarks"],["◷","Historial","httc://history"],["◎","Protocolos","httc://protocols"],["⚙","Ajustes","httc://settings"]].map(([i,n,u])=><button key={u}onClick={()=>{setMenu(false);navigate(u)}}><b>{i}</b>{n}</button>)}</div>}
 </header>
}
function Router({url,projects,setProjects,bookmarks,setBookmarks,history,navigate}){
 const h=host(url);
 if(h==="home")return <Home projects={projects}navigate={navigate}/>;
 if(h==="new")return <Developer navigate={navigate}setProjects={setProjects}/>;
 if(h==="projects")return <ProjectList projects={projects}navigate={navigate}setProjects={setProjects}/>;
 if(h==="bookmarks")return <BookmarkList items={bookmarks}setItems={setBookmarks}navigate={navigate}/>;
 if(h==="history")return <History items={history}navigate={navigate}/>;
 if(h==="protocols")return <Protocols navigate={navigate}/>;
 if(h==="settings")return <Settings/>;
 const project=projects.find(x=>x.domain===h);
 if(project&&isInternal(url))return <LocalSite project={project}url={url}/>;
 if(/^https?:/i.test(url)||P.has(proto(url)))return <External url={url}/>;
 return <NotFound navigate={navigate}/>;
}
function Home({projects,navigate}){
 const[q,setQ]=useState("");
 return <div className="home"><div className="home-main"><section><div className="eyebrow">DUMBNAVIGATOR · WEB ENGINE</div><h1>internet,<br/><em>a tu manera.</em></h1><p>Un navegador experimental con <b>httc://</b> como espacio local y una familia de protocolos para organizar la web.</p><form className="search"onSubmit={e=>{e.preventDefault();navigate(q)}}><span>⌕</span><input value={q}onChange={e=>setQ(e.target.value)}placeholder="buscar o escribir una dirección"/><button>→</button></form><div className="cards"><button onClick={()=>navigate("httc://new")}><b>✦ Develope</b><small>crea y publica tu web</small></button><button onClick={()=>navigate("httc://protocols")}><b>◎ Protocolos</b><small>HTTC + 5 rutas regionales</small></button><button onClick={()=>navigate("httc://projects")}><b>▦ Proyectos</b><small>{projects.length} guardados</small></button></div></section><aside><div className="orb">d</div><small>ROUTER</small><strong>HTTC</strong><p>La puerta universal del ecosistema.</p></aside></div><section className="network"><div><small>NETWORK</small><h2>una web, seis puertas.</h2></div><div className="proto-mini">{PROTOCOLS.map(x=><button key={x.id}onClick={()=>navigate(x.id+"://example.com")}><b>{x.symbol} {x.label}</b><small>{x.scope}</small></button>)}</div></section></div>
}
function External({url}){
 const id=proto(url),meta=P.get(id);
 return <div className="external"><div><span className="big-symbol">{meta?.symbol||"↗"}</span><div className="eyebrow">{meta?meta.label+" · "+meta.scope:"WEB EXTERNA"}</div><h1>{host(url)}</h1><p>{meta?"Esta dirección usa la capa experimental de dumbNavigator y se traduce a HTTPS para llegar al destino.":"Esta dirección pertenece a la web externa."}</p><code>{url}</code><a href={external(url)}target="_blank"rel="noreferrer">Abrir destino ↗</a></div></div>
}
function Protocols({navigate}){return <div className="dark"><header><div><small>NETWORK ARCHITECTURE</small><h1>Protocolos</h1><p>La arquitectura de direccionamiento de dumbNavigator.</p></div></header><div className="proto-grid">{PROTOCOLS.map(x=><article key={x.id}><b className="proto-symbol">{x.symbol}</b><div><small>{x.label}</small><h2>{x.title}</h2><p><code>{x.id}://</code> · ámbito {x.scope}.</p><button onClick={()=>navigate(x.id+"://example.com")}>Probar →</button></div></article>)}</div><div className="flow"><b>HTTC</b><span>→</span>{PROTOCOLS.slice(1).map(x=><span key={x.id}>{x.label}</span>)}</div></div>}
function ProjectList({projects,navigate,setProjects}){return <div className="dark"><header><div><small>TU INTERNET</small><h1>Proyectos</h1></div><button onClick={()=>navigate("httc://new")}>＋ nuevo</button></header>{projects.map(p=><div className="row"key={p.id}onClick={()=>navigate("httc://"+p.domain)}><b>{p.name[0]?.toUpperCase()||"W"}</b><span><strong>{p.name}</strong><small>httc://{p.domain}</small></span><button onClick={async e=>{e.stopPropagation();await deleteProject(p.id);setProjects(await loadProjects())}}>×</button></div>)}{!projects.length&&<div className="empty">Todavía no hay proyectos.</div>}</div>}
function BookmarkList({items,setItems,navigate}){return <div className="dark"><header><div><small>LIBRARY</small><h1>Marcadores</h1></div></header>{items.map(x=><div className="row"key={x.url}onClick={()=>navigate(x.url)}><b>☆</b><span><strong>{x.title||x.url}</strong><small>{x.url}</small></span><button onClick={e=>{e.stopPropagation();setItems(items.filter(y=>y.url!==x.url))}}>×</button></div>)}{!items.length&&<div className="empty">No hay marcadores.</div>}</div>}
function History({items,navigate}){return <div className="dark"><header><div><small>LIBRARY</small><h1>Historial</h1></div></header>{items.map(x=><button className="history"key={x.time}onClick={()=>navigate(x.url)}><time>{new Date(x.time).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</time><span>{x.title}</span><small>{x.url}</small></button>)}{!items.length&&<div className="empty">El historial está limpio.</div>}</div>}
function Settings(){return <div className="dark"><header><div><small>SYSTEM</small><h1>Ajustes</h1></div></header><div className="settings"><article><small>VERSION</small><b>5.0</b><p>Frontend reconstruido desde cero.</p></article><article><small>DATOS LOCALES</small><b>IndexedDB</b><p>Los proyectos locales viven en el almacenamiento del navegador.</p></article><article><small>PUBLICACIÓN</small><b>Cloudflare D1</b><p>La base de datos pública conserva sitios y archivos publicados.</p></article></div></div>}
function Developer({navigate,setProjects}){
 const fresh=()=>({id:uid(),name:"Mi web",domain:"mi-web",entry:"index.html",files:{"index.html":"<!doctype html>\n<html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"style.css\"></head><body><main><span>DUMBNAVIGATOR</span><h1>Hola, internet.</h1><p>Tu primera web.</p></main></body></html>","style.css":"body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0e13;color:#f4f5f7;font-family:system-ui,sans-serif}main{width:min(760px,86vw)}span{font:700 10px monospace;letter-spacing:.2em;color:#8992a0}h1{font-size:clamp(48px,9vw,110px);letter-spacing:-.08em;margin:.15em 0}p{color:#8b94a2}"}})();
 const[project,setProject]=useState(fresh),[file,setFile]=useState("index.html"),[message,setMessage]=useState("");
 const files=Object.keys(project.files).sort();
 const patch=x=>setProject(p=>({...p,...x}));
 const persist=async()=>{const p={...project,name:project.name.trim()||"Mi web",domain:project.domain.toLowerCase().replace(/[^a-z0-9.-]/g,"")||"mi-web",updatedAt:Date.now()};await saveProject(p);setProjects(await loadProjects());setProject(p);setMessage("guardado en este dispositivo")};
 const publish=async()=>{const p={...project,name:project.name.trim()||"Mi web",domain:project.domain.toLowerCase().replace(/[^a-z0-9.-]/g,"")||"mi-web",updatedAt:Date.now()};const token=localStorage.getItem("dn.token."+p.domain)||"";const r=await fetch("/api/sites",{method:"POST",headers:{"content-type":"application/json",...(token?{"x-publish-token":token}:{})},body:JSON.stringify(p)});const d=await r.json();if(!r.ok){setMessage(d.error||"error al publicar");return}if(d.token)localStorage.setItem("dn.token."+p.domain,d.token);await saveProject(p);setProjects(await loadProjects());setProject(p);setMessage("publicado · "+d.publicUrl)};
 const add=()=>{const n=prompt("nombre del archivo","script.js");if(n&&!project.files[n]){patch({files:{...project.files,[n]:""}});setFile(n)}};
 return <div className="developer"><aside><button className="dev-logo"onClick={()=>navigate("httc://home")}><b>d</b><span><strong>develope</strong><small>studio</small></span></button><label>DOMINIO<input value={project.domain}onChange={e=>patch({domain:e.target.value})}/></label><label>NOMBRE<input value={project.name}onChange={e=>patch({name:e.target.value})}/></label><button className="add-file"onClick={add}>＋ archivo</button><nav>{files.map(f=><button className={f===file?"current":""}key={f}onClick={()=>setFile(f)}>{f}</button>)}</nav><button className="back"onClick={()=>navigate("httc://home")}>← navegador</button></aside><main><header><div><small>DEPLOYMENT STUDIO</small><h2>{project.name}</h2></div><div><button onClick={persist}>guardar</button><button className="publish"onClick={publish}>↑ publicar</button></div></header><div className="editor"><section><header>{file}</header><textarea value={project.files[file]}onChange={e=>patch({files:{...project.files,[file]:e.target.value}})}spellCheck="false"/></section><section><header>PREVIEW</header>{file.endsWith(".html")?<iframe title="preview"sandbox="allow-scripts allow-forms allow-modals"srcDoc={project.files[file]}/>:<pre>{project.files[file]}</pre>}</section></div>{message&&<div className="status">{message}</div>}</main></div>
}
function LocalSite({project,url}){const path=decodeURIComponent(new URL(url).pathname.replace(/^\//,""))||project.entry;const source=project.files[path]??project.files[project.entry];if(source==null)return <NotFound/>;return path.endsWith(".html")?<iframe className="site" title={project.name} sandbox="allow-scripts allow-forms allow-modals"srcDoc={source}/>:<pre className="raw">{source}</pre>}
function NotFound({navigate}){return <div className="notfound"><small>404 · DUMBNAVIGATOR</small><h1>no existe.</h1><button onClick={()=>navigate?.("httc://home")}>volver</button></div>}

createRoot(document.getElementById("root")).render(<App/>);
