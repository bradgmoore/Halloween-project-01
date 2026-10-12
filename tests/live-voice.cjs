// Run against a locally served app with Playwright and Chromium installed.
const {chromium}=require('playwright');
const fs=require('fs'),os=require('os'),path=require('path');
const fixtureDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'well-voice-'));
const fixture=path.join(fixtureDirectory,'input.wav');
const wav=Buffer.alloc(44+48000*2*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(96000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);for(let i=0;i<48000*2;i++)wav.writeInt16LE(Math.round(8000*Math.sin(2*Math.PI*220*i/48000)),44+i*2);fs.writeFileSync(fixture,wav);
process.on('exit',()=>fs.rmSync(fixtureDirectory,{recursive:true,force:true}));
const baseURL=process.env.WELL_TEST_URL||'http://localhost:8020';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream',`--use-file-for-fake-audio-capture=${fixture}`]});
 const context=await browser.newContext();
 await context.addInitScript(()=>{
  const media=navigator.mediaDevices,enumerate=media.enumerateDevices.bind(media),getMedia=media.getUserMedia.bind(media);
  window.micRequests=[];window.testStreams=[];window.reportWrongMic=false;window.noInternalMic=false;window.deferMic=false;window.pendingMic=null;
  media.enumerateDevices=async()=>{const all=await enumerate();return all.map(device=>device.kind==='audioinput'?{deviceId:device.deviceId,kind:device.kind,groupId:device.groupId,label:window.noInternalMic?'Bluetooth headset':`Built-in microphone (${device.label})`}:device).concat([{deviceId:'bluetooth-test',kind:'audioinput',groupId:'bt',label:'Bluetooth headset'}])};
  media.getUserMedia=async constraints=>{window.micRequests.push(constraints);const stream=await getMedia(constraints);window.testStreams.push(stream);if(window.reportWrongMic&&constraints.audio?.deviceId){const track=stream.getAudioTracks()[0],settings=track.getSettings.bind(track);track.getSettings=()=>({...settings(),deviceId:'wrong-device'})}if(window.deferMic&&constraints.audio?.deviceId)await new Promise(resolve=>window.pendingMic=resolve);return stream};
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseURL);await page.locator('[data-tab=live]').click();await page.locator('#detect-mic').click();await page.waitForFunction(()=>document.querySelector('#mic-device').value!==''&&!document.querySelector('#detect-mic').disabled);
 if(!await page.locator('#mic-device option[value="bluetooth-test"]').evaluate(option=>option.disabled))throw Error('External mic not excluded');
 const selected=await page.locator('#mic-device').inputValue();await page.locator('#talk').click();await page.waitForFunction(()=>document.querySelector('#mic-status').textContent.startsWith('Active input:'));
 const exact=await page.evaluate(()=>micRequests.at(-1).audio.deviceId.exact);if(exact!==selected)throw Error('Wrong requested mic');await page.waitForFunction(()=>document.querySelector('#mic-meter').value>0);
 for(const name of ['Witch','Zombie','Ghoul','Demon','Ghost','Natural']){const preset=page.getByRole('button',{name,exact:true});await preset.click();if(await preset.getAttribute('aria-pressed')!=='true')throw Error('Preset selection failed')}
 await page.locator('#gain').fill('0.5');await page.locator('#end-talk').click();if(!await page.evaluate(()=>testStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))))throw Error('Leaked capture track');
 await page.locator('#talk').click();await page.waitForFunction(()=>document.querySelector('#mic-status').textContent.startsWith('Active input:'));await page.locator('#stop').click();if(!await page.evaluate(()=>testStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))))throw Error('Global stop leaked microphone');
 await page.evaluate(()=>window.reportWrongMic=true);await page.locator('#talk').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('did not confirm'));if(!await page.locator('#end-talk').isDisabled())throw Error('Mismatched mic not stopped');await page.evaluate(()=>window.reportWrongMic=false);
 await page.evaluate(()=>window.deferMic=true);await page.locator('#talk').click();await page.waitForFunction(()=>!!window.pendingMic);await page.locator('#stop').click();await page.evaluate(()=>{pendingMic();window.deferMic=false});await page.waitForFunction(()=>testStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));if(!await page.locator('#end-talk').isDisabled())throw Error('Cancelled mic startup continued');
 await page.evaluate(()=>{window.noInternalMic=true;document.querySelector('#mic-device').value='';localStorage.removeItem('well-device-mic')});await page.locator('#talk').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('No built-in microphone identified'));if(!await page.evaluate(()=>testStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))))throw Error('Detection track leaked');
 const dsp=await page.evaluate(async()=>{
  const results={};
  for(const name of Object.keys(VOICE_PRESETS)){
   const context=new OfflineAudioContext(1,48000,48000);await VoiceEffects.prepare(context);const source=context.createOscillator();source.frequency.value=220;const effects=new VoiceEffects(context,source,context.destination,.3);effects.setPreset(name);source.start();source.stop(.9);const rendered=await context.startRendering();const x=rendered.getChannelData(0);let power=0;for(let i=10000;i<40000;i++)power+=x[i]*x[i];results[name]={rms:Math.sqrt(power/30000),samples:Array.from(x.slice(12000,12200))};effects.destroy();
  }
  for(const [name,result] of Object.entries(results)){if(!Number.isFinite(result.rms)||result.rms<.001||result.rms>.8)throw Error('Invalid DSP output '+name);if(name!=='natural'){let difference=0;for(let i=0;i<result.samples.length;i++)difference+=Math.abs(result.samples[i]-results.natural.samples[i]);if(difference<.1)throw Error('Preset has no effect '+name)}}
  return Object.fromEntries(Object.entries(results).map(([name,r])=>[name,r.rms]));
 });
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: explicit microphone request, Bluetooth exclusion, actual input validation, moving meter, six active presets, output gain, track cleanup, cancelled startup, refusal without device mic, non-silent/distinct DSP for all presets.');console.log(dsp);
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
