/* Zamknięcie zachowuje rozmowę. Nowa rozmowa i przekazanie do zadania mają jawny cykl życia. */
function civicCancelConversationRequest(conversation){conversation.generation=(conversation.generation||0)+1;conversation.requestController?.abort();conversation.pending=null;if(WR===conversation)pending=null}
function civicLeaveAssistantForTask(){if(!app.classList.contains('chatting'))return;civicCancelConversationRequest(VIS);exitChat()}
function civicNewAssistantConversation(){
 if(VOICE)exitVoice();civicCancelConversationRequest(VIS);closeHist();
 const next=mkConv();switchTo(next);input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
 civicSheetTitle.textContent='Asystent';civicSheet.dataset.mode='help';
 $('#cAssistantStatus').textContent='Nowa rozmowa. Poprzednie rozmowy znajdziesz w menu.';input.focus();
}
$('#cAssistantNew').onclick=civicNewAssistantConversation;
$('#cAssistantHistory').onclick=()=>{civicCloseAssistantOptions();
 const dialog=document.createElement('dialog');dialog.className='c-conversation-dialog';dialog.setAttribute('aria-labelledby','cConversationTitle');
 const draftOf=c=>c===VIS?input.value:(c.composerDraft||'');
 const conversations=CONVS.filter(c=>c.title||draftOf(c).trim()).sort((a,b)=>b.t-a.t);
 const conversationTitle=c=>c.title||'Szkic: '+draftOf(c).trim().slice(0,60)+(draftOf(c).trim().length>60?'…':'');
 dialog.innerHTML=`<header class="c-sheet-header"><h2 id="cConversationTitle">Rozmowy</h2><button type="button" aria-label="Zamknij rozmowy" id="cConversationClose">${psvg('close')}</button></header><div class="c-conversation-body">${conversations.length?`<div class="c-list">${conversations.map(c=>civicRow({title:conversationTitle(c),sub:c===VIS?'Otwarta rozmowa':!c.title?'Niewysłany szkic':c.last||'Rozmowa z tej sesji',icon:'clock',attrs:`data-conversation="${c.id}"`})).join('')}</div>`:'<p>Jeszcze bez rozmów.</p>'}<p class="c-inline-note">Rozmowy są dostępne do odświeżenia strony. Nowa rozmowa nie usuwa szkiców w Sprawach.</p></div>`;
 app.append(dialog);const close=()=>{dialog.close();dialog.remove();syncModalIsolation();$('#cAssistantOptionsTrigger')?.focus()};dialog.querySelector('#cConversationClose').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 dialog.querySelectorAll('[data-conversation]').forEach(button=>button.onclick=()=>{const conversation=CONVS.find(c=>c.id===+button.dataset.conversation);if(!conversation)return;if(VOICE)exitVoice();switchTo(conversation);civicSheetTitle.textContent='Asystent';close()});dialog.showModal();syncModalIsolation();dialog.querySelector('#cConversationClose').focus();
};
const civicAssistantTaskShowBase=showProductTab;
showProductTab=function(...args){civicLeaveAssistantForTask();return civicAssistantTaskShowBase(...args)};

/* Niewysłany tekst należy do rozmowy, a nie do współdzielonego kompozytora. */
const civicDraftSwitchBase=switchTo;
switchTo=function(conversation){if(conversation===VIS)return;VIS.composerDraft=input.value;civicDraftSwitchBase(conversation);input.value=conversation.composerDraft||'';input.dispatchEvent(new Event('input',{bubbles:true}))};

/* The active unsent text survives navigation back from the full-window demo.
   Session storage is scoped to this profile/run; no messages or action tokens are restored. */
const civicUnsentKey='mobywatel-unsent-'+(OS.storageKey||OS.id);
function civicSaveUnsent(){try{if(input.value&&input.value.length<=16000)sessionStorage.setItem(civicUnsentKey,input.value);else sessionStorage.removeItem(civicUnsentKey)}catch(e){}}
try{const text=sessionStorage.getItem(civicUnsentKey);if(text&&text.length<=16000&&!input.value){input.value=text;VIS.composerDraft=text;input.dispatchEvent(new Event('input',{bubbles:true}))}}catch(e){}
input.addEventListener('input',civicSaveUnsent);window.addEventListener('pagehide',civicSaveUnsent);
