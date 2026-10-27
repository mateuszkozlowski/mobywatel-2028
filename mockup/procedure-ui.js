/* Etap przygotowania nie jest wysłaniem wniosku ani zapłatą. */
function civicBenefitPreparation(back=civicToolBack,defaults={}){
 const key='benefit:'+String(defaults.sprawa_urodzenia||defaults.pesel_dziecka||defaults.dziecko||'new');
 const saved={...defaults,...(lifeState.benefitDrafts?.[key]||{})};
 civicPublicScreen('Przygotuj dane do 800+',`<p class="l-lead">Zacznij teraz. Wniosek wyślesz po uzyskaniu PESEL dziecka i sprawdzeniu pełnego formularza SW-R.</p><form class="c-service-form" id="cBenefitForm"><label class="c-field"><span>Imię i nazwisko dziecka</span><input name="dziecko" required maxlength="150" autocomplete="off" value="${escP(saved.dziecko||'')}"></label><label class="c-field"><span>Data urodzenia <small>(opcjonalnie)</small></span><input type="date" name="data_urodzenia" value="${escP(saved.data_urodzenia||'')}"></label><label class="c-field"><span>PESEL dziecka <small>(jeśli został nadany)</small></span><input name="pesel_dziecka" inputmode="numeric" pattern="[0-9]{11}" maxlength="11" value="${escP(saved.pesel_dziecka||'')}" aria-describedby="cBenefitPeselHint"><small id="cBenefitPeselHint">Brak numeru nie przeszkadza w zapisaniu przygotowania. Jest wymagany przed wysłaniem wniosku.</small></label><p class="c-form-error" role="status" id="cBenefitError"></p><button type="submit" class="p-primary">Sprawdź przygotowanie</button></form><button type="button" class="c-text-button" id="cBenefitRequirements">Co trzeba sprawdzić przed wysłaniem?</button>${(lifeState.benefitDrafts?.[key]||(lifeState.receipts||[]).some(r=>r.operation==='wniosek_800plus'&&(r.parameters?.sprawa_urodzenia||r.parameters?.pesel_dziecka||r.parameters?.dziecko)===(defaults.sprawa_urodzenia||defaults.pesel_dziecka||defaults.dziecko)))?'<button type="button" class="c-text-button" id="cBenefitDiscard">Usuń niewysłane przygotowanie</button>':''}`,back);
 const form=$('#cBenefitForm');
 $('#cBenefitDiscard')?.addEventListener('click',()=>{const identifier=defaults.sprawa_urodzenia||defaults.pesel_dziecka||defaults.dziecko;lifeState.receipts=(lifeState.receipts||[]).filter(r=>!(r.operation==='wniosek_800plus'&&(r.parameters?.sprawa_urodzenia||r.parameters?.pesel_dziecka||r.parameters?.dziecko)===identifier));if(lifeState.benefitDrafts)delete lifeState.benefitDrafts[key];saveLife();back()});
 const values=()=>({...Object.fromEntries(new FormData(form)),...(defaults.sprawa_urodzenia?{sprawa_urodzenia:defaults.sprawa_urodzenia}:{})});
 form.oninput=()=>{lifeState.benefitDrafts=lifeState.benefitDrafts||{};lifeState.benefitDrafts[key]=values();saveLife()};
 $('#cBenefitRequirements').onclick=()=>civicBenefitRequirements(()=>civicBenefitPreparation(back,values()));
 form.onsubmit=async e=>{e.preventDefault();const args=values(),b=form.querySelector('[type=submit]');b.disabled=true;$('#cBenefitError').textContent='';try{const response=await civicServiceRequest('preview','wniosek_800plus',args);if(!form.isConnected)return;civicPreviewTool('wniosek_800plus',args,response,()=>civicBenefitPreparation(back,args),back)}catch(err){if(form.isConnected){$('#cBenefitError').textContent=err.message;b.disabled=false}}};
}
function civicBenefitRequirements(back){
 civicPublicScreen('Przed wysłaniem do ZUS',`<p class="l-lead">Przygotowanie danych to pierwszy etap. Pełny wniosek SW-R wymaga sprawdzenia:</p><ul class="c-procedure-list"><li>danych rodzica i dziecka, w tym PESEL, dat urodzenia, obywatelstwa i adresu;</li><li>rachunku oraz danych kontaktowych;</li><li>wspólnego zamieszkiwania i utrzymywania dziecka, sytuacji drugiego rodzica i wymaganych oświadczeń;</li><li>okoliczności zagranicznych, opieki naprzemiennej i załączników, jeśli dotyczą rodziny.</li></ul><p class="c-inline-note">Dla noworodka termin 3 miesięcy biegnie od urodzenia. O przyznaniu i kwocie rozstrzyga ZUS. Za niepełny miesiąc kwota może być proporcjonalna.</p><footer class="c-outcome-actions"><button type="button" class="p-primary" id="cBenefitReturn">Wróć do przygotowania</button><a class="c-text-button" href="https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus" target="_blank" rel="noopener">Zasady i kanały składania w ZUS ${psvg('chev')}</a></footer>`,back);$('#cBenefitReturn').onclick=back;
}
function civicPccPayment(receipt,back=()=>showProductTab('cases')){
 civicPublicScreen('Zapłata PCC',collisionRows([['Do zapłaty',receipt.outcome.do_zaplaty],['Tytuł','Podatek PCC od zakupu pojazdu'],['Odbiorca','Urząd skarbowy właściwy dla miejsca zamieszkania'],['Termin','14 dni od umowy; ostatni dzień zależy od dni wolnych'],['Potwierdzenie bankowe','Jeszcze nie otrzymano']])+`<p class="l-lead">PCC wpłaca się na właściwy rachunek urzędu skarbowego. Nie używaj mikrorachunku PIT, CIT i VAT.</p><p class="c-inline-note">Przed przelewem potrzebny jest zweryfikowany numer rachunku urzędu i dane identyfikujące deklarację. Samo otwarcie tego ekranu nie oznacza zapłaty.</p><footer class="c-outcome-actions"><button type="button" class="p-primary" id="cPccLeavePending">Zostaw w sprawach do zapłaty</button><a class="c-text-button" target="_blank" rel="noopener" href="https://www.gov.pl/web/gov/zaplac-podatek-od-czynnosci-cywilnoprawnych">Oficjalne zasady zapłaty PCC ${psvg('chev')}</a></footer>`,back);
 $('#cPccLeavePending').onclick=()=>{civicQuery='';civicCaseFilter='action';showProductTab('cases')};
}
const civicProcedureToolBase=civicOpenTool;
civicOpenTool=function(name,back=civicToolBack,service={}){if(name==='wniosek_800plus'){civicBenefitPreparation(back,service.defaults||{});return}civicProcedureToolBase(name,back,service)};

