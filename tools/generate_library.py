"""Generate original procedural Halloween audio; no third-party samples required.
Requires Python, numpy, scipy, and ffmpeg. Run from the repository root.
"""
from pathlib import Path
import json, subprocess, tempfile
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io.wavfile import write
RATE=22050
GROUPS={
'Ghosts & spirits':['The spirit in the well','Ghost choir','A mournful apparition','Spectral rising','The banshee beyond','Lost souls','Something is floating','Phantom farewell'],
'Creatures & monsters':['Something beneath the bed','The hungry creature','A beast awakens','Swamp monster','The crawling thing','Creature at the window','Deep sea horror','Monster calls back'],
'Eerie melodies':['Midnight music box','The crooked lullaby','A doll sings in tones','The abandoned nursery','Carnival after dark','The haunted waltz','Music from the attic','The last lullaby'],
'Haunted atmospheres':['Fog over the graveyard','The abandoned asylum','A presence in the room','Under the dark lake','The endless corridor','The forest is watching','Midnight at the well','The empty chapel'],
'Cursed radio':['A signal from nowhere','The haunted broadcast','Television possession','The missing transmission','A voice made of static','Numbers from the void','Lost channel thirteen','The final signal'],
'Rituals & dark magic':['The summoning','Circle of shadows','An ancient curse','The forbidden chamber','A portal opens','The midnight ritual','The spell takes hold','Beyond the veil'],
'Suspense & reveals':['Something is coming','Do not turn around','The shadow grows','Behind you','The figure appears','No way out','The last warning','The reveal'],
'Synthesized shrieks':['A spectral shriek','The rising scream tone','A cry from below','The howling shadow','The night creature','A distorted cry','The impossible howl','The final fright']}
def band(x,lo,hi):return sosfilt(butter(3,[lo,hi],btype='bandpass',fs=RATE,output='sos'),x)
def tone(t,f):return np.sin(2*np.pi*np.cumsum(np.broadcast_to(f,t.shape))/RATE)
def echo(x):
 y=x.copy()
 for sec,g in [(.13,.25),(.31,.19),(.57,.12),(.83,.07)]:
  n=int(sec*RATE);y[n:]+=g*x[:-n]
 return y
