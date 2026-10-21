// Offline-Cache: App-Dateien zwischenspeichern, Netz zuerst versuchen
const CACHE="schiessbuch-v2";
const FILES=["./","schiessbuch.html","supabase.js","config.js","supa-db.js","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))); });
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  // Nur eigene Dateien und Schriften cachen, Datenbank-Anfragen nie
  if(e.request.method!=="GET"||/supabase\.co$/.test(u.hostname)) return;
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)); } return r; }).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
