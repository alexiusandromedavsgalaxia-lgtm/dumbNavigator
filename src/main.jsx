import React,{useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import './styles.css'

const HOME='dumb://une.developeit.dev/'
const RESERVED=['google.com','apple.com','microsoft.com','amazon.com','youtube.com','instagram.com','facebook.com','tiktok.com','spotify.com','github.com','cloudflare.com','openai.com','wikipedia.org','reddit.com','discord.com','whatsapp.com','roblox.com','minecraft.net','nintendo.com','playstation.com','xbox.com','netflix.com']

const PAGES={
  home:'<main class="home"><span class="badge">◆ dumbNavigator</span><h1>tu web.<br/>tu universo.</h1><p>Un navegador con su propio espacio web interno.</p><div class="grid"><section class="card"><h2>crear una web</h2><p>Diseña y publica HTML localmente.</p><button data-nav="dumb://une.developeit.dev/new">Crear mi web →</button></section><section class="card"><h2>offline-first</h2><p>Tus webs y preferencias se guardan en este navegador.</p></section></div></main>',
  about:'<main class="home"><span class="badge">dumbNavigator · React + Vite</span><h1>tu navegador dentro de dumb://</h1><p>Versión web del proyecto, reconstruida como aplicación React con Vite.</p><div class="grid"><section class="card"><h2>navegación</h2><p>Pestañas, historial, marcadores y páginas internas.</p></section><section class="card"><h2>creador</h2><p>Editor HTML con vista previa aislada.</p></section></div></main>',
  help:'<main class="home"><h1>ayuda</h1><p>Escribe <code>miweb.com</code> para crear una dirección dumb://uuu.miweb.com.</p><div class="grid"><section class="card"><h2>atajos</h2><p>← atrás · → adelante · ⌂ inicio · ↻ recargar · ☆ marcador · ☰ menú.</p></section></div></main>',
  docs:'<main class="home"><h1>dumb://</h1><p>Las direcciones internas usan los prefijos <code>uuu</code> y <code>jit</code>.</p></main>',
  gallery:'<main class="home"><h1>galería offline</h1><div class="grid"><section class="card"><h2>nebula</h2><p>vector local</p></section><section class="card"><h2>aurora</h2><p>vector local</p></section><section class="card"><h2>orbit</h2><p>vector local</p></section></div></main>'
}

const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)??'null')??d}catch{return d}}
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v))
const host=url=>{try{return new URL(url).hostname.toLowerCase()}catch{return ''}}
const titleFor=url=>{
  const h=host(url)
  if(url===HOME)return 'Nueva pestaña'
  if(h==='une.developeit.dev'||h==='uuu.une.developeit.dev'){
    const p=new URL(url).pathname.split('/').filter(Boolean)[0]||'home'
    return ({about:'Acerca de',help:'Ayuda',docs:'Documentación',gallery:'Galería',new:'Crear una web',home:'Nueva pestaña'})[p]||'dumbNavigator'
  }
  return h||'Nueva pestaña'
}
const normalize=input=>{
  let s=input.trim()
  if(!s)return HOME
  if(!s.includes('://'))s='dumb://'+s
  if(!s.startsWith('dumb://'))return s
  try{
    const u=new URL(s)
    let h=u.hostname.toLowerCase()
    if(!h.includes('.'))h='uuu.'+h
    return 'dumb://'+h+(u.pathname||'/')+(u.search||'')+(u.hash||'')
  }catch{return HOME}
}
const rewrite=html=>html.replace(/href\s*=\s*["'](dumb:\/\/[^"']+)["']/gi,(_,u)=>'href="#" data-nav="'+u.replaceAll('"','&quot;')+'"')
const validDomain=value=>{
  let h=value.trim().toLowerCase()
  if(!h.includes('.'))h='uuu.'+h
  if(!/^[a-z0-9.-]+$/.test(h)||h.length>253)return null
  if(!/^(uuu|jit)\./.test(h))h='uuu.'+h
  const bare=h.replace(/^(uuu|jit)\./,'')
  return RESERVED.some(x=>bare===x||bare.endsWith('.'+x))?null:h
}

