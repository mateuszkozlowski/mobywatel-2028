"""Owner-only, no-store aggregate dashboard. Credentials live outside the release tree."""
from pathlib import Path
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
from http.cookies import SimpleCookie
from urllib.parse import parse_qs,urlparse
import os,json,hashlib,hmac,secrets,time,base64,html
import visit_counts
AUTH_PATH=Path(os.environ.get('CIVIC_STATE_DIR',Path(__file__).parent/'.state'))/'admin-auth.json'

def auth():
 try:return json.loads(AUTH_PATH.read_text())
 except (OSError,ValueError):return None

def password_ok(username,password):
 data=auth()
 if not data or not isinstance(password,str) or not 1<=len(password)<=256:return False
 candidate=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(data['salt']),int(data['iterations'])).hex()
 return hmac.compare_digest(candidate,data['password_hash']) and hmac.compare_digest(str(username),'admin')

def issue_session(now=None):
 data=auth();payload=str(int(now or time.time())+8*3600)+'.'+secrets.token_hex(16)
 signature=hmac.new(bytes.fromhex(data['session_key']),payload.encode(),hashlib.sha256).hexdigest()
 return payload+'.'+signature

def session_ok(raw,now=None):
 data=auth()
 if not data:return False
 try:
  cookies=SimpleCookie();cookies.load(raw or '');token=cookies['civic_admin'].value;expiry,nonce,signature=token.split('.')
  if int(expiry)<=int(now or time.time()) or len(nonce)!=32:return False
  expected=hmac.new(bytes.fromhex(data['session_key']),(expiry+'.'+nonce).encode(),hashlib.sha256).hexdigest()
  return hmac.compare_digest(expected,signature)
 except (KeyError,ValueError,TypeError):return False

def cookie(value='',logout=False):
 return 'civic_admin='+value+'; Path=/admin; Max-Age='+('0' if logout else '28800')+'; HttpOnly; Secure; SameSite=Strict'

STYLE='''*{box-sizing:border-box}body{margin:0;background:#f2f3f7;color:#142033;font:400 15px/1.5 Inter,system-ui,sans-serif}a{color:#2458d9;text-decoration:none}button,input{font:inherit}button{cursor:pointer;border:0}button,a,input{outline-offset:4px} :focus-visible{outline:3px solid #2458d9}header{max-width:1100px;margin:auto;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{font-size:16px;font-weight:650}.brand span{font-weight:400;color:#637087}header button{background:white;color:#334d75;padding:10px 18px;border-radius:24px;min-height:44px}main{max-width:1100px;margin:auto;padding:20px 24px 56px}h1{font-size:34px;line-height:1.14;letter-spacing:-.025em;margin:6px 0 12px}h2{font-size:20px;margin:0 0 22px}.muted{color:#637087}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:28px 0}.card,.panel{background:white;border:1px solid #e0e5ee;border-radius:24px;padding:24px}.card strong{display:block;font-size:36px;line-height:1.2;font-variant-numeric:tabular-nums}.card small{display:block;color:#637087;font-size:12px;margin-top:8px}.card h2{font-size:13px;font-weight:500;color:#536073;margin:0 0 16px}.card time{font-size:17px}.panel{margin-top:20px}.chart{display:grid;gap:12px}.chart-row{display:grid;grid-template-columns:75px minmax(0,1fr) 52px;gap:14px;align-items:center;font-size:12px}.bar{background:#edf1f8;border-radius:6px;height:24px;overflow:hidden}.bar i{display:block;background:#315aa0;height:100%;min-width:3px}.chart-row b{text-align:right;font-variant-numeric:tabular-nums}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:14px 10px;text-align:right;border-bottom:1px solid #e3e7ef;font-variant-numeric:tabular-nums}th:first-child,td:first-child{text-align:left}.table-wrap{overflow:auto}.help{font-size:12px;line-height:20px;color:#637087;margin-top:24px;max-width:74ch}.login{width:min(430px,calc(100% - 32px));margin:6vh auto;padding:32px;background:white;border:1px solid #e0e5ee;border-radius:28px}.login h1{font-size:28px}.login label{display:block;font-weight:550;font-size:13px;margin:22px 0 8px}.login input{display:block;width:100%;height:48px;border:1px solid #aab8ce;border-radius:12px;padding:10px 12px;color:#142033;background:white}.login button{width:100%;min-height:48px;background:#2458d9;color:white;border-radius:26px;padding:12px 18px;margin-top:26px;font-weight:600}.error{color:#a42c35;font-size:13px;line-height:20px}.empty{padding:28px 0;color:#637087}@media(max-width:650px){header,main{padding-inline:18px}h1{font-size:29px}.cards{grid-template-columns:1fr}.card{padding:20px}.card strong{font-size:32px}.panel{padding:20px 16px}.chart-row{grid-template-columns:64px minmax(0,1fr) 35px;gap:10px}th,td{padding:12px 8px}.login{padding:26px}}'''

