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

const titleFor=url=>url===DEFAULT_HOME?'Nueva pestaña':domainFromUrl(url)||'Nueva página'
const rewrite=html=>html.replace(/href\s*=\s*["'](dumb:\/\/[^"']+)["']/gi,(_,u)=>'href="#" data-nav="'+u.replaceAll('"','&quot;')+'"')

const LANG={
es:{settings:'Configuración',newTab:'Nueva pestaña',home:'Inicio',create:'Crear una web',bookmarks:'Marcadores',history:'Historial',clearHistory:'Borrar historial',language:'Idioma',appearance:'Apariencia',style:'Estilo',background:'Fondo',accent:'Color de acento',density:'Densidad',shape:'Forma de interfaz',save:'Guardar cambios',start:'Empezar a navegar',yourBrowser:'TU NAVEGADOR',what:'¿qué quieres',today:'hacer hoy?',address:'Escribe una dirección dumb://',yourSites:'Tus webs',site:'tu sitio',noBookmarks:'Aún no tienes marcadores.',historyEmpty:'Aún no hay historial.',customize:'Haz que el navegador se sienta como tuyo.',languageDesc:'Idioma de la interfaz del navegador.',createDesc:'Construye un sitio HTML local y publícalo dentro de dumb://.',historyDesc:'Vuelve rápidamente a lo que estabas viendo.',notFound:'Página no encontrada',notFoundDesc:'Esta dirección todavía no existe en dumbNavigator.',backHome:'Volver al inicio',creator:'DUMBNAVIGATOR CREATOR',createTitle:'Crea una web local.',createIntro:'Escribe HTML y guárdalo dentro de este navegador. No se conecta a páginas externas.',preview:'Vista previa',editable:'editable',html:'HTML',domain:'nombre-de-tu-web',publish:'Guardar en dumb://',localBackend:'Funciones locales',localBackendDesc:'Las funciones externas no forman parte de este navegador local.',solid:'Sólido',glass:'Glass',minimal:'Minimal',gradient:'Degradado',plain:'Liso',aurora:'Aurora',comfortable:'Cómoda',compact:'Compacta',spacious:'Amplia',soft:'Suave',sharp:'Precisa',pill:'Redondeada'},
en:{settings:'Settings',newTab:'New tab',home:'Home',create:'Create a website',bookmarks:'Bookmarks',history:'History',clearHistory:'Clear history',language:'Language',appearance:'Appearance',style:'Style',background:'Background',accent:'Accent color',density:'Density',shape:'Interface shape',save:'Save changes',start:'Start browsing',yourBrowser:'YOUR BROWSER',what:'what do you want',today:'to do today?',address:'Enter a dumb:// address',yourSites:'Your websites',site:'your site',noBookmarks:'You do not have any bookmarks yet.',historyEmpty:'There is no history yet.',customize:'Make the browser feel like yours.',languageDesc:'Browser interface language.',createDesc:'Build a local HTML site and save it inside dumb://.',historyDesc:'Quickly return to what you were viewing.',notFound:'Page not found',notFoundDesc:'This address does not exist in dumbNavigator yet.',backHome:'Back to home',creator:'DUMBNAVIGATOR CREATOR',createTitle:'Create a local website.',createIntro:'Write HTML and save it inside this browser. It never connects to external pages.',preview:'Preview',editable:'editable',html:'HTML',domain:'your-site-name',publish:'Save to dumb://',localBackend:'Local functions',localBackendDesc:'External functions are not part of this local browser.',solid:'Solid',glass:'Glass',minimal:'Minimal',gradient:'Gradient',plain:'Plain',aurora:'Aurora',comfortable:'Comfortable',compact:'Compact',spacious:'Spacious',soft:'Soft',sharp:'Sharp',pill:'Rounded'},
de:{settings:'Einstellungen',newTab:'Neuer Tab',home:'Startseite',create:'Website erstellen',bookmarks:'Lesezeichen',history:'Verlauf',clearHistory:'Verlauf löschen',language:'Sprache',appearance:'Darstellung',style:'Stil',background:'Hintergrund',accent:'Akzentfarbe',density:'Dichte',shape:'Form',save:'Änderungen speichern',start:'Surfen starten',yourBrowser:'DEIN BROWSER',what:'was möchtest du',today:'heute tun?',address:'dumb:// Adresse eingeben',yourSites:'Deine Websites',site:'deine Seite',noBookmarks:'Noch keine Lesezeichen.',historyEmpty:'Noch kein Verlauf.',customize:'Passe den Browser an.',languageDesc:'Sprache der Browseroberfläche.',createDesc:'Erstelle eine lokale HTML-Seite in dumb://.',historyDesc:'Kehre schnell zur letzten Seite zurück.',notFound:'Seite nicht gefunden',notFoundDesc:'Diese Adresse existiert noch nicht.',backHome:'Zur Startseite',creator:'DUMBNAVIGATOR CREATOR',createTitle:'Lokale Website erstellen.',createIntro:'Schreibe HTML und speichere es in diesem Browser. Keine externen Seiten.',preview:'Vorschau',editable:'bearbeitbar',html:'HTML',domain:'deine-seite',publish:'In dumb:// speichern',localBackend:'Lokale Funktionen',localBackendDesc:'Externe Funktionen gehören nicht zu diesem lokalen Browser.',solid:'Vollton',glass:'Glass',minimal:'Minimal',gradient:'Verlauf',plain:'Einfarbig',aurora:'Aurora',comfortable:'Komfortabel',compact:'Kompakt',spacious:'Großzügig',soft:'Weich',sharp:'Präzise',pill:'Rund'},
fr:{settings:'Réglages',newTab:'Nouvel onglet',home:'Accueil',create:'Créer un site',bookmarks:'Favoris',history:'Historique',clearHistory:'Effacer l’historique',language:'Langue',appearance:'Apparence',style:'Style',background:'Arrière-plan',accent:'Couleur d’accent',density:'Densité',shape:'Forme',save:'Enregistrer',start:'Commencer',yourBrowser:'TON NAVIGATEUR',what:'que veux-tu',today:'faire aujourd’hui ?',address:'Saisis une adresse dumb://',yourSites:'Tes sites',site:'ton site',noBookmarks:'Aucun favori pour le moment.',historyEmpty:'Aucun historique.',customize:'Personnalise ton navigateur.',languageDesc:'Langue de l’interface.',createDesc:'Crée un site HTML local dans dumb://.',historyDesc:'Reviens rapidement à ce que tu consultais.',notFound:'Page introuvable',notFoundDesc:'Cette adresse n’existe pas encore.',backHome:'Retour à l’accueil',creator:'DUMBNAVIGATOR CREATOR',createTitle:'Créer un site local.',createIntro:'Écris du HTML et enregistre-le dans ce navigateur. Aucune page externe.',preview:'Aperçu',editable:'modifiable',html:'HTML',domain:'nom-de-ton-site',publish:'Enregistrer dans dumb://',localBackend:'Fonctions locales',localBackendDesc:'Les fonctions externes ne font pas partie de ce navigateur local.',solid:'Uni',glass:'Glass',minimal:'Minimal',gradient:'Dégradé',plain:'Uni',aurora:'Aurore',comfortable:'Confortable',compact:'Compact',spacious:'Spacieux',soft:'Doux',sharp:'Précis',pill:'Arrondi'}
};
const tr=(language,key)=> (LANG[language]||LANG.es)[key]||LANG.es[key]||key

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
        <label>{tr(language,'language')}<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="es">Español</option><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option></select></label>
        <label>{tr(language,'style')}<select value={style} onChange={e=>setStyle(e.target.value)}><option value="glass">Glass</option><option value="solid">Sólido</option><option value="minimal">Minimal</option></select></label>
        <label>{tr(language,'accent')}<div className="colorChoices">{['#8ab4ff','#b58cff','#63d6a5','#ff9b71','#ff7aa8'].map(x=><button key={x} style={{background:x}} className={color===x?'selected':''} onClick={()=>setColor(x)} aria-label={x}/>)}</div></label>
        <label>{tr(language,'background')}<select value={background} onChange={e=>setBackground(e.target.value)}><option value="gradient">Degradado</option><option value="plain">Liso</option><option value="aurora">Aurora</option></select></label>
        <label>{tr(language,'density')}<select value={density} onChange={e=>setDensity(e.target.value)}><option value="comfortable">Cómoda</option><option value="compact">Compacta</option><option value="spacious">Amplia</option></select></label>
        <label>{tr(language,'shape')}<select value={radius} onChange={e=>setRadius(e.target.value)}><option value="soft">Suave</option><option value="sharp">Precisa</option><option value="pill">Redondeada</option></select></label>
      </div>
      <div className="setupPreview"><div className="previewDot" style={{background:color}}/><div><b>Así se verá dumbNavigator</b><span>Tu configuración se guarda en este dispositivo.</span></div></div>
      <button className="primary big" onClick={finish}>{tr(language,'start')} <span>→</span></button>
    </section>
  </div>
}

