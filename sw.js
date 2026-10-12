const CACHE='the-well-v5';
const ASSETS=['./','./index.html','./style.css','./app.js','./voice-effects.js','./voice-processor.js','./manifest.webmanifest','./icon.svg','./assets/ring-for-candy.png','./library.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
async function audioResponse(request){
  const cache=await caches.open(CACHE);
  const headers=new Headers(request.headers);headers.delete('range');
  const fullRequest=new Request(request,{headers});
  let response=await cache.match(fullRequest);
  if(!response){response=await fetch(fullRequest);if(response.status===200)try{await cache.put(fullRequest,response.clone())}catch{/* Playback still works if storage is full. */}}
  const range=request.headers.get('range');
  if(!range||response.status!==200)return response;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2]))return response;
  const blob=await response.blob(),size=blob.size;
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
  if(start>=size||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  const resultHeaders=new Headers(response.headers);
  resultHeaders.set('Content-Range',`bytes ${start}-${end}/${size}`);
  resultHeaders.set('Content-Length',String(end-start+1));resultHeaders.set('Accept-Ranges','bytes');
  return new Response(blob.slice(start,end+1,blob.type),{status:206,headers:resultHeaders});
}
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.includes('/audio/')&&url.pathname.endsWith('.mp3')){
    event.respondWith(audioResponse(request).catch(()=>new Response('Audio is not cached. Reconnect to play this clip.',{status:503})));return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{const response=await fetch(request);if(response.status===200)try{await cache.put(request,response.clone())}catch{}return response}
    catch{return await cache.match(request)||new Response('Offline content unavailable.',{status:503})}
  })());
});
