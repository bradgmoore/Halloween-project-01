'use strict';
const updateVersion='3.2.1';
const updateStatus=document.getElementById('update-status');
const retryUpdate=document.getElementById('retry-update');
async function refreshSoundboard(){
  retryUpdate.hidden=true;
  updateStatus.textContent='Loading the 20 sounds. Keeping your saved recordings…';
  try{
    if('serviceWorker'in navigator){
      const scope=new URL('./',location.href);
      let deadline;
      const registration=await Promise.race([navigator.serviceWorker.register(new URL('./sw.js?v='+updateVersion,scope),{scope:scope.pathname,updateViaCache:'none'}),new Promise((resolve,reject)=>{deadline=setTimeout(()=>reject(Error('Browser updates are delayed. Use Open Soundpad directly below.')),15000)})]).finally(()=>clearTimeout(deadline));
      const active=await new Promise((resolve,reject)=>{
        const started=Date.now();
        const timer=setInterval(()=>{
          const waiting=registration.waiting;
          if(waiting)waiting.postMessage({type:'ACTIVATE'});
          if(registration.active?.state==='activated'&&new URL(registration.active.scriptURL).searchParams.get('v')===updateVersion){clearInterval(timer);resolve(true)}
          else if(Date.now()-started>45000){clearInterval(timer);reject(Error('The update has not finished. Stay online and try again.'))}
        },150);
      });
      if(!active)throw Error('Update unavailable.');
    }
    updateStatus.textContent='Update ready. Opening your soundboard…';
    location.replace(new URL('./?updated='+updateVersion,location.href));
  }catch(error){updateStatus.textContent=error.message||'Stay online and try the update again.';retryUpdate.hidden=false}
}
retryUpdate.onclick=refreshSoundboard;
refreshSoundboard();