STYLE += 'body{color-scheme:light}h1,h2{text-wrap:balance}p{text-wrap:pretty}.dashboard-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:28px}.dashboard-heading h1{margin-bottom:14px}.dashboard-heading p{margin:0}.dashboard-heading .eyebrow{margin:0 0 10px;font-size:12px;font-weight:600;color:#59657a}.filters{flex:none}.filters label{display:block;margin-bottom:8px;font-size:12px;font-weight:600;color:#59657a}.filters>div{display:flex;gap:8px}.filters select{min-height:44px;background:white;border:1px solid #c7d2e4;border-radius:12px;padding:10px 30px 10px 12px;color:#142033;font:inherit;font-size:13px}.primary{min-height:44px;padding:10px 20px;background:#2458d9;color:white;border-radius:24px;font-size:13px;font-weight:600}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.metric{padding:22px;background:#fff;border:1px solid #e0e5ee;border-radius:22px;min-width:0}.metric h2{min-height:38px;margin:0 0 14px;font-size:13px;line-height:19px;color:#59657a;font-weight:500}.metric strong{font-size:clamp(26px,3vw,36px);line-height:1.15;font-weight:650;font-variant-numeric:tabular-nums}.metric p{margin:14px 0 0;font-size:12px;line-height:19px;color:#59657a}.coverage{margin:20px 0 28px;font-size:12px;line-height:20px;color:#59657a}.panel-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}.panel-grid>.panel{margin:0;min-width:0}.panel h2{font-size:19px;line-height:1.3;margin:0 0 12px}.panel-note,.panel-title p{color:#59657a;font-size:12px;line-height:20px;margin:0 0 22px}.panel-title{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.panel-title p{margin-bottom:24px}.download{display:inline-flex;align-items:center;min-height:44px;white-space:nowrap;font-size:13px;font-weight:600}.trend-scroll,.hours-scroll{overflow-x:auto;padding-bottom:6px}.trend{display:grid;grid-template-columns:repeat(var(--columns),minmax(30px,1fr));min-width:calc(var(--columns)*32px);gap:6px;align-items:end}.trend-column{text-align:center;font-size:11px;line-height:18px;color:#59657a;font-variant-numeric:tabular-nums}.trend-value{height:22px;color:#142033;font-size:12px;font-weight:600}.trend-track{height:140px;max-width:46px;margin:0 auto 10px;display:flex;align-items:flex-end;justify-content:center;border-bottom:1px solid #d7deea}.trend-track i{display:block;width:70%;background:#3460b8;border-radius:4px 4px 0 0}.ranked{list-style:none;padding:0;margin:0;display:grid;gap:17px}.ranked li>div:first-child{display:flex;justify-content:space-between;align-items:baseline;gap:20px;font-size:13px;line-height:20px;margin-bottom:7px}.ranked li span{min-width:0}.ranked li b{font-variant-numeric:tabular-nums;flex:none}.rail{height:5px;border-radius:5px;background:#edf1f8;overflow:hidden}.rail i{height:100%;display:block;background:#3460b8;border-radius:5px}.hours{display:grid;grid-template-columns:repeat(24,minmax(14px,1fr));gap:2px;min-width:420px}.hour-column{font-size:10px;color:#59657a;text-align:center;font-variant-numeric:tabular-nums}.hour-value{height:20px;color:#142033;font-size:11px}.hour-track{height:110px;display:flex;align-items:end;justify-content:center;margin-bottom:10px;border-bottom:1px solid #d7deea}.hour-track i{display:block;width:65%;background:#3460b8;border-radius:3px 3px 0 0}.empty{font-size:13px;line-height:22px;padding:18px 0;margin:0}.definitions{margin-top:28px;color:#59657a;font-size:12px;line-height:21px}.definitions summary{cursor:pointer;font-size:13px;font-weight:600;min-height:44px;display:list-item;padding-top:10px}.definitions ul{max-width:90ch;padding-left:20px}.definitions li{margin-bottom:10px}.sample-notice{padding:12px 16px;background:#fff3d4;color:#59450a;border-radius:12px;font-size:12px;font-weight:600;margin:0 0 24px}select:focus-visible,summary:focus-visible{outline:3px solid #2458d9;outline-offset:4px}@media(max-width:960px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.dashboard-heading{flex-direction:column;align-items:stretch;gap:24px}.filters>div{display:grid;grid-template-columns:1fr auto}.panel-grid{grid-template-columns:1fr}.panel-title{flex-direction:column;gap:0}.panel-title p{margin-bottom:4px}.download{margin-bottom:18px}.metric{padding:18px}.metrics{gap:12px}.panel{border-radius:20px}.trend-track{height:120px}}@media(max-width:360px){.metrics{grid-template-columns:1fr}.metric h2{min-height:0}.metric p{margin-top:10px}}\n'

