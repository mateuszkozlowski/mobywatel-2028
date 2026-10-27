/* Księga jest obiektem; zamówienie i weryfikacja mają osobne rezultaty. */
async function civicKwHome(back=civicToolBack){
 civicPublicScreen('Księgi wieczyste','<p class="l-lead" role="status">Pobieranie Twoich ksiąg…</p>',back);const page=PUI.firstElementChild;
 try{const response=await civicServiceRequest('read','ksiegi_wieczyste',{});if(PUI.firstElementChild!==page)return;civicKwLibrary(response.data,back)}catch(error){if(PUI.firstElementChild===page)civicPublicScreen('Księgi wieczyste',`<p class="c-form-error" role="status">${escP(error.message)}</p><button type="button" class="p-primary" id="cKwRetry">Spróbuj ponownie</button>`,back);$('#cKwRetry')?.addEventListener('click',()=>civicKwHome(back))}
}
function civicKwLibrary(data,back){
 const books=data.ksiegi||[];
 civicPublicScreen('Księgi wieczyste',`<div class="c-list">${civicRow({title:'Twoje księgi',sub:books.length?'Nieruchomości powiązane z Twoim profilem':'Brak ksiąg w tym profilu',icon:'house',attrs:'id="cKwMine"'})}${civicRow({title:'Zamówione dokumenty',sub:'Zamówienia i dostępność plików',icon:'docs',attrs:'id="cKwOrders"'})}${civicRow({title:'Sprawdź dokument',sub:'Kod z dokumentu i właściwe źródło weryfikacji',icon:'shield',attrs:'id="cKwVerify"'})}</div>`,back);
 const home=()=>civicKwLibrary(data,back);$('#cKwMine').onclick=()=>civicKwBooks(books,home);$('#cKwOrders').onclick=()=>civicKwOrders(home);$('#cKwVerify').onclick=()=>civicKwVerify(home);
}
function civicKwBooks(books,back){
 civicPublicScreen('Twoje księgi',books.length?`<div class="c-list">${books.map((book,i)=>civicRow({title:book.opis,sub:book.numer,icon:'house',attrs:`data-kw-book="${i}"`})).join('')}</div>`:'<p class="l-lead">Nie znaleziono ksiąg powiązanych z Twoim profilem.</p><p class="c-inline-note">Brak na tej liście nie jest rozstrzygnięciem prawa własności. Sprawdź dane ujawnione w księdze.</p>',back);PUI.querySelectorAll('[data-kw-book]').forEach(b=>b.onclick=()=>civicKwBook(books[+b.dataset.kwBook],()=>civicKwBooks(books,back)));
}
function civicKwBook(book,back){
 civicPublicScreen('Twoja nieruchomość',collisionRows([['Księga wieczysta',book.numer],['Nieruchomość',book.opis],['Prawo',book.wlasnosc]])+`<button type="button" class="p-primary" id="cKwOrderBook">Zamów dokument z tej księgi</button>`,back);$('#cKwOrderBook').onclick=()=>civicKwOrder(book,()=>civicKwBook(book,back));
}
function civicKwOrder(book,back,saved={}){
 const types=[['odpis_zwykly','Odpis zwykły','30 zł'],['odpis_zupelny','Odpis zupełny','75 zł'],['wyciag','Wyciąg z jednego działu','10 zł'],['zaswiadczenie_o_zamknieciu','Zaświadczenie o zamknięciu','10 zł']];
 civicPublicScreen('Zamów dokument',collisionRows([['Księga wieczysta',book.numer],['Nieruchomość',book.opis]])+`<form class="c-service-form" id="cKwOrderForm"><label class="c-field"><span>Rodzaj dokumentu</span><select name="rodzaj" required><option value="">Wybierz</option>${types.map(([value,title,cost])=>`<option value="${value}">${title} · ${cost}</option>`).join('')}</select></label><label class="c-field" id="cKwSectionField" hidden><span>Dział księgi</span><select name="dzial"><option value="">Wybierz dział</option><option value="I">I — oznaczenie i prawa</option><option value="II">II — własność</option><option value="III">III — prawa, roszczenia i ograniczenia</option><option value="IV">IV — hipoteka</option></select></label><p class="c-form-error" role="status" id="cKwOrderError"></p><button type="submit" class="p-primary">Sprawdź zamówienie</button></form>`,back);
 const form=$('#cKwOrderForm');form.elements.rodzaj.value=saved.rodzaj||'';form.elements.dzial.value=saved.dzial||'';$('#cKwSectionField').hidden=saved.rodzaj!=='wyciag';form.elements.dzial.required=saved.rodzaj==='wyciag';form.elements.rodzaj.onchange=()=>{const excerpt=form.elements.rodzaj.value==='wyciag';$('#cKwSectionField').hidden=!excerpt;form.elements.dzial.required=excerpt};form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;const args={ksiega:book.numer,rodzaj:new FormData(form).get('rodzaj'),...(form.elements.rodzaj.value==='wyciag'?{dzial:form.elements.dzial.value}:{})};try{const response=await civicServiceRequest('preview','zamow_odpis_kw',args);if(!form.isConnected)return;const next=()=>civicKwOrders(back);next.civicNextLabel='Zobacz zamówione dokumenty';civicPreviewTool('zamow_odpis_kw',args,response,()=>civicKwOrder(book,back,args),next)}catch(error){if(form.isConnected){$('#cKwOrderError').textContent=error.message;button.disabled=false}}};
}
function civicKwOrders(back){
 const orders=(lifeState.receipts||[]).filter(r=>r.operation==='zamow_odpis_kw').slice().reverse();
 civicPublicScreen('Zamówione dokumenty',orders.length?`<div class="c-list">${orders.map(r=>civicRow({title:r.parameters.ksiega||'Zamówienie dokumentu',sub:(r.card?.title||'Zamówienie')+' · '+lifeTime(r.created),icon:'docs',attrs:`data-kw-order="${r.id}"`})).join('')}</div>`:'<p class="l-lead">Nie masz jeszcze zapisanych zamówień.</p><p class="c-inline-note">Wybierz nieruchomość w Twoich księgach, aby przygotować zamówienie dokumentu.</p>',back);
 PUI.querySelectorAll('[data-kw-order]').forEach(b=>b.onclick=()=>{const r=orders.find(r=>r.id===b.dataset.kwOrder);civicPublicScreen('Zamówienie dokumentu',civicCardBody(r.card)+(r.review?`<details class="c-info"><summary>Szczegóły zamówienia</summary>${civicCardBody(r.review)}</details>`:'')+'<p class="c-inline-note">Plik pojawi się dopiero po potwierdzeniu opłaty i udostępnieniu dokumentu przez CIKW.</p><button type="button" class="p-primary" id="cKwOrderReturn">Wróć do zamówień</button>',()=>civicKwOrders(back));$('#cKwOrderReturn').onclick=()=>civicKwOrders(back)});
}
function civicKwVerify(back){
 civicPublicScreen('Sprawdź dokument',`<p class="l-lead">Do weryfikacji potrzebny jest kod widoczny na dokumencie. Autentyczność i aktualność sprawdza Centralna Informacja Ksiąg Wieczystych.</p><p class="c-inline-note" role="status">Weryfikacja w aplikacji jest obecnie niedostępna. Nie sprawdziliśmy tego dokumentu. Możesz skorzystać z oficjalnego serwisu EKW.</p><footer class="c-outcome-actions"><a class="p-primary" href="https://ekw.ms.gov.pl/" target="_blank" rel="noopener">Otwórz Elektroniczne Księgi Wieczyste</a><button type="button" class="c-text-button" id="cKwVerifyBack">Wróć do ksiąg</button></footer>`,back);$('#cKwVerifyBack').onclick=back;
}
const civicKwServiceBase=civicOpenService;
civicOpenService=function(id){if(CIVIC_SERVICES.find(s=>s.id===id)?.name==='Księgi wieczyste'){civicKwHome();return}civicKwServiceBase(id)};

const civicKwToolBase=civicOpenTool;
civicOpenTool=function(name,back=civicToolBack,service={}){if(name==='ksiegi_wieczyste'){civicKwHome(back);return}civicKwToolBase(name,back,service)};
