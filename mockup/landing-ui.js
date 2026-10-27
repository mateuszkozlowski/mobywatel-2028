/* Landing uses the app's allowlisted scene bridge. Scrolling never changes app state. */
let pitchPendingScene=null;
window.civicPitchAppReady=()=>{if(!pitchPendingScene)return;const id=pitchPendingScene;pitchPendingScene=null;showcaseOpenScene(id)};
function civicPitchGoScene(person,id){civicActivateShowcase();if(!civicShowcaseScene(person,id))return;if(id.startsWith('alert-')){showcaseAlertsEnabled=true;try{localStorage.setItem(showcaseAlertsKey,'on')}catch(e){}showcaseSyncAlerts(true)}pitchPendingScene=id;if(person!==showcasePerson)showcaseSelectPerson(person,false);else if(showcaseReady)window.civicPitchAppReady();document.querySelector('#pokaz').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})}
document.querySelectorAll('[data-pitch-scene]').forEach(button=>button.onclick=()=>civicPitchGoScene(button.dataset.pitchPerson,button.dataset.pitchScene));


const pitchUrl=new URL(location.href);const requestedScene=pitchUrl.searchParams.get('scene');if(requestedScene&&civicShowcaseScene(showcasePerson,requestedScene)){pitchPendingScene=requestedScene;if(showcaseReady)window.civicPitchAppReady()}

/* Keep the complete device visible. This changes only presentation geometry. */
function civicFitDevices(){document.querySelectorAll('.device-fit').forEach(box=>{const rect=box.getBoundingClientRect();if(!rect.width||!rect.height)return;const scale=Math.min(1,rect.width/410,rect.height/800);box.style.setProperty('--device-scale',String(scale))})}
const civicDeviceObserver=new ResizeObserver(civicFitDevices);document.querySelectorAll('.device-fit').forEach(box=>civicDeviceObserver.observe(box));civicFitDevices();

const civicIntro=document.querySelector('#showPlay'),civicLiveDevice=document.querySelector('#showApp').closest('.device');
let civicShowcaseLaunched=pitchUrl.searchParams.get('view')==='app'||(pitchUrl.searchParams.get('view')!=='render'&&(!!showcaseInitialPerson||!!requestedScene));
function civicActivateShowcase(){civicShowcaseLaunched=true;civicIntro.hidden=true;civicLiveDevice.hidden=false;document.querySelector('.demo-controls').hidden=false;document.querySelector('.demo-footer').hidden=false;const url=new URL(location.href);url.searchParams.set('view','app');history.replaceState(null,'',url);civicFitDevices()}
function civicReturnToRender(){document.body.classList.remove('app-zoomed');document.querySelector('#showExitZoom').hidden=true;const layout=document.querySelector('.story-layout');layout.classList.remove('app-focus');document.querySelector('#showZoomApp').setAttribute('aria-pressed','false');document.querySelector('#showZoomApp').textContent='Powiększ';civicShowcaseLaunched=false;civicIntro.hidden=false;civicLiveDevice.hidden=true;document.querySelector('.demo-controls').hidden=true;document.querySelector('.demo-footer').hidden=true;const url=new URL(location.href);url.searchParams.set('view','render');url.searchParams.delete('scene');history.replaceState(null,'',url);civicFitDevices();civicIntro.focus({preventScroll:true});document.querySelector('#pokaz').scrollIntoView({behavior:'instant',block:'start'})}
if(civicShowcaseLaunched)civicActivateShowcase();else{civicLiveDevice.hidden=true;civicIntro.hidden=false;document.querySelector('.demo-controls').hidden=true;document.querySelector('.demo-footer').hidden=true}
civicIntro.onclick=()=>{civicActivateShowcase();document.querySelector('[data-person="'+showcasePerson+'"]').focus({preventScroll:true})};
document.querySelector('#showRender').onclick=civicReturnToRender;
document.querySelectorAll('[data-person]').forEach(button=>button.addEventListener('click',civicActivateShowcase));
document.querySelector('#showMobileScene').addEventListener('change',civicActivateShowcase);
document.querySelector('.hero-actions a[href="#pokaz"]').addEventListener('click',()=>{civicActivateShowcase();document.querySelector('[data-person="'+showcasePerson+'"]').focus({preventScroll:true})});
let civicZoomScroll=0;document.querySelector('#showZoomApp').onclick=event=>{civicActivateShowcase();const layout=document.querySelector('.story-layout'),active=!layout.classList.contains('app-focus');if(active)civicZoomScroll=scrollY;layout.classList.toggle('app-focus',active);document.body.classList.toggle('app-zoomed',active);document.querySelector('#showExitZoom').hidden=!active;event.currentTarget.setAttribute('aria-pressed',String(active));event.currentTarget.textContent=active?'Wróć do opowieści':'Powiększ';scrollTo({top:active?0:civicZoomScroll,behavior:'instant'});civicFitDevices();if(active)document.querySelector('#showExitZoom').focus({preventScroll:true})};
document.querySelector('#showExitZoom').onclick=()=>{document.querySelector('#showZoomApp').click();document.querySelector('#showZoomApp').focus({preventScroll:true})};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('app-zoomed')){event.preventDefault();document.querySelector('#showExitZoom').click()}});

if(requestedScene&&civicShowcaseScene(showcasePerson,requestedScene)&&pitchUrl.searchParams.get('view')!=='render')civicPitchGoScene(showcasePerson,requestedScene);document.querySelectorAll('[data-person]').forEach(button=>button.addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))civicActivateShowcase()}));
