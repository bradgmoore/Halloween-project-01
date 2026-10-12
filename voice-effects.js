/* Live audio processing. No recording or upload is performed here. */
const VOICE_PRESETS={
  natural:{label:'Natural',pitch:1,lowpass:12000,bass:0,drive:0,ring:0,ringHz:0,echo:0,delay:.12},
  witch:{label:'Witch',pitch:1.38,lowpass:4400,bass:-4,drive:.12,ring:.08,ringHz:8,echo:.15,delay:.14},
  zombie:{label:'Zombie',pitch:.76,lowpass:1800,bass:7,drive:.28,ring:.14,ringHz:5,echo:.08,delay:.1},
  ghoul:{label:'Ghoul',pitch:.88,lowpass:3300,bass:2,drive:.08,ring:.32,ringHz:24,echo:.32,delay:.21},
  demon:{label:'Demon',pitch:.60,lowpass:3800,bass:9,drive:.42,ring:.24,ringHz:38,echo:.18,delay:.16},
  ghost:{label:'Ghost',pitch:1.12,lowpass:5500,bass:-2,drive:0,ring:.18,ringHz:7,echo:.4,delay:.29}
};
const voiceModuleLoads=new WeakMap();
class VoiceEffects {
  static async prepare(context){
    if(!context.audioWorklet||typeof AudioWorkletNode==='undefined')throw Error('Live voice filters need a recent Chrome or Safari browser over HTTPS.');
    if(!voiceModuleLoads.has(context)){const promise=context.audioWorklet.addModule('./voice-processor.js').catch(e=>{voiceModuleLoads.delete(context);throw e});voiceModuleLoads.set(context,promise)}
    await voiceModuleLoads.get(context);
  }
  constructor(context,source,destination,level=.3){
    this.context=context;this.nodes=[];this.oscillators=[];
    const node=(n)=>{this.nodes.push(n);return n};
    this.highpass=node(context.createBiquadFilter());this.highpass.type='highpass';this.highpass.frequency.value=75;
    this.pitch=node(new AudioWorkletNode(context,'well-pitch',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]}));
    this.bass=node(context.createBiquadFilter());this.bass.type='lowshelf';this.bass.frequency.value=240;
    this.lowpass=node(context.createBiquadFilter());this.lowpass.type='lowpass';
    this.distortion=node(context.createWaveShaper());this.distortion.oversample='2x';
    this.ring=node(context.createGain());this.modulator=context.createOscillator();this.modDepth=node(context.createGain());this.oscillators.push(this.modulator);this.modulator.connect(this.modDepth).connect(this.ring.gain);
    this.compressor=node(context.createDynamicsCompressor());this.compressor.threshold.value=-18;this.compressor.ratio.value=6;this.compressor.knee.value=12;
    this.output=node(context.createGain());this.output.gain.value=level;
    this.delay=node(context.createDelay(.6));this.echo=node(context.createGain());this.feedback=node(context.createGain());this.feedback.gain.value=.18;
    this.meter=node(context.createAnalyser());this.meter.fftSize=512;
    source.connect(this.meter);source.connect(this.highpass);this.highpass.connect(this.pitch).connect(this.bass).connect(this.lowpass).connect(this.distortion).connect(this.ring).connect(this.compressor).connect(this.output).connect(destination);
    this.ring.connect(this.delay).connect(this.echo).connect(this.compressor);this.delay.connect(this.feedback).connect(this.delay);
    this.setPreset('natural');this.modulator.start();
  }
  setPreset(name){
    const preset=VOICE_PRESETS[name];if(!preset)throw Error('Unknown voice filter.');
    const time=this.context.currentTime;
    const set=(param,value)=>{param.cancelScheduledValues(time);param.setTargetAtTime(value,time,.035)};
    set(this.pitch.parameters.get('ratio'),preset.pitch);set(this.bass.gain,preset.bass);set(this.lowpass.frequency,preset.lowpass);
    set(this.ring.gain,1-preset.ring);set(this.modDepth.gain,preset.ring);set(this.modulator.frequency,preset.ringHz||1);
    set(this.echo.gain,preset.echo);set(this.delay.delayTime,preset.delay);
    if(preset.drive){const curve=new Float32Array(2048),k=1+preset.drive*7;for(let i=0;i<curve.length;i++){const x=i*2/(curve.length-1)-1;curve[i]=Math.tanh(x*k)/Math.tanh(k)}this.distortion.curve=curve}else this.distortion.curve=null;
    this.preset=name;
  }
  setLevel(level){this.output.gain.setTargetAtTime(level,this.context.currentTime,.025)}
  destroy(){if(this.destroyed)return;this.destroyed=true;this.pitch.port.postMessage('stop');for(const oscillator of this.oscillators)oscillator.stop();for(const node of this.nodes)node.disconnect();this.pitch.port.close()}
}
