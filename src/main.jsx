import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import './styles.css'

const HOME='dumb://home'
const CREATE='dumb://create'
const DEVELOPE='dumb://uuu.develope.it'
const RESERVED=['home','create','bookmarks','history','uuu.develope.it']

const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)??'null')??d}catch{return d}}
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
const visibleUrl=url=>{if(!url||url===HOME)return '';try{const u=new URL(url);return u.protocol==='dumb:'?u.hostname.toLowerCase()+(u.pathname&&u.pathname!=='/'?u.pathname:'')+(u.search||'')+(u.hash||''):''}catch{return ''}}
const domainFromUrl=url=>{try{const u=new URL(url);return u.protocol==='dumb:'?u.hostname.toLowerCase():''}catch{return ''}}
const normalize=input=>{let s=input.trim();if(!s)return HOME;if(/^https?:\/\//i.test(s))return HOME;if(!s.includes('://'))s='dumb://'+s;try{const u=new URL(s);if(u.protocol!=='dumb:'||!u.hostname)return HOME;return 'dumb://'+u.hostname.toLowerCase()+(u.pathname&&u.pathname!=='/'?u.pathname:'')+(u.search||'')+(u.hash||'')}catch{return HOME}}
const titleFor=url=>url===HOME?'Nueva pestaña':url===DEVELOPE?'DevelopE.it':visibleUrl(url)||'Nueva página'

const rewrite=(html,base='dumb://home')=>html
.replace(/href\s*=\s*["'](dumb:\/\/[^"']+)["']/gi,(_,u)=>'href="#" data-nav="'+u.replaceAll('"','&quot;')+'"')
.replace(/href\s*=\s*["'](\/[^"']*)["']/gi,(_,p)=>{try{const u=new URL(base);return 'href="#" data-nav="'+('dumb://'+u.hostname+(p||'/')).replaceAll('"','&quot;')+'"'}catch{return 'href="#"'}})
.replace(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi,'href="#" data-blocked="external"')

const LANG={
es:{settings:'Configuración',newTab:'Nueva pestaña',create:'Crear web',bookmarks:'Marcadores',history:'Historial',clearHistory:'Borrar historial',language:'Idioma',appearance:'Apariencia',style:'Estilo',background:'Fondo',accent:'Acento',density:'Densidad',shape:'Forma',save:'Guardar cambios',start:'Entrar al navegador',address:'Buscar o escribir una dirección',yourSites:'Tus webs',notFound:'Esta página no existe',notFoundDesc:'La dirección aún no tiene una web guardada en este navegador.',backHome:'Volver al inicio',createTitle:'Tu espacio para crear.',createIntro:'Construye una web local. Todo queda dentro de dumbNavigator.',publish:'Guardar web',noBookmarks:'Todavía no tienes marcadores.',historyEmpty:'Todavía no hay historial.',customize:'Personaliza cada parte del navegador.',languageDesc:'Idioma de la interfaz.',localOnly:'Todo permanece en este navegador.',developer:'Entorno de desarrollo local'},
en:{settings:'Settings',newTab:'New tab',create:'Create web',bookmarks:'Bookmarks',history:'History',clearHistory:'Clear history',language:'Language',appearance:'Appearance',style:'Style',background:'Background',accent:'Accent',density:'Density',shape:'Shape',save:'Save changes',start:'Enter browser',address:'Search or enter an address',yourSites:'Your websites',notFound:'This page does not exist',notFoundDesc:'This address has no website saved in this browser yet.',backHome:'Back home',createTitle:'Your creative space.',createIntro:'Build a local website. Everything stays inside dumbNavigator.',publish:'Save website',noBookmarks:'No bookmarks yet.',historyEmpty:'No history yet.',customize:'Customize every part of the browser.',languageDesc:'Interface language.',localOnly:'Everything stays in this browser.',developer:'Local development environment'}
}
const tr=(l,k)=>(LANG[l]||LANG.es)[k]||LANG.es[k]||k

function Setup({onDone}){
 const [language,setLanguage]=useState('es'),[style,setStyle]=useState('aurora'),[color,setColor]=useState('#8b7cff')
 const finish=()=>{const c={language,style,color,background:'aurora',density:'comfortable',radius:'soft'};write('dumbSetup',c);onDone(c)}
 return <div className="onboarding"><div className="onboardOrb"/><section className="onboardCard"><div className="logoLarge">d</div><div className="kicker">DUMBNAVIGATOR / FIRST RUN</div><h1>tu navegador.<br/><i>a tu manera.</i></h1><p>Un navegador local para crear y visitar tus propias webs. Sin páginas externas.</p><div className="onboardControls"><label>Idioma<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="es">Español</option><option value="en">English</option></select></label><label>Estética<select value={style} onChange={e=>setStyle(e.target.value)}><option value="aurora">Aurora</option><option value="graphite">Graphite</option><option value="clean">Clean</option></select></label></div><div className="accentRow"><span>Acento</span>{['#8b7cff','#ff4668','#48d7a2','#55a8ff','#ff9c57'].map(c=><button key={c} style={{background:c}} className={color===c?'chosen':''} onClick={()=>setColor(c)}/>)}</div><button className="enterButton" onClick={finish}>{tr(language,'start')} <b>↗</b></button></section></div>
}

function Home({navigate,config}){
 const sites=Object.entries(read('dumbSites',{})), bookmarks=read('dumbBookmarks',[])
 const [query,setQuery]=useState('')
 return <div className="homePage">
  <div className="homeTop"><div className="homeBrand"><span>d</span><div><b>dumbNavigator</b><small>LOCAL WEB</small></div></div><div className="homeStatus"><i/> local only</div></div>
  <section className="homeHero"><div className="heroKicker">TU ESPACIO WEB</div><h1>¿qué vas a<br/><em>crear hoy?</em></h1><p>Escribe una dirección local o abre una de tus webs. Todo vive aquí.</p><form onSubmit={e=>{e.preventDefault();navigate(query)}}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr(config.language,'address')} autoFocus/><button>↵</button></form></section>
  <section className="homeModules">
   <button className="homeModule featured" onClick={()=>navigate(CREATE)}><div className="moduleTop"><span className="moduleGlyph">＋</span><span>CREATOR</span></div><h2>Crea una web</h2><p>HTML, vista previa y guardado local.</p><b className="moduleArrow">↗</b></button>
   <button className="homeModule" onClick={()=>navigate(DEVELOPE)}><div className="moduleTop"><span className="moduleGlyph">⌘</span><span>DEVELOPE.IT</span></div><h2>Desarrolla</h2><p>Tu entorno de desarrollo local.</p><b className="moduleArrow">↗</b></button>
   <button className="homeModule" onClick={()=>navigate('dumb://bookmarks')}><div className="moduleTop"><span className="moduleGlyph">☆</span><span>LIBRARY</span></div><h2>Marcadores</h2><p>{bookmarks.length?bookmarks.length+' guardados':'Guarda tus páginas favoritas.'}</p><b className="moduleArrow">↗</b></button>
  </section>
  <section className="homeSites"><div className="sectionHeader"><div><span>COLECCIÓN</span><h2>Tus webs</h2></div><b>{sites.length.toString().padStart(2,'0')}</b></div>{sites.length?<div className="siteCards">{sites.slice(0,8).map(([h],i)=><button key={h} onClick={()=>navigate('dumb://'+h)}><span className="siteIndex">{String(i+1).padStart(2,'0')}</span><strong>{h}</strong><small>web local</small><b>↗</b></button>)}</div>:<div className="emptySites"><span>◌</span><div><b>Aquí aparecerán tus webs</b><p>Crea tu primera página y quedará guardada en este navegador.</p></div><button onClick={()=>navigate(CREATE)}>Crear ahora ↗</button></div>}</section>
  <footer><span>PRIVATE / LOCAL-FIRST</span><span>sin web externa · sin navegación fuera de aquí</span></footer>
 </div>
}

function SettingsPage({config,setConfig,onClose}){
 const [draft,setDraft]=useState({...config})
 const set=(k,v)=>setDraft(x=>({...x,[k]:v}))
 const save=()=>{write('dumbSetup',draft);setConfig(draft);onClose()}
 return <div className="fullPage settingsNew"><header><div><span className="pageKicker">PREFERENCIAS</span><h1>Configuración</h1><p>Elige cómo quieres que se sienta dumbNavigator.</p></div><button className="roundClose" onClick={onClose}>×</button></header><div className="settingsGrid">
  <section className="settingsCard wide"><div className="cardTitle"><span>01</span><div><h2>Apariencia</h2><p>La identidad visual del navegador.</p></div></div><div className="settingOptions"><label>Estilo<select value={draft.style} onChange={e=>set('style',e.target.value)}><option value="aurora">Aurora</option><option value="graphite">Graphite</option><option value="clean">Clean</option></select></label><label>Fondo<select value={draft.background||'aurora'} onChange={e=>set('background',e.target.value)}><option value="aurora">Aurora</option><option value="plain">Liso</option><option value="gradient">Degradado</option></select></label><label>Densidad<select value={draft.density||'comfortable'} onChange={e=>set('density',e.target.value)}><option value="comfortable">Cómoda</option><option value="compact">Compacta</option><option value="spacious">Amplia</option></select></label><label>Forma<select value={draft.radius||'soft'} onChange={e=>set('radius',e.target.value)}><option value="soft">Suave</option><option value="sharp">Recta</option><option value="pill">Redonda</option></select></label></div><div className="colorLine"><span>Color de acento</span>{['#8b7cff','#ff4668','#48d7a2','#55a8ff','#ff9c57'].map(c=><button key={c} style={{background:c}} className={draft.color===c?'chosen':''} onClick={()=>set('color',c)}/>)}</div></section>
  <section className="settingsCard"><div className="cardTitle"><span>02</span><div><h2>Idioma</h2><p>{tr(draft.language,'languageDesc')}</p></div></div><select value={draft.language} onChange={e=>set('language',e.target.value)}><option value="es">Español</option><option value="en">English</option></select></section>
  <section className="settingsCard"><div className="cardTitle"><span>03</span><div><h2>Privacidad</h2><p>Este navegador solo utiliza almacenamiento local.</p></div></div><div className="privacyBadge"><i/> {tr(draft.language,'localOnly')}</div></section>
 </div><button className="saveButton" onClick={save}>Guardar cambios <b>↗</b></button></div>
}

function Creator({navigate,config,developer=false}){
 const [code,setCode]=useState('<!doctype html>\n<html>\n<head><title>Mi web</title></head>\n<body style="font-family:system-ui;padding:48px">\n<h1>Hola 👋</h1>\n<p>Mi primera web local.</p>\n</body>\n</html>')
 const [domain,setDomain]=useState('miweb.local'),[previewMode,setPreviewMode]=useState('split'),[backend,setBackend]=useState(false)
 const preview=rewrite(code),title=developer?'DevelopE.it':'Creator'
 const publish=()=>{const h=domain.trim().toLowerCase().replace(/[^a-z0-9.-]/g,'');if(!h||RESERVED.includes(h)){alert('Elige otro nombre de web.');return}const sites=read('dumbSites',{});sites[h]={mode:'html',html:code,backend:null};write('dumbSites',sites);navigate('dumb://'+h)}
 return <div className="creatorNew">
  <header className="creatorHeader"><div><span className="pageKicker">{developer?'DEVELOPE.IT':'DUMBNAVIGATOR CREATOR'}</span><h1>{developer?'Build. Test. Keep it local.':'Crea tu propia web.'}</h1><p>{developer?'Un espacio de desarrollo que vive dentro de este navegador.':'Escribe, previsualiza y guarda. Nada sale de este navegador.'}</p></div><button className="roundClose" onClick={()=>navigate(HOME)}>×</button></header>
  <div className="creatorToolbar"><div className="editorTabs"><button className="active">index.html</button><button onClick={()=>setBackend(!backend)}>＋ {backend?'backend.js':'archivo'}</button></div><div className="viewSwitch"><button className={previewMode==='code'?'active':''} onClick={()=>setPreviewMode('code')}>CODE</button><button className={previewMode==='split'?'active':''} onClick={()=>setPreviewMode('split')}>SPLIT</button><button className={previewMode==='preview'?'active':''} onClick={()=>setPreviewMode('preview')}>PREVIEW</button></div></div>
  <div className={'editorStage '+previewMode+(backend?' hasBackend':'')}><section className="editorPane"><div className="paneBar"><span><i/> index.html</span><small>HTML</small></div><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/></section><section className="previewPane"><div className="paneBar"><span>LIVE PREVIEW</span><small>LOCAL</small></div><iframe srcDoc={preview} title="preview" sandbox="allow-scripts allow-forms"/></section></div>
  {backend&&<div className="backendStrip"><span>backend.js</span><small>solo referencia local</small></div>}
  <div className="publishDock"><div><span>DOMINIO LOCAL</span><b>{domain||'tu-web.local'}</b></div><input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="algo.tudominio.tld"/><button onClick={publish}>{tr(config.language,'publish')} <b>↗</b></button></div>
 </div>
}

function BrowserPage({url,navigate,reloadToken,config}){
 const [html,setHtml]=useState('')
 useEffect(()=>{const h=domainFromUrl(url),site=h?read('dumbSites',{})[h]:null;setHtml(site?rewrite(site.html,url):'<main class="notFound"><span>404 / LOCAL</span><h1>'+tr(config.language,'notFound')+'</h1><p>'+tr(config.language,'notFoundDesc')+'</p><button data-nav="dumb://home">'+tr(config.language,'backHome')+'</button></main>')},[url,reloadToken,config.language])
 return <iframe className="siteFrame" srcDoc={html} title={url} sandbox="allow-scripts allow-forms" onLoad={e=>{try{e.currentTarget.contentDocument?.addEventListener('click',ev=>{const n=ev.target.closest('[data-nav]');if(n){ev.preventDefault();navigate(n.dataset.nav)}const b=ev.target.closest('[data-blocked]');if(b)ev.preventDefault()}})}catch{}}}/>
}

