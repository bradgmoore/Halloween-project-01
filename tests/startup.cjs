const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const base=(process.env.WELL_TEST_URL||'http://127.0.0.1:8000').replace(/\/$/,'');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'library.json')));
const audio=fs.readFileSync(path.resolve(root,catalog.clips[0].url));
const bytes=audio.toString('base64'),hash=crypto.createHash('sha256').update(audio).digest('hex');
const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  // Both optional browser systems stall forever; the real 24 tracks still load.
  for(const suffix of ['/','/beta/','/soundboard.html?v=3.3.0','/beta/soundboard.html?v=3.3.0']){
   const context=await browser.newContext({serviceWorkers:'block'});
   await context.addInitScript(()=>{indexedDB.open=()=>({});navigator.serviceWorker.register=()=>new Promise(()=>{})});
   const page=await context.newPage();
   await page.route('**/library.json*',route=>route.fulfill({json:{clips:[]}}));
   await page.goto(base+suffix);
   await page.waitForFunction(()=>document.querySelectorAll('.library-play').length===24);
   assert.equal(await page.locator('#pad-grid .pad').count(),26);
   assert.deepEqual(await page.locator('.clip-title').allTextContents(),catalog.clips.map(c=>c.title));
   await page.getByRole('button',{name:'Play '+catalog.clips[0].title,exact:true}).click();
   await page.waitForFunction(()=>[...active].some(item=>item.audio.currentTime>.05));
   await page.locator('#stop').click();
   await context.close();
  }
  // Recover an existing stale worker and retain custom recordings/cache data.
  const context=await browser.newContext(),page=await context.newPage();
  await page.goto(base+'/blank.html');
  await page.evaluate(async({bytes})=>{
   const blob=new Blob([Uint8Array.from(atob(bytes),c=>c.charCodeAt(0))],{type:'audio/mpeg'});
   await new Promise((resolve,reject)=>{const request=indexedDB.open('the-well',2);request.onupgradeneeded=()=>{for(const name of ['clips','library_media'])if(!request.result.objectStoreNames.contains(name))request.result.createObjectStore(name)};request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('clips','readwrite');for(const index of [0,1,2,11])tx.objectStore('clips').put({name:'Saved '+index,blob},index);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)}});
   const unrelated=await caches.open('unrelated-app-cache');await unrelated.put('/keep-this',new Response('keep'));
   await navigator.serviceWorker.register('./legacy-empty-sw.js');await navigator.serviceWorker.ready;
  },{bytes});
  await page.goto(base+'/');assert.equal(await page.locator('#pad-grid button').count(),2);
  await page.goto(base+'/soundboard.html?v=3.3.0');
  await page.waitForFunction(()=>db&&clips[0]?.name==='Saved 0'&&document.querySelectorAll('.library-play').length===24);
  assert.equal(await page.locator('#pad-grid .pad').count(),26);
  await page.goto(base+'/update.html?v=3.3.0');
  await page.waitForURL('**/?updated=3.3.0',{timeout:60000});
  await page.waitForFunction(()=>db&&clips[0]?.name==='Saved 0'&&document.querySelectorAll('.library-play').length===24);
  assert.equal(await page.locator('#pad-grid .pad').count(),26);
  assert.deepEqual(await page.locator('[data-custom-index] > span').allTextContents(),['Saved 0','Saved 1']);
  const saved=await page.evaluate(async()=>{const rows=await new Promise((resolve,reject)=>{const r=db.transaction('clips').objectStore('clips').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return Promise.all(rows.map(async row=>({name:row.name,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await row.blob.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join('')})))});
  assert.deepEqual(saved.map(row=>row.name),['Saved 0','Saved 1','Saved 2','Saved 11']);assert(saved.every(row=>row.hash===hash));
  assert.equal(await page.evaluate(async()=>await(await(await caches.open('unrelated-app-cache')).match('/keep-this')).text()),'keep');
  await context.close();
  console.log('PASS: all 24 bundled tracks appear and play despite stalled storage/service-worker setup and an empty network catalogue; stale two-button install upgrades in place, preserving all seeded recording bytes and unrelated caches.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
