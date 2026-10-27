/* Jedno źródło stanu dla Spraw i podsumowania asystenta. */
const civicLiveTodoRendered=new WeakMap();
function civicTodoTiles(){return civicPendingTiles().filter(x=>!(x.k==='letter'&&!x.u)).slice().sort((a,b)=>(parsedDeadline(a.d)?.date?.getTime()??Infinity)-(parsedDeadline(b.d)?.date?.getTime()??Infinity))}
function civicTodoMarkup(){const tiles=civicTodoTiles(),reviews=readReviewCases().filter(x=>x.state==='open'),reminders=(lifeState.reminders||[]).filter(x=>!x.done).slice().sort((a,b)=>new Date(a.when)-new Date(b.when)),n=tiles.length+reviews.length+reminders.length;return `${hd('bell',n?'Do załatwienia · '+n:'Nie masz zadań do wykonania')}${reviews.map(x=>civicRow({title:x.title,sub:'Do wyjaśnienia · dane nie zostały przekazane',icon:'shield',attrs:`data-live-review="${escP(x.id)}"`})).join('')}${tiles.map(x=>{const due=parsedDeadline(x.d),delta=due?.delta,relative=delta===0?'Dzisiaj':delta===1?'Jutro':delta>1?`Za ${delta} dni`:delta<0?'Po terminie':'';return civicRow({title:x.h,sub:[deadlineText(x.d),relative].filter(Boolean).join(' · '),icon:x.k==='letter'?'mail':x.k==='pay'?'coin':x.k==='oc'?'car':'clock',attrs:`data-live-case="${TILES.indexOf(x)}"`})}).join('')}${reminders.map(x=>civicRow({title:x.title,sub:'Twoje przypomnienie · '+lifeTime(x.when),icon:'clock',attrs:'data-live-reminder'})).join('')}${n?'':'<p class="c-inline-note">Nie masz spraw wymagających działania. Status wysłanych spraw sprawdzisz w zakładce Sprawy.</p>'}<div class="c-assistant-end"><button type="button" class="p-primary" data-todo-open>Przejdź do spraw</button><button type="button" class="c-text-button" data-todo-close>Zamknij asystenta</button></div>`}
function civicRefreshTodoCards(){
 if(!app.classList.contains('chatting'))return;
 document.querySelectorAll('[data-live-todo],.ui.list').forEach(box=>{if(!box.hasAttribute('data-live-todo')&&!box.querySelector('[data-k="letter"],[data-k="oc"],[data-k="pay"]'))return;const html=civicTodoMarkup();if(civicLiveTodoRendered.get(box)===html)return;const focused=box.contains(document.activeElement);box.setAttribute('data-live-todo','');box.innerHTML=html;civicLiveTodoRendered.set(box,html);box.querySelector('[data-todo-open]').onclick=()=>{exitChat();civicQuery='';civicCaseFilter='all';showProductTab('cases')};box.querySelector('[data-todo-close]').onclick=exitChat;box.querySelectorAll('[data-live-case]').forEach(b=>b.onclick=()=>{const index=+b.dataset.liveCase;exitChat();openProductCase(index)});box.querySelectorAll('[data-live-review]').forEach(b=>b.onclick=()=>{exitChat();openReviewCase(b.dataset.liveReview)});box.querySelectorAll('[data-live-reminder]').forEach(b=>b.onclick=()=>{exitChat();civicQuery='';civicCaseFilter='action';showProductTab('cases')});if(focused){const heading=box.querySelector('b,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}})
}
S.todo=async function(){await say('Twoje aktualne sprawy i terminy:');await card(`<div class="ui list c-live-todo" data-live-todo>${civicTodoMarkup()}</div>`);civicRefreshTodoCards()};
S.letter=async function(){const mailId=TILES.find(x=>x.k==='letter'&&x.mailId)?.mailId;exitChat();if(mailId)civicMailOpen(mailId);else civicMailHome(()=>showProductTab('services'))};
S.oc=async function(){exitChat();civicOpenVehicles(()=>showProductTab('services'))};
S.pay=async function(){exitChat();civicToolMenu({name:'ePłatności'})};
S.punkty=async function(){exitChat();civicReadTool('punkty_karne',{},()=>showProductTab('services'),{})};
S.pesel=async function(){exitChat();civicReadTool('status_pesel',{},()=>showProductTab('services'),{})};
const civicEnterDynamic=enterChat;enterChat=function(){civicEnterDynamic();civicRefreshTodoCards()};
const civicSaveDynamic=saveLife;saveLife=function(){const ok=civicSaveDynamic();if(ok)civicRefreshTodoCards();return ok};
setInterval(civicRefreshTodoCards,60000);window.addEventListener('focus',civicRefreshTodoCards);document.addEventListener('visibilitychange',()=>{if(!document.hidden)civicRefreshTodoCards()});
/* Kod QR ma trzy odmienne zadania. Skanowanie obsługuje również logowanie na komputerze. */
function civicQrHome(){
 lifeSecondary('Kod QR',`<p class="l-lead">Zaloguj się na komputerze albo przekaż tylko potrzebne dane.</p><div class="c-list">${civicRow({title:'Zeskanuj kod',sub:'Logowanie na komputerze i prośby o dane',icon:'scan',attrs:'id="cQrScan"'})}${civicRow({title:'Pokaż swoje dane',sub:'Wybierz zakres, który chcesz przekazać',icon:'docs',attrs:'id="cQrShow"'})}${civicRow({title:'Sprawdź dokument innej osoby',sub:'Druga osoba zeskanuje Twój kod',icon:'profile',attrs:'id="cQrReceive"'})}</div><button type="button" class="c-text-button" id="cQrManual">Wpisz kod ręcznie</button>${civicDemoRun?`<section class="c-section"><h2>Prośby w pokazie</h2><div class="c-list">${civicRow({title:'Wypożyczalnia prosi o dane',sub:'Sprawdź odbiorcę i wybierz zakres',icon:'car',attrs:'id="cQrDemoRequest"'})}${civicRow({title:'Prośba z innymi danymi',sub:'Sprawdź rozbieżność przed przekazaniem',icon:'shield',attrs:'id="cQrDemoConflict"'})}</div></section>`:''}<details class="c-info"><summary>Jak zalogować się na komputerze?</summary><p>W serwisie wybierz logowanie z mObywatelem. Zeskanuj wyświetlony kod telefonem. Sprawdź nazwę serwisu i kod na obu ekranach, a potem potwierdź logowanie.</p></details>`);
 $('#lifeBack')?.remove();app.dataset.lifeScreen='qr';$('#cQrDemoRequest')?.addEventListener('click',()=>demoConsentFlow().then(()=>showProductTab('qr')));$('#cQrDemoConflict')?.addEventListener('click',()=>demoConsentFlow({conflict:true}).then(()=>showProductTab('qr')));$('#cQrScan').onclick=()=>qrFlow();$('#cQrManual').onclick=()=>qrFlow({manual:true});$('#cQrShow').onclick=()=>{showLifeScopes();$('#lifeBack').onclick=()=>showProductTab('qr')};$('#cQrReceive').onclick=()=>przyjmijFlow({});
 let companion=document.querySelector('#cLoginCompanion');if(!companion){companion=document.createElement('aside');companion.id='cLoginCompanion';companion.className='c-pair-companion';companion.innerHTML=`<small>Komputer w pokazie</small><b>Logowanie z mObywatelem</b><p>Otwórz serwis, a telefonem zeskanuj kod lub wpisz go ręcznie.</p><a href="/login-demo.html" target="_blank" rel="noopener">Otwórz portal na komputerze ${psvg('chev')}</a>`;document.body.append(companion)}
}
const civicQrShowBase=showProductTab;showProductTab=function(tab){if(tab!=='qr'){civicQrShowBase(tab);return}activeProductTab='qr';app.dataset.productTab='qr';app.dataset.lastMainTab='qr';civicQrHome();renderProductNav()};
new MutationObserver(()=>{const c=document.querySelector('#cLoginCompanion');if(c&&app.dataset.lifeScreen!=='qr')c.remove()}).observe(app,{subtree:false,attributes:true,attributeFilter:['data-life-screen']});
function civicQrPayload(value){const match=/^moby-local:(\d{1,5})$/.exec(value||'');return match&&+match[1]<=65535?{token:+match[1]}:null}
function civicManualScan(){
 const st=PS;pStopCam();const screen=pScreen(`${pTop('Wpisz kod z ekranu')}<div class="qbody"><h2>Sprawdź kod</h2><p>Przepisz sześć cyfr z komputera lub drugiego telefonu.</p><form id="cManualQrForm"><label class="c-field"><span>Kod</span><input name="code" inputmode="numeric" autocomplete="off" pattern="[0-9]{6}" maxlength="6" required></label><p class="c-form-error" role="status" id="cManualQrError"></p><button type="submit" class="p-primary">Sprawdź kod</button></form></div>`,'light');
 screen.querySelector('#cManualQrForm').onsubmit=async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button'),code=Number(e.currentTarget.elements.code.value);button.disabled=true;try{if(code>65535)throw new Error('Kod nie pasuje. Sprawdź sześć cyfr na drugim ekranie.');const j=await API('/api/znak/kto?t='+code+'&dev='+DEV);if(PS!==st)return;if(!j?.dev)throw new Error('Kod jest nieaktualny. Poproś o nowy kod.');PS.opt.lookupToken=code;pConsent(j)}catch(e){if(PS===st){screen.querySelector('#cManualQrError').textContent=e.message;button.disabled=false}}};
}
function civicLoginCode(dev){return String([...dev].reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),7)%90+10)}
function civicLoginConsent(j){
 const st=PS,code=civicLoginCode(j.dev),screen=pScreen(`${pTop('Potwierdź logowanie')}<div class="qbody"><div class="c-login-recipient"><small>Logujesz się do</small><h2>${E(j.kto)}</h2><p>Sprawdź, czy na komputerze widzisz ten sam kod.</p><strong>${code}</strong></div><section class="c-section"><h3>Twoje konto</h3>${rowsHTML([['Imię i nazwisko',MOJE.imie_nazwisko],['PESEL',MOJE.pesel]])}</section><p class="c-inline-note">Potwierdzasz logowanie. Nie podpisujesz dokumentu.</p><p class="c-form-error" id="cLoginError" role="status"></p><button type="button" class="p-primary" id="cLoginApprove">Potwierdź logowanie</button><button type="button" class="c-text-button" id="cLoginDecline">Anuluj</button></div>`,'light');
 screen.querySelector('#cLoginDecline').onclick=()=>{API('/api/znak/przekaz',{to:j.dev,from:DEV,ok:false}).catch(()=>{});pFinish({ok:false})};st.cancelUI=screen.querySelector('#cLoginDecline').onclick;screen.querySelector('.qclose').onclick=st.cancelUI;screen.querySelector('#cLoginApprove').onclick=async()=>{const button=screen.querySelector('#cLoginApprove');button.disabled=true;try{await faceid();if(PS!==st)return;const data=makeConsentData('logowanie',[['Imię i nazwisko',MOJE.imie_nazwisko],['PESEL',MOJE.pesel]],OS.id),response=await API('/api/znak/przekaz',{to:j.dev,from:DEV,ok:true,dane:data});if(!response?.ok)throw new Error('Nie otrzymano potwierdzenia. Spróbuj ponownie.');lifeEvent('Potwierdzono logowanie','share',j.kto);st.cancelUI=null;const done=pScreen(`${pTop('Logowanie potwierdzone')}<div class="qbody"><div class="c-success-mark">${psvg('check')}</div><h2>Wróć do komputera</h2><p>Potwierdzenie zostało przekazane do serwisu.</p><button type="button" class="p-primary" id="cLoginDone">Gotowe</button></div>`,'light');done.querySelector('#cLoginDone').onclick=()=>pFinish({ok:true})}catch(e){if(PS===st){screen.querySelector('#cLoginError').textContent=e.message;button.disabled=false}}};
}

/* Podpowiedź asystenta i katalog prowadzą do tych samych aktualnych ekranów. */
function civicIntentHub(title,lead,actions,origin=activeProductTab){
 exitChat();civicPublicScreen(title,`<p class="l-lead">${lead}</p><div class="c-list">${actions.map((x,i)=>civicRow({title:x.title,sub:x.sub||'',icon:x.icon||'docs',attrs:`data-intent-action="${i}"`})).join('')}</div>`,()=>showProductTab(['start','cases','qr','services','profile'].includes(origin)?origin:'services'));
 const hubBack=()=>{if(title==='Utrata portfela'){civicLostWallet(origin);return}if(title==='Narodziny dziecka'){civicBirthHub(origin);return}civicIntentHub(title,lead,actions,origin)};const labels={'Utrata portfela':['Wróć do ochrony portfela','Kontynuuj ochronę portfela'],'Kupno samochodu':['Wróć do kupna samochodu','Kolejny krok po zakupie'],'Narodziny dziecka':['Wróć do spraw dziecka','Pozostałe sprawy dziecka'],'Odnalezione dokumenty':['Wróć do odnalezionych dokumentów','Pozostałe działania dla dokumentów']};[hubBack.civicReturnLabel,hubBack.civicNextLabel]=labels[title]||['Wróć do wyboru działania','Wybierz kolejne działanie'];PUI.querySelectorAll('[data-intent-action]').forEach(b=>b.onclick=()=>actions[+b.dataset.intentAction].run(hubBack));
}
function civicLostWallet(origin=activeProductTab){
 const invalid=(lifeState.serviceState?.uniewaznione||[]).includes('dowod'),suspended=lifeState.serviceState?.zawieszone?.dowod;
 const actions=[{title:'Zastrzeż utracone dokumenty',sub:'Ochrona w Systemie Dokumenty Zastrzeżone',icon:'shield',run:back=>civicOpenTool('zastrzez_dokumenty',back)}];
 if(invalid){
  const invalidation=(lifeState.receipts||[]).filter(r=>r.operation==='zastrzez_dokumenty'&&r.outcome?.uniewazniono?.includes('dowod')).slice(-1)[0];
  const request=(lifeState.receipts||[]).filter(r=>r.operation==='wniosek_dowod'&&(!invalidation||r.created>=invalidation.created)).slice(-1)[0];
  actions.unshift({title:request?'Wniosek o nowy dowód':'Złóż wniosek o nowy dowód',sub:request?'Wniosek złożony · sprawdź następny krok':'Poprzedni dowód jest unieważniony',icon:'docs',run:back=>request?civicReceiptDetail(request):civicOpenTool('wniosek_dowod',back,{defaults:{powod:'utrata'}})});
 }else if(suspended){actions.push({title:'Sprawdź zawieszenie dowodu',sub:'Dowód jest już zawieszony',icon:'docs',run:back=>civicReadTool('moje_dokumenty',{},back,{})})}
 else actions.push({title:'Zawieś dowód osobisty',sub:'Osobna, czasowa blokada dokumentu',icon:'docs',run:back=>civicOpenTool('zawies_dowod',back)});
 actions.push({title:'Chroń numer PESEL',sub:'Sprawdź stan i dostępne działania',icon:'lock',run:back=>civicToolMenu({name:'Zastrzeż PESEL'},back)},{title:'Sprawdź status dokumentów',sub:'Które dokumenty są aktywne',icon:'search',run:back=>civicReadTool('moje_dokumenty',{},back,{})});
 civicIntentHub('Utrata portfela',invalid?'Dowód jest unieważniony. Przygotuj nowy wniosek i sprawdź ochronę pozostałych danych.':'Wybierz ochronę potrzebną w Twojej sytuacji. Zastrzeżenie w bankach i zawieszenie dowodu to odrębne czynności.',actions,origin);
 PUI.firstElementChild.insertAdjacentHTML('beforeend','<p class="c-inline-note">Jeśli zginęła karta płatnicza, zablokuj ją w swoim banku.</p>');
}
function civicCarPurchase(){civicIntentHub('Kupno samochodu','Sprawdź pojazd przed zakupem albo przygotuj formalności na podstawie podpisanej umowy.',[
 {title:'Sprawdź historię pojazdu',sub:'Numer rejestracyjny, VIN i data pierwszej rejestracji',icon:'car',run:back=>civicOpenTool('historia_pojazdu',back)},
 {title:'Sprawdź OC',sub:'Ochrona pojazdu na wybrany dzień',icon:'shield',run:back=>civicOcLookup(back)},
 {title:'Przygotuj PCC-3 z umowy',sub:'Po zakupie, po sprawdzeniu warunków podatku',icon:'docs',run:back=>civicContractHome(back)},
 {title:'Moje pojazdy',sub:'Dane i działania dla posiadanych pojazdów',icon:'car',run:back=>civicOpenVehicles(back)}
 ])}
function civicBirthHub(origin=activeProductTab){
 const receipts=lifeState.receipts||[],births=receipts.filter(r=>r.operation==='zglos_urodzenie'),actions=[];
 for(const birth of births){
  const name=birth.review?.rows?.find(row=>row[0]==='Dziecko')?.[1]||[birth.parameters?.imie,birth.parameters?.drugie_imie].filter(Boolean).join(' ').trim();if(!name)continue;
  const benefit=receipts.filter(r=>r.operation==='wniosek_800plus'&&r.parameters?.sprawa_urodzenia===birth.id).slice(-1)[0];
  actions.push({title:'Zgłoszenie: '+name,sub:'Wysłane do USC · PESEL po sporządzeniu aktu',icon:'check',run:()=>civicReceiptDetail(birth)});
  actions.push({title:benefit?'Kontynuuj przygotowanie do 800+':'Przygotuj dane do 800+',sub:name+' · '+(benefit?.parameters?.pesel_dziecka?'dane zapisane, wniosek jeszcze niewysłany':'PESEL uzupełnisz po nadaniu przez USC'),icon:'baby',run:back=>civicOpenTool('wniosek_800plus',back,{defaults:{...(benefit?.parameters||{}),dziecko:name,sprawa_urodzenia:birth.id}})});
 }
 if(!births.length){actions.push({title:'Zgłoś urodzenie dziecka',sub:'Dane do aktu urodzenia',icon:'docs',run:back=>civicOpenTool('zglos_urodzenie',back)},{title:'Przygotuj dane do 800+',sub:'Sprawdź dane dziecka i warunki świadczenia',icon:'baby',run:back=>civicOpenTool('wniosek_800plus',back)})}
 else actions.push({title:'Zgłoś urodzenie kolejnego dziecka',icon:'plus',run:back=>civicOpenTool('zglos_urodzenie',back)});
 civicIntentHub('Narodziny dziecka','Zgłoszenie urodzenia i wniosek o świadczenie to osobne sprawy. Wysłanie zgłoszenia nie oznacza jeszcze nadania numeru PESEL.',actions,origin);
}
S.portfel=async function(){civicLostWallet()};
S.stluczka=async function(){exitChat();collisionHome()};
S.auto=async function(){civicCarPurchase()};
S.dziecko=async function(){civicBirthHub()};
S.renew=async function(){exitChat();civicOpenTool('wniosek_dowod',()=>showProductTab('services'))};
S.pesel=async function(){exitChat();civicToolMenu({name:'Zastrzeż PESEL'})};
const civicIntentServiceBase=civicOpenService;civicOpenService=function(id){const s=CIVIC_SERVICES.find(x=>x.id===id);if(s?.name==='Utrata portfela'){civicLostWallet();return}if(s?.name==='Narodziny dziecka'){civicBirthHub();return}civicIntentServiceBase(id)};

S.kdr=async function(){exitChat();const d=DOCS.find(x=>x.id==='kdr');if(d)openDoc(d.id);else civicReadTool('partnerzy_kdr',{},()=>showProductTab('services'),{})};
S.fallback=async function(){await say('Nie rozpoznałem sprawy. Możesz wybrać ją z katalogu usług.');chips([{label:'Znajdź usługę',go:()=>{exitChat();civicQuery='';civicOpenCatalog()}}])};
const civicIntentToolBase=civicOpenTool;civicOpenTool=function(name,back=civicToolBack,service={}){if(name==='zloz_pcc3'){civicContractHome(back);return}civicIntentToolBase(name,back,service)};
S.docShow=async function(id){exitChat();const d=DOCS.find(x=>x.id===id);if(d){openDoc(d.id);return}civicPublicScreen('Dokument niedostępny','<p class="l-lead">Tego dokumentu nie ma w Twoim portfelu.</p><button type="button" class="p-primary" id="cIntentWallet">Przejdź do portfela</button>',()=>showProductTab('start'));$('#cIntentWallet').onclick=()=>showProductTab('start')};
S.dowodWaz=async function(){return S.docShow('dowod')};
S.znaleziony=async function(){civicIntentHub('Odnalezione dokumenty','Sprawdź bieżący stan. Unieważnionego dokumentu nie przywrócisz przez cofnięcie zastrzeżenia.',[
 {title:'Sprawdź status dokumentów',icon:'search',run:back=>civicReadTool('moje_dokumenty',{},back,{})},
 {title:'Cofnij zastrzeżenie w bankach',icon:'shield',run:back=>civicOpenTool('cofnij_zastrzezenie_dokumentu',back)},
 {title:'Cofnij zawieszenie dowodu',icon:'docs',run:back=>civicOpenTool('odwies_dowod',back)}
 ])};
