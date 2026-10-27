/* First-party aggregate analytics. Event requests omit cookies and never contain form text or URLs. */
(()=>{
 const excluded=()=>{if(new URLSearchParams(location.search).get('qa')==='1')return true;try{return localStorage.getItem('civic-analytics-ignore')==='1'}catch{return false}};if(excluded())return;
 const sendParent=event=>window.parent.postMessage({type:'civic-aggregate-event',event},location.origin);
 const assistantClick=e=>e.target.closest?.('#cGlobalAssistant,.l-assistant-button');
 const mapsClick=e=>{const a=e.target.closest?.('a[href]');if(!a)return false;try{const u=new URL(a.href);return /(^|\.)google\.[a-z.]+$/.test(u.hostname)&&u.pathname.startsWith('/maps')||u.hostname==='maps.app.goo.gl'}catch{return false}};
 if(window.parent!==window){
  let last=0;const active=()=>{if(performance.now()-last>2000){last=performance.now();sendParent('active')}};
  document.addEventListener('pointerdown',active,{passive:true});document.addEventListener('keydown',active);document.addEventListener('scroll',active,{passive:true,capture:true});
  document.addEventListener('click',e=>{if(assistantClick(e))sendParent('assistant_open');if(mapsClick(e))sendParent('maps_open')});return;
 }
 const page=({'/':'strona','/pokaz.html':'strona','/aplikacja':'aplikacja','/aplikacja/':'aplikacja','/index.html':'aplikacja','/materialy.html':'materialy','/technology.html':'technologia'})[location.pathname];if(!page)return;
 const pref=()=>{try{return localStorage.getItem('civic-visit-choice')}catch{return null}};
 const post=(path,body,cookies=false)=>{if(excluded())return Promise.resolve();return fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:cookies?'same-origin':'omit',referrerPolicy:'no-referrer',body:JSON.stringify(body),keepalive:true}).catch(()=>{})};
 const metric=(event,target='',seconds)=>post('/api/analytics',{page,event,...(target?{target}:{}),...(seconds?{seconds}:{})});
 const source=()=>{try{if(!document.referrer)return 'direct';const u=new URL(document.referrer),h=u.hostname;if(u.origin===location.origin)return 'internal';if(h==='mobywatel.ai'||h.endsWith('.mobywatel.ai'))return 'challenge';if(h==='github.com'||h.endsWith('.github.com'))return 'github';if(/(^|\.)google\.[a-z.]+$/.test(h))return 'google';if(h==='bing.com'||h.endsWith('.bing.com'))return 'bing';for(const [domain,key]of [['linkedin.com','linkedin'],['facebook.com','facebook'],['x.com','x'],['t.co','x']])if(h===domain||h.endsWith('.'+domain))return key;return 'other'}catch{return 'direct'}};
 const signal=(extra={})=>post('/api/page-view',{page,cookie:pref()==='yes',source:source(),device:innerWidth<=760?'small':innerWidth<=1100?'medium':'large',...extra},true);
 signal();
 window.addEventListener('civic-scene-opened',e=>{if(page==='aplikacja'&&typeof e.detail?.scene==='string')metric('scene_open',e.detail.scene)});
 let demoCounted=false;const demo=()=>{if(demoCounted)return;const controls=document.querySelector('.demo-controls'),frame=document.querySelector('#showApp');if(page==='aplikacja'||controls&&!controls.hidden&&frame?.getAttribute('aria-busy')==='false'){demoCounted=true;metric('demo_open')}};
 demo();const controls=document.querySelector('.demo-controls'),frame=document.querySelector('#showApp');if(controls){const observer=new MutationObserver(demo);observer.observe(controls,{attributes:true,attributeFilter:['hidden']});if(frame)observer.observe(frame,{attributes:true,attributeFilter:['aria-busy']})}
 let lastActivity=performance.now(),lastTick=performance.now(),activeSeconds=0;
 const activity=()=>{lastActivity=performance.now()};document.addEventListener('pointerdown',activity,{passive:true});document.addEventListener('keydown',activity);document.addEventListener('scroll',activity,{passive:true});
 const tick=()=>{const now=performance.now(),delta=Math.min(5,(now-lastTick)/1000);lastTick=now;if(document.visibilityState==='visible'&&now-lastActivity<60000)activeSeconds+=delta};
 const flush=()=>{tick();const seconds=Math.min(30,Math.floor(activeSeconds));if(seconds>0){activeSeconds-=seconds;metric('engagement','',seconds)}};
 setInterval(tick,5000);setInterval(flush,15000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();else{lastTick=performance.now();activity()}});window.addEventListener('pagehide',flush);
 const depths=new Set();document.addEventListener('scroll',()=>{if(page!=='strona')return;const distance=document.documentElement.scrollHeight-innerHeight;if(distance<100)return;const depth=Math.min(100,Math.floor(scrollY/distance*100));for(const level of [25,50,75,100])if(depth>=level&&!depths.has(level)){depths.add(level);metric('scroll',String(level))}},{passive:true});
 document.addEventListener('click',e=>{
  const person=e.target.closest?.('[data-person]');if(person)metric('person_select',person.dataset.person);
  if(assistantClick(e))metric('assistant_open');if(mapsClick(e))metric('maps_open');
  const a=e.target.closest?.('a[href]');if(!a)return;
  try{const u=new URL(a.href);if(u.hostname==='github.com'&&u.pathname.replace(/\/$/,'')==='/mateuszkozlowski/mobywatel-2028')metric('github_click');if(u.origin===location.origin&&u.pathname.startsWith('/materialy/')&&u.pathname.endsWith('.pdf'))metric('pdf_open');if(a.id==='showFullApp'||a.classList.contains('mobile-demo-entry'))metric('app_full')}catch{}
 });
 const seen=new Set();window.addEventListener('message',e=>{
  if(!frame||e.origin!==location.origin||e.source!==frame.contentWindow)return;
  if(e.data?.type==='civic-aggregate-event'){if(e.data.event==='active')activity();else if(['assistant_open','maps_open'].includes(e.data.event))metric(e.data.event);return}
  if(e.data?.type==='mobywatel-demo-ready')demo();
  if(e.data?.type==='mobywatel-demo-status'&&e.data.ok===true&&typeof e.data.scene==='string'){
   const key=e.data.person+':'+e.data.requestId+':'+e.data.scene;if(seen.has(key))return;seen.add(key);if(seen.size>100)seen.delete(seen.values().next().value);metric('scene_open',e.data.scene)
  }
 });
 // Cookie choice concerns only the optional daily browser count. Actions remain anonymous totals.
 const nav=document.querySelector('.footer-nav');if(!nav)return;
 const trigger=document.createElement('button');trigger.type='button';trigger.textContent='Statystyki odwiedzin';trigger.style.cssText='font:inherit;color:inherit;background:none;border:0;padding:0;min-height:44px;cursor:pointer;text-align:left';nav.append(trigger);
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-labelledby','visitPrivacyTitle');dialog.style.cssText='border:1px solid #dae1ed;border-radius:24px;padding:28px;width:min(440px,calc(100% - 32px));max-height:calc(100dvh - 32px);overflow:auto;box-sizing:border-box;color:#142033;background:#fff;font:400 14px/1.6 system-ui,sans-serif';
 dialog.innerHTML='<form method="dialog"><h2 id="visitPrivacyTitle" tabindex="-1" autofocus style="font-size:23px;line-height:1.2;margin:0 0 16px">Statystyki odwiedzin</h2><p>Zliczamy odsłony, kliknięcia, otwierane scenariusze i przybliżony czas aktywności. Statystyki zawierają tylko sumy oraz ogólne kategorie źródeł ruchu i ekranów. Nie zawierają IP ani treści spraw.</p><p>Opcjonalne, losowe cookie rozróżnia przeglądarki przez 24 godziny. Nie łączymy z nim kliknięć ani spraw. Dane są na serwerze autora. Panel obejmuje 90 dni szczegółów; starsze usuwamy przy kolejnym zapisie.</p><p id="visitPrivacyStatus" role="status"></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button value="yes">Zezwól na cookie</button><button value="no">Bez cookie</button><button value="close">Zamknij</button></div></form>';
 for(const b of dialog.querySelectorAll('button'))b.style.cssText='min-height:44px;border:1px solid #ccd6e7;background:#f1f4fa;color:#244b8d;border-radius:24px;padding:10px 16px;font:600 13px/20px system-ui,sans-serif;cursor:pointer';
 document.body.append(dialog);trigger.addEventListener('click',()=>{dialog.querySelector('#visitPrivacyStatus').textContent=pref()==='yes'?'Cookie jest włączone. Możesz je wyłączyć poniżej.':'Cookie jest wyłączone.';dialog.showModal()});
 dialog.addEventListener('close',()=>{if(!['yes','no'].includes(dialog.returnValue))return;try{localStorage.setItem('civic-visit-choice',dialog.returnValue)}catch{}signal({cookie:dialog.returnValue==='yes',count:false});trigger.focus()});
})();
