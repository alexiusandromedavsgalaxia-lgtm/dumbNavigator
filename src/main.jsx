import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import './styles.css'

const DEFAULT_HOME='dumb://home'
const SETTINGS='dumb://settings'
const RESERVED=['google.com','apple.com','microsoft.com','amazon.com','youtube.com','instagram.com','facebook.com','tiktok.com','spotify.com','github.com','cloudflare.com','openai.com','wikipedia.org','reddit.com','discord.com','whatsapp.com','roblox.com','minecraft.net','nintendo.com','playstation.com','xbox.com','netflix.com']

const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)??'null')??d}catch{return d}}
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v))
const host=url=>{try{return new URL(url).hostname.toLowerCase()}catch{return ''}}
const normalize=input=>{
  let s=input.trim()
  if(!s)return DEFAULT_HOME
  if(s==='settings')return SETTINGS
  if(!s.includes('://'))s='dumb://'+s
  if(!s.startsWith('dumb://')&&!/^https?:\/\//i.test(s))s='https://'+s
  try{return s.startsWith('dumb://')?(()=>{const u=new URL(s);return 'dumb://'+u.hostname.toLowerCase()+(u.pathname||'/')})():s}catch{return DEFAULT_HOME}
}
const titleFor=url=>url===DEFAULT_HOME?'Neue Tab':url===SETTINGS?'Einstellungen':host(url)||'Neue Tab'
const rewrite=html=>html.replace(/href\s*=\s*["'](dumb:\/\/[^"']+)["']/gi,(_,u)=>'href="#" data-nav="'+u.replaceAll('"','&quot;')+'"')

const themes={
  dark:{bg:'#08090d',surface:'#15171d',text:'#f5f7fb',accent:'#8ab4ff'},
  light:{bg:'#f4f5f7',surface:'#ffffff',text:'#17191f',accent:'#356ee8'},
  midnight:{bg:'#070817',surface:'#10132a',text:'#f4f2ff',accent:'#a88cff'}
}

function Setup({onDone}){
  const [language,setLanguage]=useState('es')
  const [style,setStyle]=useState('glass')
  const [color,setColor]=useState('#8ab4ff')
  const [background,setBackground]=useState('gradient')
  const finish=()=>{
    write('dumbSetup',{language,style,color,background})
    onDone({language,style,color,background})
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
      </div>
      <div className="setupPreview"><div className="previewDot" style={{background:color}}/><div><b>Así se verá dumbNavigator</b><span>Tu configuración se guarda en este dispositivo.</span></div></div>
      <button className="primary big" onClick={finish}>Empezar a navegar <span>→</span></button>
    </section>
  </div>
}

const Home=({navigate,settings})=>{
  const sites=Object.entries(read('dumbSites',{}))
  const bookmarks=read('dumbBookmarks',[])
  return <div className="startPage">
    <header className="startHeader"><div className="brand"><span className="brandMark">d</span><b>dumbNavigator</b></div><button className="settingsBtn" onClick={()=>navigate(SETTINGS)}>⚙</button></header>
    <section className="hero">
      <span className="eyebrow">TU NAVEGADOR</span>
      <h1>¿qué quieres<br/><em>hacer hoy?</em></h1>
      <p>Busca, navega, guarda tus sitios y crea los tuyos. Sin una “página de developer” pegada como portada.</p>
      <form className="homeSearch" onSubmit={e=>{e.preventDefault();navigate(e.currentTarget.q.value)}}>
        <span>⌕</span><input name="q" placeholder="Busca o escribe una dirección..." autoFocus/><button>→</button>
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
    <footer className="startFooter"><span>Privado · local-first</span><span>React · Vite</span></footer>
  </div>
}

function SettingsPage({config,setConfig}){
  const [draft,setDraft]=useState(config)
  const save=()=>{write('dumbSetup',draft);setConfig(draft)}
  return <div className="settingsPage"><div className="settingsTop"><div><span className="eyebrow">PERSONALIZACIÓN</span><h1>Configuración</h1></div></div>
    <div className="settingsSections">
      <section><h2>Apariencia</h2><p>Haz que el navegador se sienta como tuyo.</p>
        <label>Estilo<select value={draft.style} onChange={e=>setDraft({...draft,style:e.target.value})}><option value="glass">Glass</option><option value="solid">Sólido</option><option value="minimal">Minimal</option></select></label>
        <label>Fondo<select value={draft.background} onChange={e=>setDraft({...draft,background:e.target.value})}><option value="gradient">Degradado</option><option value="plain">Liso</option><option value="aurora">Aurora</option></select></label>
        <label>Color de acento<div className="colorChoices">{['#8ab4ff','#b58cff','#63d6a5','#ff9b71','#ff7aa8'].map(x=><button key={x} style={{background:x}} className={draft.color===x?'selected':''} onClick={()=>setDraft({...draft,color:x})}/>)}</div></label>
      </section>
      <section><h2>Idioma</h2><p>Idioma de la interfaz del navegador.</p><select value={draft.language} onChange={e=>setDraft({...draft,language:e.target.value})}><option value="es">Español</option><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option></select></section>
      <button className="primary save" onClick={save}>Guardar cambios</button>
    </div>
  </div>
}

function Creator({navigate}){
  const [domain,setDomain]=useState('miweb')
  const [code,setCode]=useState('<!doctype html>\n<html>\n<head><title>Mi web</title></head>\n<body style="font-family:system-ui;padding:40px">\n  <h1>Hola 👋</h1>\n  <p>Mi primera web en dumbNavigator.</p>\n</body>\n</html>')
  const publish=()=>{let h=domain.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/[^a-z0-9.-]/g,'');if(!h||RESERVED.some(x=>h===x||h.endsWith('.'+x))){alert('Elige otro nombre de web.');return}if(!h.includes('.'))h='uuu.'+h+'.dev';const sites=read('dumbSites',{});sites[h]={html:code};write('dumbSites',sites);navigate('dumb://'+h)}
  return <div className="creatorPro"><div className="creatorTop"><div><span className="eyebrow">DUMBNAVIGATOR CREATOR</span><h1>Crea tu web.</h1></div><button onClick={()=>navigate(DEFAULT_HOME)}>×</button></div><div className="creatorLayout"><section className="codePanel"><div className="panelHead"><b>HTML</b><span>editable</span></div><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/></section><section className="livePanel"><div className="panelHead"><b>Vista previa</b><span>LIVE</span></div><iframe className="preview" srcDoc={rewrite(code)} title="Vista previa" sandbox="allow-scripts allow-forms"/></section></div><div className="publishBar"><input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="nombre-de-tu-web"/><span>.dev</span><button className="primary" onClick={publish}>Publicar →</button></div></div>
}

function BrowserPage({url,navigate,reloadToken}){
  const [html,setHtml]=useState('')
  const [external,setExternal]=useState(false)
  useEffect(()=>{const h=host(url);let value=null;if(h&&read('dumbSites',{})[h])value=read('dumbSites',{})[h].html;if(value){setExternal(false);setHtml(rewrite(value))}else if(/^https?:\/\//.test(url)){setExternal(true)}else{setExternal(false);setHtml('<main class="notFound"><span>404</span><h1>Página no encontrada</h1><p>Esta dirección todavía no existe en dumbNavigator.</p><button data-nav="dumb://home">Volver al inicio</button></main>')}},[url,reloadToken])
  if(external)return <iframe className="page" src={url} title={url} referrerPolicy="no-referrer"/>
  return <iframe className="page" srcDoc={html} title={url} sandbox="allow-scripts allow-forms" onLoad={e=>{try{e.currentTarget.contentDocument?.addEventListener('click',ev=>{const n=ev.target.closest('[data-nav]');if(n){ev.preventDefault();navigate(n.dataset.nav)}})}catch{}}}/>
}

function App(){
  const [config,setConfig]=useState(()=>read('dumbSetup',null))
  const [tabs,setTabs]=useState(()=>[{url:DEFAULT_HOME,title:'Neue Tab',history:[DEFAULT_HOME],index:0}])
  const [active,setActive]=useState(0),[menu,setMenu]=useState(false),[address,setAddress]=useState(DEFAULT_HOME),[reloadToken,setReloadToken]=useState(0)
  const current=tabs[active]
  const navigate=url=>{const u=normalize(url);setTabs(ts=>ts.map((t,i)=>i===active?{...t,url:u,title:titleFor(u),history:[...t.history.slice(0,t.index+1),...(t.url===u?[]:[u])],index:t.url===u?t.index:t.index+1}:t));setAddress(u);setMenu(false);const h=read('dumbHistory',[]).filter(x=>x!==u);h.push(u);write('dumbHistory',h.slice(-200))}
  const back=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index>0?{...t,index:t.index-1,url:t.history[t.index-1],title:titleFor(t.history[t.index-1])}:t))
  const forward=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index<t.history.length-1?{...t,index:t.index+1,url:t.history[t.index+1],title:titleFor(t.history[t.index+1])}:t))
  const newTab=()=>{setTabs(ts=>[...ts,{url:DEFAULT_HOME,title:'Neue Tab',history:[DEFAULT_HOME],index:0}]);setActive(tabs.length)}
  const close=i=>{if(tabs.length===1)return;setTabs(ts=>ts.filter((_,n)=>n!==i));setActive(a=>i<a?a-1:Math.min(a,tabs.length-2))}
  const bookmarks=read('dumbBookmarks',[]),bookmarked=bookmarks.some(x=>x.url===current.url)
  const content=current.url===DEFAULT_HOME?<Home navigate={navigate}/>:current.url===SETTINGS?<SettingsPage config={config} setConfig={setConfig}/>:current.url==='dumb://create'?<Creator navigate={navigate}/>:current.url==='dumb://bookmarks'?<div className="listPage"><h1>Marcadores</h1>{bookmarks.length?bookmarks.map(x=><button key={x.url} onClick={()=>navigate(x.url)}>{x.title||x.url}<span>→</span></button>):<p>Aún no tienes marcadores.</p>}</div>:current.url==='dumb://history'?<div className="listPage"><h1>Historial</h1>{read('dumbHistory',[]).slice().reverse().map(x=><button key={x} onClick={()=>navigate(x)}>{x}<span>→</span></button>)}</div>:<BrowserPage url={current.url} navigate={navigate} reloadToken={reloadToken}/>
  return <div className="app" style={{'--accent':config?.color||'#8ab4ff'}}>
    <div className="tabs">{tabs.map((t,i)=><div className={'tab '+(i===active?'active':'')} key={i} onClick={()=>setActive(i)}><span>{t.title}</span><button onClick={e=>{e.stopPropagation();close(i)}}>×</button></div>)}<button className="newtab" onClick={newTab}>＋</button></div>
    <div className="toolbar"><div className="actions"><button className="icon" disabled={!current.index} onClick={back}>←</button><button className="icon" disabled={current.index>=current.history.length-1} onClick={forward}>→</button><button className="icon" onClick={()=>navigate(DEFAULT_HOME)}>⌂</button><button className="icon" onClick={()=>setReloadToken(x=>x+1)}>↻</button></div><form className="address" onSubmit={e=>{e.preventDefault();navigate(address)}}><span>⌕</span><input value={address} onChange={e=>setAddress(e.target.value)} spellCheck="false"/></form><div className="actions"><button className="icon" onClick={()=>{const a=read('dumbBookmarks',[]);const i=a.findIndex(x=>x.url===current.url);i>=0?a.splice(i,1):a.push({url:current.url,title:current.title});write('dumbBookmarks',a);setReloadToken(x=>x+1)}}>{bookmarked?'★':'☆'}</button><button className="icon" onClick={()=>setMenu(!menu)}>☰</button></div></div>
    <main className="main">{content}{menu&&<div className="panel"><h2>dumbNavigator</h2><button onClick={()=>navigate('dumb://bookmarks')}>☆ Marcadores</button><button onClick={()=>navigate('dumb://history')}>◷ Historial</button><button onClick={()=>navigate('dumb://create')}>✦ Crear una web</button><button onClick={()=>navigate(SETTINGS)}>⚙ Configuración</button><button onClick={()=>{localStorage.removeItem('dumbHistory');setMenu(false)}}>⌫ Borrar historial</button></div>}</main>
  </div>
}

createRoot(document.getElementById('root')).render(config?<App/>:<Setup onDone={setConfig}/>)
