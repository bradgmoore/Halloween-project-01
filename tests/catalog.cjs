const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
const base=process.env.WELL_TEST_URL,wav=require('./audio-fixture.cjs');
// Test-only entries use our original test tone. No provider audio is claimed here.
const clips=[
 {id:'fx-1',kind:'effects',title:'Test effect one',url:'./assets/speaker-check.wav'},
 {id:'fx-2',kind:'effects',title:'Test effect two',url:'./assets/speaker-check.wav'},
 {id:'fx-3',kind:'effects',title:'Test effect three',url:'./assets/speaker-check.wav'},
 {id:'music-1',kind:'music',title:'Test music one',url:'./assets/speaker-check.wav'},
 {id:'music-2',kind:'music',title:'Test music two',url:'./assets/speaker-check.wav'}
];
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});try{
 for(const suffix of ['/','/beta/']){
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/library.json',route=>route.fulfill({json:{clips}}));await page.goto(base+suffix);await page.waitForFunction(()=>document.querySelectorAll('#pad-grid .pad').length===7&&db);
  await page.evaluate(async bytes=>{for(const [index,name] of [[0,'My first custom'],[1,'My second custom'],[2,'Old third custom'],[11,'Old twelfth custom']])await persist(index,{name,blob:new Blob([new Uint8Array(bytes)],{type:'audio/wav'})})},Array.from(wav));
  assert.deepEqual(await page.locator('[data-custom-index] span').allTextContents(),['My first custom','My second custom']);assert.equal(await page.locator('#target option').count(),2);assert.equal(await page.locator('#studio #audio-import').count(),1);assert.equal(await page.locator('[data-tab=library]').count(),0);assert.equal(await page.locator('a[href^="http"]').count(),0);
  assert.equal(await page.locator('#pads .library-play').count(),5);assert.equal(await page.locator('#pads').isVisible(),true);assert(!(await page.locator('#pad-grid').textContent()).includes('Old third custom'));
  for(const clip of clips){
   const button=page.getByRole('button',{name:`Play ${clip.title}`,exact:true});await button.click();await page.waitForFunction(title=>document.querySelector('#library-playing').textContent===`Playing: ${title}`,clip.title);await page.waitForFunction(()=>[...active][0]?.audio.currentTime>0);
   assert.equal(await page.evaluate(()=>[...active][0].audio.loop),clip.kind==='music');assert.equal(await button.getAttribute('aria-pressed'),'true');await button.click();assert.equal(await page.evaluate(()=>active.size),0);assert.equal(await button.getAttribute('aria-pressed'),'false');
  }
  assert.equal(context.pages().length,1);assert.equal(page.url(),base+suffix);assert.equal(await page.getByRole('button',{name:'Remove',exact:true}).count(),0);
  await page.locator('#library-search').fill('effect two');assert.equal(await page.locator('.pad').count(),3);assert.equal(await page.locator('[data-custom-index]').count(),2);await page.locator('#library-search').fill('');
  await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.pad').length===7&&db);assert.deepEqual(await page.locator('[data-custom-index] span').allTextContents(),['My first custom','My second custom']);assert.equal(await page.evaluate(()=>clips[2].name),'Old third custom');assert.equal(await page.evaluate(()=>clips[11].name),'Old twelfth custom');assert.deepEqual(await page.evaluate(async()=>Array.from(new Uint8Array(await clips[1].blob.arrayBuffer()))),Array.from(wav));
  await page.locator('#party-mode').click();assert(await page.locator('#pads').isVisible());assert(await page.locator('[data-tab=studio]').isHidden());assert.equal(await page.locator('.pad').count(),7);
  for(const width of [390,430,800]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  if(process.env.WELL_CATALOG_SCREENSHOT&&suffix==='/')await page.screenshot({path:process.env.WELL_CATALOG_SCREENSHOT});assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({serviceWorkers:'block'});await context.addInitScript(()=>{indexedDB.open=()=>{throw Error('Storage unavailable')}});const page=await context.newPage();await page.route('**/library.json',route=>route.fulfill({json:{clips}}));await page.goto(base);await page.waitForFunction(()=>document.querySelectorAll('.library-play').length===5);await page.getByRole('button',{name:'Play Test effect one',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#library-playing').textContent==='Playing: Test effect one');await page.locator('#stop').click();await context.close();
 console.log('PASS: first two custom sounds retained byte-for-byte; other ten hidden with data preserved; every catalogue track is a Soundpad Play button; no external links/navigation; playback/toggle/loop/search/party/mobile layout and storage-independent playback. Catalogue entries here are test fixtures, not provider imports.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
