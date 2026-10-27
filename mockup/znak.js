/* ---------- Potwierdź swoje dane: jeden skaner. Skanujesz znak mObywatela podmiotu (telefonu obok albo strony na komputerze)
   i po Face ID przekazujesz mu swoje dane w zakresie, o który prosi. Znak to zmieniający się żeton w pierścieniu kropek. ---------- */
const DEV=(()=>{try{let d=sessionStorage.getItem('mobDev');if(!d){d=Math.random().toString(36).slice(2,10);sessionStorage.setItem('mobDev',d)}return d}catch(e){return Math.random().toString(36).slice(2,10)}})();
const QI={x:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',pc:'<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>',ph:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',inbox:'<path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"/><path d="M5.5 6.5h13L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5z"/><path d="M12 3v7M9.5 7.5 12 10l2.5-2.5"/>'};
const qsvg=(n,w=1.8)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${QI[n]||I[n]||''}</svg>`;
const hhmm=()=>new Date().toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
const mmss=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const API=(u,b)=>fetch(u,{...(b?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}:{cache:'no-store'}),signal:AbortSignal.timeout(12000)}).then(r=>r.json());
const E=x=>esc(String(x==null?'':x));
const SHARE_HISTORY_KEY='mobywatel-share-history-'+(OS.storageKey||OS.id);
const REVIEW_CASES_KEY='mobywatel-review-cases-'+(OS.storageKey||OS.id);
const rowsHTML=rows=>rows.map(([k,v])=>`<div class="drow"><span>${E(k)}</span>${v==='foto'?'<span class="dph"><span class="ph"></span></span>':`<b>${E(v)}</b>`}</div>`).join('');
function makeConsentData(cel,selected,photoId){
 if(!Array.isArray(selected)||selected.length===0)throw new Error('Brak wybranych danych');
 const dane={cel,rows:selected.map(([k,v])=>[k,v])};
 if(selected.some(([,v])=>v==='foto'))dane.foto=photoId;
 return dane;
}

/* moje dane (z portfela) i zakresy, o które może prosić znak */
const MOJE=Object.assign({foto:'foto'},OS.moje);
const ZAKRESY={
 tozsamosc:{nazwa:'Tożsamość',pola:[['Zdjęcie','foto'],['Imię i nazwisko','imie_nazwisko'],['Data urodzenia','data_urodzenia'],['PESEL','pesel'],['Dowód osobisty','dowod']]},
 pelnoletnosc:{nazwa:'Pełnoletność',pola:[['Zdjęcie','foto'],['Pełnoletność','pelnoletnosc']]},
 prawo_jazdy:{nazwa:'Wynajem samochodu',pola:[['Imię i nazwisko','imie_nazwisko'],['Uprawnienia do kierowania','prawo_jazdy']]},
 mstluczka:{nazwa:'Dane do oświadczenia',pola:[['Kierowca','imie_nazwisko'],['Pojazd','pojazd'],['OC','oc'],['Prawo jazdy','prawo_jazdy']]}
};
const wypelnij=pola=>pola.map(([l,k])=>[l,MOJE[k]||k]);

/* ---------- mój znak: żeton zmienia się co 30 s, serwer wie, do kogo należy ---------- */
let TOKEN=0,TOKEN_T=0,MOJ_CEL='tozsamosc',ZS=null,beatBusy=false;
function nowyToken(){TOKEN=Math.floor(Math.random()*65536);TOKEN_T=Date.now();rysujZnaki()}
function rysujZnaki(){document.querySelectorAll('.live').forEach(el=>{el.innerHTML=ZNAK.svg(TOKEN)});const b=$('#mojZnak');if(b)b.innerHTML=ZNAK.svg(TOKEN);const code=$('#cReceiverCode');if(code)code.textContent=String(TOKEN).padStart(6,'0')}
nowyToken();setInterval(nowyToken,30000);
new MutationObserver(()=>{if(document.querySelector('.live:empty'))rysujZnaki()}).observe(document.body,{childList:true,subtree:true});
async function beat(){
 if(document.visibilityState!=='visible'||beatBusy||!ZS)return;beatBusy=true;
 const z=ZAKRESY[MOJ_CEL];
 try{const j=await API('/api/znak/beat',{dev:DEV,token:TOKEN,kind:'telefon',kto:'Telefon z mObywatelem',cel:MOJ_CEL,zakres:z.pola});
  if(j.zmien)nowyToken();
  if(ZS){const w=$('#zx .wait');if(w&&!w.dataset.odm)w.innerHTML=j.skanuje?'<i></i>Druga osoba potwierdza przekazanie…':'<i></i>Czekam na dane…'}
  (j.otrzymane||[]).forEach(d=>odebrano(d))}catch(e){}finally{beatBusy=false}
}
setInterval(beat,5000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)beat()});

/* ---------- ekrany ---------- */
let PS=null;
function pMount(id='qrx'){let o=$('#'+id);if(!o){o=el(`<div class="qrx" id="${id}" role="dialog" aria-modal="true"></div>`);app.append(o)}return o}
function pScreen(html,cls='',id='qrx'){const o=pMount(id);o.className='qrx on '+cls;o.innerHTML=html;const title=o.querySelector('.qtop b');o.setAttribute('aria-label',title?.textContent||'Potwierdzenie danych');o.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>id==='qrx'?pFinish({ok:false}):zFinish({ok:false}));o.onkeydown=e=>{if(e.key!=='Tab')return;const f=[...o.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(x=>x.offsetParent!==null);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};requestAnimationFrame(()=>o.querySelector('button:not(:disabled)')?.focus());return o}
function pTop(t){return `<div class="qtop"><button class="qclose" data-close aria-label="Zamknij">${qsvg('x',2)}</button><b>${t}</b><span></span></div>`}
function pStopCam(){if(PS&&PS.stream){PS.stream.getTracks().forEach(t=>t.stop());PS.stream=null}if(PS)PS.run=false}
function pFinish(r){const s=PS;if(!s)return;pStopCam();clearInterval(s.tick);PS=null;const o=$('#qrx');if(o){o.classList.remove('on');setTimeout(()=>{if(!PS){o.innerHTML='';if(s.focusReturn?.isConnected)s.focusReturn.focus()}},320)}s.resolve(r)}

/* ---------- skaner ---------- */
function qrFlow(opt={}){
 if(PS)pFinish({ok:false});
 return new Promise(resolve=>{PS={resolve,opt,run:true,focusReturn:document.activeElement};opt.manual?civicManualScan():pScan()});
}
async function demoConsentFlow(opt={}){
 if(PS)pFinish({ok:false});
 const receiver='demo-'+DEV,token=Math.floor(Math.random()*65536),request={dev:receiver,token,kind:'web',kto:'AutoPlus',cel:'prawo_jazdy',zakres:ZAKRESY.prawo_jazdy.pola};
 if(opt.conflict){const other=Object.values(OSOBY).find(x=>x.id!==OS.id);request.expectedName=other.imie+' '+other.nazwisko;}
 const response=await API('/api/znak/beat',request);if(response?.error)throw new Error('Nie można uruchomić pokazu');
 return new Promise(resolve=>{PS={resolve,opt:{demo:true},run:false,focusReturn:document.activeElement};pConsent(request)});
}
function pRequestConflict(j){
 const current=MOJE.imie_nazwisko,st=PS;
 const o=pScreen(`${pTop('Sprawdź różnicę w danych')}<div class="qbody qconflict"><div class="qconflict-symbol">${svg('alert')}</div><h2>Prośba dotyczy innej osoby</h2><p class="qconflict-intro">Odbiorca wskazał w prośbie inne dane niż te w Twoim dokumencie. Wyjaśnij różnicę przed przekazaniem.</p><div class="qconflict-values"><div><small>Prośba · ${E(j.kto)}</small><b>${E(j.expectedName)}</b></div><div><small>mDowód</small><b>${E(current)}</b></div></div><p class="qconflict-result">Dane nie zostały przekazane.</p><div class="qconflict-actions"><button type="button" class="qbtn primary wide" id="saveConflict">Zapisz sprawę do wyjaśnienia</button><button type="button" class="qbtn ghost wide" id="leaveConflict">Wróć do dokumentów</button></div></div>`,'light');
 o.querySelector('#leaveConflict').onclick=()=>{pFinish({ok:false});if(typeof showProductTab==='function')showProductTab('start')};
 o.querySelector('#saveConflict').onclick=()=>{if(PS!==st)return;const id='driver-'+Date.now();try{const items=JSON.parse(localStorage.getItem(REVIEW_CASES_KEY)||'[]');items.push({id,title:'Wyjaśnij różnicę w danych',recipient:j.kto,expectedName:j.expectedName,currentName:current,state:'open',created:new Date().toISOString()});localStorage.setItem(REVIEW_CASES_KEY,JSON.stringify(items));pFinish({ok:false,reviewId:id})}catch(e){o.querySelector('.qconflict-result').textContent='Nie udało się zapisać sprawy. Dane nadal nie zostały przekazane.'}};
}
async function pScan(){
 const st=PS;
 const o=pScreen(`${pTop('Zeskanuj kod')}<div class="cam"><video playsinline muted autoplay></video><div class="guide"><span></span></div><p class="camhint">Uruchamiam aparat…</p></div>
  <div class="qscanfoot"><p class="lh">Zeskanuj kod na komputerze, aby się zalogować, lub kod odbiorcy danych. Zanim potwierdzisz, sprawdzisz serwis i zakres prośby.</p>
  <button class="qalt" id="cManualFromScan">Wpisz kod ręcznie</button><button class="qalt" id="pokazZnak">${qsvg('inbox',1.7)}Sprawdź dokument innej osoby</button></div>`,'dark scan');
 o.querySelector('#cManualFromScan').onclick=civicManualScan;
 o.querySelector('#pokazZnak').onclick=()=>{pFinish({ok:false});setTimeout(()=>przyjmijFlow({}),330)};
 const hint=t=>{const h=o.querySelector('.camhint');if(h)h.textContent=t};
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})}
 catch(e){hint('Brak dostępu do aparatu. Zezwól na aparat w ustawieniach przeglądarki.');return}
 if(PS!==st){stream.getTracks().forEach(t=>t.stop());return}
 st.stream=stream;const v=o.querySelector('video');v.srcObject=stream;try{await v.play()}catch(e){}
 o.querySelector('.cam').classList.add('live');hint('Szukam znaku…');
 const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});let last=null,lastT=0,busy=false;
 const loop=async()=>{
  if(!st.run||PS!==st)return;
  if(v.readyState>=2&&!busy){
   const W=480,H=Math.round(W*v.videoHeight/v.videoWidth)||360;cv.width=W;cv.height=H;cx.drawImage(v,0,0,W,H);
   const frame=cx.getImageData(0,0,W,H);let r=ZNAK.decode(frame.data,W,H);if(!r&&typeof jsQR==='function'){const decoded=jsQR(frame.data,W,H,{inversionAttempts:'dontInvert'});r=civicQrPayload(decoded?.data)}
   const g=o.querySelector('.guide');if(g)g.classList.toggle('seen',!!r);
   if(r&&r.token===TOKEN){hint('To Twój własny znak. Zeskanuj znak odbiorcy.');r=null}
   if(r){
    if(last===r.token&&Date.now()-lastT<1500){busy=true;hint('Rozpoznano znak, sprawdzam…');
     try{const j=await API('/api/znak/kto?t='+r.token+'&dev='+DEV);
      if(j&&j.dev){PS.opt.lookupToken=r.token;try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}pStopCam();pConsent(j);return}
      hint('Ten znak jest nieaktualny. Poproś o odświeżenie ekranu.')}catch(e){hint('Brak połączenia. Spróbuj jeszcze raz.')}
     busy=false}
    last=r.token;lastT=Date.now()}
  }
  setTimeout(loop,90);
 };
 loop();
}
function consentDefaultSelection(requested,preferredScope){
 const allowed={age:['pelnoletnosc'],id:['imie_nazwisko','foto'],licence:['prawo_jazdy']}[preferredScope];
 return requested.map(([,key])=>!allowed||allowed.includes(key));
}
function pConsent(j,selectedFields=null){
 if(j.cel==='logowanie'){civicLoginConsent(j);return}
 if(j.expectedName&&j.expectedName.trim().toLocaleLowerCase('pl')!==MOJE.imie_nazwisko.trim().toLocaleLowerCase('pl')){pRequestConflict(j);return}
 const st=PS,requested=j.zakres||ZAKRESY.tozsamosc.pola,defaults=selectedFields?requested.map(([label])=>selectedFields.some(([name])=>name===label)):consentDefaultSelection(requested,PS.opt?.preferredScope),rows=wypelnij(requested),zakres=ZAKRESY[j.cel]||ZAKRESY.tozsamosc,nazwa=zakres.nazwa;
 const zrodlo=j.cel==='prawo_jazdy'?'mDowód i mPrawo jazdy':j.cel==='mstluczka'?'mPrawo jazdy i moje pojazdy':'mDowód';
 const rowId=i=>`claim-${i}`;
 const o=pScreen(`${pTop('Przekazanie danych')}<div class="qbody">
  <div class="who"><span class="wico">${qsvg(j.kind==='web'?'pc':'ph')}</span><div><small>${j.kind==='web'?'Prośba ze strony internetowej':'Prośba z telefonu obok'}</small><b>${E(j.kto)}</b></div></div>
  <section class="request-purpose" aria-label="Cel prośby"><span>CEL PROŚBY</span><b>${E(nazwa==='Wynajem samochodu'?'Umowa najmu i potwierdzenie uprawnień kierowcy':nazwa)}</b><small>Źródło: ${E(zrodlo)}</small></section>
  <div class="scope-head"><h3 class="qh">Zakres danych</h3><span>Możesz go zmienić</span></div>
  <div class="dlist scope-list" role="group" aria-label="Wybierz dane do udostępnienia">${rows.map(([k,v],i)=>`<label class="scope-row" for="${rowId(i)}"><span class="scope-check"><input id="${rowId(i)}" type="checkbox" ${defaults[i]?'checked':''}><i aria-hidden="true">${svg('check')}</i></span><span class="scope-copy"><b>${E(k)}</b><small>${E(v==='foto'?'Zdjęcie z dokumentu':v)}</small>${!defaults[i]?'<em class="scope-extra">Poza wybranym zakresem</em>':''}</span></label>`).join('')}</div>
  <p class="scope-state" role="status" aria-live="polite"></p>
  <p class="qnote">Udostępnisz tylko zaznaczone dane, jednorazowo.</p>
  <div class="qbtns"><button class="qbtn ghost">Odrzuć prośbę</button><button class="qbtn primary">Udostępnij <span class="share-count"></span></button></div></div>`,'light');
 const chosen=()=>[...o.querySelectorAll('.scope-row input:checked')].map(x=>rows[Number(x.id.replace('claim-',''))]);
 const share=o.querySelector('.qbtn.primary'),state=o.querySelector('.scope-state');
 const refresh=()=>{const n=chosen().length;share.disabled=n===0;share.querySelector('.share-count').textContent=n?`(${n})`:'';state.textContent=n?`Zaznaczone dane: ${n} z ${rows.length}.${n<rows.length?' Odbiorca może poprosić o uzupełnienie.':''}`:(st.opt?.preferredScope==='age'&&!defaults.some(Boolean)?'Odbiorca nie prosi o samo potwierdzenie 18+. Pozostałe dane są odznaczone. Możesz odrzucić prośbę.':'Nic nie zostanie udostępnione. Możesz odrzucić prośbę.')};
 o.querySelectorAll('.scope-row input').forEach(x=>x.addEventListener('change',refresh));refresh();
 o.querySelector('.qbtn.ghost').onclick=()=>{API('/api/znak/przekaz',{to:j.dev,from:DEV,ok:false}).catch(()=>{});pFinish({ok:false})};
 share.onclick=()=>{const selected=chosen();if(!selected.length||share.disabled)return;pConsentReview(j,selected,()=>pConsent(j,selected),async(confirmScreen,confirmButton)=>{
  const share=confirmButton,o=confirmScreen;
  const originalLabel=share.innerHTML;share.disabled=true;share.setAttribute('aria-busy','true');share.textContent='Udostępnianie…';o.querySelectorAll('.scope-row input,.qbtn.ghost,.qclose').forEach(x=>x.disabled=true);
  await faceid();if(PS!==st)return;
  try{
   const dane=makeConsentData(j.cel,selected,OS.id);
   const response=await API('/api/znak/przekaz',{to:j.dev,from:DEV,ok:true,dane});
   if(!response||response.ok!==true)throw new Error('Brak potwierdzenia');
  }catch(e){
   if(PS!==st)return;share.innerHTML=originalLabel;share.removeAttribute('aria-busy');o.querySelectorAll('.scope-row input,.qbtn.ghost,.qclose').forEach(x=>x.disabled=false);share.disabled=false;let error=o.querySelector('.c-consent-error');if(!error){error=document.createElement('p');error.className='c-consent-error';error.setAttribute('role','status');o.querySelector('.qbtns').before(error)}error.textContent='Nie udało się potwierdzić przekazania. Sprawdź ekran odbiorcy przed ponowieniem.';return;
  }
  const t=hhmm();
  try{const log=JSON.parse(localStorage.getItem(SHARE_HISTORY_KEY)||'[]');log.push({to:j.kto,fields:selected.map(([k])=>k),at:new Date().toISOString(),time:new Date().toLocaleString('pl-PL',{dateStyle:'medium',timeStyle:'short'})});localStorage.setItem(SHARE_HISTORY_KEY,JSON.stringify(log.slice(-30)))}catch(e){}
  const o2=pScreen(`${pTop('Gotowe')}<div class="qbody qdone"><div class="bigok">${svg('check')}</div><h2>Dane przekazane</h2><p>${E(j.kto)}<br>${t}</p>
   <div class="dlist small">${selected.map(([k])=>`<div class="drow"><span>${E(k)}</span><b>${svg('check')}</b></div>`).join('')}</div><button class="qbtn primary wide">Gotowe</button></div>`,'light');
  o2.querySelector('.qbtn').onclick=()=>pFinish({ok:true,wynik:{przekazano:true,odbiorca:j.kto,zakres:selected.map(x=>x[0]),godzina:t}});
 });};
}

/* ---------- mój znak: przyjmowanie danych od osoby, która go zeskanuje ---------- */
function przyjmijFlow(opt={}){
 if(ZS)zFinish({ok:false});
 MOJ_CEL=opt.cel&&ZAKRESY[opt.cel]?opt.cel:'tozsamosc';
 return new Promise(resolve=>{ZS={resolve,opt};zShow();beat()});
}
function zShow(){
 const st=ZS,wyb=['tozsamosc','pelnoletnosc','prawo_jazdy'];
 const o=pScreen(`${pTop('Sprawdź dokument innej osoby')}<div class="qbody c mz">
  <div class="mojznak" id="mojZnak">${ZNAK.svg(TOKEN)}</div>
  <p class="qlead c" data-h>Na drugim telefonie wybierz <b>Kod QR → Zeskanuj kod</b>. Bez aparatu wybierz <b>Wpisz kod ręcznie</b>.</p><strong class="c-qr-number" id="cReceiverCode">${String(TOKEN).padStart(6,'0')}</strong>
  ${MOJ_CEL==='mstluczka'?'<p class="qnote c">Zakres: dane do oświadczenia o zdarzeniu</p>':`<div class="seg light">${wyb.map(k=>`<button data-c="${k}" class="${k===MOJ_CEL?'on':''}">${ZAKRESY[k].nazwa}</button>`).join('')}</div>`}
  <div class="wait"><i></i>Czekam na dane…</div></div>`,'light','zx');
 o.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{MOJ_CEL=b.dataset.c;o.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b));nowyToken();beat()});
}
function zFinish(r){const s=ZS;ZS=null;MOJ_CEL='tozsamosc';const o=$('#zx');if(o){o.classList.remove('on');setTimeout(()=>{if(!ZS)o.innerHTML=''},320)}clearInterval(s&&s.tick);if(s)s.resolve(r)}
function odebrano(d){
 if(!d.ok){if(ZS){const w=$('#zx .wait');if(w){w.dataset.odm=1;w.innerHTML='<i></i>Druga osoba odmówiła. Możesz poprosić jeszcze raz.';setTimeout(()=>{delete w.dataset.odm},6000)}}return}
 if(!ZS)ZS={resolve:()=>{},opt:{}};
 const st=ZS,rows=(d.dane&&d.dane.rows)||[],foto=rows.some(r=>r[1]==='foto'),rest=rows.filter(r=>r[1]!=='foto');
 const name=(rows.find(r=>r[0]==='Imię i nazwisko'||r[0]==='Kierowca')||[])[1],cel=d.dane&&d.dane.cel,z=ZAKRESY[cel]||ZAKRESY.tozsamosc;let left=180;
 try{navigator.vibrate&&navigator.vibrate([80,40,80])}catch(e){}
 const label=name||(cel==='pelnoletnosc'?'Osoba pełnoletnia':'Przekazane dane');
 const wynik={imie_nazwisko:name||null,zakres:z.nazwa,dane:Object.fromEntries(rest),status:'przekazane'};
 const o=pScreen(`${pTop(z.nazwa)}<div class="qbody">
  <div class="okbar">${svg('check')}<b>Dane z portfela</b><span>${hhmm()}</span></div>
  <div class="person">${foto?`<span class="pav photo"><span class="ph" style="background-image:url(assets/portrait-${/^[a-z]+$/.test(d.dane.foto||'')?d.dane.foto:'marta'}-r45.jpg)"></span></span>`:''}<div><b>${E(label)}</b><small>Przekazany zakres</small></div></div>
  ${d.dane&&d.dane.pojazd&&d.dane.pojazd.model&&typeof SYLWETKI!=='undefined'?`<div class="otrz-syl">${SYLWETKI.svg(String(d.dane.pojazd.model),String(d.dane.pojazd.kolor||''))}</div>`:''}
  <div class="dlist">${rowsHTML(rest.filter(r=>r[1]!==name))}</div>
  <p class="qnote c">Dane znikną z ekranu za <b class="pt">${mmss(left)}</b></p>
  <button class="qbtn primary wide">${cel==='mstluczka'?'Dalej':'Zakończ'}</button></div>`,'light','zx');
 st.tick=setInterval(()=>{left=Math.max(0,left-1);const b=o.querySelector('.pt');if(b)b.textContent=mmss(left);if(!left)zFinish({ok:true,wynik})},1000);
 o.querySelector('.qbtn').onclick=()=>zFinish({ok:true,wynik});
}
/* znak na karcie mDowodu: dotknięcie powiększa go, by druga osoba mogła go zeskanować */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.face .live');if(!t)return;e.preventDefault();e.stopPropagation();przyjmijFlow({})},true);
/* „Pokaż dane” na mDowodzie; po zminimalizowaniu aplikacji dane znów są ukryte */
function odkryjDane(e){const t=e.target.closest&&e.target.closest('.face .reveal');if(!t)return false;e.preventDefault();e.stopPropagation();app.classList.remove('ukryte');return true}
['pointerdown','pointerup','click'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.closest&&e.target.closest('.face .reveal')){if(ev==='click')odkryjDane(e);else e.stopPropagation()}},true));
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&odkryjDane(e))return},true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')app.classList.add('ukryte')});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(PS){if(PS.cancelUI)PS.cancelUI();else pFinish({ok:false})}else if(ZS)zFinish({ok:false})}});
{const b=$('#qrBtn');if(b)b.onclick=()=>qrFlow({})}

function pConsentReview(j,selected,back,confirm){const st=PS,screen=pScreen(`${pTop('Sprawdź przed przekazaniem')}<div class="qbody c-consent-review"><div class="who"><span class="wico">${qsvg(j.kind==='web'?'pc':'ph')}</span><div><small>Odbiorca</small><b>${E(j.kto)}</b></div></div><p class="qnote">Jednorazowe przekazanie wybranych danych</p><div class="dlist">${rowsHTML(selected)}</div><p class="qnote">Pozostałe dane zostają w telefonie.</p><div class="qbtns"><button type="button" class="qbtn primary">Potwierdź przekazanie</button><button type="button" class="qbtn ghost">Zmień zakres</button></div></div>`,'light');screen.querySelector('.qbtn.ghost').onclick=back;screen.querySelector('.qbtn.primary').onclick=()=>{if(PS===st)confirm(screen,screen.querySelector('.qbtn.primary'))}}
