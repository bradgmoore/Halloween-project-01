const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
const fixture=require('./audio-fixture.cjs'),base=process.env.WELL_TEST_URL;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});try{
 for(const suffix of ['/','/beta/']){
  const context=await browser.newContext();await context.addInitScript(()=>{
   window.micCalls=0;window.graphCalls=0;
   navigator.mediaDevices.getUserMedia=()=>{micCalls++;throw Error('No microphone available')};
   // Simulate failure of the old mandatory live-output route. Files must still play.
   for(const name of ['createMediaStreamDestination','createMediaElementSource'])AudioContext.prototype[name]=()=>{graphCalls++;throw Error('Live audio graph unavailable')};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+suffix);await page.waitForFunction(()=>typeof db!=='undefined'&&db);
  assert((await page.locator('.release-version').textContent()).includes('3.3.0'));
  await page.evaluate(async bytes=>persist(0,{name:'Existing saved sound',blob:new Blob([new Uint8Array(bytes)],{type:'audio/wav'})}),Array.from(fixture));
  await page.locator('.pad').first().click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing Existing saved sound.');
  await page.waitForFunction(()=>[...active][0]?.audio.currentTime>.05);
  // Measure file output, rather than only checking the play() promise or UI text.
  const energy=await page.evaluate(async()=>{
   const audio=[...active][0].audio,stream=audio.captureStream();
   if(!stream.getAudioTracks().length)await new Promise(resolve=>audio.addEventListener('playing',resolve,{once:true}));
   const chunks=[],recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>chunks.push(e.data);
   const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.start();await new Promise(resolve=>setTimeout(resolve,300));recorder.stop();await stopped;
   const c=new AudioContext(),buffer=await c.decodeAudioData(await new Blob(chunks,{type:recorder.mimeType}).arrayBuffer()),samples=buffer.getChannelData(0);await c.close();return Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);
  });assert(energy>.001,`silent native file output at ${suffix}`);
  await page.locator('#master-volume').evaluate(input=>{input.value=.25;input.dispatchEvent(new Event('input'))});assert.equal(await page.evaluate(()=>[...active][0].audio.volume),.25);
  await page.locator('#overlap').check();await page.locator('.pad').first().click();await page.locator('.pad').first().click();await page.waitForFunction(()=>active.size===3);await page.locator('#stop').click();assert.equal(await page.evaluate(()=>active.size),0);assert.equal(await page.locator('body > audio').count(),0);
  await page.locator('#quick-test-speaker').click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing speaker test sound.');await page.waitForFunction(()=>[...active][0]?.audio.currentTime>.05);await page.waitForFunction(()=>active.size===0);assert.equal(await page.locator('body > audio').count(),0);
  assert.deepEqual(await page.evaluate(()=>[micCalls,graphCalls]),[0,0],'file playback must not require microphone or live audio graph');
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof db!=='undefined'&&db);await page.locator('#quick-test-speaker').click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing speaker test sound.');await page.locator('#stop').click();
  const range=await page.evaluate(async()=>{const response=await fetch('./assets/speaker-check.wav',{headers:{Range:'bytes=0-31'}});return {status:response.status,length:(await response.arrayBuffer()).byteLength,range:response.headers.get('Content-Range')}});assert.equal(range.status,206);assert.equal(range.length,32);assert(range.range.startsWith('bytes 0-31/'));
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: live and beta saved sounds produce measured audio even when the mic/Web Audio output fails; native playback, overlap, volume, Stop cleanup, speaker test, offline playback and Safari-style audio range requests.');
}finally{await browser.close()}})().catch(require('./report-error.cjs'));
