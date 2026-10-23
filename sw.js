// Bump C on every release. App files load from cache first and refresh in the background.
const C='moose-v4-1',F=['./','./index.html','./css/style.css','./js/app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./logo.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!='GET'||new URL(r.url).origin!=location.origin)return;
e.respondWith((async()=>{const c=await caches.open(C),hit=await c.match(r,{ignoreSearch:true});
const net=fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}).catch(()=>null);
if(hit){e.waitUntil(net);return hit}
return (await net)||await c.match('./index.html')})())});
