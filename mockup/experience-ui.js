Object.assign(PICON,{heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>'});
/* Prepared explanations are real model results, kept with their source timestamp. */
const civicLetterJobs=new Map(),civicLetterRetryUntil=new Map();
function civicLetterResponseError(response,data,id){const error=Error(data.error||'Nie pobrano wyjaśnienia.');if(response.status===429&&!/budżet|miesiąc/i.test(error.message)){const seconds=Number(response.headers.get('Retry-After'))||60;error.retryAt=Date.now()+Math.max(1,Math.min(300,seconds))*1000;civicLetterRetryUntil.set(id,error.retryAt)}return error}

function civicPreparedLetter(id){const x=lifeState.preparedLetters?.[id];return x&&x.revision==='r54-grounded-v2'&&x.day===civicCalendarDay()&&Date.now()-x.at<86400000?x.result:null}
function civicPrepareLetter(id){
 if(civicPreparedLetter(id))return Promise.resolve(civicPreparedLetter(id));
 if(civicLetterJobs.has(id))return civicLetterJobs.get(id);
 const retryAt=civicLetterRetryUntil.get(id);if(retryAt>Date.now())return Promise.reject(Object.assign(Error('Odczekaj chwilę przed kolejną próbą.'),{retryAt}));
 const job=(async()=>{const response=await fetch('/api/ai/prepared-letter?'+new URLSearchParams({osoba:OS.id,mailId:id}),{signal:AbortSignal.timeout(10000)});let data;if(response.ok)data=await response.json();else{if(response.status!==404){const error=await response.json();throw civicLetterResponseError(response,error,id)}const generated=await fetch('/api/ai/explain-letter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({osoba:OS.id,mailId:id}),signal:AbortSignal.timeout(150000)});data=await generated.json();if(!generated.ok)throw civicLetterResponseError(generated,data,id)}lifeState.preparedLetters=lifeState.preparedLetters||{};lifeState.preparedLetters[id]={at:Date.now(),day:civicCalendarDay(),revision:data.revision||'legacy',result:data};saveLife();return data})().finally(()=>civicLetterJobs.delete(id));
 civicLetterJobs.set(id,job);return job;
}
function civicPlainNotice(mail){return !mail.termin&&String(mail.tresc||'').length<320&&/stypendium|potwierdzenie zmiany wpisu/i.test(mail.temat||'')}
function civicNextLetter(){return civicPendingTiles().filter(x=>x.k==='letter'&&x.mailId).sort((a,b)=>(parsedDeadline(a.d)?.delta??999)-(parsedDeadline(b.d)?.delta??999))[0]}
const civicHomeBeforePrepared=homeView;
homeView=function(){const html=civicHomeBeforePrepared().replace('<h1>Dokumenty</h1>','<h2>Dokumenty</h2>'),x=civicNextLetter();if(!x)return html;const due=parsedDeadline(x.d),prepared=civicPreparedLetter(x.mailId),copy=prepared?'Wyjaśnienie gotowe do przeczytania':due?'Przeczytaj pismo i przygotuj odpowiedź':'Zobacz treść pisma';return html.replace(/^(<div[^>]*>)/,`$1<h1 class="sr-only">Start</h1><section class="c-next-action"><h2>${due?'Twój ruch':'Nowa wiadomość'}</h2><button type="button" data-next-letter="${escP(x.mailId)}"><span class="c-next-action-icon">${psvg('mail')}</span><span><strong>${escP(due?civicDeadlineLabel(x.d):'Przeczytaj pismo')}</strong><b>${escP(x.h)}</b><small>${due?'Termin: '+escP(due.label)+' · ':''}${copy}</small></span>${psvg('chev')}</button></section>`)};
const civicPreparedBinding=bindCivicUI;
bindCivicUI=function(){civicPreparedBinding();PUI.querySelectorAll('[data-next-letter]').forEach(b=>b.onclick=()=>civicMailOpen(b.dataset.nextLetter));const x=civicNextLetter();if(activeProductTab==='start'&&x&&parsedDeadline(x.d)&&!civicPreparedLetter(x.mailId)&&lifeState.letterPreparationAttempted?.[x.mailId]!==('r54-grounded-v2:'+civicCalendarDay())){lifeState.letterPreparationAttempted={...lifeState.letterPreparationAttempted,[x.mailId]:'r54-grounded-v2:'+civicCalendarDay()};civicPrepareLetter(x.mailId).then(()=>{const small=PUI.querySelector('[data-next-letter] small');if(small)small.textContent='Termin: '+parsedDeadline(x.d).label+' · Wyjaśnienie gotowe do przeczytania'}).catch(()=>{})}};
function civicExplanationMarkup(result,mail){return `<article class="c-ai-explanation"><small>Bielik · wyjaśnienie pisma</small><h2>Co mówi pismo</h2><p>${escP(result.text)}</p>${mail.termin?`<div class="c-ai-deadline"><b>${escP(civicDeadlineLabel(mail.termin))}</b><span>${escP(mail.termin)}</span></div>`:''}<details class="c-info"><summary>Fragmenty źródłowe (${result.sources.length})</summary>${result.sources.map(t=>`<blockquote>${escP(t)}</blockquote>`).join('')}</details></article>`}
const civicPreparedMailBase=civicAiMailBase;
civicMailDetail=function(mail,back,sent=false){
 civicPreparedMailBase(mail,back,sent);if(!mail||sent)return;
 const page=PUI.firstElementChild;page.classList.add('c-mail-page');
 if(civicPlainNotice(mail)){const reply=page.querySelector('#cMailReply');if(reply){reply.textContent='Wróć do spraw';reply.onclick=back}return;}
 const original=page.querySelector('.c-mail-body'),details=document.createElement('details');details.className='c-info c-mail-original';details.innerHTML='<summary>Oryginał pisma</summary>';original.before(details);details.append(original);
 const help=document.createElement('section');help.className='c-ai-explainer';help.innerHTML='<div id="cPreparedExplanation" aria-live="polite" role="status"></div>';page.querySelector('.c-mail-overview').before(help);const output=help.firstElementChild;
 const cached=civicPreparedLetter(mail.id);let watching=true,timer;
 const show=result=>{if(page.isConnected&&watching){clearInterval(timer);output.innerHTML=civicExplanationMarkup(result,mail)}};
 if(cached)show(cached);else{
  const start=Date.now();output.innerHTML=`<div aria-hidden="true">${civicSkeletonMarkup()}</div><p>Bielik przygotowuje wyjaśnienie <span class="c-ai-wait-clock" aria-hidden="true">0 s</span></p><div class="c-ai-wait-actions"><button type="button" class="c-text-button" id="cReadWithoutAI">Czytaj oryginał</button><button type="button" class="c-text-button" id="cStopExplanation">Pomiń wyjaśnienie</button></div>`;
  timer=setInterval(()=>{if(!page.isConnected){clearInterval(timer);return}const clock=output.querySelector('.c-ai-wait-clock');if(clock)clock.textContent=Math.floor((Date.now()-start)/1000)+' s'},1000);
  output.querySelector('#cReadWithoutAI').onclick=()=>{details.open=true;details.scrollIntoView({block:'nearest'})};
  output.querySelector('#cStopExplanation').onclick=()=>{watching=false;clearInterval(timer);output.innerHTML='<p>Możesz przeczytać oryginał i przygotować odpowiedź.</p><button type="button" class="c-text-button" id="cExplainAgain">Pokaż wyjaśnienie</button>';details.open=true;output.querySelector('#cExplainAgain').onclick=()=>civicMailDetail(mail,back)};
  civicPrepareLetter(mail.id).then(show).catch(e=>{clearInterval(timer);if(page.isConnected&&watching){details.open=true;output.innerHTML=`<p>${escP(e.message)}</p><button type="button" class="c-text-button" id="cRetryPrepared">Spróbuj wyjaśnić ponownie</button>`;const retry=output.querySelector('button');retry.onclick=()=>civicMailDetail(mail,back);if(e.retryAt){const refresh=()=>{if(!page.isConnected){clearInterval(timer);return}const left=Math.max(0,Math.ceil((e.retryAt-Date.now())/1000));retry.disabled=left>0;retry.textContent=left?'Ponów za '+left+' s':'Spróbuj wyjaśnić ponownie';if(!left)clearInterval(timer)};refresh();timer=setInterval(refresh,1000)}}});
 }
 const reply=page.querySelector('#cMailReply');if(reply){if(lifeState.formDrafts?.['wyslij_pismo:'+mail.id]?.tresc?.some(t=>String(t).trim()))reply.textContent='Wróć do szkicu odpowiedzi';civicPinAction(reply);}
};
/* The pinned action follows the product viewport, including the on-screen keyboard. */
function civicPinAction(button){
 button.classList.add('c-pinned-action');const update=()=>{if(!button.isConnected){clean();return}const r=PUI.getBoundingClientRect(),v=window.visualViewport,bottom=Math.min(r.bottom,v?v.offsetTop+v.height:innerHeight);Object.assign(button.style,{left:(r.left+16)+'px',width:Math.max(0,r.width-32)+'px',bottom:Math.max(0,innerHeight-bottom+12)+'px'})};
 const observer=new ResizeObserver(update),clean=()=>{observer.disconnect();window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);window.visualViewport?.removeEventListener('scroll',update);mutation.disconnect()};
 const mutation=new MutationObserver(()=>{if(!button.isConnected)clean()});observer.observe(PUI);mutation.observe(PUI,{childList:true,subtree:true});window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);update();
}
/* Subpages have one compact title bar; the assistant remains directly available. */
const civicCompactSecondary=lifeSecondary;
lifeSecondary=function(title,body){civicCompactSecondary(title,body);const h=PUI.querySelector('.c-flow-header');if(h){const button=civicAssistantTrigger();button.classList.add('c-inline-assistant');h.append(button)}};
// Rendering once applies the new home without deleting any saved work.
if(activeProductTab==='start')showProductTab('start');

for(const receipt of lifeState.receipts||[])if(receipt.card?.title==='Potwierdzenie pokazu')receipt.card.title='Potwierdzenie';
