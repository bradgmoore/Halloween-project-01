'use strict';
const $=id=>document.getElementById(id);
const CUSTOM_PAD_COUNT=2;
const MAX_CLIP=25*1024*1024,MAX_RECORDING_MS=180000;
const names=['Ring for candy','The doorstep','A whisper','Footsteps','Static','Door creak','A warning','Heartbeat','Scratching','The visitor','Cold wind','Goodbye'];
const loadSetting=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const writeSetting=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
let clips=Array(12).fill(null),db,context,master,phoneOutput,pending,previewURL;
let audioRequest=0,micRequest=0,micSession=null,recording=null,held=false,voicePreset='natural';
let libraryEntries=[],libraryView='all',selectedCategory='All',playingLibraryId=null;
let favorites=new Set(loadSetting('candy-favorites',[])),recent=loadSetting('candy-recent',[]);
let sceneSettings=loadSetting('candy-scene',{id:'4-1',volume:.2}),ambient=null,ambientRequest=0,party=false,downloadController=null,downloadRequest=0,wakeLock=null;
const active=new Set();
function status(message){$('status').textContent=message}
function audioContext(){if(!context){context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=Number($('master-volume').value);phoneOutput=new PhoneAudioOutput(context);master.connect(phoneOutput.destination);phoneOutput.playbackMode();context.addEventListener('statechange',()=>{if(micSession&&context.state!=='running')status('iPhone audio was interrupted. Release, check Bluetooth output in Control Center, and hold again.')})}return context}
function savePreferences(){writeSetting('candy-favorites',[...favorites]);writeSetting('candy-recent',recent);writeSetting('candy-scene',sceneSettings);writeSetting('candy-master',Number($('master-volume').value))}
async function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('the-well',2);r.onupgradeneeded=()=>{for(const name of ['clips','library_media'])if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name)};r.onblocked=()=>status('Close other Ring for Candy tabs so saved audio can be upgraded safely.');r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)};r.onerror=()=>reject(r.error)})}
function transaction(operation){return new Promise((resolve,reject)=>{const tx=db.transaction('clips','readwrite');operation(tx.objectStore('clips'));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
async function persist(index,clip){if(!db)throw Error('Browser storage is unavailable.');await transaction(store=>clip?store.put(clip,index):store.delete(index));clips[index]=clip;renderPads()}
function action(id,fn){$(id).onclick=()=>{try{Promise.resolve(fn()).catch(e=>status(e.message))}catch(e){status(e.message)}}}
function tab(name){if(party&&name==='studio')return;releaseTalk();document.querySelectorAll('[data-tab]').forEach(button=>{const chosen=button.dataset.tab===name;button.setAttribute('aria-selected',String(chosen));$(button.dataset.tab).hidden=!chosen})}
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>tab(button.dataset.tab));
const microphone=new DeviceMicrophone($('mic-device'),message=>{$('mic-status').textContent=message});
function meterOff(){$('mic-meter').value=0;$('mic-level-text').textContent='Microphone off'}
function stopMicrophone({discard=false}={}){
  ++micRequest;held=false;microphone.cancel();$('talk').classList.remove('speaking');$('talk').textContent='Hold to talk';$('talk').setAttribute('aria-pressed','false');
  const session=micSession;micSession=null;
  if(session){clearInterval(session.meterTimer);session.source?.disconnect();session.effects?.destroy();session.stream.getTracks().forEach(t=>t.stop())}if(phoneOutput){phoneOutput.element.pause();phoneOutput.playbackMode()}
  if(recording){const take=recording;recording=null;take.discard=discard;clearTimeout(take.timer);if(take.recorder&&take.recorder.state!=='inactive')take.recorder.stop();else finishTake(take)}
  $('record').disabled=!db;$('finish').disabled=true;$('mic-device').disabled=false;$('detect-mic').disabled=false;meterOff();duckBackground();
}
function stopForeground(){++audioRequest;for(const item of [...active])item.stop();playingLibraryId=null;markPlaying();$('library-playing').textContent='Choose a sound below';duckBackground()}
function stopAll(){stopForeground();stopMicrophone();$('preview').pause();stopAmbient();status('All audio and microphones stopped.')}
action('stop',stopAll);action('library-stop',stopAll);
function duckBackground(){if(ambient){const duck=active.size>0||!!micSession;ambient.gain.gain.setTargetAtTime(Number($('scene-volume').value)*(duck ? .22 : 1),audioContext().currentTime,.08)}}
function markPlaying(){document.querySelectorAll('.library-play').forEach(button=>{const playing=[...active].some(item=>item.id===button.dataset.clipId);button.classList.toggle('playing',playing);button.setAttribute('aria-pressed',String(playing));button.querySelector('.play-symbol').textContent=playing?'■':'▶'})}
function fileAudio(url){
  // Keep file playback on the native media path. Do not wait for mic permission,
  // an AudioContext, or a second media element before calling play() on iOS.
  const audio=new Audio(url);audio.playsInline=true;audio.setAttribute('playsinline','');audio.setAttribute('webkit-playsinline','');audio.hidden=true;audio.volume=Number($('master-volume').value);document.body.append(audio);return audio;
}
function syncVolume(){const volume=Number($('master-volume').value);$('preview').volume=volume;for(const item of active)if(item.audio)item.audio.volume=volume;if(master)master.gain.setTargetAtTime(volume,context.currentTime,.03)}
async function playMedia(url,{title,index=null,id=null,overlap=false}={}){
  stopMicrophone();$('preview').pause();if(!overlap)stopForeground();const request=audioRequest;
  const audio=fileAudio(url);audio.loop=!!(id&&libraryEntries.find(clip=>clip.id===id)?.kind==='music'&&$('music-loop').checked);let stopped=false;
  const item={index,id,audio,stop:()=>{if(stopped)return;stopped=true;audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();audio.remove();active.delete(item);if(index!==null&&![...active].some(item=>item.index===index))$('pad-grid').children[index]?.classList.remove('playing');if(playingLibraryId===id){playingLibraryId=null;$('library-playing').textContent='Choose a sound below'}markPlaying();duckBackground();if(url.startsWith('blob:'))URL.revokeObjectURL(url)}};
  active.add(item);if(index!==null)$('pad-grid').children[index]?.classList.add('playing');if(id){playingLibraryId=id;$('library-playing').textContent=`Loading ${title}…`}markPlaying();duckBackground();audio.onended=item.stop;audio.onerror=()=>{item.stop();status('This audio file could not play. Try MP3, WAV or AAC.')};
  try{await audio.play();if(stopped)return;status(Number($('master-volume').value)===0?`Playing ${title}, but app volume is zero. Turn up the volume below.`:`Playing ${title}.`);if(id){$('library-playing').textContent=`Playing: ${title}`;recent=[id,...recent.filter(value=>value!==id)].slice(0,30);savePreferences();}}catch(e){item.stop();if(request===audioRequest)throw Error(e.name==='NotAllowedError'?'Playback was blocked. Tap the sound again to start it.':`Audio could not start: ${e.message}`)}
}
async function playPad(index){
  if(clips[index])return playMedia(URL.createObjectURL(clips[index].blob),{title:clips[index].name,index,overlap:$('overlap').checked});
  status('This button is empty. Add your own recording or upload in Record & assign.');
}
function renderPads(){
  const grid=$('pad-grid');grid.replaceChildren();
  names.slice(0,CUSTOM_PAD_COUNT).forEach((name,index)=>{
    const button=document.createElement('button');button.className='pad';button.dataset.customIndex=index;
    if([...active].some(item=>item.index===index))button.classList.add('playing');
    const number=document.createElement('small');number.textContent=`CUSTOM ${index+1} · ${clips[index]?'SAVED':'EMPTY'}`;
    const title=document.createElement('span');title.textContent=clips[index]?.name||name;button.append(number,title);button.onclick=()=>playPad(index).catch(e=>status(e.message));grid.append(button);
  });
  for(const clip of libraryList()){
    const button=document.createElement('button');button.className='pad library-play';button.dataset.clipId=clip.id;button.setAttribute('aria-label',`Play ${clip.title}`);
    const label=document.createElement('small'),symbol=document.createElement('span');symbol.className='play-symbol';symbol.textContent='▶';label.append(symbol,clip.kind==='music'?' MUSIC':' SOUND EFFECT');
    const title=document.createElement('span');title.className='clip-title';title.textContent=clip.title;button.append(label,title);
    button.onclick=()=>{const playing=[...active].filter(item=>item.id===clip.id);if(playing.length){playing.forEach(item=>item.stop());return}playMedia(clip.blob?URL.createObjectURL(clip.blob):clip.url,{title:clip.title,id:clip.id,overlap:$('overlap').checked}).catch(e=>status(e.message))};grid.append(button);
  }
  markPlaying();
}
names.slice(0,CUSTOM_PAD_COUNT).forEach((name,index)=>$('target').append(new Option(`${index+1} · ${name}`,index)));
$('target').onchange=()=>{$('clip-name').value=clips[Number($('target').value)]?.name||''};
function setPending(blob){if(blob.size>MAX_CLIP)throw Error('Clip exceeds 25 MB.');$('preview').pause();if(previewURL)URL.revokeObjectURL(previewURL);pending=blob;previewURL=URL.createObjectURL(blob);$('preview').src=previewURL;$('preview').hidden=false;$('save').disabled=!db;status('Preview your clip, then save it to a button.')}
async function validateAudio(blob){if(!blob.size||blob.size>MAX_CLIP)throw Error('Choose audio smaller than 25 MB.');try{const decoded=await audioContext().decodeAudioData(await blob.arrayBuffer());if(decoded.duration<=0)throw Error()}catch{throw Error('This file could not be decoded as audio. Try MP3, WAV or AAC.')}}
$('upload').onchange=async()=>{try{const file=$('upload').files[0];if(!file)return;await validateAudio(file);const inferred=/\.mp3$/i.test(file.name)?'audio/mpeg':/\.(m4a|aac)$/i.test(file.name)?'audio/mp4':'audio/wav';const type=file.type.startsWith('audio/')?file.type:inferred;setPending(new Blob([file],{type}));$('clip-name').value=file.name.replace(/\.[^.]+$/,'')}catch(e){status(e.message)}};
action('save',async()=>{if(!pending)return;await persist(Number($('target').value),{name:$('clip-name').value.trim()||'Untitled clip',blob:pending});status('Clip saved.')});
action('clear',async()=>{if(confirm('Clear this button?')){stopAll();await persist(Number($('target').value),null);status('Button reset.')}});
const descriptions={natural:'Natural: your voice without spooky effects.',witch:'Witch: higher pitch, sharp tone and a short echo.',zombie:'Zombie: lower pitch, muffled growl and rough distortion.',ghoul:'Ghoul: hollow metallic voice with a haunting echo.',demon:'Demon: deep pitch, distortion and a dark echo.',ghost:'Ghost: airy pitch, trembling tone and a longer echo.'};
for(const [name,preset] of Object.entries(VOICE_PRESETS)){
  $('record-voice').append(new Option(preset.label,name));const button=document.createElement('button');button.textContent=preset.label;button.dataset.voice=name;button.setAttribute('aria-pressed',String(name===voicePreset));button.onclick=()=>{if(held)stopMicrophone();voicePreset=name;document.querySelectorAll('[data-voice]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('voice-description').textContent=descriptions[name]};$('voice-presets').append(button);
}
$('mic-device').onchange=()=>{stopMicrophone();microphone.remember();$('mic-status').textContent=`Selected input: ${$('mic-device').selectedOptions[0].textContent}`};
action('detect-mic',async()=>{stopMicrophone();audioContext();phoneOutput.captureMode();$('detect-mic').disabled=true;try{await microphone.discover()}finally{phoneOutput?.playbackMode();$('detect-mic').disabled=false}});action('studio-mic',()=>tab('live'));
async function openMicrophone(request,preset,destination){
  const c=audioContext();phoneOutput.captureMode();await phoneOutput.resume();if(preset!=='natural')await VoiceEffects.prepare(c);if(request!==micRequest)return null;
  const stream=await microphone.acquire(()=>request===micRequest);if(!stream)return null;
  try{await phoneOutput.resume();if(request!==micRequest){stream.getTracks().forEach(t=>t.stop());return null}const source=c.createMediaStreamSource(stream),effects=preset==='natural'?new NaturalVoice(c,source,destination,Number($('gain').value)):new VoiceEffects(c,source,destination,Number($('gain').value));effects.setPreset(preset);const session={stream,source,effects};micSession=session;$('mic-device').disabled=true;stream.getAudioTracks()[0].onmute=()=>{if(micSession===session)$('mic-level-text').textContent='Microphone muted by iOS—release and try again.'};
    stream.getAudioTracks()[0].onended=()=>{if(micSession===session){stopMicrophone();status('Microphone disconnected. Check iPhone microphone permission.')}};
    const samples=new Float32Array(effects.meter.fftSize);session.meterTimer=setInterval(()=>{effects.meter.getFloatTimeDomainData(samples);const rms=Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);$('mic-meter').value=Math.min(1,rms*4);$('mic-level-text').textContent=rms>.008?'Mic receiving audio—check Bluetooth speaker output':'Listening—speak near the device mic'},100);duckBackground();return session;
  }catch(e){stream.getTracks().forEach(t=>t.stop());throw e}
}
async function startTalk(){
  if(held||recording)return;stopMicrophone();stopForeground();$('preview').pause();held=true;const request=++micRequest;$('talk').textContent='Keep holding—opening mic…';$('talk').classList.add('speaking');$('talk').setAttribute('aria-pressed','true');
  try{const session=await openMicrophone(request,voicePreset,(audioContext(),master));if(session&&held&&request===micRequest){$('talk').textContent='Speaking… release to mute';status(`Push to talk · ${VOICE_PRESETS[voicePreset].label} voice.`)}}catch(e){if(request===micRequest){stopMicrophone();status(e.message);$('mic-status').textContent=e.message}}
}
function releaseTalk(){if(held){stopMicrophone();status('Microphone closed. Hold to speak.')}}
$('talk').addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();$('talk').setPointerCapture(event.pointerId);startTalk()});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('talk').addEventListener(event,releaseTalk);
$('talk').addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();if(!event.repeat)startTalk()}});$('talk').addEventListener('keyup',event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();releaseTalk()}});$('talk').addEventListener('blur',releaseTalk);
window.addEventListener('blur',()=>{releaseTalk();if(recording)stopMicrophone()});
$('gain').oninput=()=>micSession?.effects.setLevel(Number($('gain').value));
$('master-volume').value=Math.max(0,Math.min(1,Number(loadSetting('candy-master',.7))));$('preview').volume=Number($('master-volume').value);$('master-volume').oninput=()=>{syncVolume();savePreferences()};
function testSpeaker(){return playMedia('./assets/speaker-check.wav',{title:'speaker test sound'})}
action('test-speaker',testSpeaker);action('quick-test-speaker',testSpeaker);
function finishTake(take){if(take.finished)return;take.finished=true;take.destination?.disconnect();take.destination?.stream.getTracks().forEach(track=>track.stop());if(!take.discard&&take.chunks.length){const blob=new Blob(take.chunks,{type:take.recorder.mimeType});try{setPending(blob);$('clip-name').value=take.name}catch(e){status(e.message)}}}
action('record',async()=>{
  if(recording||$('record').disabled)return;if(!window.MediaRecorder)throw Error('Recording needs a recent browser.');stopAll();const request=++micRequest;$('record').disabled=true;$('finish').disabled=false;
  const take={chunks:[],bytes:0,discard:false,name:`${$('record-voice').selectedOptions[0].textContent} voice`,request};recording=take;
  try{const c=audioContext();take.destination=c.createMediaStreamDestination();const session=await openMicrophone(request,$('record-voice').value,take.destination);if(!session||request!==micRequest)return;session.effects.setLevel(1);take.recorder=new MediaRecorder(take.destination.stream);take.recorder.ondataavailable=event=>{if(event.data.size){take.bytes+=event.data.size;if(take.bytes>MAX_CLIP){take.discard=true;if(recording===take)stopMicrophone({discard:true});status('Recording exceeded 25 MB and was discarded. Make a shorter take.')}else take.chunks.push(event.data)}};take.recorder.onstop=()=>finishTake(take);take.recorder.onerror=()=>{take.discard=true;if(recording===take)stopMicrophone({discard:true});status('Recording failed. Try again.')};take.recorder.start(500);take.timer=setTimeout(()=>{if(recording===take){stopMicrophone();status('Recording finished at the 3-minute limit.')}},MAX_RECORDING_MS);status(`Recording ${take.name} locally—no speaker output.`)}catch(e){if(request===micRequest){stopMicrophone({discard:true});throw e}}
});
action('finish',()=>{if(recording){stopMicrophone();status('Recording finished. Review the preview.')}});
navigator.mediaDevices?.addEventListener('devicechange',async()=>{if(!micSession)return;const session=micSession;try{const devices=await navigator.mediaDevices.enumerateDevices();if(micSession!==session)return;const track=session.stream.getAudioTracks()[0],id=track.getSettings().deviceId,inputs=devices.filter(device=>device.kind==='audioinput');if(track.readyState!=='live'||microphone.external.test(track.label)||(id&&inputs.length&&!inputs.some(device=>device.deviceId===id))){stopMicrophone();status('Microphone route changed. Reselect the iPhone mic and try again.')}}catch{if(micSession===session){$('mic-status').textContent='Microphone route details unavailable. Check the meter and speaker output.'}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMicrophone();$('preview').pause()}else if(party)requestWakeLock()});
let libraryKind='effects';
$('music-loop').onchange=()=>{for(const item of active)if(item.audio&&libraryEntries.find(clip=>clip.id===item.id)?.kind==='music')item.audio.loop=$('music-loop').checked};
function libraryList(){const query=$('library-search').value.trim().toLowerCase();return libraryEntries.filter(clip=>clip.title.toLowerCase().includes(query))}
function renderLibrary(){
  renderPads();const count=libraryEntries.length;$('library-state').textContent=`2 custom buttons · ${count} ${count===1?'audio track':'audio tracks'}`;
  $('soundboard-empty').hidden=libraryList().length>0;$('soundboard-empty').textContent=count?'No matching sounds.':'Halloween audio is not available yet.';
  $('music-loop-label').hidden=!libraryEntries.some(clip=>clip.kind==='music');$('library-add-label').textContent=libraryKind==='music'?'Add music files':'Add sound effect files';
}
$('library-search').oninput=renderLibrary;
$('library-kind').onchange=()=>{libraryKind=$('library-kind').value;renderLibrary()};
function libraryTransaction(operation){return new Promise((resolve,reject)=>{if(!db)return reject(Error('Browser storage is unavailable.'));const tx=db.transaction('library_media','readwrite');operation(tx.objectStore('library_media'));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
async function loadPublishedCatalog(){
  const response=await fetch('./library.json');if(!response.ok)throw Error('Published audio catalogue could not load.');
  const data=await response.json();if(!Array.isArray(data.clips))throw Error('Published audio catalogue is invalid.');
  const ids=new Set();return data.clips.map(clip=>{
    if(!clip||typeof clip.id!=='string'||!clip.id||ids.has(clip.id)||typeof clip.title!=='string'||!clip.title.trim()||!['effects','music'].includes(clip.kind)||typeof clip.url!=='string'||!clip.url.trim())throw Error('Published audio catalogue has an invalid track.');
    const url=new URL(clip.url,location.href);if(url.protocol!=='https:'&&url.origin!==location.origin)throw Error('Published audio requires a secure playback URL.');
    ids.add(clip.id);return {...clip,id:`published:${clip.id}`,url:url.href};
  });
}
async function loadCatalog(){
  const results=await Promise.allSettled([loadPublishedCatalog(),new Promise((resolve,reject)=>{if(!db)return resolve([]);const request=db.transaction('library_media').objectStore('library_media').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})]);
  libraryEntries=results.flatMap(result=>result.status==='fulfilled'?result.value:[]);renderLibrary();renderScenes();await offlineReadiness();
  const failure=results.find(result=>result.status==='rejected');if(failure)status(failure.reason.message);
}
$('library-upload').onchange=async()=>{const files=[...$('library-upload').files],kind=libraryKind;let added=0;try{for(const file of files){await validateAudio(file);const c=audioContext(),decoded=await c.decodeAudioData(await file.arrayBuffer());const type=file.type.startsWith('audio/')?file.type:/\.mp3$/i.test(file.name)?'audio/mpeg':/\.(m4a|aac)$/i.test(file.name)?'audio/mp4':'audio/wav';const clip={id:crypto.randomUUID(),title:file.name.replace(/\.[^.]+$/,''),kind,duration:decoded.duration,blob:new Blob([file],{type})};await libraryTransaction(store=>store.put(clip,clip.id));added++}status(`Added ${added} audio files. Saved privately on this device.`)}catch(e){status(`Added ${added} files. ${e.message}`)}finally{$('library-upload').value='';await loadCatalog()}};
action('builtin-library',loadCatalog);
function stopAmbient(){++ambientRequest;if(ambient){ambient.audio.pause();ambient.audio.removeAttribute('src');ambient.audio.load();ambient.source.disconnect();ambient.gain.disconnect();ambient=null}$('scene-status').textContent='No background playing'}
async function startAmbient(){stopMicrophone();$('preview').pause();stopAmbient();const request=ambientRequest,audioEpoch=audioRequest,c=audioContext();await phoneOutput.resume();if(request!==ambientRequest||audioEpoch!==audioRequest)return;const clip=libraryEntries.find(clip=>clip.id===$('scene-sound').value);if(!clip)throw Error('Choose a background sound.');const audio=new Audio(clip.blob?URL.createObjectURL(clip.blob):clip.url);audio.loop=true;const source=c.createMediaElementSource(audio),gain=c.createGain();source.connect(gain).connect(master);const scene={audio,source,gain};ambient=scene;duckBackground();audio.onerror=()=>{if(ambient===scene){stopAmbient();status('Background audio unavailable. Download it or reconnect.')}};try{await audio.play();if(ambient!==scene)return;$('scene-status').textContent=`Looping: ${clip.title}`;sceneSettings.id=clip.id;savePreferences()}catch(e){if(ambient===scene)stopAmbient();throw e}}
function renderScenes(){const previous=$('scene-sound').value||sceneSettings.id;$('scene-sound').replaceChildren();for(const clip of libraryEntries)$('scene-sound').append(new Option(`${clip.category} · ${clip.title}`,clip.id));$('scene-sound').value=libraryEntries.some(c=>c.id===previous)?previous:libraryEntries[0]?.id||'';$('scene-volume').value=Math.max(0,Math.min(.6,Number(sceneSettings.volume)||.2));$('scene-presets').replaceChildren();for(const scene of [{name:'Fog at the doorstep',id:'4-1'},{name:'Haunted radio',id:'5-1'},{name:'Midnight ritual',id:'6-1'}]){const button=document.createElement('button');button.textContent=scene.name;button.onclick=()=>{$('scene-sound').value=scene.id;startAmbient().catch(e=>status(e.message))};$('scene-presets').append(button)}}
$('scene-volume').oninput=()=>{sceneSettings.volume=Number($('scene-volume').value);savePreferences();duckBackground()};action('scene-start',startAmbient);action('scene-stop',()=>{++audioRequest;stopAmbient()});
async function requestWakeLock(){try{if(party&&navigator.wakeLock&&!document.hidden&&!wakeLock){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>wakeLock=null)}}catch{}}
function setParty(value){party=value;document.body.classList.toggle('party-mode',party);$('party-mode').textContent=party?'Owner controls':'Party mode';document.querySelector('[data-tab="studio"]').hidden=party;const url=new URL(location.href);if(party)url.searchParams.set('mode','party');else url.searchParams.delete('mode');history.replaceState(null,'',url);if(party){tab('pads');window.scrollTo(0,0);requestWakeLock()}else{wakeLock?.release();wakeLock=null}}
action('party-mode',()=>{stopAll();if(party&&!confirm('Leave guest mode and show owner editing controls?'))return;setParty(!party)});
async function mediaCache(){if(!('caches'in window))throw Error('Offline downloads require HTTPS and browser cache support.');return caches.open(APP_MEDIA_CACHE)}
async function offlineReadiness(){
 const note='Recordings and added files stay on this device.';
 try{
  const published=libraryEntries.filter(clip=>clip.id.startsWith('published:'));
  if(!published.length){$('offline-status').textContent=note;return}
  const cached=new Set((await(await mediaCache()).keys()).map(request=>request.url));
  const ready=published.filter(clip=>cached.has(new URL(clip.url,location.href).href)).length;
  $('offline-status').textContent=`${note} ${ready} of ${published.length} Halloween sounds ready offline.${ready<published.length?' Stay online while the app installs, then refresh this list.':''}`;
 }catch{$('offline-status').textContent=`${note} Offline sound availability could not be checked in this browser.`}
}

function blobData(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})}
async function setupFile(){const data={version:2,name:'Ring for Candy setup',clips:await Promise.all(clips.map(async clip=>clip?{name:clip.name,data:await blobData(clip.blob)}:null)),favorites:[...favorites],recent,scene:sceneSettings,masterVolume:Number($('master-volume').value)};return new File([JSON.stringify(data)],'ring-for-candy-setup.json',{type:'application/json'})}
function downloadFile(file){const url=URL.createObjectURL(file),anchor=document.createElement('a');anchor.href=url;anchor.download=file.name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}
action('export',async()=>{downloadFile(await setupFile());status('Setup exported. Keep this file as your backup.')});
action('share-setup',async()=>{const file=await setupFile();if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Ring for Candy setup'});status('Setup shared. Use Restore backup to reload your setup.')}catch(e){if(e.name!=='AbortError'){downloadFile(file);status('Sharing unavailable. Setup downloaded for backup.')}}}else{downloadFile(file);status('Setup downloaded. Keep the file somewhere safe.')}});
$('restore').onchange=async()=>{try{const file=$('restore').files[0];if(!file)return;if(file.size>420*1024*1024)throw Error('Setup file exceeds 420 MB.');const data=JSON.parse(await file.text());if(![1,2].includes(data.version)||!Array.isArray(data.clips)||data.clips.length!==12)throw Error('Invalid soundboard setup.');const restored=[];for(const clip of data.clips){if(clip===null){restored.push(null);continue}if(typeof clip.name!=='string'||typeof clip.data!=='string'||!/^data:audio\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9-]+=[a-zA-Z0-9._+-]+)*;base64,/.test(clip.data))throw Error('Invalid audio in setup.');const blob=await(await fetch(clip.data)).blob();await validateAudio(blob);restored.push({name:clip.name.slice(0,40),blob})}if(data.version===2&&(!Array.isArray(data.favorites)||!Array.isArray(data.recent)||data.favorites.length>500||data.recent.length>30||!data.favorites.every(id=>typeof id==='string')||!data.recent.every(id=>typeof id==='string')||typeof data.scene?.id!=='string'||!Number.isFinite(data.scene.volume)||!Number.isFinite(data.masterVolume)))throw Error('Invalid setup settings.');if(!confirm('Replace this device’s saved custom recordings with the imported setup?'))return;stopAll();await transaction(store=>{store.clear();restored.forEach((clip,index)=>{if(clip)store.put(clip,index)})});clips=restored;if(data.version===2){favorites=new Set(data.favorites);recent=data.recent;sceneSettings={id:data.scene.id,volume:Math.max(0,Math.min(.6,data.scene.volume))};$('master-volume').value=Math.max(0,Math.min(1,data.masterVolume));if(master)master.gain.value=Number($('master-volume').value);$('preview').volume=Number($('master-volume').value);savePreferences()}renderPads();renderLibrary();renderScenes();status('Setup restored. Microphone selection remains specific to this device.')}catch(e){status(`Restore failed: ${e.message}`)}finally{$('restore').value=''}};
async function init(){renderPads();try{db=await database();await new Promise((resolve,reject)=>{const request=db.transaction('clips').objectStore('clips').openCursor();request.onsuccess=()=>{const cursor=request.result;if(cursor){if(Number.isInteger(cursor.key)&&cursor.key>=0&&cursor.key<12)clips[cursor.key]=cursor.value;cursor.continue()}else resolve()};request.onerror=()=>reject(request.error)});renderPads()}catch{status('Browser storage unavailable. Playback works; editing needs storage.');for(const id of ['record','save','clear','restore'])$(id).disabled=true}
  if('serviceWorker'in navigator){try{const previouslyControlled=!!navigator.serviceWorker.controller;const registration=await navigator.serviceWorker.register('./sw.js');const show=()=>{$('update-notice').hidden=false};if(registration.waiting)show();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',()=>{if(registration.waiting&&navigator.serviceWorker.controller)show()}));$('apply-update').onclick=()=>{stopAll();registration.waiting?.postMessage({type:'ACTIVATE'})};let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(previouslyControlled&&!refreshing){refreshing=true;location.reload()}})}catch{status('Offline support unavailable. Use HTTPS.')}}
  try{await loadCatalog()}catch(e){$('library-state').textContent='Audio list unavailable. Try again when online.';status(e.message)}if(new URL(location.href).searchParams.get('mode')==='party')setParty(true);
}
init();
