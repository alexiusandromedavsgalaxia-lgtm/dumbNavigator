import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import"./styles.css";
import{getProjects,putProject,removeProject}from"./store";

const HOME="dumb://home";
const CREATE="dumb://create";
const RESERVED=new Set(["home","create","projects","bookmarks","history","settings","protocols","about","api","sites"]);
const PROTOCOLS={
  httc:{label:"HTTC",name:"HyperText Transfer for the Common Web",scope:"universal",icon:"◎"},
  amwp:{label:"AMWP",name:"American Web Protocol",scope:"Americas",icon:"◉"},
  euwp:{label:"EUWP",name:"European Web Protocol",scope:"Europe",icon:"◇"},
  aswp:{label:"ASWP",name:"Asian Web Protocol",scope:"Asia",icon:"◈"},
  afwp:{label:"AFWP",name:"African Web Protocol",scope:"Africa",icon:"◆"},
  ocwp:{label:"OCWP",name:"Oceania Web Protocol",scope:"Oceania",icon:"◌"}
};
const uid=()=>crypto.randomUUID();
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"null")??d}catch{return d}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const host=u=>{try{return new URL(u).hostname.toLowerCase()}catch{return""}};
const protocol=u=>{const m=String(u).match(/^([a-z][\w+.-]*):\/\//i);return m?m[1].toLowerCase():""};
const normalizeInput=s=>{
  s=String(s||"").trim();
  if(!s)return HOME;
  if(/^dumb:\/\//i.test(s))return"dumb://"+s.slice(7).toLowerCase();
  if(/^https?:\/\//i.test(s))return s;
  if(/^(httc|amwp|euwp|aswp|afwp|ocwp):\/\//i.test(s))return s.replace(/^([A-Za-z]+):/,(m,p)=>p.toLowerCase()+":");
  if(s.includes(".")&&/^[\w.-]+(?:\/.*)?$/i.test(s))return"httc://"+s;
  if(/^\s*[a-z0-9.-]+\s*$/i.test(s)&&s.includes("."))return"httc://"+s;
  return"https://www.google.com/search?q="+encodeURIComponent(s);
};
const externalTarget=u=>/^(httc|amwp|euwp|aswp|afwp|ocwp):\/\//i.test(u)?"https://"+u.replace(/^[a-z]+:\/\//i,""):u;
const ext=p=>(p.split(".").pop()||"").toLowerCase();
const mime=p=>({html:"text/html",css:"text/css",js:"text/javascript",json:"application/json",svg:"image/svg+xml",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",txt:"text/plain"}[ext(p)]||"application/octet-stream");
const data=(p,v)=>typeof v==="string"?"data:"+mime(p)+";charset=utf-8,"+encodeURIComponent(v):"data:"+mime(p)+";base64,"+btoa(String.fromCharCode(...Uint8Array.from(v?.data||[])));
const preview=(p,h)=>String(h).replace(/(src|href)=([\"'])([^\"']+)\2/gi,(m,a,q,r)=>{if(/^(data:|https?:|\/\/|#|mailto:)/i.test(r))return m;const k=r.replace(/^\//,"");return p.files[k]===undefined?m:a+"="+q+data(k,p.files[k])+q});
const pageTitle=(u,ps)=>{
  const h=host(u);
  if(h==="home")return"Inicio";
  if(h==="create")return"Develope";
  if(PROTOCOLS[protocol(u)])return h||u;
  return ps.find(p=>p.domain===h)?.name||h||u;
};

function App(){
  const[projects,setProjects]=useState([]);
  const[url,setUrl]=useState(()=>read("dn-url",HOME));
  const[tabs,setTabs]=useState(()=>read("dn-tabs",[{id:uid(),url:HOME,title:"Inicio"}]));
  const[active,setActive]=useState(()=>read("dn-active",0));
  const[bookmarks,setBookmarks]=useState(()=>read("dn-bm",[]));
  const[history,setHistory]=useState(()=>read("dn-history",[]));
  const[ready,setReady]=useState(false);
  useEffect(()=>{getProjects().then(setProjects).finally(()=>setReady(true))},[]);
  useEffect(()=>write("dn-tabs",tabs),[tabs]);useEffect(()=>write("dn-active",active),[active]);useEffect(()=>write("dn-url",url),[url]);useEffect(()=>write("dn-bm",bookmarks),[bookmarks]);useEffect(()=>write("dn-history",history),[history]);
  const go=input=>{
    const u=normalizeInput(input);
    setUrl(u);
    setTabs(t=>t.map((a,i)=>i===active?{...a,url:u,title:pageTitle(u,projects)}:a));
    setHistory(h=>[{url:u,title:pageTitle(u,projects),at:Date.now()},...h.filter(x=>x.url!==u)].slice(0,100));
  };
  const save=async p=>{await putProject(p);setProjects(await getProjects());go("dumb://"+p.domain)};
  const del=async id=>{await removeProject(id);setProjects(await getProjects());go("dumb://projects")};
  if(!ready)return <div className="boot"><span>d</span><small>cargando dumbNavigator</small></div>;
  return <div className="app">
    <Chrome tabs={tabs} active={active} setActive={i=>{setActive(i);setUrl(tabs[i].url)}} add={()=>{setTabs(t=>[...t,{id:uid(),url:HOME,title:"Inicio"}]);setActive(tabs.length)}} close={i=>{if(tabs.length>1){setTabs(t=>t.filter((_,n)=>n!==i));setActive(a=>Math.max(0,Math.min(a-(i<a?1:0),tabs.length-2)))}}} url={url} go={go} bookmarks={bookmarks} setBookmarks={setBookmarks}/>
    <main className="viewport"><Page url={url} projects={projects} bookmarks={bookmarks} setBookmarks={setBookmarks} history={history} go={go} save={save} del={del}/></main>
  </div>
}

function Chrome({tabs,active,setActive,add,close,url,go,bookmarks,setBookmarks}){
  const[q,setQ]=useState(url);const[menu,setMenu]=useState(false);useEffect(()=>setQ(url),[url]);
  const submit=e=>{e.preventDefault();go(q)};
  const fav=bookmarks.some(x=>x.url===url);
  return <header className="chrome">
    <div className="tabs"><button className="brand" onClick={()=>go(HOME)}>d</button>{tabs.map((t,i)=><div className={"tab "+(i===active?"active":"")} key={t.id} onClick={()=>setActive(i)}><span>{t.title}</span>{tabs.length>1&&<button onClick={e=>{e.stopPropagation();close(i)}}>×</button>}</div>)}<button className="new" onClick={add}>+</button></div>
    <div className="toolbar">
      <button onClick={()=>window.history.back()} aria-label="Atrás">‹</button><button onClick={()=>window.history.forward()} aria-label="Adelante">›</button><button onClick={()=>go(url)} aria-label="Recargar">↻</button>
      <form className="address" onSubmit={submit}><span className={"protocol-dot "+(PROTOCOLS[protocol(q)]?"known":"")}></span><input value={q} onChange={e=>setQ(e.target.value)} spellCheck="false"/><kbd>↵</kbd></form>
      <button className="iconbtn" onClick={()=>setBookmarks(fav?bookmarks.filter(x=>x.url!==url):[...bookmarks,{url,title:pageTitle(url,[])}])}>{fav?"★":"☆"}</button>
      <button className="iconbtn" onClick={()=>setMenu(!menu)}>☰</button>
    </div>
    {menu&&<nav className="menu">{[["⌂","Inicio",HOME],["✦","Develope",CREATE],["▦","Proyectos","dumb://projects"],["☆","Marcadores","dumb://bookmarks"],["◷","Historial","dumb://history"],["◎","Protocolos","dumb://protocols"],["⚙","Ajustes","dumb://settings"]].map(x=><button key={x[1]} onClick={()=>{setMenu(false);go(x[2])}}><i>{x[0]}</i>{x[1]}</button>)}</nav>}
  </header>
}

function Page({url,projects,bookmarks,setBookmarks,history,go,save,del}){
  const h=host(url);
  if(h==="home")return <Home projects={projects} go={go}/>;
  if(h==="create")return <Developer save={save} go={go}/>;
  if(h==="projects")return <List title="Proyectos" eyebrow="TU INTERNET" items={projects} go={go} del={del} create/empty="Todavía no tienes proyectos."/>;
  if(h==="bookmarks")return <List title="Marcadores" eyebrow="LIBRARY" items={bookmarks} go={go} setBookmarks={setBookmarks} empty="No hay marcadores."/>;
  if(h==="history")return <History items={history} go={go}/>;
  if(h==="settings")return <Settings/>;
  if(h==="protocols")return <Protocols go={go}/>;
  if(/^https?:/i.test(url)||PROTOCOLS[protocol(url)])return <External url={url}/>;
  const p=projects.find(x=>x.domain===h);return p?<Local p={p} url={url}/>:<NotFound url={url} go={go}/>;
}

function Home({projects,go}){
  const[q,setQ]=useState("");
  return <div className="home">
    <div className="home-grid"><section className="hero"><div className="eyebrow"><span className="pulse"></span>DUMBNAVIGATOR / WEB ENGINE</div><h1>internet,<br/><em>a tu manera.</em></h1><p>Un navegador experimental con una capa local <b>dumb://</b> y una familia de protocolos regionales para la web.</p>
      <form className="searchbox" onSubmit={e=>{e.preventDefault();go(q)}}><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="buscar o escribir una dirección" autoFocus/><button>→</button></form>
      <div className="quick"><button onClick={()=>go(CREATE)}><span>✦</span><b>Develope</b><small>crea y publica webs</small></button><button onClick={()=>go("dumb://protocols")}><span>◎</span><b>Protocolos</b><small>HTTC + 5 regiones</small></button><button onClick={()=>go("dumb://projects")}><span>▦</span><b>Proyectos</b><small>{projects.length} guardados</small></button></div>
    </section><aside className="home-side"><div className="orb"><span>d</span></div><div><small>ROUTER</small><strong>HTTC</strong><p>un protocolo común para conectar la web sin perder las rutas regionales.</p></div></aside></div>
    <section className="protocol-strip"><div><small>PROTOCOLOS DISPONIBLES</small><h2>una web, seis puertas.</h2></div><div className="protocols-mini">{Object.entries(PROTOCOLS).map(([id,p])=><button key={id} onClick={()=>go(id+"://example.com")}><i>{p.icon}</i><b>{p.label}</b><small>{p.scope}</small></button>)}</div></section>
    {projects.length>0&&<section className="recent"><small>TUS WEBS</small><h2>Internet local</h2>{projects.slice(0,5).map(p=><button className="site" key={p.id} onClick={()=>go("dumb://"+p.domain)}><strong>{p.name[0]?.toUpperCase()||"W"}</strong><span><b>{p.name}</b><small>dumb://{p.domain}</small></span>→</button>)}</section>}
  </div>
}

function External({url}){
  const pr=protocol(url),meta=PROTOCOLS[pr],target=externalTarget(url);
  return <div className="external"><div className="external-card"><div className="external-mark">{meta?.icon||"↗"}</div><div className="eyebrow">{meta?meta.label+" / "+meta.scope:"WEB EXTERNA"}</div><h1>{host(url)}</h1><p>{meta?<>Esta dirección usa <b>{meta.label}</b>, una ruta de dumbNavigator para la web {meta.scope.toLowerCase()}. El destino final se abre fuera del motor local.</>:<>Esta dirección apunta a la web externa.</>}</p><code>{url}</code><a href={target} target="_blank" rel="noreferrer">Abrir destino ↗</a></div></div>
}

function Protocols({go}){return <div className="dark protocols-page"><header><div><small>NETWORK ARCHITECTURE</small><h1>Protocolos</h1><p>La capa de direccionamiento experimental de dumbNavigator.</p></div></header><div className="protocol-grid">{Object.entries(PROTOCOLS).map(([id,p])=><article key={id}><div className="proto-icon">{p.icon}</div><div><span>{p.label}</span><h2>{p.name}</h2><p>Esquema <code>{id}://</code> · ámbito {p.scope}.</p><button onClick={()=>go(id+"://example.com")}>Probar dirección →</button></div></article>)}</div><div className="architecture"><b>HTTC</b><span>→</span><span>AMWP</span><span>EUWP</span><span>ASWP</span><span>AFWP</span><span>OCWP</span></div></div>}

function List({title,eyebrow,items,go,del,setBookmarks,create,empty}){return <div className="dark"><header><div><small>{eyebrow}</small><h1>{title}</h1></div>{create&&<button onClick={()=>go(CREATE)}>＋ nuevo</button>}</header>{items.map(x=>{const u=x.url||"dumb://"+x.domain;return <div className="row" key={x.id||u} onClick={()=>go(u)}><strong>{(x.name||x.title||"W")[0].toUpperCase()}</strong><span><b>{x.name||x.title||u}</b><small>{u}</small></span><button onClick={e=>{e.stopPropagation();del?del(x.id):setBookmarks(items.filter(y=>(y.url||"")!==u))}}>×</button></div>})}{!items.length&&<div className="empty">{empty}</div>}</div>}

function History({items,go}){return <div className="dark"><header><div><small>LIBRARY</small><h1>Historial</h1></div></header>{items.length?items.map((x,i)=><button className="history" key={i} onClick={()=>go(x.url)}><time>{new Date(x.at).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</time><span>{x.title}</span><small>{x.url}</small></button>):<div className="empty">Tu historial está limpio.</div>}</div>}

function Settings(){return <div className="dark"><header><div><small>SYSTEM</small><h1>Ajustes</h1></div></header><div className="settings-grid"><article><span>VERSION</span><b>dumbNavigator 4</b><p>Motor local React + Vite, almacenamiento local e infraestructura Cloudflare.</p></article><article><span>SESIONES</span><b>Persistentes</b><p>Pestañas, favoritos e historial se guardan en este dispositivo.</p></article><article><span>PUBLICACIÓN</span><b>Cloudflare D1</b><p>Develope puede publicar proyectos estáticos en <code>/sites/&lt;dominio&gt;/</code>.</p></article></div></div>}

function Developer({save,go}){
  const initial={id:uid(),name:"Mi web",domain:"my-site",entry:"index.html",files:{
    "index.html":"<!doctype html>\n<html lang=\"es\">\n<head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"style.css\"></head>\n<body><main><span>DEVELOPE</span><h1>Hola, internet.</h1><p>Esta página vive dentro de dumbNavigator.</p><a href=\"https://example.com\">salir a la web →</a></main></body></html>",
    "style.css":"body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1017;color:#f5f6f8;font-family:system-ui,sans-serif}main{width:min(760px,86vw)}span{font:700 11px monospace;letter-spacing:.2em;opacity:.55}h1{font-size:clamp(48px,9vw,110px);letter-spacing:-.08em;margin:.2em 0}p{color:#9aa2ae;font-size:18px}a{color:#fff;text-decoration:none}"
  }};
  const[p,setP]=useState(initial),[file,setFile]=useState("index.html"),[pub,setPub]=useState("");
  const files=Object.keys(p.files).sort();
  const update=(patch)=>setP(x=>({...x,...patch}));
  const add=()=>{const n=prompt("Nombre del archivo","script.js");if(n&&!p.files[n]){update({files:{...p.files,[n]:""}});setFile(n)}};
  const saveLocal=async()=>{const q={...p,name:p.name.trim()||"Mi web",domain:p.domain.toLowerCase().replace(/[^a-z0-9.-]/g,"")||"my-site",updatedAt:Date.now()};if(RESERVED.has(q.domain))return alert("Ese dominio está reservado.");await save(q);setP(q)};
  const publish=async()=>{await saveLocal();const token=localStorage.getItem("dn-token-"+p.domain);const r=await fetch("/api/sites",{method:"POST",headers:{"content-type":"application/json",...(token?{"x-publish-token":token}:{})},body:JSON.stringify({name:p.name,domain:p.domain,type:"static",entry:p.entry,files:p.files})});const d=await r.json();if(!r.ok)return alert(d.error||"No se pudo publicar.");if(d.token)localStorage.setItem("dn-token-"+p.domain,d.token);setPub(d.publicUrl)};
  return <div className="dev"><aside><button className="devbrand" onClick={()=>go(HOME)}><b>d</b><span><strong>develope</strong><small>studio</small></span></button><div className="field"><label>DOMINIO</label><input value={p.domain} onChange={e=>update({domain:e.target.value})}/></div><div className="field"><label>NOMBRE</label><input value={p.name} onChange={e=>update({name:e.target.value})}/></div><button className="fileadd" onClick={add}>＋ archivo</button><div className="files">{files.map(f=><button className={file===f?"sel":""} key={f} onClick={()=>setFile(f)}>{f}</button>)}</div><button className="back" onClick={()=>go(HOME)}>← navegador</button></aside>
    <main><header><div><small>DEPLOYMENT STUDIO</small><h2>{p.name}</h2></div><div className="dev-actions"><button onClick={saveLocal}>guardar</button><button className="accent" onClick={publish}>↑ publicar</button></div></header><div className="work"><section><div className="panel-title">{file}</div><textarea value={p.files[file]} onChange={e=>update({files:{...p.files,[file]:e.target.value}})} spellCheck="false"/></section><section><div className="panel-title">LIVE PREVIEW</div>{file.endsWith(".html")?<iframe title="preview" sandbox="allow-scripts allow-forms allow-modals" srcDoc={preview(p,p.files[file])}/>:<pre>{p.files[file]}</pre>}</section></div>{pub&&<div className="published">Publicado · <a href={pub} target="_blank" rel="noreferrer">{pub}</a></div>}</main></div>
}

function Local({p,url}){const path=decodeURIComponent(new URL(url).pathname.replace(/^\//,""))||p.entry,f=p.files[path]??p.files[p.entry];if(f===undefined)return <NotFound url={url}/>;return ext(path)==="html"&&typeof f==="string"?<iframe className="siteframe" title={p.name} sandbox="allow-scripts allow-forms allow-modals" srcDoc={preview(p,f)}/>:<pre className="raw">{typeof f==="string"?f:"[archivo binario]"}</pre>}
function NotFound({url,go}){return <div className="notfound"><small>DUMBNAVIGATOR · 404</small><h1>no existe.</h1><p>{url}</p><button onClick={()=>go(HOME)}>volver al inicio</button></div>}

createRoot(document.getElementById("root")).render(<App/>);
