const DB_NAME='dumbNavigatorDB'
const DB_VERSION=2
const STORE='projects'
function openDB(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION)
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})}
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db)}
  req.onerror=()=>reject(req.error)
 })
}
export async function getProjects(){
 const db=await openDB()
 return new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)})
}
export async function putProject(project){
 const db=await openDB()
 return new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readwrite').objectStore(STORE).put(project);req.onsuccess=()=>resolve(project);req.onerror=()=>reject(req.error)})
}
export async function deleteProject(id){
 const db=await openDB()
 return new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readwrite').objectStore(STORE).delete(id);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error)})
}
