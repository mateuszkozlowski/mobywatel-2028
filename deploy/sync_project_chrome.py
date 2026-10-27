"""Keep the project website's navigation and footer identical, without runtime hydration."""
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]/'mockup'
PAGES={'pokaz.html':'idea','technology.html':'technology','materialy.html':'research'}
NAVIGATION=[('idea','opowiesc','Jak działa'),('technology','technologia','Technologia'),('research','badania','Badania')]
BRAND='<a class="brand" href="/pokaz.html" aria-label="mObywatel 2028 — strona główna"><img src="assets/icon-mobywatel.svg" alt="" width="30" height="30"><span>mObywatel <b>2028</b></span></a>'
def header(active):
 links=''.join('<a href="'+(('#'+anchor) if active=='idea' else '/pokaz.html#'+anchor)+'"'+(' aria-current="location"' if key==active and active!='idea' else '')+'>'+label+'</a>' for key,anchor,label in NAVIGATION)
 return '<header class="site-header">'+BRAND+'<nav class="site-nav" aria-label="Nawigacja projektu">'+links+'</nav><a class="site-try" href="/pokaz.html?view=app#pokaz" aria-label="Wypróbuj aplikację"><span>Wypróbuj<span class="try-extra"> aplikację</span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a></header>'
FOOTER='<footer class="site-footer"><div class="footer-inner"><div class="footer-identity">'+BRAND+'<p>Mateusz Kozłowski · mObywatel Challenge</p></div><nav class="footer-nav" aria-label="Informacje o projekcie"><a href="/technology.html">Opis techniczny</a><a href="/materialy.html">Wyniki badań</a><a href="/materialy/r57/mObywatel2028_R57_final.pdf" download>Prezentacja PDF <span aria-hidden="true">↓</span></a><a href="https://github.com/mateuszkozlowski/mobywatel-2028" target="_blank" rel="noopener" aria-label="Kod źródłowy na GitHubie">GitHub <span aria-hidden="true">↗</span></a><a href="https://mobywatel.ai/" target="_blank" rel="noopener">O konkursie <span aria-hidden="true">↗</span></a></nav></div></footer>' 
updates=[]
for name,active in PAGES.items():
 p=ROOT/name;old=p.read_text()
 new,n=re.subn(r'<header class="site-header">.*?</header>',lambda _:header(active),old,count=1,flags=re.S)
 if n!=1:raise SystemExit('Missing project header: '+name)
 new,n=re.subn(r'<footer class="site-footer">.*?</footer>',lambda _:FOOTER,new,count=1,flags=re.S)
 if n!=1:raise SystemExit('Missing project footer: '+name)
 updates.append((p,new,old))
if '--check' in sys.argv:
 drift=[p.name for p,new,old in updates if new!=old]
 if drift:raise SystemExit('Project navigation differs: '+', '.join(drift))
 print('Three shared headers and footers agree.')
else:
 for p,new,_ in updates:p.write_text(new)
 print('Updated three project headers and footers.')
