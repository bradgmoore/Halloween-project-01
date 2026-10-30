const http=require('http'),fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg','.wav':'audio/wav','.txt':'text/plain','.md':'text/plain'};
const server=http.createServer((request,response)=>{
 const pathname=decodeURIComponent(new URL(request.url,'http://local').pathname);if(pathname==='/blank.html'){response.writeHead(200,{'content-type':'text/html'});return response.end('<!doctype html><title>Cache migration fixture</title>')}
 const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(root+path.sep)||file.includes('/.git/')){response.writeHead(403);return response.end()}
 fs.readFile(file,(error,body)=>{if(error){response.writeHead(404);response.end()}else{response.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-cache'});response.end(body)}})
});
server.listen(0,'127.0.0.1',()=>{
 const scripts=['published-assets.cjs','published-playback.cjs','catalog.cjs','playback.cjs','e2e.cjs','beta.cjs'];
 function next(){const script=scripts.shift();if(!script)return server.close(()=>process.exit(0));const child=spawn(process.execPath,[path.join(__dirname,script)],{stdio:'inherit',env:{...process.env,WELL_TEST_URL:`http://127.0.0.1:${server.address().port}`}});child.on('exit',code=>{if(code)server.close(()=>process.exit(code));else next()});child.on('error',error=>{console.error(error);server.close(()=>process.exit(1))})}
 next();
});