/* Polska walidacja dla formularzy niezależnie od języka przeglądarki. */
document.addEventListener('invalid',event=>{
 const field=event.target;if(!app.contains(field)||!field.validity||typeof field.setCustomValidity!=='function')return;
 const v=field.validity;let message='Sprawdź wartość w tym polu.';
 if(v.valueMissing)message=field.tagName==='SELECT'?'Wybierz opcję z listy.':field.type==='checkbox'?'Zaznacz wymagane pole.':'Uzupełnij to pole.';
 else if(v.typeMismatch)message=field.type==='email'?'Wpisz poprawny adres e-mail.':'Sprawdź format danych.';
 else if(v.patternMismatch)message=field.name?.includes('pesel')?'Wpisz 11 cyfr numeru PESEL.':field.name==='code'?'Wpisz sześć cyfr kodu.':'Sprawdź format danych.';
 else if(v.rangeOverflow)message='Wartość jest za duża lub data jest zbyt późna.';
 else if(v.rangeUnderflow)message='Wartość jest za mała lub data jest zbyt wczesna.';
 field.setCustomValidity(message);field.setAttribute('aria-invalid','true');
 const notice=field.form?.querySelector('.c-form-error');if(notice)notice.textContent=message;
},true);
document.addEventListener('input',event=>{const field=event.target;if(app.contains(field)&&typeof field.setCustomValidity==='function'){field.setCustomValidity('');field.removeAttribute('aria-invalid')}});
