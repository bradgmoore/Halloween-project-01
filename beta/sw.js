importScripts('./cache-config.js?v=3.2.0');
const SHELL_CACHE=APP_CACHE_PREFIX+'shell-beta-v5';
const ASSETS=['./','./index.html','./style.css?v=3.2.0','./app.js?v=3.2.0','./beta-tools.js?v=3.2.0','./tester-guide.html','./iphone-audio.js?v=3.2.0','./microphone.js?v=3.2.0','./cache-config.js?v=3.2.0','./voice-effects.js?v=3.2.0','./voice-processor.js','./manifest.webmanifest','./icon.svg','./assets/ring-for-candy.png','./assets/speaker-check.wav','./audio/CREDITS.md','../audio/imported/halloween/CREDITS.md'];
const LIBRARY_URL=new URL('./library.json',self.location.href);
const PUBLISHED_AUDIO_PATH=new URL('../audio/imported/halloween/',self.location.href).pathname;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch(new Request(LIBRARY_URL.href,{cache:'no-store'}));
 if(!response.ok)throw Error('Published audio catalogue could not load.');
 const catalog=await response.clone().json();
 if(!Array.isArray(catalog.clips)||!catalog.clips.length)throw Error('Published audio catalogue is empty or invalid.');
 const audioURLs=catalog.clips.map(clip=>{
  if(typeof clip?.url!=='string'||!clip.url.trim())throw Error('Published audio catalogue has an invalid URL.');
  const url=new URL(clip.url,LIBRARY_URL);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(PUBLISHED_AUDIO_PATH)||!url.pathname.endsWith('.mp3'))throw Error('Published audio must be local Halloween MP3s.');
  return url.href;
 });
 const shell=await caches.open(SHELL_CACHE);
 await shell.addAll(ASSETS);
 await shell.put(LIBRARY_URL.href,response);
 const media=await caches.open(APP_MEDIA_CACHE);
 await media.addAll([...new Set(audioURLs)].map(url=>new Request(url,{cache:'reload'})));
})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const media=await caches.open(APP_MEDIA_CACHE),scope=new URL('./',self.location.href).pathname;
 for(const key of await caches.keys()){
  if(/^the-well-v[1-5]$/.test(key)){const old=await caches.open(key);for(const request of await old.keys()){const url=new URL(request.url);if(url.pathname.startsWith(scope+'audio/')&&url.pathname.endsWith('.mp3')){const response=await old.match(request);if(response?.status===200&&!await media.match(url.href))try{await media.put(url.href,response)}catch{}}}}
  if(key.startsWith(APP_CACHE_PREFIX+'shell-')&&key!==SHELL_CACHE)await caches.delete(key);
 }
 await self.clients.claim();
})()));
async function audioResponse(request){
  const cache=await caches.open(APP_MEDIA_CACHE);
  const headers=new Headers(request.headers);headers.delete('range');
  const fullRequest=new Request(request,{headers});
  let response=await cache.match(fullRequest)||await (await caches.open(SHELL_CACHE)).match(fullRequest);
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
  if((url.pathname.includes('/audio/')&&url.pathname.endsWith('.mp3'))||url.pathname.endsWith('/assets/speaker-check.wav')){
    event.respondWith(audioResponse(request).catch(()=>new Response('Audio is not cached. Reconnect to play this clip.',{status:503})));return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    try{const response=await fetch(request);if(response.status===200)try{await cache.put(request,response.clone())}catch{}return response}
    catch{return await cache.match(request)||(request.mode==='navigate'?await cache.match(new URL('./index.html',self.location.href).href):null)||new Response('Offline content unavailable.',{status:503})}
  })());
});