def shell(body,title='Statystyki — mObywatel 2028'):
 return '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+title+'</title><style>'+STYLE+'</style></head><body>'+body+'</body></html>'

def login(error=''):
 message='<p class="error" role="alert">'+html.escape(error)+'</p>' if error else ''
 return shell('<header><a class="brand" href="/pokaz.html">mObywatel <span>2028</span></a></header><main class="login"><h1>Statystyki projektu</h1><p class="muted">Panel właściciela</p>'+message+'<form method="post" action="/admin/login"><label for="user">Login</label><input id="user" name="username" value="admin" autocomplete="username" required maxlength="64"><label for="password">Hasło</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button type="submit">Zaloguj się</button></form></main>')

OWNER_FILTER_SCRIPT="""<script>(()=>{const c=document.querySelector('#ignoreSelf'),s=document.querySelector('#ignoreSelfStatus');if(!c)return;const sync=()=>{s.textContent=c.checked?'Ta przeglądarka jest pomijana. Dotychczasowe liczby pozostają bez zmian.':'Ta przeglądarka jest zliczana. Po zmianie ustawienia odśwież otwartą stronę projektu.'};try{c.checked=localStorage.getItem('civic-analytics-ignore')==='1';sync()}catch{s.textContent='Przeglądarka blokuje zapis ustawienia.';c.disabled=true}c.onchange=()=>{try{localStorage.setItem('civic-analytics-ignore',c.checked?'1':'0');sync()}catch{c.checked=!c.checked;s.textContent='Nie udało się zapisać ustawienia.'}}})();</script>"""
STYLE += '.owner-filter{margin:0 0 22px;font-size:12px;color:#59657a}.owner-filter label{display:inline-flex;align-items:center;gap:10px;min-height:44px;font-weight:600;cursor:pointer}.owner-filter input{width:18px;height:18px;accent-color:#2458d9}.owner-filter p{margin:0;line-height:20px}'

