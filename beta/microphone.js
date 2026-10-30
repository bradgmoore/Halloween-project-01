/* Prefer a local input; keep Safari's automatic route available when input IDs are hidden. */
class DeviceMicrophone {
  constructor(select,report){this.select=select;this.report=report;this.generation=0;this.external=/bluetooth|airpods|headset|hands.?free|earbuds|wireless|usb/i;this.internal=/built[ -]?in|internal|microphone array|iphone|ipad|macbook|pixel|tablet|lenovo|integrated/i;}
  cancel(){this.generation++}
  supported(){if(!navigator.mediaDevices?.getUserMedia||!navigator.mediaDevices?.enumerateDevices)throw Error('Microphone access needs HTTPS and Safari microphone permission.');}
  isLocal(device){return this.internal.test(device.label)&&!this.external.test(device.label)}
  async discover(){
    this.supported();const request=++this.generation;let probe;
    try{
      let all=await navigator.mediaDevices.enumerateDevices();
      if(!all.some(d=>d.kind==='audioinput'&&d.label)){probe=await navigator.mediaDevices.getUserMedia({audio:true});all=await navigator.mediaDevices.enumerateDevices()}
      if(request!==this.generation)return false;
      const inputs=all.filter(d=>d.kind==='audioinput'&&d.deviceId);const previous=this.select.value;let saved;try{saved=localStorage.getItem('beta:well-device-mic')}catch{}
      this.select.replaceChildren(new Option('Device microphone · automatic',''));
      for(const input of inputs){const option=new Option(input.label||'Unnamed microphone',input.deviceId);option.disabled=this.external.test(input.label);this.select.append(option)}
      const eligible=inputs.filter(d=>!this.external.test(d.label));
      const local=eligible.find(d=>this.isLocal(d)&&!['default','communications'].includes(d.deviceId))||eligible.find(d=>this.isLocal(d));
      const remembered=eligible.find(d=>d.deviceId===(previous||saved)&&!['default','communications'].includes(d.deviceId));
      const selected=local||remembered;if(selected)this.select.value=selected.deviceId;
      this.report(selected?`${this.isLocal(selected)?'Built-in mic':'Selected input'}: ${selected.label||'Unnamed microphone'}`:'Automatic device microphone. Safari may hide input names; the active input will be shown when you hold to talk.');return true;
    }finally{probe?.getTracks().forEach(track=>track.stop())}
  }
  async acquire(valid){
    this.supported();if(!valid())return null;const id=this.select.value;
    if(this.external.test(this.select.selectedOptions[0]?.textContent||''))throw Error('Select the iPhone microphone.');
    const constraints={echoCancellation:true,noiseSuppression:true,autoGainControl:false};
    if(id){if(!navigator.mediaDevices.getSupportedConstraints().deviceId)throw Error('Select automatic input; this browser hides microphone IDs.');constraints.deviceId={exact:id}}
    const stream=await navigator.mediaDevices.getUserMedia({audio:constraints});
    if(!valid()){stream.getTracks().forEach(t=>t.stop());return null}
    const track=stream.getAudioTracks()[0],settings=track?.getSettings();
    const alias=['default','communications'].includes(id);
    if(!track||this.external.test(track.label)||(id&&!alias&&settings?.deviceId&&settings.deviceId!==id)){
      stream.getTracks().forEach(t=>t.stop());throw Error('Browser did not confirm the selected iPhone microphone. Capture stopped.');
    }
    const confirmation=id&&settings?.deviceId===id?'selected input confirmed':settings?.deviceId?'automatic input reported':'Safari has not exposed an input ID';
    this.report(`Active input: ${track.label||'Device microphone'} · ${confirmation}`);return stream;
  }
  remember(){try{localStorage.setItem('beta:well-device-mic',this.select.value)}catch{}}
}
