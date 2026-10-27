/* Top-level page counts; an optional daily browser cookie requires an explicit choice. */
(()=>{
 if(window.parent!==window||new URLSearchParams(location.search).get('qa')==='1')return;
 const page=({'/':'strona','/pokaz.html':'strona','/aplikacja':'aplikacja','/aplikacja/':'aplikacja','/index.html':'aplikacja','/materialy.html':'materialy'})[location.pathname];if(!page)return;
 const pref=()=>{try{return localStorage.getItem('civic-visit-choice')}catch{return null}};
 const signal=(extra={})=>fetch('/api/page-view',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page,cookie:pref()==='yes',...extra}),keepalive:true}).catch(()=>{});
 signal();
 const nav=document.querySelector('.footer-nav');if(!nav)return;
 const trigger=document.createElement('button');trigger.type='button';trigger.textContent='Statystyki odwiedzin';trigger.style.cssText='font:inherit;color:inherit;background:none;border:0;padding:0;min-height:44px;cursor:pointer;text-align:left';nav.append(trigger);
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-labelledby','visitPrivacyTitle');dialog.style.cssText='border:1px solid #dae1ed;border-radius:24px;padding:28px;width:min(440px,calc(100% - 32px));box-sizing:border-box;color:#142033;background:#fff;font:400 14px/1.6 system-ui,sans-serif';
 dialog.innerHTML='<form method="dialog"><h2 id="visitPrivacyTitle" style="font-size:23px;line-height:1.2;margin:0 0 16px">Statystyki odwiedzin</h2><p>Licznik zapisuje sumę odsłon strony, aplikacji i materiałów. Nie zapisuje treści spraw ani adresów IP.</p><p>Jeśli zezwolisz na cookie, pomoże ono rozróżnić przeglądarki danego dnia. Jest losowe i wygasa po 24 godzinach. Dane pozostają na serwerze autora projektu.</p><p id="visitPrivacyStatus" role="status"></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button value="yes">Zezwól na cookie</button><button value="no">Bez cookie</button><button value="close">Zamknij</button></div></form>';
 for(const b of dialog.querySelectorAll('button'))b.style.cssText='min-height:44px;border:1px solid #ccd6e7;background:#f1f4fa;color:#244b8d;border-radius:24px;padding:10px 16px;font:600 13px/20px system-ui,sans-serif;cursor:pointer';
 document.body.append(dialog);trigger.addEventListener('click',()=>{dialog.querySelector('#visitPrivacyStatus').textContent=pref()==='yes'?'Cookie jest włączone. Możesz je wyłączyć poniżej.':'Cookie jest wyłączone.';dialog.showModal()});
 dialog.addEventListener('close',()=>{if(!['yes','no'].includes(dialog.returnValue))return;try{localStorage.setItem('civic-visit-choice',dialog.returnValue)}catch{}signal({cookie:dialog.returnValue==='yes',count:false});trigger.focus()});
})();
