/* Oficjalne materiały źródłowe. Wpis historyczny zachowuje rzeczywiste daty i zakończony stan. */
const SAFETY_SOURCES={
 rcb:'https://www.gov.pl/web/rcb',
 rso:'https://komunikaty.tvp.pl/',
 guide:'https://www.gov.pl/web/poradnikbezpieczenstwa/',
 history:'https://www.gov.pl/web/rcb/raport-dobowy3'
};
function safetyView(){
 return `<div class="p-page s-page"><h1>Bezpieczeństwo</h1><p class="s-lead">Komunikaty, źródła i przygotowanie w jednym miejscu.</p>
  <section class="s-sources" aria-labelledby="s-now"><div class="s-section-head"><h2 id="s-now">Aktualne ostrzeżenia</h2></div><div class="s-source-links"><a href="${SAFETY_SOURCES.rcb}" target="_blank" rel="noopener">${svg('bell')}<span><b>Alert RCB</b><small>Komunikaty krajowe</small></span>${psvg('chev')}</a><a href="${SAFETY_SOURCES.rso}" target="_blank" rel="noopener">${svg('alert')}<span><b>RSO</b><small>Ostrzeżenia regionalne</small></span>${psvg('chev')}</a></div></section>
  <section class="p-section"><h2>Historia komunikatów</h2><button type="button" class="s-alert-record" data-safety-alert="skala"><span class="s-ended">Zakończone</span><b>Ćwiczenia systemu alarmowania</b><p>Gmina Skała · 23 października 2026</p><span class="s-alert-source">RCB ${psvg('chev')}</span></button></section>
  <section class="p-section"><h2>Przygotuj siebie i bliskich</h2><a class="s-guide" href="assets/poradnik-bezpieczenstwa.pdf" download="Poradnik-bezpieczenstwa.pdf">${svg('doc')}<span><b>Poradnik bezpieczeństwa</b><small>Pobierz PDF · 325 KB</small></span>${psvg('chev')}</a><a class="s-guide-source" href="${SAFETY_SOURCES.guide}" target="_blank" rel="noopener">Zobacz materiały MSWiA i RCB ${psvg('chev')}</a></section>
  <div class="s-channel-note">${svg('bell')}<p>SMS-y i alarmy systemowe docierają niezależnie od tej listy.</p></div></div>`;
}
function openSafetyAlert(){
 PUI.innerHTML=`<div class="p-page s-page"><button type="button" class="p-back" id="safetyBack">${psvg('chev')}Bezpieczeństwo</button><span class="s-ended">Zakończone</span><h1 tabindex="-1">Ćwiczenia systemu alarmowania</h1><p class="s-lead">Komunikat RCB dotyczący treningu syren w gminie Skała.</p><dl class="s-alert-facts"><div><dt>Obszar</dt><dd>Gmina Skała, powiat krakowski</dd></div><div><dt>Termin</dt><dd>23 października 2026<br>10:00–12:00</dd></div><div><dt>Źródło</dt><dd>Rządowe Centrum Bezpieczeństwa</dd></div><div><dt>Stan zdarzenia</dt><dd>Zakończone</dd></div></dl><section class="p-section"><h2>Co oznaczał komunikat</h2><p class="s-body">RCB zapowiedziało trening alarmowania z użyciem syren. Komunikat dotyczył ćwiczeń, a nie potwierdzonego zagrożenia.</p></section><a class="p-primary s-primary-link" href="${SAFETY_SOURCES.history}" target="_blank" rel="noopener">Otwórz komunikat źródłowy ${psvg('chev')}</a></div>`;
 $('#safetyBack').onclick=()=>showProductTab('safety');PUI.scrollTo(0,0);requestAnimationFrame(()=>PUI.querySelector('h1')?.focus({preventScroll:true}));
}
function bindSafetyUI(){PUI.querySelectorAll('[data-safety-alert]').forEach(b=>b.onclick=openSafetyAlert)}