PAGE_LABELS={'strona':'Strona główna','aplikacja':'Aplikacja w pełnym oknie','materialy':'Badania','technologia':'Opis techniczny'}
SOURCE_LABELS={'direct':'Bez widocznego źródła','internal':'Przejścia w obrębie strony','challenge':'mObywatel Challenge','github':'GitHub','google':'Google','bing':'Bing','linkedin':'LinkedIn','facebook':'Facebook','x':'X / Twitter','other':'Inne strony'}
DEVICE_LABELS={'small':'Mały ekran · do 760 px','medium':'Średni ekran · 761–1100 px','large':'Duży ekran · ponad 1100 px'}
SCENE_LABELS={'marta-reply':'Marta · przygotowanie odpowiedzi','marta-letter':'Marta · pismo ze skarbówki','marta-birth':'Marta · narodziny dziecka','marta-share':'Marta · wybór danych','marta-conflict':'Marta · rozbieżność danych','jan-contract':'Jan · PCC-3 po zakupie auta','jan-vat':'Jan · wyjaśnienia VAT','jan-collision':'Jan · oświadczenie po stłuczce','ewa-renew':'Ewa · wymiana dowodu','ewa-zus':'Ewa · pismo z ZUS','ewa-sms':'Ewa · podejrzany SMS','kacper-wallet':'Kacper · zgubiony portfel','kacper-age':'Kacper · pełnoletność','kacper-warnings':'Kacper · ostrzeżenia','kacper-shelters':'Kacper · mapa schronienia','alert-ready':'Ostrzeżenie','alert-air':'Alarm powietrzny','alert-clear':'Koniec zagrożenia'}
EVENT_LABELS={'demo_open':'Uruchomienia aplikacji','scene_open':'Otwarcia spraw','person_select':'Wybory osoby w pokazie','app_full':'Przejścia do pełnego okna','assistant_open':'Otwarcia asystenta','pdf_open':'Otwarcia prezentacji PDF','github_click':'Przejścia do GitHub','maps_open':'Przejścia do Google Maps'}

def number(value):return f'{value:,}'.replace(',',' ')
def esc(value):return html.escape(str(value),quote=True)
def date_label(value):
 try:return datetime.fromisoformat(value).astimezone(ZoneInfo('Europe/Warsaw')).strftime('%d.%m.%Y, %H:%M')
 except (ValueError,TypeError):return 'Brak danych'
def period_days(query):
 value=parse_qs(query).get('days',['7'])[0]
 return int(value) if value in ('1','7','30','90') else 7

def metric_rows(data,kind,page=None):
 totals={}
 for r in data.get('measurements',[]):
  if r['kind']==kind and (page is None or r['page']==page):totals[r['target']]=totals.get(r['target'],0)+r['value']
 return totals

def metric_total(data,kind,page=None):return sum(metric_rows(data,kind,page).values())

def ranked(values,labels,empty='Pierwsze dane pojawią się po odwiedzinach.',show_zero=False):
 if not values or not sum(values.values()) and not show_zero:return '<p class="empty">'+esc(empty)+'</p>'
 maximum=max(values.values()) or 1
 return '<ol class="ranked">'+''.join('<li><div><span>'+esc(labels.get(k,k))+'</span><b>'+number(v)+'</b></div><div class="rail" aria-hidden="true"><i style="width:'+str(round(v/maximum*100,2))+'%"></i></div></li>' for k,v in sorted(values.items(),key=lambda x:(-x[1],x[0])))+'</ol>'