function Creator({navigate}){
  const [domain,setDomain]=useState('')
  const [prefix,setPrefix]=useState('uuu')
  const [code,setCode]=useState('<!doctype html><html><body style="font-family:system-ui;padding:32px"><h1>hola 👋</h1><p>mi primera web.</p></body></html>')
  const publish=()=>{
    const h=validDomain(prefix+'.'+domain)
    if(!h){window.alert('dominio no válido o reservado');return}
    const sites=read('dumbSites',{})
    sites[h]={html:code}
    write('dumbSites',sites)
    navigate('dumb://'+h+'/')
  }
  return <div className="creator">
    <section className="editor">
      <header><b>crear una web</b><span>HTML local</span></header>
      <div className="creatorControls">
        <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="miweb.com"/>
        <select value={prefix} onChange={e=>setPrefix(e.target.value)}><option value="uuu">uuu</option><option value="jit">jit</option></select>
        <button onClick={publish}>publicar</button>
      </div>
      <textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/>
    </section>
    <section className="previewWrap">
      <header><b>vista previa</b></header>
      <iframe className="preview" srcDoc={rewrite(code)} title="preview" sandbox="allow-scripts allow-forms"/>
    </section>
  </div>
}

function Browser({url,navigate,reloadToken}){
  const [html,setHtml]=useState('')
  const [external,setExternal]=useState(false)

  useEffect(()=>{
    const h=host(url)
    let value=null
    if(h==='une.developeit.dev'||h==='uuu.une.developeit.dev'){
      const p=new URL(url).pathname.split('/').filter(Boolean)[0]||'home'
      if(p==='new'){setExternal(false);setHtml('');return}
      value=PAGES[p]||null
    }else{
      value=read('dumbSites',{})[h]?.html||null
    }
    if(value){setExternal(false);setHtml(rewrite(value))}
    else if(/^https?:\/\//.test(url)){setExternal(true);setHtml('')}
    else{setExternal(false);setHtml('<main class="home"><h1>404</h1><p>No existe esta página en dumb://.</p></main>')}
  },[url,reloadToken])

  if(host(url)==='une.developeit.dev'||host(url)==='uuu.une.developeit.dev'){
    const p=new URL(url).pathname.split('/').filter(Boolean)[0]||'home'
    if(p==='new')return <Creator navigate={navigate}/>
  }
  if(external)return <iframe className="page" src={url} title={url} referrerPolicy="no-referrer"/>
  return <iframe className="page" srcDoc={html} title={url} sandbox="allow-scripts allow-forms" onLoad={e=>{
    try{
      e.currentTarget.contentDocument?.addEventListener('click',ev=>{
        const n=ev.target.closest('[data-nav]')
        if(n){ev.preventDefault();navigate(n.dataset.nav)}
      })
    }catch{}
  }}/>
}

function App(){
  const [tabs,setTabs]=useState([{url:HOME,title:'Nueva pestaña',history:[HOME],index:0}])
  const [active,setActive]=useState(0)
  const [menu,setMenu]=useState(false)
  const [address,setAddress]=useState(HOME)
  const [reloadToken,setReloadToken]=useState(0)
  const current=tabs[active]

  useEffect(()=>setAddress(current.url),[current.url])

  const navigate=url=>{
    const u=normalize(url)
    setTabs(ts=>ts.map((t,i)=>i===active
      ? {...t,url:u,title:titleFor(u),history:[...t.history.slice(0,t.index+1),...(t.url===u?[]:[u])],index:t.url===u?t.index:t.index+1}
      : t))
    setAddress(u)
    setMenu(false)
    const h=read('dumbHistory',[]).filter(x=>x!==u)
    h.push(u)
    write('dumbHistory',h.slice(-100))
  }

  const back=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index>0
    ? {...t,index:t.index-1,url:t.history[t.index-1],title:titleFor(t.history[t.index-1])}:t))
  const forward=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index<t.history.length-1
    ? {...t,index:t.index+1,url:t.history[t.index+1],title:titleFor(t.history[t.index+1])}:t))
  const newTab=()=>{setTabs(ts=>[...ts,{url:HOME,title:'Nueva pestaña',history:[HOME],index:0}]);setActive(tabs.length)}
  const close=i=>{
    if(tabs.length===1)return
    setTabs(ts=>ts.filter((_,n)=>n!==i))
    setActive(a=>i<a?a-1:Math.min(a,tabs.length-2))
  }
  const bookmark=()=>{
    const a=read('dumbBookmarks',[])
    const i=a.findIndex(x=>x.url===current.url)
    if(i>=0)a.splice(i,1)
    else a.push({url:current.url,title:current.title})
    write('dumbBookmarks',a)
    setMenu(false)
  }
  const bookmarked=read('dumbBookmarks',[]).some(x=>x.url===current.url)

  return <div className="app">
    <div className="tabs">
      {tabs.map((t,i)=><div className={'tab '+(i===active?'active':'')} key={i} onClick={()=>setActive(i)}>
        <span>{t.title}</span>
        <button aria-label="Cerrar pestaña" onClick={e=>{e.stopPropagation();close(i)}}>×</button>
      </div>)}
      <button className="newtab" aria-label="Nueva pestaña" onClick={newTab}>＋</button>
    </div>
    <div className="toolbar">
      <div className="actions">
        <button className="icon" disabled={!current.index} onClick={back} aria-label="Atrás">←</button>
        <button className="icon" disabled={current.index>=current.history.length-1} onClick={forward} aria-label="Adelante">→</button>
        <button className="icon" onClick={()=>navigate(HOME)} aria-label="Inicio">⌂</button>
        <button className="icon" onClick={()=>setReloadToken(x=>x+1)} aria-label="Recargar">↻</button>
      </div>
      <form className="address" onSubmit={e=>{e.preventDefault();navigate(address)}}>
        <span>⌕</span>
        <input value={address} onChange={e=>setAddress(e.target.value)} spellCheck="false" aria-label="Dirección"/>
      </form>
      <div className="actions">
        <button className="icon" onClick={bookmark} aria-label="Marcador">{bookmarked?'★':'☆'}</button>
        <button className="icon" onClick={()=>setMenu(v=>!v)} aria-label="Menú">☰</button>
      </div>
    </div>
    <main className="main">
      <Browser url={current.url} navigate={navigate} reloadToken={reloadToken}/>
      {menu&&<div className="panel">
        <h2>dumbNavigator</h2>
        <div className="menuGrid">
          <button onClick={()=>window.alert(read('dumbBookmarks',[]).map(x=>x.url).join('\n')||'no tienes marcadores')}>★ marcadores</button>
          <button onClick={()=>window.alert(read('dumbHistory',[]).slice().reverse().join('\n')||'historial vacío')}>◷ historial</button>
          <button onClick={()=>{navigator.clipboard?.writeText(current.url);setMenu(false)}}>▣ copiar dirección</button>
          <button onClick={()=>{localStorage.removeItem('dumbHistory');setMenu(false)}}>⌫ borrar historial</button>
          <button onClick={()=>navigate('dumb://une.developeit.dev/new')}>✦ crear una web</button>
          <button onClick={()=>navigate('dumb://une.developeit.dev/about')}>ⓘ acerca de</button>
          <button onClick={()=>navigate('dumb://une.developeit.dev/help')}>❔ ayuda</button>
          <button onClick={()=>navigate('dumb://une.developeit.dev/docs')}>▤ documentación</button>
        </div>
      </div>}
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>)