out=Path('audio/spooky');out.mkdir(parents=True,exist_ok=True);clips=[]
for group,(category,titles) in enumerate(GROUPS.items()):
 for i,title in enumerate(titles):
  rng=np.random.default_rng(20261012+group*101+i);duration=(6+i%4) if group!=3 else (11+i%4);t=np.arange(int(duration*RATE))/RATE;noise=rng.normal(0,1,len(t));phase=i*.6
  if group==0:
   f=190+i*22+70*np.sin(2*np.pi*(.15+i*.025)*t+phase);x=sum(tone(t,f*k)*(.42/k) for k in [1,2,3,4]);x=band(x,150,2200)*(np.sin(np.pi*t/duration)**2)*(.55+.45*np.sin(2*np.pi*.6*t)**2);x+=.06*band(noise,600,2500)
  elif group==1:
   f=43+i*7+10*np.sin(2*np.pi*(.8+i*.18)*t);growl=np.tanh(3*sum(tone(t,f*k)/k for k in range(1,8)));x=band(growl,40,1600)*(.15+.85*np.sin(2*np.pi*(.35+i*.05)*t)**6);x+=.12*band(noise,100,900)
  elif group==2:
   x=np.zeros(len(t));notes=[0,1,7,6,12,3,1,-5] if i%2 else [0,7,1,8,3,12,6,-1];spacing=.46+i*.055
   for j,start in enumerate(np.arange(0,duration-1,spacing)):
    local=t-start;mask=local>=0;f=(220+i*21)*2**(notes[(j+i)%len(notes)]/12);env=np.exp(-np.maximum(local,0)*(2+i*.12))*mask; x+=.32*env*(np.sin(2*np.pi*f*local)+.28*np.sin(2*np.pi*f*2.011*local)+.11*np.sin(2*np.pi*f*3.93*local))
  elif group==3:
   f=49+i*9;x=.2*tone(t,f)+.18*tone(t,f*1.013)+.13*tone(t,f*1.498)+.1*tone(t,f*2.03);x+=.23*band(noise,180+i*25,1300+i*170)*(.3+.7*np.sin(2*np.pi*.1*t+phase)**2);x+=.13*tone(t,290+i*35+22*np.sin(t*.5))*np.sin(np.pi*t/duration)**4
  elif group==4:
   pulses=(np.sin(2*np.pi*(1.2+i*.3)*t+phase)>.3).astype(float);carrier=tone(t,420+i*85+90*np.sin(t*(2+i)));x=.16*band(noise,600,4800)*(.1+.9*pulses)+.2*carrier*pulses*(.6+.4*np.sin(t*15));x+=.08*tone(t,72+i*7)
  elif group==5:
   f=64+i*8;x=sum(.18/(k+1)*tone(t,f*ratio) for k,ratio in enumerate([1,1.005,1.5,2,2.99,4.07]));x*=.5+.5*np.sin(2*np.pi*(.22+i*.04)*t)**2
   for start in np.arange(.5,duration,1.6+i*.1):
    u=np.maximum(t-start,0);x+=.18*(t>=start)*np.exp(-u*1.7)*tone(t,390+i*31)*(1+.2*np.sin(u*19))
  elif group==6:
   progress=t/duration;f=65+i*12+((220+i*25)*progress**2);x=(.12+.5*progress)*(.4*tone(t,f)+.16*tone(t,f*1.03)+.2*band(noise,250,3300));x*=.4+.6*np.sin(2*np.pi*(.7*t+(1+i*.2)*t*t/duration))**4;x+=.35*band(noise,80,2200)*np.exp(-((t-duration*.8)/.14)**2)
  else:
   f=360+i*43+250*np.sin(np.pi*t/duration)+90*np.sin(t*(8+i));x=.3*tone(t,f)+.13*tone(t,f*1.97)+.07*tone(t,f*3.02);x+=.13*band(noise,900,4200);x*=np.sin(np.pi*t/duration)**(.6+i*.12)*(.6+.4*np.sin(t*(15+i))**2)
  x=echo(x);fade=np.minimum(t/.18,1)*np.minimum((duration-t)/.65,1);x*=fade;x=x/(max(np.max(np.abs(x)),.001))*0.65
  filename=f'{group+1:02d}-{i+1:02d}.mp3'
  with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
   write(wav.name,RATE,(x*32767).astype(np.int16));subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',wav.name,'-codec:a','libmp3lame','-q:a','5',str(out/filename)],check=True)
  clips.append({'id':f'{group+1}-{i+1}','title':title,'category':category,'url':'audio/spooky/'+filename,'duration':duration,'creator':'Ring for Candy · original procedural audio','license':'CC0 1.0','description':'Original synthesized Halloween clip; no human voice recording.'})
existing=json.loads(Path('library.json').read_text()) if Path('library.json').exists() else {'clips':[]}
clips += [clip for clip in existing['clips'] if str(clip.get('id','')).startswith('voice-')]
Path('library.json').write_text(json.dumps({'title':'Ring for Candy Halloween library','clips':clips},indent=2)+'\n')
(out/'CREDITS.md').write_text('''# Ring for Candy Halloween library\n\n64 original procedural audio compositions generated with tools/generate_library.py. No third-party recordings, film samples, or human voice recordings are used. Ghost/creature/voice descriptions refer to synthesized tones and textures. This is not a third-party hosted sound archive.\n\nThe generated audio is offered under CC0 1.0 Universal for free reuse: https://creativecommons.org/publicdomain/zero/1.0/\n\nSee ../LICENSE-CC0.txt for the legal text.\n''')
print(f'Generated {len(clips)} clips.')