function ListPage({type,navigate,config}){
 const items=type==='bookmarks'?read('dumbBookmarks',[]):read('dumbHistory',[]).slice().reverse()
 const empty=type==='bookmarks'?tr(config.language,'noBookmarks'):tr(config.language,'historyEmpty')
 return <div className="fullPage listNew"><header><div><span className="pageKicker">{type==='bookmarks'?'LIBRARY':'JOURNAL'}</span><h1>{type==='bookmarks'?'Marcadores':'Historial'}</h1><p>{type==='bookmarks'?'Tus páginas locales guardadas.':'Los últimos lugares que visitaste dentro del navegador.'}</p></div></header>{items.length?<div className="listRows">{items.map((x,i)=>{const u=typeof x==='string'?x:x.url;return <button key={u+i} onClick={()=>navigate(u)}><span>{String(i+1).padStart(2,'0')}</span><div><b>{typeof x==='string'?visibleUrl(x):x.title||visibleUrl(x.url)}</b><small>{visibleUrl(u)}</small></div><strong>↗</strong></button>})}</div>:<div className="listEmpty"><span>○</span><b>{empty}</b></div>}</div>
}

class ErrorBoundary extends React.Component{state={error:null};static getDerivedStateFromError(error){return{error}};render(){return this.state.error?<div className="fatal"><b>DUMBNAVIGATOR</b><h1>No se pudo cargar.</h1><p>{String(this.state.error.message||this.state.error)}</p><button onClick={()=>location.reload()}>Recargar</button></div>:this.props.children}}

