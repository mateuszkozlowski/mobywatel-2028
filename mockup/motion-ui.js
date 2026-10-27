/* Ruch reaguje na intencję: nacisk, orientację i zachowanie ciągłości karty. */
let pressedControl=null;
function releaseControl(){if(pressedControl){pressedControl.classList.remove('is-pressed');pressedControl=null}}
app.addEventListener('pointerdown',event=>{
 releaseControl();
 if(!walletMotionAllowed()||event.button!==0)return;
 const control=event.target.closest('button:not(:disabled),a.s-guide,a.s-alert-record');
 if(!control||control.closest('.product-nav,.w-document-tabs,.l-card-choices,.c-segmented'))return;
 pressedControl=control;control.classList.add('is-pressed');
});
window.addEventListener('pointerup',releaseControl,true);
window.addEventListener('pointercancel',releaseControl,true);
app.addEventListener('scroll',releaseControl,true);
document.addEventListener('visibilitychange',releaseControl);
/* Tło pozostaje widoczne wizualnie, ale nie trafia do nawigacji czytnika podczas dialogu. */
const civicOutsideModalInert=new Map();
function syncModalIsolation(){
 const native=[...app.querySelectorAll('dialog[open]')].at(-1);
 const modal=native||['#faceid','#qrx','#zx','#detail'].map(s=>app.querySelector(s)).find(n=>n?.classList.contains('on'));
 for(const child of app.children)child.inert=Boolean(modal&&child!==modal&&!child.contains(modal));
 for(const node of document.querySelectorAll('#cShowcaseWindowBar,#cLoginCompanion')){if(modal){if(!civicOutsideModalInert.has(node))civicOutsideModalInert.set(node,node.inert);node.inert=true}}
 if(!modal){for(const [node,previous] of civicOutsideModalInert){node.inert=previous}civicOutsideModalInert.clear()}
}
new MutationObserver(syncModalIsolation).observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['class','open']});
new MutationObserver(syncModalIsolation).observe(document.body,{childList:true});
syncModalIsolation();
