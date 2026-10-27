/* The visible resource, never form contents, is the assistant's scope. */
function civicSetAssistantResource(kind,resourceId,title,page=PUI.firstElementChild){if(!page)return;Object.assign(page.dataset,{assistantKind:kind,assistantResourceId:resourceId,assistantTitle:title})}
function civicCurrentAssistantContext(){const detail=$('#detail'),page=detail?.classList.contains('on')?detail:PUI.firstElementChild,context={screen:activeProductTab,title:(page?.querySelector('h1')?.textContent||'').slice(0,100)};if(page?.dataset.assistantKind)Object.assign(context,{kind:page.dataset.assistantKind,resourceId:page.dataset.assistantResourceId,title:page.dataset.assistantTitle.slice(0,120)});return context}
const civicContextMailBase=civicMailDetail;
civicMailDetail=function(mail,back,sent=false){civicContextMailBase(mail,back,sent);if(mail&&!sent)civicSetAssistantResource('letter',mail.id,mail.temat)};
const civicContextVehicleBase=civicVehicleDetail;
civicVehicleDetail=function(v,...args){civicContextVehicleBase(v,...args);civicSetAssistantResource('vehicle',v.nr,(v.model||v.marka)+' · '+v.nr)};
const civicContextDocBase=openDoc;
openDoc=function(id){civicContextDocBase(id);const detail=$('#detail');if(!detail?.classList.contains('on'))return;const header=detail.querySelector('.p-detail-head');if(header&&!header.querySelector('.l-assistant-button'))header.append(civicAssistantTrigger());if(['dowod','pj','kdr','paszport'].includes(id)){const doc=DOCS.find(d=>d.id===id);if(doc)civicSetAssistantResource('document',id,doc.name,detail)}};

const civicContextPanel=document.createElement('section');civicContextPanel.className='c-assistant-context';civicContextPanel.hidden=true;civicContextPanel.setAttribute('aria-label','Kontekst asystenta');civicSheet.querySelector('.c-sheet-header').after(civicContextPanel);
function civicAssistantRequestContext(){return VIS.assistantContext||civicCurrentAssistantContext()}
function civicContextTask(intent){civicRouterOpen(intent,'',civicAssistantRequestContext())}
function civicRenderAssistantContext(){
 const context=civicAssistantRequestContext(),active=!!context.kind;civicContextPanel.hidden=!active;civicSheet.dataset.contextResource=String(active);input.placeholder=active?'Zapytaj o '+(context.kind==='letter'?'to pismo':context.kind==='vehicle'?'ten pojazd':'ten dokument')+'…':'Co chcesz załatwić?';
 if(!active)return;
 civicContextPanel.innerHTML=`<div class="c-context-heading"><div><small>Dotyczy otwartego ${context.kind==='letter'?'pisma':context.kind==='vehicle'?'pojazdu':'dokumentu'}</small><strong>${escP(context.title)}</strong></div><button type="button" class="l-icon-button" aria-label="Pomiń kontekst ekranu">${psvg('close')}</button></div><div class="c-context-actions"></div>`;
 civicContextPanel.querySelector('button').onclick=()=>{civicCancelConversationRequest(VIS);VIS.assistantContext={screen:activeProductTab,title:''};VIS.routerTurns=[];civicRenderAssistantContext();input.focus()};
 const actions=context.kind==='letter'?[['Wyjaśnij pismo',()=>send('Wyjaśnij mi to pismo')],['Przygotuj odpowiedź',()=>civicContextTask('letter_reply')]]:context.kind==='vehicle'?[['Sprawdź terminy',()=>send('Kiedy kończy się OC i badanie?')]]:[['Otwórz dokument',()=>civicContextTask('documents')]];
 if(!VIS.title)for(const [label,run] of actions){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=run;civicContextPanel.querySelector('.c-context-actions').append(button)}
}
const civicContextEnterBase=enterChat;
enterChat=function(){
 if(!civicSheet.open){const context=civicCurrentAssistantContext(),previous=VIS.assistantContext;if(previous&&JSON.stringify(previous)!==JSON.stringify(context)){civicCancelConversationRequest(VIS);VIS.routerTurns=[];if(VIS.title){const note=document.createElement('p');note.className='c-context-change';note.textContent='Teraz: '+(context.title||'rozmowa ogólna');VIS.el.append(note)}}VIS.assistantContext=context}
 civicContextEnterBase();civicRenderAssistantContext();
};
const civicContextSwitchBase=switchTo;switchTo=function(conversation){civicContextSwitchBase(conversation);if(civicSheet.open)civicRenderAssistantContext()};
const civicContextNewBase=civicNewAssistantConversation;civicNewAssistantConversation=function(){civicContextNewBase();VIS.assistantContext=civicCurrentAssistantContext();civicRenderAssistantContext()};$('#cAssistantNew').onclick=civicNewAssistantConversation;
