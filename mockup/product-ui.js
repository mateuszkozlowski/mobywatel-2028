function civicPreferenceKey(key){return 'mobywatel-'+key+(OS.storageKey?'-'+OS.storageKey:'')}
/* Główna warstwa produktu: zadania, portfel i ustawienia mają osobne, stałe miejsca.
   To demonstracyjny UI z fikcyjnymi danymi; scenariusze usługowe pozostają symulacją. */
const PUI=$('#productUI'),PNAV=$('#productNav');
let activeProductTab='start';
let walletTransition=null,walletTrigger=null;
const settingKey=key=>key.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
const walletMotionAllowed=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&app.dataset.reduceMotion!=='true'&&app.dataset.inputKind!=='keyboard';
function openWalletItem(id,trigger){
 walletTrigger=trigger;
 if(walletTransition){walletTransition.skipTransition();openDoc(id);return}
 if(!document.startViewTransition||!walletMotionAllowed()||!trigger.classList.contains('w-credential')){openDoc(id);return}
 let target;trigger.style.viewTransitionName='wallet-card';app.dataset.cardTransition='true';
 const transition=document.startViewTransition(()=>{trigger.style.viewTransitionName='';openDoc(id);target=$('#detail .w-document-display .w-credential');if(target)target.style.viewTransitionName='wallet-card'});
 walletTransition=transition;transition.ready.catch(()=>{});transition.finished.catch(()=>{}).finally(()=>{trigger.style.viewTransitionName='';if(target)target.style.viewTransitionName='';if(walletTransition===transition){walletTransition=null;delete app.dataset.cardTransition}});
}
const PICON={home:'<path d="m3.5 10 8.5-7 8.5 7v9.5a1 1 0 0 1-1 1h-5.2v-6.2H9.7v6.2H4.5a1 1 0 0 1-1-1z"/>',
 cases:'<rect x="4" y="4.5" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h4M9 2.8h6"/>',
 docs:'<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M10 12h5M10 16h5"/>',
 profile:'<circle cx="12" cy="8" r="3.3"/><path d="M5.5 20c.7-3.1 3-5 6.5-5s5.8 1.9 6.5 5"/>',
 search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
 chev:'<path d="m9 6 6 6-6 6"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
 sparkle:'<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
 check:'<path d="m5 12 4.3 4.3L19 6.7"/>'};
