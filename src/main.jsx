import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import './styles.css'

const DEFAULT_HOME='dumb://home'
const CREATE='dumb://create'
const RESERVED=['home','create','bookmarks','history']

const read=(k,d)=>{try{return JSON.parse(window.localStorage.getItem(k)??'null')??d}catch{return d}}
const write=(k,v)=>{try{window.localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
const clearStorageKey=k=>{try{window.localStorage.removeItem(k)}catch{}}

const domainFromUrl=url=>{try{const u=new URL(url);return u.protocol==='dumb:'?u.hostname.toLowerCase():''}catch{return ''}}
const normalize=input=>{
  let s=input.trim()
  if(!s)return DEFAULT_HOME
  if(!s.includes('://'))s='dumb://'+s
  try{
    const u=new URL(s)
    if(u.protocol!=='dumb:')return DEFAULT_HOME
    const domain=u.hostname.toLowerCase()
    if(!domain)return DEFAULT_HOME
    return 'dumb://'+domain+(u.pathname&&u.pathname!=='/'?u.pathname:'/')+(u.search||'')+(u.hash||'')
  }catch{return DEFAULT_HOME}
}

const titleFor=url=>url===DEFAULT_HOME?'Neue Tab':domainFromUrl(url)||'Nueva página'
const rewrite=html=>html.replace(/href\s*=\s*["'](dumb:\/\/[^"']+)["']/gi,(_,u)=>'href="#" data-nav="'+u.replaceAll('"','&quot;')+'"')
const reactDocument=()=>'<main class="notFound"><h1>Vista React no disponible</h1><p>El modo React se guarda localmente, pero esta versión solo ejecuta HTML local sin cargadores externos.</p></main>'

const themes={
  dark:{bg:'#08090d',surface:'#15171d',text:'#f5f7fb',accent:'#8ab4ff'},
  light:{bg:'#f4f5f7',surface:'#ffffff',text:'#17191f',accent:'#356ee8'},
  midnight:{bg:'#070817',surface:'#10132a',text:'#f4f2ff',accent:'#a88cff'}
}

function Setup({onDone}){
  const [language,setLanguage]=useState('es')
  const [style,setStyle]=useState('glass')
  const [color,setColor]=useState('#8ab4ff')
  const [background,setBackground]=useState('aurora')
  const [density,setDensity]=useState('comfortable')
  const [radius,setRadius]=useState('soft')
  const finish=()=>{
    write('dumbSetup',{language,style,color,background,density,radius})
    onDone({language,style,color,background,density,radius})
  }
  return <div className={'setup '+style} style={{'--setup-accent':color}}>
    <div className="setupGlow"/>
    <section className="setupCard">
      <div className="setupLogo">d</div>
      <span className="eyebrow">DUMBNAVIGATOR</span>
      <h1>Configura tu navegador.</h1>
      <p className="setupIntro">Un espacio web personal, rápido y tuyo. Puedes cambiar todo esto después.</p>
      <div className="setupGrid">
        <label>Idioma<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="es">Español</option><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option></select></label>
        <label>Estilo<select value={style} onChange={e=>setStyle(e.target.value)}><option value="glass">Glass</option><option value="solid">Sólido</option><option value="minimal">Minimal</option></select></label>
        <label>Color de acento<div className="colorChoices">{['#8ab4ff','#b58cff','#63d6a5','#ff9b71','#ff7aa8'].map(x=><button key={x} style={{background:x}} className={color===x?'selected':''} onClick={()=>setColor(x)} aria-label={x}/>)}</div></label>
        <label>Fondo<select value={background} onChange={e=>setBackground(e.target.value)}><option value="gradient">Degradado</option><option value="plain">Liso</option><option value="aurora">Aurora</option></select></label>
        <label>Densidad<select value={density} onChange={e=>setDensity(e.target.value)}><option value="comfortable">Cómoda</option><option value="compact">Compacta</option><option value="spacious">Amplia</option></select></label>
        <label>Forma de interfaz<select value={radius} onChange={e=>setRadius(e.target.value)}><option value="soft">Suave</option><option value="sharp">Precisa</option><option value="pill">Redondeada</option></select></label>
      </div>
      <div className="setupPreview"><div className="previewDot" style={{background:color}}/><div><b>Así se verá dumbNavigator</b><span>Tu configuración se guarda en este dispositivo.</span></div></div>
      <button className="primary big" onClick={finish}>Empezar a navegar <span>→</span></button>
    </section>
  </div>
}

const Home=({navigate,openSettings})=>{
  const sites=Object.entries(read('dumbSites',{}))
  const bookmarks=read('dumbBookmarks',[])
  return <div className="startPage">
    <header className="startHeader"><div className="brand"><span className="brandMark">d</span><b>dumbNavigator</b></div><button className="settingsBtn" onClick={openSettings}>⚙</button></header>
    <section className="hero">
      <span className="eyebrow">TU NAVEGADOR</span>
      <h1>¿qué quieres<br/><em>hacer hoy?</em></h1>
      <p>Crea y navega tus webs locales. Todo vive dentro de dumbNavigator, usando únicamente direcciones dumb://.</p>
      <form className="homeSearch" onSubmit={e=>{e.preventDefault();navigate(e.currentTarget.q.value)}}>
        <span>⌕</span><input name="q" placeholder="Escribe una dirección dumb://" autoFocus/><button>→</button>
      </form>
    </section>
    <section className="quickGrid">
      <button className="featureCard accent" onClick={()=>navigate('dumb://create')}>
        <span className="featureIcon">✦</span><div><b>Crear una web</b><small>Construye un sitio HTML local y publícalo en tu espacio dumb://.</small></div><strong>→</strong>
      </button>
      <button className="featureCard" onClick={()=>navigate('dumb://bookmarks')}>
        <span className="featureIcon">☆</span><div><b>Marcadores</b><small>{bookmarks.length?bookmarks.length+' sitios guardados':'Guarda tus sitios favoritos aquí'}</small></div><strong>→</strong>
      </button>
      <button className="featureCard" onClick={()=>navigate('dumb://history')}>
        <span className="featureIcon">◷</span><div><b>Historial</b><small>Vuelve rápidamente a lo que estabas viendo.</small></div><strong>→</strong>
      </button>
    </section>
    {sites.length>0&&<section className="section"><div className="sectionTitle"><b>Tus webs</b><span>{sites.length}</span></div><div className="siteList">{sites.slice(0,6).map(([h])=><button key={h} onClick={()=>navigate('dumb://'+h)}><span>◉</span><b>{h}</b><small>tu sitio</small><strong>→</strong></button>)}</div></section>}
    <footer className="startFooter"><span>Privado · local-first</span><span>Solo dumb:// · local-first</span></footer>
  </div>
}

function SettingsPage({config,setConfig,onClose}){
  const [draft,setDraft]=useState({...config,density:config.density||'comfortable',radius:config.radius||'soft'})
  const save=()=>{write('dumbSetup',draft);setConfig(draft)}
  return <div className="settingsPage"><div className="settingsTop"><div><span className="eyebrow">PERSONALIZACIÓN</span><h1>Configuración</h1></div><button className="settingsClose" onClick={onClose}>×</button></div>
    <div className="settingsSections">
      <section><h2>Apariencia</h2><p>Haz que el navegador se sienta como tuyo.</p>
        <label>Estilo<select value={draft.style} onChange={e=>setDraft({...draft,style:e.target.value})}><option value="glass">Glass</option><option value="solid">Sólido</option><option value="minimal">Minimal</option></select></label>
        <label>Fondo<select value={draft.background} onChange={e=>setDraft({...draft,background:e.target.value})}><option value="gradient">Degradado</option><option value="plain">Liso</option><option value="aurora">Aurora</option></select></label>
        <label>Color de acento<div className="colorChoices">{['#8ab4ff','#b58cff','#63d6a5','#ff9b71','#ff7aa8'].map(x=><button key={x} style={{background:x}} className={draft.color===x?'selected':''} onClick={()=>setDraft({...draft,color:x})}/>)}</div></label>
        <label>Densidad<select value={draft.density} onChange={e=>setDraft({...draft,density:e.target.value})}><option value="comfortable">Cómoda</option><option value="compact">Compacta</option><option value="spacious">Amplia</option></select></label>
        <label>Forma de interfaz<select value={draft.radius} onChange={e=>setDraft({...draft,radius:e.target.value})}><option value="soft">Suave</option><option value="sharp">Precisa</option><option value="pill">Redondeada</option></select></label>
      </section>
      <section><h2>Idioma</h2><p>Idioma de la interfaz del navegador.</p><select value={draft.language} onChange={e=>setDraft({...draft,language:e.target.value})}><option value="es">Español</option><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option></select></section>
      <button className="primary save" onClick={save}>Guardar cambios</button>
    </div>
  </div>
}

function Creator({navigate}){
  const [mode,setMode]=useState('html')
  const [domain,setDomain]=useState('miweb')
  const [code,setCode]=useState('<!doctype html>\\n<html>\\n<head><title>Mi web</title></head>\\n<body style="font-family:system-ui;padding:40px">\\n  <h1>Hola 👋</h1>\\n  <p>Mi primera web en dumbNavigator.</p>\\n</body>\\n</html>')
  const [backend,setBackend]=useState(false)
  const [backendCode,setBackendCode]=useState('export async function onRequest(context) {\\n  return new Response(JSON.stringify({ ok: true } ), {\\n    headers: { "content-type": "application/json" }\\n  })\\n}')
  const preview=mode==='react'?reactDocument():rewrite(code)\n  const publish=()=>{
    let h=domain.trim().toLowerCase().replace(/[^a-z0-9.-]/g,'')
    if(!h||RESERVED.includes(h)){alert('Elige otro nombre de web.');return}
    if(!h.includes('.'))h=h+'.dev'
    const sites=read('dumbSites',{})
    sites[h]={mode,html:code,backend:backend?backendCode:null}
    write('dumbSites',sites)
    navigate('dumb://'+h)
  }
  return <div className="creatorPro">
    <div className="creatorTop"><div><span className="eyebrow">DUMBNAVIGATOR CREATOR</span><h1>Crea una web avanzada.</h1><p>HTML o React, con espacio para backend.</p></div><button onClick={()=>navigate(DEFAULT_HOME)}>×</button></div>
    <div className="creatorModes"><button className={mode==='html'?'active':''} onClick={()=>setMode('html')}>HTML</button><button className={mode==='react'?'active':''} onClick={()=>setMode('react')}>React</button><button className={backend?'active':''} onClick={()=>setBackend(!backend)}>＋ Backend</button></div>
    <div className="creatorLayout">
      <section className="codePanel"><div className="panelHead"><b>{mode==='react'?'React / JSX':'HTML'}</b><span>editable</span></div><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/></section>
      <section className="livePanel"><div className="panelHead"><b>Vista previa</b><span>LIVE</span></div><iframe className="preview" srcDoc={preview} title="Vista previa" sandbox="allow-scripts allow-forms"/></section>
    </div>
    {backend&&<section className="backendPanel"><div className="panelHead"><b>Backend</b><span>Cloudflare Pages Function</span></div><textarea value={backendCode} onChange={e=>setBackendCode(e.target.value)} spellCheck="false"/><p>El código queda asociado al proyecto para desplegarlo como función del backend cuando la web se publique en Cloudflare.</p></section>}
    <div className="publishBar"><input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="nombre-de-tu-web"/><span>.dev</span><button className="primary" onClick={publish}>Publicar →</button></div>
  </div>
}
function BrowserPage({url,navigate,reloadToken}){
  const [html,setHtml]=useState('')
  useEffect(()=>{
    const h=domainFromUrl(url)
    const site=h?read('dumbSites',{})[h]:null
    if(site)setHtml(site.mode==='react'?reactDocument():rewrite(site.html))
    else setHtml('<main class="notFound"><span>404</span><h1>Página no encontrada</h1><p>Esta dirección todavía no existe en dumbNavigator.</p><button data-nav="dumb://home">Volver al inicio</button></main>')
  },[url,reloadToken])
  return <iframe className="page" srcDoc={html} title={url} sandbox="allow-scripts allow-forms" onLoad={e=>{try{e.currentTarget.contentDocument?.addEventListener('click',ev=>{const n=ev.target.closest('[data-nav]');if(n){ev.preventDefault();navigate(n.dataset.nav)}})}catch{}}}/>
}

class AppErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  render(){
    if(this.state.error)return <div className="fatalError"><span className="eyebrow">DUMBNAVIGATOR</span><h1>No se pudo iniciar.</h1><p>La aplicación encontró un error al cargar esta versión.</p><pre>{String(this.state.error?.message||this.state.error)}</pre><button className="primary" onClick={()=>{clearStorageKey('dumbSetup');clearStorageKey('dumbSites');clearStorageKey('dumbBookmarks');clearStorageKey('dumbHistory');window.location.reload()}}>Restablecer configuración</button></div>
    return this.props.children
  }
}

function App(){
  const [config,setConfig]=useState(()=>read('dumbSetup',null))
  const [tabs,setTabs]=useState(()=>[{url:DEFAULT_HOME,title:'Neue Tab',history:[DEFAULT_HOME],index:0}])
  const [active,setActive]=useState(0),[menu,setMenu]=useState(false),[address,setAddress]=useState(DEFAULT_HOME),[reloadToken,setReloadToken]=useState(0),[settingsOpen,setSettingsOpen]=useState(false)
  const current=tabs[active]||tabs[0]
  useEffect(()=>{setAddress(current?.url||DEFAULT_HOME)},[current?.url])
  if(!config)return <Setup onDone={setConfig}/>
  const navigate=url=>{const u=normalize(url);setTabs(ts=>ts.map((t,i)=>i===active?{...t,url:u,title:titleFor(u),history:[...t.history.slice(0,t.index+1),...(t.url===u?[]:[u])],index:t.url===u?t.index:t.index+1}:t));setAddress(u);setMenu(false);const h=read('dumbHistory',[]).filter(x=>x!==u);h.push(u);write('dumbHistory',h.slice(-200))}
  const back=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index>0?{...t,index:t.index-1,url:t.history[t.index-1],title:titleFor(t.history[t.index-1])}:t))
  const forward=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index<t.history.length-1?{...t,index:t.index+1,url:t.history[t.index+1],title:titleFor(t.history[t.index+1])}:t))
  const newTab=()=>{setTabs(ts=>[...ts,{url:DEFAULT_HOME,title:'Neue Tab',history:[DEFAULT_HOME],index:0}]);setActive(tabs.length)}
  const close=i=>{if(tabs.length===1)return;setTabs(ts=>ts.filter((_,n)=>n!==i));setActive(a=>i<a?a-1:Math.min(a,tabs.length-2))}
  const bookmarks=read('dumbBookmarks',[]),bookmarked=bookmarks.some(x=>x.url===current.url)
  const content=current.url===DEFAULT_HOME?<Home navigate={navigate} openSettings={()=>setSettingsOpen(true)}/>:current.url===CREATE?<Creator navigate={navigate}/>:current.url==='dumb://bookmarks'?<div className="listPage"><h1>Marcadores</h1>{bookmarks.length?bookmarks.map(x=><button key={x.url} onClick={()=>navigate(x.url)}>{x.title||x.url}<span>→</span></button>):<p>Aún no tienes marcadores.</p>}</div>:current.url==='dumb://history'?<div className="listPage"><h1>Historial</h1>{read('dumbHistory',[]).slice().reverse().map(x=><button key={x} onClick={()=>navigate(x)}>{x}<span>→</span></button>)}</div>:<BrowserPage url={current.url} navigate={navigate} reloadToken={reloadToken}/>
  return <div className={'app '+(config.style||'solid')+' density-'+(config.density||'comfortable')+' radius-'+(config.radius||'soft')+' bg-'+(config.background||'aurora')} style={{'--accent':config?.color||'#63d6a5'}}>
    <div className="tabs">{tabs.map((t,i)=><div className={'tab '+(i===active?'active':'')} key={i} onClick={()=>setActive(i)}><span>{t.title}</span><button onClick={e=>{e.stopPropagation();close(i)}}>×</button></div>)}<button className="newtab" onClick={newTab}>＋</button></div>
    <div className="toolbar"><div className="actions"><button className="icon" disabled={!current.index} onClick={back}>←</button><button className="icon" disabled={current.index>=current.history.length-1} onClick={forward}>→</button><button className="icon" onClick={()=>navigate(DEFAULT_HOME)}>⌂</button><button className="icon" onClick={()=>setReloadToken(x=>x+1)}>↻</button></div><form className="address" onSubmit={e=>{e.preventDefault();navigate(address)}}><span>⌕</span><input value={address} onChange={e=>setAddress(e.target.value)} spellCheck="false"/></form><div className="actions"><button className="icon" onClick={()=>{const a=read('dumbBookmarks',[]);const i=a.findIndex(x=>x.url===current.url);i>=0?a.splice(i,1):a.push({url:current.url,title:current.title});write('dumbBookmarks',a);setReloadToken(x=>x+1)}}>{bookmarked?'★':'☆'}</button><button className="icon" onClick={()=>setMenu(!menu)}>☰</button></div></div>
    <main className="main">{content}{settingsOpen&&<div className="settingsOverlay"><SettingsPage config={config} setConfig={setConfig} onClose={()=>setSettingsOpen(false)}/></div>}{menu&&<div className="panel"><h2>dumbNavigator</h2><button onClick={()=>navigate('dumb://bookmarks')}>☆ Marcadores</button><button onClick={()=>navigate('dumb://history')}>◷ Historial</button><button onClick={()=>navigate('dumb://create')}>✦ Crear una web</button><button onClick={()=>{setSettingsOpen(true);setMenu(false)}}>⚙ Configuración</button><button onClick={()=>{localStorage.removeItem('dumbHistory');setMenu(false)}}>⌫ Borrar historial</button></div>}</main>
  </div>
}

const root=document.getElementById('root')
if(root)createRoot(root).render(<AppErrorBoundary><App/></AppErrorBoundary>)
