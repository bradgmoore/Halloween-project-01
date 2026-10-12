/* Dual overlapping delay heads shift live pitch without changing speech speed. */
class WellPitchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors(){return [{name:'ratio',defaultValue:1,minValue:.5,maxValue:1.8,automationRate:'a-rate'}]}
  constructor(){super();this.alive=true;this.port.onmessage=event=>{if(event.data==='stop')this.alive=false};this.buffer=new Float32Array(Math.ceil(sampleRate*.25));this.write=0;this.phase=0;this.window=sampleRate*.045;this.base=sampleRate*.008}
  read(delay){let position=(this.write-delay+this.buffer.length)%this.buffer.length;const left=Math.floor(position),fraction=position-left;return this.buffer[left]*(1-fraction)+this.buffer[(left+1)%this.buffer.length]*fraction}
  process(inputs,outputs,parameters){
    if(!this.alive)return false;
    const input=inputs[0]?.[0],output=outputs[0]?.[0];if(!output)return true;
    for(let i=0;i<output.length;i++){
      const sample=input?.[i]||0;this.buffer[this.write]=sample;const ratio=parameters.ratio.length===1?parameters.ratio[0]:parameters.ratio[i];
      if(Math.abs(ratio-1)<.001)output[i]=sample;
      else{this.phase=(this.phase+Math.abs(1-ratio)/this.window)%1;const p=this.phase,q=(p+.5)%1;const delayA=this.base+this.window*(ratio>1?1-p:p),delayB=this.base+this.window*(ratio>1?1-q:q);const weight=Math.sin(Math.PI*p)**2;output[i]=this.read(delayA)*weight+this.read(delayB)*(1-weight)}
      this.write=(this.write+1)%this.buffer.length;
    }
    return true;
  }
}
registerProcessor('well-pitch',WellPitchProcessor);
