// Test-only worker served by tests/run.cjs, never registered by the app.
const scope=new URL('./',self.location.href).pathname;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname===scope||url.pathname===scope+'index.html'){
    event.respondWith(Promise.resolve(new Response('<!doctype html><title>Old soundboard</title><p>Version 3.2.0</p><div id="pad-grid"><button>Saved one</button><button>Saved two</button></div>',{headers:{'content-type':'text/html'}})));
  }else if(url.pathname===scope+'library.json'){
    event.respondWith(Promise.resolve(new Response('{"clips":[]}',{headers:{'content-type':'application/json'}})));
  }
});