const Home=({navigate,openSettings,config})=>{\n  const language=config?.language||'es'
  const sites=Object.entries(read('dumbSites',{}))
  const bookmarks=read('dumbBookmarks',[])
  return <div className="startPage">
    <header className="startHeader"><div className="brand"><span className="brandMark">d</span><b>dumbNavigator</b></div><button className="settingsBtn" onClick={openSettings}>⚙</button></header>
    <section className="hero">
      <span className="eyebrow">{tr(language,'yourBrowser')}</span>
      <h1>{tr(language,'what')}<br/><em>{tr(language,'today')}</em></h1>
      <p>{tr(language,'createDesc')}</p>
      <form className="homeSearch" onSubmit={e=>{e.preventDefault();navigate(e.currentTarget.q.value)}}>
        <span>⌕</span><input name="q" placeholder={tr(language,'address')} autoFocus/><button>→</button>
      </form>
    </section>
    <section className="quickGrid">
      <button className="featureCard accent" onClick={()=>navigate('dumb://create')}>
        <span className="featureIcon">✦</span><div><b>{tr(language,'create')}</b><small>{tr(language,'createDesc')}</small></div><strong>→</strong>
      </button>
      <button className="featureCard" onClick={()=>navigate('dumb://bookmarks')}>
        <span className="featureIcon">☆</span><div><b>{tr(language,'bookmarks')}</b><small>{bookmarks.length?bookmarks.length+' · '+tr(language,'bookmarks'):tr(language,'noBookmarks')}</small></div><strong>→</strong>
      </button>
      <button className="featureCard" onClick={()=>navigate('dumb://history')}>
        <span className="featureIcon">◷</span><div><b>{tr(language,'history')}</b><small>{tr(language,'historyDesc')}</small></div><strong>→</strong>
      </button>
    </section>
    {sites.length>0&&<section className="section"><div className="sectionTitle"><b>{tr(language,'yourSites')}</b><span>{sites.length}</span></div><div className="siteList">{sites.slice(0,6).map(([h])=><button key={h} onClick={()=>navigate('dumb://'+h)}><span>◉</span><b>{h}</b><small>{tr(language,'site')}</small><strong>→</strong></button>)}</div></section>}
    <footer className="startFooter"><span>Privado · local-first</span><span>Solo dumb:// · local-first</span></footer>
  </div>
}

