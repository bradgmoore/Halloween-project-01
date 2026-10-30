/* Use a media element as the output endpoint, including live microphone audio.
   This gives Safari one inline playback path; Bluetooth routing still belongs to iOS. */
class PhoneAudioOutput {
  constructor(context){
    this.context=context;this.destination=context.createMediaStreamDestination();
    this.element=document.createElement('audio');this.element.id='speaker-output';
    this.element.playsInline=true;this.element.setAttribute('playsinline','');this.element.setAttribute('webkit-playsinline','');
    this.element.setAttribute('aria-label','Live speaker output');this.element.srcObject=this.destination.stream;
    this.element.volume=1;this.element.muted=false;document.body.append(this.element);
  }
  async resume(){
    // Start both synchronously within the gesture, before awaiting microphone permission.
    const contextStart=this.context.resume();const playbackStart=this.element.play();
    try{await Promise.all([contextStart,playbackStart])}catch(error){throw Error(`Speaker output could not start. Tap Test speaker output, then try again. ${error.message}`)}
  }
  captureMode(){try{if(navigator.audioSession)navigator.audioSession.type='play-and-record'}catch{}}
  playbackMode(){try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch{}}
}
class NaturalVoice {
  constructor(context,source,destination,level){this.context=context;this.output=context.createGain();this.output.gain.value=level;this.meter=context.createAnalyser();this.meter.fftSize=512;source.connect(this.meter);source.connect(this.output).connect(destination);this.preset='natural'}
  setPreset(name){if(name!=='natural')throw Error('Release the talk button before selecting a voice filter.')}
  setLevel(value){this.output.gain.setTargetAtTime(value,this.context.currentTime,.025)}
  destroy(){this.output.disconnect();this.meter.disconnect()}
}
