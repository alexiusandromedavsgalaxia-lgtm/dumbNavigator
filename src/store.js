const DB_NAME='dumbNavigatorDB'
const DB_VERSION=1
const STORE='projects'

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION)
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'})
    req.onsuccess=()=>resolve(req.result)
    req.onerror=()=>reject(req.error)
  })
}
export async function getProjects(){
  const db=await openDB()
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll()
    req.onsuccess=()=>resolve(req.result||[])
    req.onerror=()=>reject(req.error)
  })
}
export async function putProject(project){
  const db=await openDB()
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,'readwrite').objectStore(STORE).put(project)
    req.onsuccess=()=>resolve(project)
    req.onerror=()=>reject(req.error)
  })
}
export async function deleteProject(id){
  const db=await openDB()
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,'readwrite').objectStore(STORE).delete(id)
    req.onsuccess=()=>resolve()
    req.onerror=()=>reject(req.error)
  })
}
