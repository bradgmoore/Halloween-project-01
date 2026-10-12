"""Import a pinned CC0 Kenney voice pack supplied as a local Git checkout.
Usage: python3 tools/import_recorded_voices.py /path/to/kenney-voiceover-fighter-for-godot
"""
import hashlib,json,subprocess,sys,shutil
from pathlib import Path
root=Path(sys.argv[1]);commit='08f93f0697459505e83f351f0e532115ca0550da'
actual=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
if actual!=commit:raise SystemExit('Source checkout does not match the reviewed commit.')
license_text=(root/'LICENSE').read_text()
if 'CC0 1.0 Universal' not in license_text:raise SystemExit('Expected source CC0 license missing.')
out=Path('audio/recorded');out.mkdir(exist_ok=True)
phrases=[('war_look_out','Look out'),('war_watch_my_back','Watch my back'),('hurry_up','Hurry up'),('game_over','Game over'),('mission_failed','Mission failed'),('time_over','Time is over'),('ready','Are you ready'),('you_lose','You lose')]
entries=[];sources=[]
for voice in [1,2]:
 for name,title in phrases:
  source=root/f'addons/kenney voiceover pack/voice type {voice}/{name}.ogg';sources.append({'path':str(source.relative_to(root)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
  for style in ['original','demon']:
   file=f'{voice}-{name}-{style}.mp3';cmd=['ffmpeg','-v','error','-nostdin','-y','-i',str(source)]
   if style=='demon':cmd+=['-af','aresample=22050,asetrate=15876,aresample=22050,atempo=1.388889,lowpass=f=3600,aecho=0.8:0.8:100:0.25']
   cmd+=['-codec:a','libmp3lame','-q:a','4',str(out/file)];subprocess.run(cmd,check=True)
   duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(out/file)],text=True))
   entries.append({'id':f'voice-{voice}-{name}-{style}','title':f'{title} · {"Voice" if style=="original" else "Demon voice"} {voice}','category':'Recorded scare phrases','url':f'audio/recorded/{file}','duration':round(duration,2),'creator':'Kenney','license':'CC0 1.0','source':'https://github.com/Boyquotes/kenney-voiceover-fighter-for-godot/tree/'+commit,'description':'Kenney CC0 voice clip'+(' with pitch and echo processing.' if style=='demon' else '.')})
m=json.loads(Path('library.json').read_text());m['clips']=[c for c in m['clips'] if not c['id'].startswith('voice-')]+entries;Path('library.json').write_text(json.dumps(m,indent=2)+'\n');shutil.copyfile(root/'LICENSE',out/'LICENSE-CC0.txt')
(out/'sources.json').write_text(json.dumps({'repository':'https://github.com/Boyquotes/kenney-voiceover-fighter-for-godot','commit':commit,'sources':sources},indent=2)+'\n')
(out/'CREDITS.md').write_text(f'''# Recorded scare phrases\n\nVoice pack by Kenney. Source repository supplies the audio under CC0 1.0 Universal; legal text included in LICENSE-CC0.txt.\n\nReviewed source: https://github.com/Boyquotes/kenney-voiceover-fighter-for-godot/tree/{commit}\n\nSixteen source phrases across two voices are included, each in original and pitch/echo-processed Demon form (32 clips). These are spoken phrases, not scream/laughter recordings. No third-party files with unverifiable redistribution rights were included. Source filenames and SHA-256 checksums are in sources.json.\n\nConversion and processing are reproducible with tools/import_recorded_voices.py.\n''')
print('Added',len(entries),'CC0 voice clips. Total:',len(m['clips']))