def dashboard(days=7,now=None):
 now=now or datetime.now(ZoneInfo('Europe/Warsaw'));today=now.date().isoformat()
 data=visit_counts.summary(days=days,now=now);before=visit_counts.summary(days=days,now=now-timedelta(days=days));today_data=visit_counts.summary(days=1,now=now)
 total=sum(data['totals'].values());previous=sum(before['totals'].values());daily={}
 for row in data['days']:daily[row['day']]=daily.get(row['day'],0)+row['views']
 keys=[(now.date()-timedelta(days=d)).isoformat() for d in reversed(range(days))]
 maximum=max((daily.get(d,0) for d in keys),default=0) or 1
 chart=''.join('<div class="trend-column"><div class="trend-value">'+(number(daily.get(d,0)) if daily.get(d,0) else '')+'</div><div class="trend-track"><i style="height:'+str(round(daily.get(d,0)/maximum*100,2))+'%"></i></div><span>'+d[8:10]+'.'+d[5:7]+'</span></div>' for d in keys)
 hourly={h:0 for h in range(24)}
 for row in data.get('measurements',[]):
  if row['kind']=='view':hourly[row['hour']]+=row['value']
 hour_max=max(hourly.values()) or 1
 hours=''.join('<div class="hour-column"><div class="hour-value">'+(number(v) if v else '')+'</div><div class="hour-track"><i style="height:'+str(round(v/hour_max*100,2))+'%"></i></div><span>'+str(h).zfill(2)+'</span></div>' for h,v in hourly.items())
 measured=metric_total(data,'measured_view');seconds=metric_total(data,'engagement');activity=seconds if measured or seconds else None
 duration='—' if activity is None else (str(activity)+' s' if activity<60 else str(activity//60)+' min '+str(activity%60)+' s' if activity<3600 else str(activity//3600)+' h '+str(activity%3600//60)+' min')
 difference=total-previous;change=('+' if difference>0 else '')+number(difference)+' względem poprzedniego okresu'
 since=data.get('details_since');coverage=('Szczegółowy pomiar od '+date_label(since)+'.') if since else 'Szczegółowy pomiar rozpocznie się po pierwszej nowej odsłonie.'
 ranges=''.join('<option value="'+str(n)+'"'+(' selected' if n==days else '')+'>'+label+'</option>' for n,label in [(1,'Dzisiaj'),(7,'Ostatnie 7 dni'),(30,'Ostatnie 30 dni'),(90,'Ostatnie 90 dni')])
 actions={k:metric_total(data,k) for k in EVENT_LABELS}
 sources=metric_rows(data,'source');devices=metric_rows(data,'device');scenes=metric_rows(data,'scene_open');people=metric_rows(data,'person_select');depths=metric_rows(data,'scroll','strona')
 day_rows=''.join('<tr><th scope="row">'+esc(d)+'</th><td>'+number(daily.get(d,0))+'</td><td>'+number(data.get('browsers',{}).get(d,0))+'</td></tr>' for d in reversed(keys))
 last=date_label(data['last_seen']) if data['last_seen'] else 'Jeszcze brak wejść'
 export='/admin/export.csv?days='+str(days)
 sample='<p class="sample-notice">Podgląd na danych przykładowych</p>' if os.environ.get('CIVIC_ANALYTICS_SAMPLE')=='1' else ''
 return shell('<header><a class="brand" href="/pokaz.html">mObywatel <span>2028</span></a><form method="post" action="/admin/logout"><button type="submit">Wyloguj</button></form></header><main>'+sample+'<div class="dashboard-heading"><div><p class="eyebrow">Prywatny panel projektu</p><h1>Statystyki odwiedzin</h1><p class="muted">Odsłony dzisiaj: '+number(sum(today_data['totals'].values()))+' · ostatnia odsłona: '+esc(last)+'</p></div><form class="filters" method="get" action="/admin"><label for="range">Zakres dat</label><div><select id="range" name="days">'+ranges+'</select><button class="primary" type="submit">Pokaż</button></div></form></div><div class="metrics"><section class="metric"><h2>Odsłony w okresie</h2><strong>'+number(total)+'</strong><p>'+esc(change)+'</p></section><section class="metric"><h2>Przeglądarki · suma dni</h2><strong>'+number(sum(data.get('browsers',{}).values()))+'</strong><p>Po zgodzie na jednodniowe cookie</p></section><section class="metric"><h2>Uruchomienia aplikacji</h2><strong>'+number(actions['demo_open'])+'</strong><p>Pierwsze otwarcie w każdej odsłonie</p></section><section class="metric"><h2>Czas aktywności</h2><strong>'+duration+'</strong><p>Łączny szacunek dla wybranego okresu</p></section></div><p class="coverage">'+esc(coverage)+' Starsze odsłony są zachowane, ale nie mają nowych szczegółów.</p><div class="owner-filter"><label><input type="checkbox" id="ignoreSelf">Pomijaj tę przeglądarkę</label><p id="ignoreSelfStatus" role="status"></p></div><section class="panel"><div class="panel-title"><div><h2>Odsłony dzień po dniu</h2><p>Każde odświeżenie strony jest kolejną odsłoną.</p></div><a class="download" href="'+export+'">Pobierz CSV ↓</a></div><div class="trend-scroll"><div class="trend" style="--columns:'+str(days)+'" role="img" aria-label="Liczba odsłon w kolejnych dniach; dokładne wartości w tabeli poniżej.">'+chart+'</div></div></section><div class="panel-grid"><section class="panel"><h2>Źródła odsłon</h2><p class="panel-note">Źródło może być ukryte przez przeglądarkę.</p>'+ranked(sources,SOURCE_LABELS)+'</section><section class="panel"><h2>Rozmiary ekranów</h2><p class="panel-note">Kategorie według szerokości okna przy otwarciu strony.</p>'+ranked(devices,DEVICE_LABELS)+'</section><section class="panel"><h2>Otwierane strony</h2><p class="panel-note">Telefon osadzony na stronie nie jest dodatkową odsłoną.</p>'+ranked(data['totals'],PAGE_LABELS)+'</section><section class="panel"><h2>Kliknięcia i działania</h2><p class="panel-note">Liczby działań, nie liczba osób ani konwersja.</p>'+ranked(actions,EVENT_LABELS,show_zero=True)+'</section><section class="panel"><h2>Otwierane scenariusze</h2><p class="panel-note">Liczymy otwarcie ekranu, a nie ukończenie sprawy.</p>'+ranked(scenes,SCENE_LABELS)+'</section><section class="panel"><h2>Wybierane osoby w pokazie</h2><p class="panel-note">To fikcyjne profile aplikacji, nie dane odwiedzających.</p>'+ranked(people,{'marta':'Marta','jan':'Jan','ewa':'Ewa','kacper':'Kacper'})+'</section><section class="panel"><h2>Jak daleko przewijają stronę</h2><p class="panel-note">Dany próg liczymy raz w każdej odsłonie strony głównej.</p>'+ranked(depths,{'25':'Do 25% strony','50':'Do 50% strony','75':'Do 75% strony','100':'Do końca strony'})+'</section><section class="panel"><h2>Odsłony według godzin</h2><p class="panel-note">Suma z wybranego okresu · czas polski.</p><div class="hours-scroll"><div class="hours" role="img" aria-label="Odsłony według godzin: '+esc(', '.join(str(h).zfill(2)+':00 — '+str(v) for h,v in hourly.items()))+'">'+hours+'</div></div></section></div><section class="panel"><h2>Dokładne wartości dzienne</h2><div class="table-wrap"><table><thead><tr><th>Dzień</th><th>Odsłony</th><th>Przeglądarki po zgodzie</th></tr></thead><tbody>'+day_rows+'</tbody></table></div></section><details class="definitions"><summary>Jak rozumieć te liczby</summary><ul><li>Odsłona oznacza otwarcie strony w przeglądarce. Nie jest liczbą osób. W tym samym dniu można otworzyć stronę wiele razy.</li><li>Przeglądarki rozróżniamy tylko po zgodzie na losowe cookie ważne 24 godziny. Suma z kilku dni może obejmować tę samą przeglądarkę wielokrotnie.</li><li>Czas aktywności rośnie, gdy strona jest widoczna i w ostatniej minucie odnotowano działanie. To szacunek, nie dokładny czas czytania.</li><li>Działania zapisujemy wyłącznie jako sumy. Nie łączymy ich z cookie ani z konkretną osobą. Nie zapisujemy IP, pełnych adresów źródeł, treści rozmów ani plików.</li><li>Panel pokazuje szczegóły z ostatnich 90 dni. Starsze szczegóły usuwamy przy kolejnym zapisie danych. Dotychczasowe sumy dzienne pozostają zachowane.</li><li>Statystyki zależą od działania JavaScript. Blokery, brak sieci, automatyczny ruch i wielokrotne odświeżenia mogą wpływać na wynik. Wejścia z parametrem qa=1 pomijamy.</li></ul></details></main>'+OWNER_FILTER_SCRIPT)

def export_csv(days):
 import csv,io
 data=visit_counts.summary(days=days);stream=io.StringIO(newline='');writer=csv.writer(stream)
 writer.writerow(['dzien','godzina','strona','miara','kategoria','wartosc','jednostka'])
 for row in data['days']:writer.writerow([row['day'],'',row['page'],'odslony','',row['views'],'odslony'])
 for day,count in sorted(data['browsers'].items()):writer.writerow([day,'','','przegladarki_po_zgodzie','',count,'przegladarki'])
 for row in data.get('measurements',[]):
  if row['kind']!='view':writer.writerow([row['day'],row['hour'],row['page'],row['kind'],row['target'],row['value'],'sekundy' if row['kind']=='engagement' else 'odslony' if row['kind'] in ('measured_view','source','device') else 'zdarzenia'])
 return ('\ufeff'+stream.getvalue()).encode('utf-8')

def send(handler,body,status=200):
 data=body.encode();handler.send_response(status);handler.send_header('Content-Type','text/html; charset=utf-8');handler.send_header('Content-Length',str(len(data)));handler.send_header('Cache-Control','no-store, private');handler.send_header('X-Robots-Tag','noindex, nofollow');handler.send_header('Content-Security-Policy',"frame-ancestors 'none'; form-action 'self'; base-uri 'none'");handler.send_header('X-Content-Type-Options','nosniff');handler.end_headers();handler.wfile.write(data)

def redirect(handler,value=None):
 handler.send_response(303);handler.send_header('Location','/admin');handler.send_header('Cache-Control','no-store, private');handler.send_header('Content-Length','0')
 if value:handler.send_header('Set-Cookie',value)
 handler.end_headers()

def get(handler,path):
 days=period_days(urlparse(handler.path).query)
 if path=='/admin/export.csv':
  if not session_ok(handler.headers.get('Cookie')):return redirect(handler)
  data=export_csv(days);handler.send_response(200);handler.send_header('Content-Type','text/csv; charset=utf-8');handler.send_header('Content-Disposition','attachment; filename="mobywatel-statystyki-'+str(days)+'dni.csv"');handler.send_header('Content-Length',str(len(data)));handler.send_header('Cache-Control','no-store, private');handler.send_header('X-Content-Type-Options','nosniff');handler.send_header('X-Robots-Tag','noindex, nofollow');handler.end_headers();handler.wfile.write(data);return
 if path not in ('/admin','/admin/'):return send(handler,login(),404)
 return send(handler,dashboard(days) if session_ok(handler.headers.get('Cookie')) else login())

def post(handler,path):
 if path=='/admin/logout':return redirect(handler,cookie(logout=True))
 form=parse_qs(handler.body().decode('utf-8','replace'))
 if password_ok(form.get('username',[''])[0],form.get('password',[''])[0]):return redirect(handler,cookie(issue_session()))
 return send(handler,login('Nieprawidłowy login lub hasło.'),401)
