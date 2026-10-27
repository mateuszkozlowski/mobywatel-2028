/* Bielik selects a known screen. No action is executed by the response. */
const civicPresetSend=send;
const CIVIC_ROUTER_ACTIONS={
 letter_reply:()=>civicMailHome(),
 letter:()=>{showProductTab('cases');const i=TILES.findIndex(t=>t.k==='letter');if(i>=0)openProductCase(i)},
 lost_wallet:()=>civicLostWallet('services'),collision:()=>collisionHome(),car_purchase:()=>civicCarPurchase('services'),birth:()=>civicBirthHub('services'),
 renew_id:()=>civicOpenTool('wniosek_dowod',()=>showProductTab('services')),pesel:()=>civicPesel(),phishing:()=>civicCertForm(),weather:()=>showProductTab('safety'),
 shelters:()=>civicSheltersForm(()=>showProductTab('safety')),documents:()=>showProductTab('start'),qr_login:()=>showProductTab('qr'),sign_document:()=>civicSignatures(),
 cases:()=>showProductTab('cases'),services:()=>civicOpenCatalog(),vehicles:()=>civicOpenVehicles(()=>showProductTab('start'))
};
function civicRouterOpen(intent,prefill='',context={}){if(context.kind==='letter'&&['letter','letter_reply'].includes(intent)){civicLeaveAssistantForTask();if(intent==='letter_reply')civicOpenTool('wyslij_pismo',()=>civicMailOpen(context.resourceId),{replyTo:context.resourceId});else civicMailOpen(context.resourceId);return}if(intent==='vehicles'&&context.kind==='vehicle'){civicLeaveAssistantForTask();civicOpenVehicles(()=>showProductTab('start'),context.resourceId);return}if(intent==='documents'&&context.kind==='document'){civicLeaveAssistantForTask();openDoc(context.resourceId);return}if(intent==='phishing'&&prefill)civicCertText=prefill;const run=CIVIC_ROUTER_ACTIONS[intent];if(!run)return;civicLeaveAssistantForTask();run()}
function civicRouterButtons(box,actions,context={}){const footer=document.createElement('div');footer.className='c-router-actions';for(const action of actions){if(!CIVIC_ROUTER_ACTIONS[action.intent])continue;const button=document.createElement('button');button.type='button';button.className='c-text-button';button.textContent=action.action||action.title;button.onclick=()=>civicRouterOpen(action.intent,action.prefill||'',action.context||context);footer.append(button)}box.append(footer)}
send=function(message){
 const text=String(message||'').trim();if(!text)return;
 if(text.length>1600){$('#cAssistantStatus').textContent='Opisz sprawę w maksymalnie 1600 znakach.';input.value=text;input.focus();return}
 if(OS.sugg.some(s=>s[0]===text))return civicPresetSend(text);
 enterChat();act(()=>{
  const conversation=VIS;civicCancelConversationRequest(conversation);addUser(text);
  const generation=conversation.generation,controller=new AbortController();conversation.requestController=controller;
  const box=document.createElement('div');box.className='msg bot c-router-card';box.setAttribute('aria-live','polite');
  box.innerHTML='<div class="c-router-loading" role="status"><span class="c-skeleton-head"></span><span class="c-skeleton-caption"></span><span class="sr-only">Dopasowuję sprawę…</span></div>';conversation.el.append(box);end();
  const previous=(conversation.routerTurns||[]).slice(-2);conversation.routerTurns=[...previous,text];
  const timeout=setTimeout(()=>controller.abort(),95000);
  fetch('/api/assistant/route',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({osoba:OS.id,message:text,previous,context:typeof civicAssistantRequestContext==='function'?civicAssistantRequestContext():{screen:activeProductTab,title:(PUI.querySelector('h1')?.textContent||'').slice(0,100)}})})
  .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'Nie udało się dopasować sprawy.');if(conversation.generation!==generation)return;
   const followResponse=conversation===VIS&&conversation.el.scrollHeight-conversation.el.scrollTop-conversation.el.clientHeight<80;
   box.replaceChildren();const textNode=document.createElement('p');textNode.textContent=data.text;box.append(textNode);
   if(data.kind==='route'&&CIVIC_ROUTER_ACTIONS[data.intent]){const heading=document.createElement('h3');heading.textContent=data.title;box.prepend(heading);civicRouterButtons(box,[{...data,prefill:text}],data.context||{})}
   else civicRouterButtons(box,data.alternatives||[],data.context||{});
   if(Array.isArray(data.sources)&&data.sources.length){const sources=document.createElement('details');sources.className='c-router-sources';const summary=document.createElement('summary');summary.textContent='Źródła odpowiedzi ('+data.sources.length+')';sources.append(summary);for(const value of data.sources){const quote=document.createElement('blockquote');quote.textContent=value;sources.append(quote)}box.append(sources)}
   const origin=document.createElement('small');origin.textContent=data.meta?.method==='reguly_bezpieczenstwa'?'Reguły bezpieczeństwa · następny krok':data.meta?.method==='dane_ekranu'?'Dane z otwartego ekranu · bez generowania':data.meta?.method==='kontekst_ekranu'?'Kontekst otwartego pisma':data.meta?.method==='wyjasnienie_pisma'?'Bielik · wyjaśnienie na podstawie pisma':'Bielik · propozycja następnego kroku';box.append(origin);
   civicAiEvent('Asystent dopasował sprawę',data.title||data.kind);if(followResponse)requestAnimationFrame(()=>{if(conversation!==VIS||!box.isConnected)return;const scroller=conversation.el;scroller.scrollTop+=box.getBoundingClientRect().top-scroller.getBoundingClientRect().top-12});
  }).catch(error=>{if(conversation.generation!==generation){box.remove();return}box.replaceChildren();const paragraph=document.createElement('p');paragraph.textContent=error.name==='AbortError'?'Odpowiedź trwa zbyt długo. Możesz wybrać sprawę z katalogu albo spróbować ponownie.':error.message;box.append(paragraph);civicRouterButtons(box,[{intent:'services',action:'Znajdź usługę'}]);const retry=document.createElement('button');retry.type='button';retry.className='c-text-button';retry.textContent='Spróbuj ponownie';retry.onclick=()=>{if(conversation!==VIS)switchTo(conversation);send(text)};box.append(retry)})
  .finally(()=>{clearTimeout(timeout);if(conversation.requestController===controller)conversation.requestController=null});
 });
};
