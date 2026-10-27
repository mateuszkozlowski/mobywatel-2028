"""Owner-only, no-store aggregate dashboard. Credentials live outside the release tree."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from http.cookies import SimpleCookie
from urllib.parse import parse_qs
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

def shell(body,title='Statystyki — mObywatel 2028'):
 return '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+title+'</title><style>'+STYLE+'</style></head><body>'+body+'</body></html>'

def login(error=''):
 message='<p class="error" role="alert">'+html.escape(error)+'</p>' if error else ''
 return shell('<header><a class="brand" href="/pokaz.html">mObywatel <span>2028</span></a></header><main class="login"><h1>Statystyki projektu</h1><p class="muted">Panel właściciela</p>'+message+'<form method="post" action="/admin/login"><label for="user">Login</label><input id="user" name="username" value="admin" autocomplete="username" required maxlength="64"><label for="password">Hasło</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button type="submit">Zaloguj się</button></form></main>')

def dashboard():
 data=visit_counts.summary();today=datetime.now(ZoneInfo('Europe/Warsaw')).date().isoformat();days={}
 for row in data['days']:days.setdefault(row['day'],{})[row['page']]=row['views']
 total=sum(data['totals'].values());views=sum(days.get(today,{}).values());browsers=data.get('browsers',{})
 last='Jeszcze brak wejść'
 if data['last_seen']:
  try:last=datetime.fromisoformat(data['last_seen']).astimezone(ZoneInfo('Europe/Warsaw')).strftime('%d.%m.%Y, %H:%M')
  except ValueError:pass
 recent=sorted(days,reverse=True)[:14];maximum=max((sum(days[d].values()) for d in recent),default=1) or 1
 bars=''.join('<div class="chart-row"><span>'+html.escape(day[5:].split('-')[1]+'.'+day[5:].split('-')[0])+'</span><div class="bar" aria-hidden="true"><i style="width:'+str(round(sum(days[day].values())/maximum*100,2))+'%"></i></div><b>'+str(sum(days[day].values()))+'</b></div>' for day in reversed(recent))
 rows=''.join('<tr><td>'+html.escape(day)+'</td><td>'+str(browsers.get(day,0))+'</td><td>'+str(days[day].get('strona',0))+'</td><td>'+str(days[day].get('aplikacja',0))+'</td><td>'+str(days[day].get('materialy',0))+'</td></tr>' for day in recent)
 return shell('<header><a class="brand" href="/pokaz.html">mObywatel <span>2028</span></a><form method="post" action="/admin/logout"><button type="submit">Wyloguj</button></form></header><main><p class="muted">Tylko dla właściciela projektu</p><h1>Wejścia na stronę</h1><p class="muted">Odsłony od uruchomienia licznika: '+str(total)+'.</p><div class="cards"><section class="card"><h2>Odsłony dzisiaj</h2><strong>'+str(views)+'</strong><small>Strona, aplikacja i materiały</small></section><section class="card"><h2>Przeglądarki dzisiaj</h2><strong>'+str(browsers.get(today,0))+'</strong><small>Po zgodzie na jednodniowe cookie</small></section><section class="card"><h2>Ostatnie wejście</h2><strong><time>'+html.escape(last)+'</time></strong><small>Czas polski</small></section></div><section class="panel"><h2>Odsłony — ostatnie 14 dni</h2><div class="chart">'+(bars or '<p class="empty">Pierwsze wejście pojawi się tutaj.</p>')+'</div></section><section class="panel"><h2>Dzień po dniu</h2><div class="table-wrap"><table><thead><tr><th>Dzień</th><th>Przeglądarki</th><th>Strona</th><th>Aplikacja</th><th>Materiały</th></tr></thead><tbody>'+rows+'</tbody></table></div></section><p class="help">To przybliżenie liczby przeglądarek, nie identyfikacja osób. Odświeżenia zwiększają odsłony. Telefon osadzony na stronie nie jest liczony osobno. Opcjonalne cookie wygasa po 24 godzinach; licznik nie zapisuje IP ani treści spraw.</p></main>')

def send(handler,body,status=200):
 data=body.encode();handler.send_response(status);handler.send_header('Content-Type','text/html; charset=utf-8');handler.send_header('Content-Length',str(len(data)));handler.send_header('Cache-Control','no-store, private');handler.send_header('X-Robots-Tag','noindex, nofollow');handler.send_header('Content-Security-Policy',"frame-ancestors 'none'; form-action 'self'; base-uri 'none'");handler.send_header('X-Content-Type-Options','nosniff');handler.end_headers();handler.wfile.write(data)

def redirect(handler,value=None):
 handler.send_response(303);handler.send_header('Location','/admin');handler.send_header('Cache-Control','no-store, private');handler.send_header('Content-Length','0')
 if value:handler.send_header('Set-Cookie',value)
 handler.end_headers()

def get(handler,path):
 if path not in ('/admin','/admin/'):return send(handler,login(),404)
 return send(handler,dashboard() if session_ok(handler.headers.get('Cookie')) else login())

def post(handler,path):
 if path=='/admin/logout':return redirect(handler,cookie(logout=True))
 form=parse_qs(handler.body().decode('utf-8','replace'))
 if password_ok(form.get('username',[''])[0],form.get('password',[''])[0]):return redirect(handler,cookie(issue_session()))
 return send(handler,login('Nieprawidłowy login lub hasło.'),401)