function SettingsPage({config,setConfig,onClose}){
  const t=key=>tr(draft.language,key)
  const [draft,setDraft]=useState({...config,density:config.density||'comfortable',radius:config.radius||'soft'})
  const save=()=>{write('dumbSetup',draft);setConfig(draft)}
  return <div className="settingsPage"><div className="settingsTop"><div><span className="eyebrow">{t('settings').toUpperCase()}</span><h1>{t('settings')}</h1></div><button className="settingsClose" onClick={onClose}>×</button></div>
    <div className="settingsSections">
      <section><h2>{t('appearance')}</h2><p>{t('customize')}</p>
        <label>{tr(language,'style')}<select value={draft.style} onChange={e=>setDraft({...draft,style:e.target.value})}><option value="glass">Glass</option><option value="solid">Sólido</option><option value="minimal">Minimal</option></select></label>
        <label>{tr(language,'background')}<select value={draft.background} onChange={e=>setDraft({...draft,background:e.target.value})}><option value="gradient">Degradado</option><option value="plain">Liso</option><option value="aurora">Aurora</option></select></label>
        <label>{tr(language,'accent')}<div className="colorChoices">{['#8ab4ff','#b58cff','#63d6a5','#ff9b71','#ff7aa8'].map(x=><button key={x} style={{background:x}} className={draft.color===x?'selected':''} onClick={()=>setDraft({...draft,color:x})}/>)}</div></label>
        <label>{tr(language,'density')}<select value={draft.density} onChange={e=>setDraft({...draft,density:e.target.value})}><option value="comfortable">Cómoda</option><option value="compact">Compacta</option><option value="spacious">Amplia</option></select></label>
        <label>{tr(language,'shape')}<select value={draft.radius} onChange={e=>setDraft({...draft,radius:e.target.value})}><option value="soft">Suave</option><option value="sharp">Precisa</option><option value="pill">Redondeada</option></select></label>
      </section>
      <section><h2>{t('language')}</h2><p>{t('languageDesc')}</p><select value={draft.language} onChange={e=>setDraft({...draft,language:e.target.value})}><option value="es">Español</option><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option></select></section>
      <button className="primary save" onClick={save}>{t('save')}</button>
    </div>
  </div>
}

