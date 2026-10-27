async function civicDispatchDemoScene(scene,status=()=>{}){
 try{
  if(!scene.startsWith('alert-')){document.querySelector('#cAlarmDialog')?.civicDismiss?.();if(new URLSearchParams(location.search).get('presenter')==='1')civicSetAlertVisibility(false)}
  exitChat();if(PS)pFinish({ok:false});if(document.querySelector('#det')?.classList.contains('on'))document.querySelector('#dclose')?.click();
  const back=()=>showProductTab('cases');
  if(['marta-letter','jan-vat','ewa-zus'].includes(scene)){showProductTab('cases');const index=TILES.findIndex(x=>x.k==='letter');if(index<0)throw new Error('missing letter');openProductCase(index)}
  else if(scene==='marta-reply'){showProductTab('cases');const mailId=TILES.find(x=>x.k==='letter')?.mailId;if(!mailId)throw new Error('missing letter');civicOpenTool('wyslij_pismo',()=>showProductTab('cases'),{replyTo:mailId})}
  else if(scene==='marta-birth'){showProductTab('services');civicBirthHub('services')}
  else if(scene==='marta-share'||scene==='marta-conflict'){showProductTab('qr');demoConsentFlow({conflict:scene==='marta-conflict'}).then(result=>{if(result.reviewId)openReviewCase(result.reviewId);else if(result.ok)showShareHistory()}).catch(()=>status(false,'Nie udało się otworzyć prośby o dane. Spróbuj ponownie.'))}
  else if(scene==='jan-contract'){showProductTab('services');civicContractHome(back)}
  else if(scene==='jan-collision'){showProductTab('services');collisionHome()}
  else if(scene==='ewa-renew'){showProductTab('cases');const index=TILES.findIndex(x=>x.k==='renew');if(index<0)throw new Error('missing renewal');openProductCase(index)}
  else if(scene==='ewa-sms'){showProductTab('services');civicCertForm()}
  else if(scene==='kacper-wallet'){showProductTab('services');civicLostWallet('services')}
  else if(scene==='kacper-age'){showProductTab('qr');showLifePresentation('age')}
  else if(scene==='kacper-warnings'){showProductTab('safety')}
  else if(scene==='alert-air'||scene==='alert-ready'||scene==='alert-clear'){civicShowAlarm(scene==='alert-air'?'air':scene==='alert-clear'?'clear':'ready')}
  else if(scene==='kacper-shelters'){showProductTab('safety');civicSheltersForm(()=>showProductTab('safety'))}
  else throw new Error('unknown scene');
  status(true);
 }catch(error){status(false,'Nie udało się otworzyć sprawy. Wróć do aplikacji i spróbuj ponownie.')}
}
if(window.parent!==window&&civicDemoRun)document.documentElement.classList.add('demo-embedded');
/* Jawne sceny przypisane do osoby. Otwarcie nie uruchamia AI ani wysyłki. */
window.addEventListener('message',async event=>{
 if(window.parent===window||event.source!==window.parent||event.origin!==location.origin||!['mobywatel-demo','mobywatel-demo-alerts'].includes(event.data?.type)||!civicDemoRun||event.data.person!==OS.id)return;
 if(event.data.type==='mobywatel-demo-alerts'){civicSetAlertVisibility(event.data.enabled,event.data.restart);return}
 const {scene,requestId}=event.data;if(!civicShowcaseScene(OS.id,scene))return;
 const status=(ok,message)=>window.parent.postMessage({type:'mobywatel-demo-status',person:OS.id,scene,requestId,ok,message},location.origin);
 await civicDispatchDemoScene(scene,status);
});
window.addEventListener('load',()=>{if(window.parent!==window&&civicDemoRun)window.parent.postMessage({type:'mobywatel-demo-ready',person:OS.id},location.origin)});

window.addEventListener('load',()=>{const scene=new URLSearchParams(location.search).get('scene');if(civicDemoRun&&scene&&civicShowcaseScene(OS.id,scene)&&window.parent===window)civicDispatchDemoScene(scene)});

/* Keyboard navigation across the presenter iframe keeps fields and menus native. */
if(new URLSearchParams(location.search).get('presenter')==='1'&&window.parent!==window&&civicDemoRun){document.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Escape'].includes(event.key)||event.ctrlKey||event.metaKey||event.altKey)return;const target=event.target;if(target.isContentEditable||target.closest('input,textarea,select,[role="combobox"],[role="slider"],[role="menu"],[role="tablist"]'))return;event.preventDefault();window.parent.postMessage({type:'mobywatel-presenter-key',person:OS.id,key:event.key},location.origin)})}

/* Presentation chrome also belongs to the separate full-window app route. */
if(window.parent===window&&civicDemoRun){
 document.documentElement.classList.add('showcase-standalone');
 const url=new URL('/pokaz.html',location.origin);url.searchParams.set('run',civicDemoRun);url.searchParams.set('osoba',OS.id);url.searchParams.set('view','app');
 const back=document.createElement('a');back.className='view-close';back.id='cShowcaseWindowReturn';back.href=url.pathname+url.search;back.setAttribute('aria-label','Wróć do strony');back.title='Wróć do strony';back.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>';document.body.prepend(back);
}
