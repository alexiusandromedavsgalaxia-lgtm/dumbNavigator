import React,{useEffect,useMemo,useState} from 'react'
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
const normalize=input=>{let s=input.trim();if(!s)return HOME;if(!s.includes('://'))s='dumb://'+s;if(!s.startsWith('dumb://'))return s;try{const u=new URL(s);let h=u.hostname.toLowerCase();if(!h.includes('.'))h='uuu.'+h;return 'dumb://'+h+(u.pathname||'/')+(u.search||'')+(u.hash||'')}catch{return HOME}}
const rewrite=html=>html.replace(/href\s*=\s*["'](dumb:\/\/[^"']+)["']/gi,(_,u)=>'href="#" data-nav="'+u.replaceAll('"','&quot;')+'"')
const validDomain=value=>{let h=value.trim().toLowerCase();if(!h.includes('.'))h='uuu.'+h;if(!/^[a-z0-9.-]+$/.test(h)||h.length>253)return null;if(!/^(uuu|jit)\./.test(h))h='uuu.'+h;const bare=h.replace(/^(uuu|jit)\./,'');return RESERVED.some(x=>bare===x||bare.endsWith('.'+x))?null:h}

function Browser({url,navigate}){
 const [html,setHtml]=useState('')
 const [external,setExternal]=useState(false)
 useEffect(()=>{const h=host(url);let value=null
   if(h==='une.developeit.dev'||h==='uuu.une.developeit.dev'){const p=new URL(url).pathname.split('/').filter(Boolean)[0]||'home';value=PAGES[p]||null}
   else value=read('dumbSites',{})[h]?.html||null
   if(value){setExternal(false);setHtml(rewrite(value))}
   else if(/^https?:\/\//.test(url)){setExternal(true);setHtml('')}
   else {setExternal(false);setHtml('<main class="home"><h1>404</h1><p>No existe esta página en dumb://.</p></main>')}
 },[url])
 if(external)return <iframe className="page" src={url} title={url} referrerPolicy="no-referrer"/>
 return <iframe className="page" srcDoc={html} title={url} sandbox="allow-scripts allow-forms" onLoad={e=>{try{e.currentTarget.contentDocument.addEventListener('click',ev=>{const n=ev.target.closest('[data-nav]');if(n){ev.preventDefault();navigate(n.dataset.nav)}})}catch{}}}/>
}

function Creator({navigate}){
 const [domain,setDomain]=useState('')
 const [prefix,setPrefix]=useState('uuu')
 const [code,setCode]=useState('<!doctype html><html><body style="font-family:system-ui;padding:32px"><h1>hola 👋</h1><p>mi primera web.</p><button onclick="this.textContent=\'funciona ✓\'">probar</button></body></html>')
 const publish=()=>{const h=validDomain(prefix+'.'+domain);if(!h)return alert('dominio no válido o reservado');const sites=read('dumbSites',{});sites[h]={html:code};write('dumbSites',sites);navigate('dumb://'+h+'/')}
 return <div className="creator"><section className="editor"><header><b>crear una web</b><span>React + Vite</span></header><div className="creatorControls"><input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="miweb.com"/><select value={prefix} onChange={e=>setPrefix(e.target.value)}><option>uuu</option><option>jit</option></select><button onClick={publish}>publicar</button></div><textarea value={code} onChange={e=>setCode(e.target.value)}/></section><section className="previewWrap"><header><b>vista previa</b></header><iframe className="preview" srcDoc={rewrite(code)} title="preview" sandbox="allow-scripts allow-forms"/></section></div>
}

function Studio(){
 const base='<!doctype html><html><body style="font-family:system-ui;padding:30px"><h1>mi proyecto</h1><p>creado con dumbNavigator Studio.</p></body></html>'
 const [code,setCode]=useState(localStorage.dumbStudioDraft||base)
 return <div className="studio"><aside><h2>◆ Studio</h2><button onClick={()=>setCode(base)}>▣ página HTML</button><button onClick={()=>setCode(base.replace('</body>',"<button onclick=\"this.textContent='funciona ✓'\">probar</button></body>"))}>▣ mini app</button><button onClick={()=>{localStorage.dumbStudioDraft=code;alert('borrador guardado')}}>⬡ guardar</button><p>editor local · vista previa aislada</p></aside><section className="code"><textarea value={code} onChange={e=>setCode(e.target.value)}/></section><iframe srcDoc={rewrite(code)} title="studio preview" sandbox="allow-scripts allow-forms"/></div>
}

function Notes(){const [v,setV]=useState(localStorage.dumbNotes||'');return <div className="notes"><div className="noteHeader"><b>notas locales</b><button onClick={()=>{localStorage.dumbNotes=v;alert('guardado')}}>guardar</button></div><textarea value={v} onChange={e=>setV(e.target.value)} placeholder="escribe aquí..."/></div>}
function Calculator(){const [x,setX]=useState('');const keys=['7','8','9','/','4','5','6','*','1','2','3','-','0','.','%','+','(',')','C','='];const go=k=>{if(k==='C')return setX('');if(k==='='){try{if(!/^[0-9+*/().% -]+$/.test(x))throw Error();setX(String(Function('return '+x)()))}catch{setX('error')}return}setX(v=>v+k)};return <div className="calc"><div className="display">{x||'0'}</div><div className="keys">{keys.map(k=><button key={k} onClick={()=>go(k)}>{k}</button>)}</div></div>}

function App(){
 const [tabs,setTabs]=useState([{url:HOME,title:'Nueva pestaña',history:[HOME],index:0}])
 const [active,setActive]=useState(0)
 const [view,setView]=useState('browser')
 const [menu,setMenu]=useState(false)
 const [address,setAddress]=useState(HOME)
 const current=tabs[active]
 useEffect(()=>setAddress(current.url),[current.url])
 const navigate=url=>{const u=normalize(url);const path=(()=>{try{return new URL(u).pathname.replace(/^\\//,'').toLowerCase()}catch{return ''}})();if(path==='new'){setView('creator')}else if(path==='studio'){setView('studio')}else if(path==='notes'){setView('notes')}else if(path==='calculator'){setView('calc')}else{setView('browser')}setTabs(ts=>ts.map((t,i)=>i===active?{...t,url:u,history:[...t.history.slice(0,t.index+1),...(t.url===u?[]:[u])],index:t.url===u?t.index:t.index+1}:t));setAddress(u);setMenu(false);const h=read('dumbHistory',[]).filter(x=>x!==u);h.push(u);write('dumbHistory',h.slice(-100))}
 const back=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index>0?{...t,index:t.index-1,url:t.history[t.index-1]}:t))
 const forward=()=>setTabs(ts=>ts.map((t,i)=>i===active&&t.index<t.history.length-1?{...t,index:t.index+1,url:t.history[t.index+1]}:t))
 const newTab=()=>{setTabs(ts=>[...ts,{url:HOME,title:'Nueva pestaña',history:[HOME],index:0}]);setActive(tabs.length);setView('browser')}
 const close=i=>{if(tabs.length===1)return;setTabs(ts=>ts.filter((_,n)=>n!==i));setActive(a=>i<a?a-1:Math.min(a,tabs.length-2))}
 const bookmark=()=>{const a=read('dumbBookmarks',[]),i=a.findIndex(x=>x.url===current.url);if(i>=0)a.splice(i,1);else a.push({url:current.url,title:current.title});write('dumbBookmarks',a);setMenu(false)}
 const bookmarked=read('dumbBookmarks',[]).some(x=>x.url===current.url)
 const content=useMemo(()=>{if(view==='creator')return <Creator navigate={navigate}/>;if(view==='studio')return <Studio/>;if(view==='notes')return <Notes/>;if(view==='calc')return <Calculator/>;return <Browser url={current.url} navigate={navigate}/>},[view,current.url])
 return <div className="app">
   <div className="tabs">{tabs.map((t,i)=><div className={'tab '+(i===active?'active':'')} key={i} onClick={()=>{setActive(i);setView('browser')}}><span>{t.title}</span><button onClick={e=>{e.stopPropagation();close(i)}}>×</button></div>)}<button className="newtab" onClick={newTab}>＋</button></div>
   <div className="toolbar"><div className="actions"><button className="icon" disabled={!current.index} onClick={back}>←</button><button className="icon" disabled={current.index>=current.history.length-1} onClick={forward}>→</button><button className="icon" onClick={()=>navigate(HOME)}>⌂</button><button className="icon" onClick={()=>setView('browser')}>↻</button></div><form className="address" onSubmit={e=>{e.preventDefault();navigate(address)}}><span>⌕</span><input value={address} onChange={e=>setAddress(e.target.value)} spellCheck="false"/></form><div className="actions"><button className="icon" onClick={bookmark}>{bookmarked?'★':'☆'}</button><button className="icon" onClick={()=>setMenu(v=>!v)}>☰</button></div></div>
   <main className="main">{content}{menu&&<div className="panel"><h2>dumbNavigator</h2><div className="menuGrid"><button onClick={()=>alert(read('dumbBookmarks',[]).map(x=>x.url).join('\n')||'no tienes marcadores')}>★ marcadores</button><button onClick={()=>alert(read('dumbHistory',[]).slice().reverse().join('\n')||'historial vacío')}>◷ historial</button><button onClick={()=>{navigator.clipboard?.writeText(current.url);setMenu(false)}}>▣ copiar dirección</button><button onClick={()=>{localStorage.removeItem('dumbHistory');setMenu(false)}}>⌫ borrar historial</button><button onClick={newTab}>＋ nueva pestaña</button><button onClick={()=>{setView('creator');setMenu(false)}}>✦ crear una web</button><button onClick={()=>{setView('studio');setMenu(false)}}>▣ Studio</button><button onClick={()=>{setView('notes');setMenu(false)}}>✎ notas</button><button onClick={()=>{setView('calc');setMenu(false)}}>⌗ calculadora</button><button onClick={()=>{navigate('dumb://une.developeit.dev/about')}}>ⓘ acerca de</button></div></div>}</main>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>)