function Creator({navigate,config}){
  const t=key=>tr(config.language,key)
  const [mode,setMode]=useState('html')
  const [domain,setDomain]=useState('miweb')
  const [code,setCode]=useState('<!doctype html>\\n<html>\\n<head><title>Mi web</title></head>\\n<body style="font-family:system-ui;padding:40px">\\n  <h1>Hola 👋</h1>\\n  <p>Mi primera web en dumbNavigator.</p>\\n</body>\\n</html>')
  const [backend,setBackend]=useState(false)
  const [backendCode,setBackendCode]=useState('export async function onRequest(context) {\\n  return new Response(JSON.stringify({ ok: true } ), {\\n    headers: { "content-type": "application/json" }\\n  })\\n}')
  const preview=rewrite(code)
  const publish=()=>{
    let h=domain.trim().toLowerCase().replace(/[^a-z0-9.-]/g,'')
    if(!h||RESERVED.includes(h)){alert('Elige otro nombre de web.');return}
    if(!h.includes('.'))h=h+'.dev'
    const sites=read('dumbSites',{})
    sites[h]={mode,html:code,backend:backend?backendCode:null}
    write('dumbSites',sites)
    navigate('dumb://'+h)
  }
  return <div className="creatorPro">
    <div className="creatorTop"><div><span className="eyebrow">DUMBNAVIGATOR CREATOR</span><h1>{t('createTitle')}</h1><p>{t('createIntro')}</p></div><button onClick={()=>navigate(DEFAULT_HOME)}>×</button></div>
    <div className="creatorModes"><button className={mode==='html'?'active':''} onClick={()=>setMode('html')}>HTML</button><button className={backend?'active':''} onClick={()=>setBackend(!backend)}>＋ Backend</button></div>
    <div className="creatorLayout">
      <section className="codePanel"><div className="panelHead"><b>{mode==='react'?'React / JSX':'HTML'}</b><span>editable</span></div><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/></section>
      <section className="livePanel"><div className="panelHead"><b>Vista previa</b><span>LIVE</span></div><iframe className="preview" srcDoc={preview} title="Vista previa" sandbox="allow-scripts allow-forms"/></section>
    </div>
    {backend&&<section className="backendPanel"><div className="panelHead"><b>Backend</b><span>{t('localBackend')}</span></div><textarea value={backendCode} onChange={e=>setBackendCode(e.target.value)} spellCheck="false"/><p>{t('localBackendDesc')}</p></section>}
    <div className="publishBar"><input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="nombre-de-tu-web"/><span>.dev</span><button className="primary" onClick={publish}>{t('publish')} →</button></div>
  </div>
}
function BrowserPage({url,navigate,reloadToken,config}){
  const language=config.language||'es'
  const [html,setHtml]=useState('')
  useEffect(()=>{
    const h=domainFromUrl(url)
    const site=h?read('dumbSites',{})[h]:null
    if(site)setHtml(rewrite(site.html))
    else setHtml(`<main class="notFound"><span>404</span><h1>${tr(language,'notFound')}</h1><p>${tr(language,'notFoundDesc')}</p><button data-nav="dumb://home">${tr(language,'backHome')}</button></main>`)
  },[url,reloadToken,language])
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
  const [tabs,setTabs]=useState(()=>[{url:DEFAULT_HOME,title:tr(read('dumbSetup',{}).language||'es','newTab')||'Nueva pestaña',history:[DEFAULT_HOME],index:0}])
  const [active,setActive]=useState(0),[menu,setMenu]=useState(false),[address,setAddress]=useState(DEFAULT_HOME),[reloadToken,setReloadToken]=useState(0),[settingsOpen,setSettingsOpen]=useState(false)
  const current=tabs[active]||tabs[0]
  useEffect(()=>{setAddress(current?.url||DEFAULT_HOME)},[current?.url])
  if(!config)return <Setup onDone={setConfig}/>
  const navigate=url=>{const u=normalize(url);setTabs(ts=>ts.map((t,i)=>i===active?{...t,url:u,title:titleFor(u),history:[...t.history.slice(0,t.index+1),...(t.url===u?[]:[u])],index:t.url===u?t.index:t.index+1}:t));setAddress(u);setMenu(false);const h=read('dumbHistory',[]).filter(x=>x!==u);h.push(u);write('dumbHistory',h.slice(-200))}
  const back=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index>0?{...t,index:t.index-1,url:t.history[t.index-1],title:titleFor(t.history[t.index-1])}:t))
  const forward=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index<t.history.length-1?{...t,index:t.index+1,url:t.history[t.index+1],title:titleFor(t.history[t.index+1])}:t))
  const newTab=()=>{setTabs(ts=>[...ts,{url:DEFAULT_HOME,title:tr(config.language,'newTab')||'Nueva pestaña',history:[DEFAULT_HOME],index:0}]);setActive(tabs.length)}
  const close=i=>{if(tabs.length===1)return;setTabs(ts=>ts.filter((_,n)=>n!==i));setActive(a=>i<a?a-1:Math.min(a,tabs.length-2))}
  const bookmarks=read('dumbBookmarks',[]),bookmarked=bookmarks.some(x=>x.url===current.url)
  const content=current.url===DEFAULT_HOME?<Home navigate={navigate} openSettings={()=>setSettingsOpen(true)} config={config}/>:current.url===CREATE?<Creator navigate={navigate} config={config}/>:current.url==='dumb://bookmarks'?<div className="listPage"><h1>{tr(config.language,'bookmarks')}</h1>{bookmarks.length?bookmarks.map(x=><button key={x.url} onClick={()=>navigate(x.url)}>{x.title||x.url}<span>→</span></button>):<p>{tr(config.language,'noBookmarks')}</p>}</div>:current.url==='dumb://history'?<div className="listPage"><h1>{tr(config.language,'history')}</h1>{read('dumbHistory',[]).slice().reverse().map(x=><button key={x} onClick={()=>navigate(x)}>{x}<span>→</span></button>)}</div>:<BrowserPage url={current.url} navigate={navigate} reloadToken={reloadToken} config={config}/>
  return <div className={'app '+(config.style||'solid')+' density-'+(config.density||'comfortable')+' radius-'+(config.radius||'soft')+' bg-'+(config.background||'aurora')} style={{'--accent':config?.color||'#63d6a5'}}>
    <div className="tabs">{tabs.map((t,i)=><div className={'tab '+(i===active?'active':'')} key={i} onClick={()=>setActive(i)}><span>{t.title}</span><button onClick={e=>{e.stopPropagation();close(i)}}>×</button></div>)}<button className="newtab" onClick={newTab}>＋</button></div>
    <div className="toolbar"><div className="actions"><button className="icon" disabled={!current.index} onClick={back}>←</button><button className="icon" disabled={current.index>=current.history.length-1} onClick={forward}>→</button><button className="icon" onClick={()=>navigate(DEFAULT_HOME)}>⌂</button><button className="icon" onClick={()=>setReloadToken(x=>x+1)}>↻</button></div><form className="address" onSubmit={e=>{e.preventDefault();navigate(address)}}><span>⌕</span><input value={address} onChange={e=>setAddress(e.target.value)} spellCheck="false"/></form><div className="actions"><button className="icon" onClick={()=>{const a=read('dumbBookmarks',[]);const i=a.findIndex(x=>x.url===current.url);i>=0?a.splice(i,1):a.push({url:current.url,title:current.title});write('dumbBookmarks',a);setReloadToken(x=>x+1)}}>{bookmarked?'★':'☆'}</button><button className="icon" onClick={()=>setMenu(!menu)}>☰</button></div></div>
    <main className="main">{content}{settingsOpen&&<div className="settingsOverlay"><SettingsPage config={config} setConfig={setConfig} onClose={()=>setSettingsOpen(false)}/></div>}{menu&&<div className="panel"><h2>dumbNavigator</h2><button onClick={()=>navigate('dumb://bookmarks')}>☆ {tr(config.language,'bookmarks')}</button><button onClick={()=>navigate('dumb://history')}>◷ {tr(config.language,'history')}</button><button onClick={()=>navigate('dumb://create')}>✦ {tr(config.language,'create')}</button><button onClick={()=>{setSettingsOpen(true);setMenu(false)}}>⚙ {tr(config.language,'settings')}</button><button onClick={()=>{localStorage.removeItem('dumbHistory');setMenu(false)}}>⌫ {tr(config.language,'clearHistory')}</button></div>}</main>
  </div>
}

const root=document.getElementById('root')
if(root)createRoot(root).render(<AppErrorBoundary><App/></AppErrorBoundary>)
