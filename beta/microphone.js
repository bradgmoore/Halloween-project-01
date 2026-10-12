/* Device microphone selection shared by push-to-talk and the recording studio. */
class DeviceMicrophone {
  constructor(select,report){this.select=select;this.report=report;this.generation=0;this.external=/bluetooth|airpods|headset|hands.?free|earbuds|wireless|usb/i;this.internal=/built[ -]?in|internal|microphone array|iphone|ipad|macbook|pixel|tablet|lenovo|integrated/i;}
  cancel(){this.generation++}
  supported(){if(!navigator.mediaDevices?.getUserMedia||!navigator.mediaDevices?.enumerateDevices)throw Error('Microphone access needs HTTPS and a recent browser.');if(!navigator.mediaDevices.getSupportedConstraints().deviceId)throw Error('This browser cannot select a microphone. Try Chrome on the tablet.');}
  isLocal(device){return this.internal.test(device.label)&&!this.external.test(device.label)}
  async discover(){
    this.supported();const request=++this.generation;let probe;
    try{
      let all=await navigator.mediaDevices.enumerateDevices();
      if(!all.some(d=>d.kind==='audioinput'&&d.label)){probe=await navigator.mediaDevices.getUserMedia({audio:true});all=await navigator.mediaDevices.enumerateDevices()}
      if(request!==this.generation)return false;
      const inputs=all.filter(d=>d.kind==='audioinput'&&d.deviceId);const previous=this.select.value;let saved;try{saved=localStorage.getItem('beta:well-device-mic')}catch{}
      this.select.replaceChildren(new Option('Choose a microphone on this device',''));
      for(const input of inputs){const option=new Option(input.label||'Unnamed microphone',input.deviceId);option.disabled=!input.label||this.external.test(input.label);this.select.append(option)}
      const eligible=inputs.filter(d=>d.label&&!this.external.test(d.label));
      const local=eligible.find(d=>this.isLocal(d)&&!['default','communications'].includes(d.deviceId))||eligible.find(d=>this.isLocal(d));
      const remembered=eligible.find(d=>d.deviceId===(previous||saved)&&!['default','communications'].includes(d.deviceId));
      const selected=local||remembered;if(selected)this.select.value=selected.deviceId;
      this.report(selected?`${this.isLocal(selected)?'Built-in mic':'Selected input—check this is the device mic'}: ${selected.label}`:'No built-in mic identified. Choose a labeled device microphone; Bluetooth inputs are excluded.');return true;
    }finally{probe?.getTracks().forEach(track=>track.stop())}
  }
  async acquire(valid){
    this.supported();if(!this.select.value)await this.discover();if(!valid())return null;
    const id=this.select.value;if(!id)throw Error('Choose the device microphone first.');
    if(this.external.test(this.select.selectedOptions[0]?.textContent||''))throw Error('Select a microphone on the phone or tablet.');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:{exact:id},echoCancellation:true,noiseSuppression:true,autoGainControl:false}});
    if(!valid()){stream.getTracks().forEach(t=>t.stop());return null}
    const track=stream.getAudioTracks()[0],settings=track?.getSettings();
    if(!settings?.deviceId||settings.deviceId!==id||this.external.test(track.label)){stream.getTracks().forEach(t=>t.stop());throw Error('Browser did not confirm the selected microphone. Capture stopped.');}
    this.report(`Active input: ${track.label||this.select.selectedOptions[0].textContent} · browser identity confirmed`);return stream;
  }
  remember(){try{localStorage.setItem('beta:well-device-mic',this.select.value)}catch{}}
}