function App(){
 const [config,setConfig]=useState(()=>read('dumbSetup',null)),[tabs,setTabs]=useState(()=>[{url:HOME,history:[HOME],index:0}]),[active,setActive]=useState(0),[address,setAddress]=useState(''),[menu,setMenu]=useState(false),[settings,setSettings]=useState(false),[reload,setReload]=useState(0)
 const current=tabs[active]||tabs[0]
 useEffect(()=>setAddress(visibleUrl(current.url)),[current.url])
 if(!config)return <Setup onDone={setConfig}/>
 const navigate=input=>{const u=normalize(input);setTabs(ts=>ts.map((t,i)=>i===active?{...t,url:u,history:[...t.history.slice(0,t.index+1),...(t.url===u?[]:[u])],index:t.url===u?t.index:t.index+1}:t));setAddress(visibleUrl(u));setMenu(false);const h=read('dumbHistory',[]).filter(x=>x!==u);h.push(u);write('dumbHistory',h.slice(-200))}
 const back=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index>0?{...t,url:t.history[t.index-1],index:t.index-1}:t))
 const forward=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index<t.history.length-1?{...t,url:t.history[t.index+1],index:t.index+1}:t))
 const newTab=()=>{setTabs(ts=>[...ts,{url:HOME,history:[HOME],index:0}]);setActive(tabs.length)}
 const close=i=>{if(tabs.length===1)return;setTabs(ts=>ts.filter((_,n)=>n!==i));setActive(a=>i<a?a-1:Math.min(a,tabs.length-2))}
 const bookmarks=read('dumbBookmarks',[]),bookmarked=bookmarks.some(x=>x.url===current.url)
 const content=current.url===HOME?<Home navigate={navigate} config={config}/>:current.url===CREATE?<Creator navigate={navigate} config={config}/>:current.url===DEVELOPE?<Creator navigate={navigate} config={config} developer/>:current.url==='dumb://bookmarks'?<ListPage type="bookmarks" navigate={navigate} config={config}/>:current.url==='dumb://history'?<ListPage type="history" navigate={navigate} config={config}/>:<BrowserPage url={current.url} navigate={navigate} reloadToken={reload} config={config}/>
 return <div className={'browserShell '+config.style} style={{'--accent':config.color||'#8b7cff'}}>
  <div className="browserTop"><div className="traffic"><i/><i/><i/></div><div className="tabsRail">{tabs.map((t,i)=><div key={i} className={'browserTab '+(i===active?'active':'')} onClick={()=>setActive(i)}><span>{visibleUrl(t.url)||'Nueva pestaña'}</span><button onClick={e=>{e.stopPropagation();close(i)}}>×</button></div>)}<button className="addTab" onClick={newTab}>＋</button></div><button className="topMenu" onClick={()=>setMenu(!menu)}>☰</button></div>
  <div className="browserBar"><div className="navControls"><button disabled={!current.index} onClick={back}>‹</button><button disabled={current.index>=current.history.length-1} onClick={forward}>›</button></div><form className="addressBar" onSubmit={e=>{e.preventDefault();navigate(address)}}><span>⌕</span><input value={address} onChange={e=>setAddress(e.target.value)} placeholder={tr(config.language,'address')} spellCheck="false"/><i>LOCAL</i></form><div className="barControls"><button onClick={()=>navigate(HOME)}>⌂</button><button onClick={()=>setReload(x=>x+1)}>↻</button><button onClick={()=>{const a=read('dumbBookmarks',[]),i=a.findIndex(x=>x.url===current.url);i>=0?a.splice(i,1):a.push({url:current.url,title:titleFor(current.url)});write('dumbBookmarks',a);setReload(x=>x+1)}}>{bookmarked?'★':'☆'}</button></div></div>
  <main className="browserContent">{content}{settings&&<div className="overlay"><SettingsPage config={config} setConfig={setConfig} onClose={()=>setSettings(false)}/></div>}{menu&&<div className="browserMenu"><div className="menuHead"><b>dumbNavigator</b><span>LOCAL</span></div><button onClick={()=>{navigate(CREATE);setMenu(false)}}>＋ <span>Crear web</span><small>Creator</small></button><button onClick={()=>{navigate(DEVELOPE);setMenu(false)}}>⌘ <span>DevelopE.it</span><small>Dev tools</small></button><button onClick={()=>{navigate('dumb://bookmarks');setMenu(false)}}>☆ <span>Marcadores</span><small>Library</small></button><button onClick={()=>{navigate('dumb://history');setMenu(false)}}>◷ <span>Historial</span><small>Journal</small></button><button onClick={()=>{setSettings(true);setMenu(false)}}>⚙ <span>Configuración</span><small>Preferences</small></button></div>}</main>
 </div>
}
const root=document.getElementById('root');if(root)createRoot(root).render(<ErrorBoundary><App/></ErrorBoundary>)