const psvg=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PICON[n]||I[n]||I.doc}</svg>`;
const escP=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tileRun(x){openProductCase(TILES.indexOf(x))}
function docSummary(d){
 if(!d)return {sub:'',status:'Dokument niedostępny'};
 if(d.id==='dowod')return {sub:'Tożsamość',status:`Dowód osobisty ważny do ${(d.f.find(x=>x[0]==='Dowód ważny do')||[])[1]||'—'}`};
 if(d.id==='pj'){const f=d.f.find(x=>x[0].startsWith('Waż'));return {sub:`Kategorie ${(d.f.find(x=>x[0]==='Kategorie')||[])[1]||'—'}`,status:f?`${f[0]} ${f[1]}`:'Zobacz zakres uprawnień'}}
 if(d.id==='auto'){if(d.more&&d.more.length){return {sub:`${d.more.length+1} pojazdy`,status:`${d.more.length+1} pojazdy w kolekcji`}}const key=d.alert&&/badanie/i.test(d.alert)?'Badanie do':'OC do';const val=(d.f.find(x=>x[0]===key)||[])[1];return {sub:d.model||d.who||'Pojazd',status:val?`${key.replace(' do','')} ${val}`:'Sprawdź status'}}
 return {sub:d.id==='kdr'?'Uprawnienie rodzica':d.id==='leg'?'Status studenta':d.name,status:d.sub};
}
function renderProductNav(){
 const tabs=[['start','Start','home'],['cases','Sprawy','cases'],['docs','Dokumenty','docs'],['safety','Alerty','shield'],['profile','Profil','profile']];
 PNAV.style.setProperty('--nav-count',tabs.length);PNAV.style.setProperty('--nav-index',tabs.findIndex(x=>x[0]===activeProductTab));
 PNAV.innerHTML=tabs.map(([id,label,icon])=>`<button type="button" data-tab="${id}" aria-current="${activeProductTab===id?'page':'false'}">${psvg(icon)}<span>${label}</span></button>`).join('');
 PNAV.querySelectorAll('button').forEach(b=>b.onclick=()=>showProductTab(b.dataset.tab));
}
function parsedDeadline(raw){const text=String(raw||''),iso=text.match(/(?:^|\D)(\d{4})-(\d{2})-(\d{2})(?!\d)/),pl=text.match(/(?:^|\D)(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/);if(!iso&&!pl)return null;const day=typeof civicCalendarDay==='function'?civicCalendarDay():new Date().toISOString().slice(0,10),y=Number(iso?iso[1]:pl[3]||day.slice(0,4)),month=Number(iso?iso[2]:pl[2]),date=Number(iso?iso[3]:pl[1]),d=new Date(Date.UTC(y,month-1,date,12));if(d.getUTCFullYear()!==y||d.getUTCMonth()!==month-1||d.getUTCDate()!==date)return null;return {date:d,delta:Math.round((d-Date.parse(day+'T12:00:00Z'))/86400000),label:new Intl.DateTimeFormat('pl-PL',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(d)}}
function deadlineText(raw){const p=parsedDeadline(raw);if(!p)return raw;const base=String(raw).replace(/,?\s*za\s+\d+\s+dni?\s*,?\s*/i,'').replace(/\d{1,2}\.\d{1,2}(?:\.\d{4})?/,p.label).trim();return p.delta<0?`Termin minął: ${base}`:p.delta===0?`Termin dziś: ${base}`:base}
function caseRow(x,i){const due=parsedDeadline(x.d);return `<button type="button" class="p-case ${x.u?'needs-action':''} ${due&&due.delta<=0?'overdue':''}" data-case="${i}"><span class="p-case-icon">${svg(x.i||'doc')}</span><span class="p-case-main"><b>${escP(x.h)}</b><small>${escP(x.s||x.d)}</small><em>${escP(deadlineText(x.d))}</em></span>${psvg('chev')}</button>`}
function docRow(d){const s=docSummary(d);return `<button type="button" class="p-doc" data-doc="${escP(d.id)}"><span class="p-doc-icon tone-${d.id}">${svg(d.id==='auto'?'car':d.id==='dowod'?'id':d.id==='pj'?'doc':'shield')}</span><span class="p-doc-main"><b>${escP(d.name)}</b><small>${escP(s.sub)}</small><em>${escP(s.status)}</em></span>${psvg('chev')}</button>`}
function walletShortcut(d){const count=d.id==='auto'?`${1+(d.more||[]).length} ${(d.more||[]).length?'pojazdy':'pojazd'}`:`Kategorie ${(d.f.find(x=>x[0]==='Kategorie')||[])[1]||'—'}`;return `<button class="w-shortcut" type="button" data-doc="${d.id}"><span class="w-shortcut-icon tone-${d.id}">${svg(d.id==='auto'?'car':'doc')}</span><span><b>${d.id==='auto'?'Pojazdy':'Prawo jazdy'}</b><small>${escP(count)}</small></span>${psvg('chev')}</button>`}
function credentialFace(d,interactive=true){
 if(d.id==='auto'){
  const count=1+(d.more||[]).length,oc=(d.f.find(x=>x[0]==='OC do')||[])[1]||'Sprawdź dane',inspection=(d.f.find(x=>x[0]==='Badanie do')||[])[1]||'Sprawdź dane';
  return `<span class="w-card-top"><b>${count>1?'Moje pojazdy':escP(d.model)}</b></span><span class="w-card-vehicle"><small>${count>1?`${escP(d.model)} · 1 z ${count}`:'Numer rejestracyjny'}</small><strong>${escP(d.plate)}</strong></span><span class="w-card-vehicle-status"><span><small>OC do</small><b>${escP(oc)}</b></span><span><small>Badanie do</small><b>${escP(inspection)}</b></span></span><span class="w-card-footer"><span>${interactive?`Otwórz dane ${count>1?'pojazdów':'pojazdu'}`:''}</span>${interactive?psvg('chev'):''}</span>`;
 }
 const categories=(d.f.find(x=>x[0]==='Kategorie')||[])[1]||'B';
 const body=d.id==='dowod'?`<span class="w-card-person"><img src="assets/portrait-${OS.id}-r45.jpg" width="50" height="65" alt=""><span><small>Imię i nazwisko</small><strong>${escP(OS.imie)}<br>${escP(OS.nazwisko)}</strong></span></span>`:d.id==='pj'?`<span class="w-card-entitlement"><span class="w-category"><small>Kategorie</small><strong>${escP(categories)}</strong></span><span class="w-card-owner"><strong>${escP(OS.imie)} ${escP(OS.nazwisko)}</strong><small>${escP(docSummary(d).status)}</small></span></span>`:`<span class="w-card-entitlement"><span class="w-card-owner"><strong>${escP(OS.imie)} ${escP(OS.nazwisko)}</strong>${d.id==='kdr'||d.id==='leg'?`<small>${escP(docSummary(d).sub)}</small>`:''}<small>${escP(d.sub)}</small></span></span>`;
 const sensitive=d.rows.find(([k])=>/pesel/i.test(k))||d.rows.find(([k])=>/numer blankietu|numer karty|numer albumu/i.test(k));
 const hiddenIdentifier=sensitive?`<span class="w-masked-id"><small>${escP(sensitive[0])}</small><strong>•••• ${escP(String(sensitive[1]).slice(-3))}</strong></span>`:'';
 const footer=interactive?`<span>Otwórz dokument</span>${psvg('chev')}`:`${hiddenIdentifier}${d.id==='dowod'?`<span class="w-card-validity">${escP(docSummary(d).status)}</span>`:psvg('lock')}`;
 return `<span class="w-card-top"><b translate="no">${escP(d.name)}</b></span>${body}<span class="w-card-footer">${footer}</span>`;
}
function credentialCard(d,slot=null,front=true){const vehicle=d.id==='auto';const title=vehicle?(d.more?.length?'Moje pojazdy':d.model):d.name;return `<button type="button" class="w-credential ${vehicle?'w-vehicle-card':''} ${slot===null?'w-library-card':`w-stack-card ${front?'is-front':'is-tab'}`}" style="${vehicle?'background-color:#314757;':`background-image:linear-gradient(180deg,rgba(5,23,45,.28),rgba(5,23,45,.16)),url('${d.img}');`}${slot===null?'':`--slot:${slot};z-index:${slot+1}` }" data-doc="${d.id}" aria-label="${escP(title)}.${vehicle?'':` ${escP(docSummary(d).sub)}.`} Otwórz ${vehicle?'dane pojazdu':'dokument'}">${front?credentialFace(d):`<span class="w-card-top"><b translate="no">${escP(title)}</b>${vehicle?'<small>Pojazd</small>':''}</span>`}</button>`}
function homeView(){
 const credentials=DOCS.slice().sort((a,b)=>({auto:0,kdr:1,leg:1,pj:2,dowod:3}[a.id]-{auto:0,kdr:1,leg:1,pj:2,dowod:3}[b.id]));
 const t=TILES[0],reviews=readReviewCases().filter(x=>x.state==='open'),review=reviews[0];
 return `<div class="p-page p-home w-home"><div class="w-page-head"><h1>Twój portfel</h1><button type="button" class="w-text-action" data-goto="docs">Wszystkie ${psvg('chev')}</button></div>
  <div class="w-wallet-stack" style="--count:${credentials.length}">${credentials.map((d,i)=>credentialCard(d,i,i===credentials.length-1)).join('')}</div>
  ${review?`<section class="w-attention"><div class="w-attention-head"><h2>Do wyjaśnienia</h2><button type="button" data-goto="cases">Sprawy ${psvg('chev')}</button></div>${reviewRow(review)}</section>`:t?`<section class="w-attention" aria-labelledby="w-attention-title"><div class="w-attention-head"><h2 id="w-attention-title">Wymaga uwagi</h2><button type="button" data-goto="cases">Sprawy (${TILES.length}) ${psvg('chev')}</button></div><button class="w-next-case" type="button" data-case="0"><span class="w-case-mark">${svg(t.i||'doc')}</span><span><b>${escP(t.h)}</b><small>${escP(deadlineText(t.d))}</small></span>${psvg('chev')}</button></section>`:''}
  <button type="button" class="w-find" id="pAssist">${psvg('search')}<span>Znajdź usługę lub opisz sytuację</span>${psvg('chev')}</button>
  </div>`;
}
function readReviewCases(){try{const rows=JSON.parse(localStorage.getItem(REVIEW_CASES_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch(e){return []}}
function reviewRow(r){return `<button type="button" class="p-case needs-action" data-review-id="${escP(r.id)}"><span class="p-case-icon">${psvg('alert')}</span><span class="p-case-main"><b>${escP(r.title)}</b><small>${escP(r.recipient)} · różne dane w prośbie</small><em>${r.state==='resolved'?'Wyjaśniona przez Ciebie':'Dane nie zostały przekazane'}</em></span>${psvg('chev')}</button>`}
function openReviewCase(id){
 const r=readReviewCases().find(x=>x.id===id);if(!r)return;
 activeProductTab='cases';renderProductNav();
 PUI.innerHTML=`<div class="p-page w-case-detail"><button class="p-back" type="button" id="reviewBack">${psvg('chev')}Sprawy</button><h1 tabindex="-1">${escP(r.title)}</h1><div class="qconflict-values"><div><small>Prośba · ${escP(r.recipient)}</small><b>${escP(r.expectedName)}</b></div><div><small>mDowód</small><b>${escP(r.currentName)}</b></div></div><p class="qconflict-result">Dane nie zostały przekazane.</p><h2 class="review-next-heading">Co dalej</h2><p class="w-case-context">Poproś odbiorcę o sprawdzenie danych w prośbie. Osoba, której dotyczy prośba, powinna potwierdzić własne dane.</p>${r.state==='open'?'<button type="button" class="p-primary" id="resolveReview">Mam to wyjaśnione</button>':'<p class="p-intro">Oznaczona przez Ciebie jako wyjaśniona.</p>'}<p class="p-demo" id="reviewResult" role="status">Sprawa zapisana na tym urządzeniu.</p></div>`;
 $('#reviewBack').onclick=()=>showProductTab('cases');
 const resolve=$('#resolveReview');if(resolve)resolve.onclick=()=>{try{const rows=readReviewCases();const item=rows.find(x=>x.id===id);item.state='resolved';item.resolved=new Date().toISOString();localStorage.setItem(REVIEW_CASES_KEY,JSON.stringify(rows));openReviewCase(id)}catch(e){$('#reviewResult').textContent='Nie udało się zapisać zmiany. Spróbuj ponownie.'}};
 PUI.scrollTo(0,0);requestAnimationFrame(()=>PUI.querySelector('h1')?.focus({preventScroll:true}));
}
function casesView(){
 const actionable=TILES.filter(x=>x.u),other=TILES.filter(x=>!x.u),reviews=readReviewCases().filter(x=>x.state==='open'),resolved=readReviewCases().filter(x=>x.state==='resolved');
 return `<div class="p-page"><p class="p-eyebrow">TWOJE SPRAWY</p><h1>Sprawy i terminy</h1><p class="p-intro">Sprawdź, co wymaga działania i jaki jest następny krok.</p>${reviews.length?`<section class="p-section"><h2>Do wyjaśnienia <span class="p-count">${reviews.length}</span></h2><div class="p-list">${reviews.map(reviewRow).join('')}</div></section>`:''}
  <section class="p-section"><h2>Wymaga Twojej uwagi <span class="p-count">${actionable.length}</span></h2><div class="p-list">${actionable.map(x=>caseRow(x,TILES.indexOf(x))).join('')}</div></section>
  ${other.length?`<section class="p-section"><h2>Pozostałe</h2><div class="p-list">${other.map(x=>caseRow(x,TILES.indexOf(x))).join('')}</div></section>`:''}
  ${resolved.length?`<details class="p-section review-archive"><summary>Wyjaśnione przez Ciebie (${resolved.length})</summary><div class="p-list">${resolved.map(reviewRow).join('')}</div></details>`:''}</div>`;
}
function docsView(){
 return `<div class="p-page w-library"><h1>Dokumenty i pojazdy</h1>
  <label class="p-search">${psvg('search')}<input id="docSearch" type="search" placeholder="Szukaj dokumentu" aria-label="Szukaj dokumentu"></label>
  <div class="w-library-toolbar"><span id="docCount">${DOCS.length} karty</span><div role="group" aria-label="Widok dokumentów"><button type="button" data-library-layout="cards" aria-pressed="true">Karty</button><button type="button" data-library-layout="list" aria-pressed="false">Lista</button></div></div>
  <div id="walletLibrary" data-layout="cards"><div class="w-library-cards">${DOCS.map(d=>credentialCard(d)).join('')}</div><div class="p-list w-library-list">${DOCS.map(docRow).join('')}</div></div>
  <p class="p-search-empty" id="docSearchEmpty" aria-live="polite" hidden>Nie znaleziono dokumentu. Spróbuj innej nazwy.</p></div>`;
}
function profileView(){
 return `<div class="p-page"><p class="p-eyebrow">USTAWIENIA I INFORMACJE</p><h1>Profil</h1>
  <section class="p-profile-card"><span class="p-avatar">${escP(OS.imie.slice(0,1))}${escP(OS.nazwisko.slice(0,1))}</span><div><b>${escP(OS.imie)} ${escP(OS.nazwisko)}</b><small>Dane i ustawienia</small></div></section>
  <section class="p-section"><h2>Prywatność</h2><div class="p-list"><div class="p-info-row">${psvg('lock')}<span><b>Dane osobowe ukryte w podglądzie</b><small>Pełne dane pokaż dopiero w szczegółach dokumentu.</small></span></div><button type="button" class="p-case" id="pQrHistory"><span class="p-case-icon">${svg('check')}</span><span class="p-case-main"><b>Udostępnianie danych</b><small>Każda prośba wymaga Twojej zgody.</small></span>${psvg('chev')}</button></div></section>
  <section class="p-section"><h2>Dostępność</h2><div class="p-settings">
   <label><span><b>Większy tekst</b><small>Powiększ treści interfejsu.</small></span><input type="checkbox" data-setting="large-text"></label>
   <label><span><b>Większy kontrast</b><small>Wzmocnij granice i tekst drugorzędny.</small></span><input type="checkbox" data-setting="contrast"></label>
   <label><span><b>Ogranicz animacje</b><small>Ogranicz ruch w przejściach.</small></span><input type="checkbox" data-setting="reduce-motion"></label>
  </div></section>
  <section class="p-section"><h2>Pomoc</h2><div class="p-list"><button type="button" class="p-case" id="pAsk"><span class="p-case-icon">${svg('dots')}</span><span class="p-case-main"><b>Zapytaj asystenta</b><small>To opcjonalny sposób rozpoczęcia sprawy.</small></span>${psvg('chev')}</button></div></section>
  <section class="p-section"><h2>Udostępnij dane</h2><div class="p-list"><button type="button" class="p-case" id="pRequestPreview"><span class="p-case-icon">${svg('scan')}</span><span class="p-case-main"><b>Prośba wypożyczalni o dane</b><small>Wybierz zakres przed przekazaniem.</small></span>${psvg('chev')}</button><button type="button" class="p-case" id="pConflictPreview"><span class="p-case-icon">${svg('alert')}</span><span class="p-case-main"><b>Różne dane kierowcy</b><small>Sprawdź rozbieżność w prośbie.</small></span>${psvg('chev')}</button></div><p id="demoRequestStatus" class="p-demo" role="status"></p></section></div>`;
}
function openProductCase(index){
 const x=TILES[index];if(!x)return;
 activeProductTab='cases';renderProductNav();
 const labels={letter:'Przygotuj odpowiedź',oc:'Sprawdź OC i badanie',pay:'Sprawdź szczegóły płatności',renew:'Sprawdź wymianę dokumentu',todo:'Sprawdź następne kroki'};
 PUI.innerHTML=`<div class="p-page w-case-detail"><button class="p-back" type="button" id="caseBack">${psvg('chev')}Sprawy</button><h1 tabindex="-1">${escP(x.h)}</h1><div class="w-case-meta">${svg(x.i||'doc')}<span>${x.u?'Wymaga Twojej uwagi':'Sprawa do sprawdzenia'}</span></div><p class="w-case-due">${escP(deadlineText(x.d))}</p><p class="w-case-context">${escP(x.k==='oc'?'Sprawdź okres ochrony i warunki odnowienia w swojej umowie.':x.s||'Zobacz szczegóły i dostępne działania.')}</p><button class="p-primary" type="button" id="caseContinue">${labels[x.k]||'Sprawdź następne kroki'} ${psvg('chev')}</button><p class="p-demo">Przed działaniem zobaczysz podsumowanie do zatwierdzenia.</p></div>`;
 $('#caseBack').onclick=()=>showProductTab('cases');
 $('#caseContinue').onclick=()=>{closeHist();startTopic(x.q||x.h,()=>S[x.k]&&S[x.k]())};
 PUI.scrollTo(0,0);requestAnimationFrame(()=>PUI.querySelector('h1')?.focus({preventScroll:true}));
}
window.enhanceCredentialView=(id,det)=>{
 const d=DOCS.find(x=>x.id===id);if(!d)return;
 const body=det.querySelector('.p-detail-body');if(!body)return;
 body.classList.add('w-document-screen');body.dataset.view='document';
 if(id==='auto')body.classList.add('w-vehicle-screen');
 const navLabel=det.querySelector('.nav>b');if(navLabel)navLabel.textContent='';
 const tabs=el('<div class="w-document-tabs" role="tablist" aria-label="Widok dokumentu"><button type="button" role="tab" id="credentialTabDocument" aria-controls="credentialDocument" aria-selected="true">Dokument</button><button type="button" role="tab" id="credentialTabData" aria-controls="credentialData" aria-selected="false" tabindex="-1">Dane</button></div>');
 body.querySelector('.p-detail-head').after(tabs);
 const dataPanel=el('<div id="credentialData" role="tabpanel" aria-labelledby="credentialTabData" hidden></div>');
 body.querySelector('.p-detail-source').before(dataPanel);
 [...body.querySelectorAll(':scope > .p-detail-section')].forEach(s=>dataPanel.append(s));
 const documentPanel=el(`<section class="w-document-display" id="credentialDocument" role="tabpanel" aria-labelledby="credentialTabDocument"><article class="w-credential ${id==='auto'?'w-vehicle-card':''}" style="${id==='auto'?'background:#314757':`background-image:linear-gradient(180deg,rgba(5,23,45,.28),rgba(5,23,45,.16)),url('${d.img}')`}">${credentialFace(d,false)}</article></section>`);
 dataPanel.before(documentPanel);
 const buttons=[...tabs.querySelectorAll('button')];
 const frame=el('<div class="c-document-frame"></div>'),content=el('<div class="c-document-content"></div>');
 body.prepend(frame);frame.append(body.querySelector('.p-detail-head'),tabs);[...body.children].filter(n=>n!==frame).forEach(n=>content.append(n));body.append(content);const scrollPositions={document:0,data:0};
 const activate=(view,focus=false)=>{scrollPositions[body.dataset.view]=content.scrollTop;const isDocument=view==='document';body.dataset.view=view;documentPanel.hidden=!isDocument;dataPanel.hidden=isDocument;buttons.forEach((b,i)=>{const on=i===(isDocument?0:1);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1});content.scrollTop=scrollPositions[view]||0;if(focus)buttons[isDocument?0:1].focus()};
 buttons.forEach((b,i)=>{b.onclick=()=>activate(i?'data':'document');b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();activate(e.key==='Home'?'document':e.key==='End'?'data':i?'document':'data',true)}}});
 if(id==='auto')buttons[0].textContent='Karta';
 det.querySelectorAll('[data-a="vehicle"],[data-a="points"],[data-a="status"]').forEach(b=>b.onclick=()=>{activate('data');const heading=b.dataset.a==='points'?[...dataPanel.querySelectorAll('h2')].find(h=>h.textContent==='Punkty karne'):dataPanel.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus();heading.scrollIntoView({block:'nearest',behavior:'instant'})}});
 const close=det.querySelector('#dclose'),originalClose=close.onclick;
 close.onclick=()=>{
  const origin=walletTrigger,card=documentPanel.querySelector('.w-credential');
  if(walletTransition){walletTransition.skipTransition();originalClose();return}
  if(!document.startViewTransition||!walletMotionAllowed()||documentPanel.hidden||!origin?.isConnected||!origin.getClientRects().length||origin.dataset.doc!==id){originalClose();return}
  card.style.viewTransitionName='wallet-card';app.dataset.cardTransition='true';
  const transition=document.startViewTransition(()=>{card.style.viewTransitionName='';originalClose();origin.style.viewTransitionName='wallet-card'});
  walletTransition=transition;transition.ready.catch(()=>{});transition.finished.catch(()=>{}).finally(()=>{card.style.viewTransitionName='';origin.style.viewTransitionName='';if(walletTransition===transition){walletTransition=null;delete app.dataset.cardTransition}});
 };
};
function showProductTab(tab){
 if(!['start','cases','docs','safety','profile'].includes(tab))return;
 const hadProductFocus=app.dataset.productReady==='true';
 for(const key of ['large-text','contrast','reduce-motion']){try{const v=localStorage.getItem(civicPreferenceKey(key));if(v)app.dataset[settingKey(key)]=v}catch(e){}}
 activeProductTab=tab;app.dataset.productTab=tab;app.classList.add('product-on');
 PUI.innerHTML=tab==='start'?homeView():tab==='cases'?casesView():tab==='docs'?docsView():tab==='safety'?safetyView():profileView();
 if(tab==='safety')bindSafetyUI();
 renderProductNav();
 PUI.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>tileRun(TILES[Number(b.dataset.case)]));
 PUI.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>openWalletItem(b.dataset.doc,b));
 PUI.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>showProductTab(b.dataset.goto));
 const sr=$('#docSearch');if(sr)sr.oninput=()=>{const q=sr.value.toLocaleLowerCase('pl');let visible=0;PUI.querySelectorAll('[data-doc]').forEach(b=>{const d=DOCS.find(x=>x.id===b.dataset.doc);b.hidden=!(d?.name+' '+b.textContent).toLocaleLowerCase('pl').includes(q);if(!b.hidden)visible++});$('#docSearchEmpty').hidden=visible!==0;$('#docCount').textContent=q?`Znalezione: ${visible/2} z ${DOCS.length}`:`${DOCS.length} karty`};
 const library=$('#walletLibrary');if(library){let layout='list';try{layout=localStorage.getItem('mobywatel-library-view'+(OS.storageKey?'-'+OS.storageKey:''))||'list'}catch(e){}const setLayout=value=>{library.dataset.layout=value;PUI.querySelectorAll('[data-library-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.libraryLayout===value)));try{localStorage.setItem('mobywatel-library-view'+(OS.storageKey?'-'+OS.storageKey:''),value)}catch(e){}};setLayout(layout==='cards'?'cards':'list');PUI.querySelectorAll('[data-library-layout]').forEach(b=>b.onclick=()=>setLayout(b.dataset.libraryLayout));}
 const assist=$('#pAssist');if(assist)assist.onclick=()=>{enterChat();input.focus()};
 const shareDemo=$('#pShareDemo');if(shareDemo)shareDemo.onclick=()=>{try{window.open('/komputer','_blank','noopener')}catch(e){location.href='/komputer'}};
 const ask=$('#pAsk');if(ask)ask.onclick=()=>{enterChat();input.focus()};
 const history=$('#pQrHistory');if(history)history.onclick=showShareHistory;
 const preview=$('#pRequestPreview');if(preview)preview.onclick=async()=>{try{const r=await demoConsentFlow();if(r.ok)showShareHistory();else if(r.reviewId)showProductTab('cases')}catch(e){const status=$('#demoRequestStatus');if(status)status.textContent='Nie udało się otworzyć prośby. Sprawdź połączenie i spróbuj ponownie.'}};
 const conflict=$('#pConflictPreview');if(conflict)conflict.onclick=async()=>{try{const r=await demoConsentFlow({conflict:true});if(r.reviewId)openReviewCase(r.reviewId)}catch(e){const status=$('#demoRequestStatus');if(status)status.textContent='Nie udało się otworzyć prośby. Spróbuj ponownie.'}};
 PUI.querySelectorAll('[data-review-id]').forEach(b=>b.onclick=()=>openReviewCase(b.dataset.reviewId));
 PUI.querySelectorAll('[data-setting]').forEach(c=>{c.checked=app.dataset[settingKey(c.dataset.setting)]==='true';c.onchange=()=>{app.dataset[settingKey(c.dataset.setting)]=String(c.checked);try{localStorage.setItem(civicPreferenceKey(c.dataset.setting),String(c.checked))}catch(e){}}});
 const heading=PUI.querySelector('h1');if(heading)heading.tabIndex=-1;
 PUI.getAnimations().forEach(animation=>animation.cancel());
 requestAnimationFrame(()=>{PUI.scrollTo(0,0);if(hadProductFocus&&!PUI.contains(document.activeElement))heading?.focus({preventScroll:true});app.dataset.productReady='true'});
}
function showShareHistory(){
 let rows=[];try{rows=JSON.parse(localStorage.getItem(SHARE_HISTORY_KEY)||'[]')}catch(e){}
 PUI.innerHTML=`<div class="p-page"><button type="button" class="p-back" id="historyBack">${psvg('chev')}Wróć do profilu</button><p class="p-eyebrow">PRYWATNOŚĆ</p><h1 tabindex="-1">Udostępnianie danych</h1><p class="p-intro">Udostępnienia zapisane na tym urządzeniu.</p>${rows.length?`<div class="p-list">${rows.slice().reverse().map(r=>`<div class="p-history-row"><span class="p-case-icon">${svg('check')}</span><span><b>${escP(r.to)}</b><small>${escP(r.fields.join(' · '))}</small><em>${escP(r.time)}</em></span></div>`).join('')}</div>`:`<div class="p-empty"><b>Nie ma jeszcze udostępnień</b><p>Przed każdym udostępnieniem zobaczysz odbiorcę i wybierzesz zakres danych.</p><button type="button" class="p-primary" id="historyTry">Zeskanuj prośbę ${psvg('chev')}</button></div>`}</div>`;
 $('#historyBack').onclick=()=>showProductTab('profile');const tryBtn=$('#historyTry');if(tryBtn)tryBtn.onclick=()=>qrFlow({});
 requestAnimationFrame(()=>PUI.querySelector('h1')?.focus({preventScroll:true}));
}
$('#mailBtn').onclick=()=>showProductTab('cases');
$('#bellBtn').onclick=()=>showProductTab('cases');
$('#homeBtn').onclick=()=>{if($('#detail').classList.contains('on'))$('#detail').classList.remove('on');exitChat();showProductTab('start')};
document.addEventListener('keydown',()=>app.dataset.inputKind='keyboard',true);
document.addEventListener('pointerdown',()=>app.dataset.inputKind='pointer',true);
showProductTab('start');

function civicDeadlineLabel(raw){const p=parsedDeadline(raw);if(!p)return 'Termin: '+raw;return p.delta===0?'Odpowiedz dzisiaj':p.delta===1?'Masz 1 dzień na odpowiedź':p.delta<0?'Termin minął '+Math.abs(p.delta)+(Math.abs(p.delta)===1?' dzień temu':' dni temu'):'Masz '+p.delta+' dni na odpowiedź'}
