"""First-party aggregate analytics. No IPs, raw referrers, prompts or individual event histories."""
from contextlib import closing
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path
from urllib.parse import parse_qs
import os,sqlite3,secrets,hmac,hashlib,re,threading
from http.cookies import SimpleCookie
_KEY_LOCK=threading.Lock()
DB=Path(os.environ.get('CIVIC_STATE_DIR',Path(__file__).parent/'.state'))/'visits.sqlite3'
PAGES={'/':'strona','/pokaz.html':'strona','/aplikacja':'aplikacja','/index.html':'aplikacja','/materialy.html':'materialy','/technology.html':'technologia'}
PAGE_KEYS=frozenset(PAGES.values())
SOURCES=frozenset(['direct','internal','challenge','github','google','bing','linkedin','facebook','x','other'])
DEVICES=frozenset(['small','medium','large'])
SCENES=frozenset(['marta-reply','marta-letter','marta-birth','marta-share','marta-conflict','jan-contract','jan-vat','jan-collision','ewa-renew','ewa-zus','ewa-sms','kacper-wallet','kacper-age','kacper-warnings','kacper-shelters','alert-ready','alert-air','alert-clear'])
TARGETS={'demo_open':{''},'app_full':{''},'github_click':{''},'pdf_open':{''},'assistant_open':{''},'maps_open':{''},'person_select':{'marta','jan','ewa','kacper'},'scene_open':SCENES,'scroll':{'25','50','75','100'},'engagement':{''}}

def _stamp(now):return now or datetime.now(ZoneInfo('Europe/Warsaw'))

def _schema(conn,stamp):
 conn.execute('CREATE TABLE IF NOT EXISTS counts(day TEXT NOT NULL,page TEXT NOT NULL,views INTEGER NOT NULL,last_seen TEXT NOT NULL,PRIMARY KEY(day,page))')
 conn.execute('CREATE TABLE IF NOT EXISTS browsers(day TEXT NOT NULL,signature TEXT NOT NULL,PRIMARY KEY(day,signature))')
 conn.execute('CREATE TABLE IF NOT EXISTS measurements(day TEXT NOT NULL,hour INTEGER NOT NULL,page TEXT NOT NULL,kind TEXT NOT NULL,target TEXT NOT NULL,value INTEGER NOT NULL,PRIMARY KEY(day,hour,page,kind,target))')
 conn.execute('CREATE TABLE IF NOT EXISTS analytics_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL)')
 day=stamp.date().isoformat()
 last=conn.execute("SELECT value FROM analytics_meta WHERE key='retention_day'").fetchone()
 if not last or last[0]!=day:
  conn.execute('DELETE FROM measurements WHERE day<?',((stamp.date()-timedelta(days=89)).isoformat(),))
  conn.execute("INSERT INTO analytics_meta VALUES('retention_day',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(day,))

def _add(conn,stamp,page,kind,target='',value=1):
 conn.execute('INSERT INTO measurements VALUES(?,?,?,?,?,?) ON CONFLICT(day,hour,page,kind,target) DO UPDATE SET value=value+excluded.value',(stamp.date().isoformat(),stamp.hour,page,kind,target,value))

def _started(conn,stamp):
 conn.execute("INSERT OR IGNORE INTO analytics_meta VALUES('details_since',?)",(stamp.isoformat(timespec='seconds'),))

def record(path,destination,query='',db=None,now=None,visitor=None,count=True,source=None,device=None):
 if destination!='document' or path not in PAGES or parse_qs(query).get('qa')==['1']:return False
 if source is not None and (not isinstance(source,str) or source not in SOURCES) or device is not None and (not isinstance(device,str) or device not in DEVICES):return False
 file=Path(db or DB);stamp=_stamp(now);file.parent.mkdir(parents=True,exist_ok=True)
 try:
  with closing(sqlite3.connect(file,timeout=2)) as conn:
   with conn:
    _schema(conn,stamp)
    if visitor and re.fullmatch(r'[a-f0-9]{32}',visitor):
     signature=hmac.new(visitor_key(file),(stamp.date().isoformat()+':'+visitor).encode(),hashlib.sha256).hexdigest()
     conn.execute('INSERT OR IGNORE INTO browsers VALUES(?,?)',(stamp.date().isoformat(),signature))
    if count:
     conn.execute('INSERT INTO counts VALUES(?,?,1,?) ON CONFLICT(day,page) DO UPDATE SET views=views+1,last_seen=MAX(counts.last_seen,excluded.last_seen)',(stamp.date().isoformat(),PAGES[path],stamp.isoformat(timespec='seconds')))
     _add(conn,stamp,PAGES[path],'view')
     if source is not None and device is not None:
      _started(conn,stamp);_add(conn,stamp,PAGES[path],'measured_view');_add(conn,stamp,PAGES[path],'source',source);_add(conn,stamp,PAGES[path],'device',device)
  return True
 except (OSError,sqlite3.Error):return False

def valid_action(data):
 if not isinstance(data,dict) or not {'page','event'}<=set(data)<= {'page','event','target','seconds'}:return False
 if not isinstance(data['page'],str) or data['page'] not in PAGE_KEYS or not isinstance(data['event'],str) or data['event'] not in TARGETS:return False
 target=data.get('target','')
 if not isinstance(target,str) or target not in TARGETS[data['event']]:return False
 if data['event']=='engagement':return type(data.get('seconds')) is int and 1<=data['seconds']<=30
 return 'seconds' not in data

def record_action(data,db=None,now=None):
 if not valid_action(data):return False
 file=Path(db or DB);stamp=_stamp(now);file.parent.mkdir(parents=True,exist_ok=True)
 try:
  with closing(sqlite3.connect(file,timeout=2)) as conn:
   with conn:
    _schema(conn,stamp);_started(conn,stamp);_add(conn,stamp,data['page'],data['event'],data.get('target',''),data.get('seconds',1))
  return True
 except (OSError,sqlite3.Error):return False

def summary(db=None,days=None,now=None):
 if days is not None and (type(days) is not int or not 1<=days<=180):raise ValueError('Invalid range')
 file=Path(db or DB);stamp=_stamp(now)
 empty=dict(totals={},days=[],last_seen=None,browsers={},measurements=[],details_since=None)
 if not file.exists():return empty
 where='';args=()
 if days is not None:where=' WHERE day>=? AND day<=?';args=((stamp.date()-timedelta(days=days-1)).isoformat(),stamp.date().isoformat())
 with closing(sqlite3.connect('file:'+str(file)+'?mode=ro',uri=True,timeout=2)) as conn:
  tables={r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
  if 'counts' not in tables:return empty
  totals=dict(conn.execute('SELECT page,SUM(views) FROM counts'+where+' GROUP BY page',args))
  rows=[dict(day=a,page=b,views=c) for a,b,c in conn.execute('SELECT day,page,views FROM counts'+where+' ORDER BY day DESC,page',args)]
  last=conn.execute('SELECT MAX(last_seen) FROM counts'+where,args).fetchone()[0]
  browsers=dict(conn.execute('SELECT day,COUNT(*) FROM browsers'+where+' GROUP BY day',args)) if 'browsers' in tables else {}
  detail_start=(stamp.date()-timedelta(days=min(days or 90,90)-1)).isoformat()
  measurements=[dict(day=a,hour=b,page=c,kind=d,target=e,value=f) for a,b,c,d,e,f in conn.execute('SELECT day,hour,page,kind,target,value FROM measurements WHERE day>=? AND day<=? ORDER BY day,hour,page,kind,target',(detail_start,stamp.date().isoformat()))] if 'measurements' in tables else []
  since=conn.execute("SELECT value FROM analytics_meta WHERE key='details_since'").fetchone() if 'analytics_meta' in tables else None
 return dict(totals=totals,days=rows,last_seen=last,browsers=browsers,measurements=measurements,details_since=since[0] if since else None)

def visitor_key(db=None):
 file=Path(db or DB).with_suffix('.key');file.parent.mkdir(parents=True,exist_ok=True)
 with _KEY_LOCK:
  if file.exists():
   key=file.read_bytes()
   if len(key)!=32:raise OSError('Invalid analytics key')
   return key
  fd=os.open(file,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600);key=secrets.token_bytes(32)
  with os.fdopen(fd,'wb') as stream:stream.write(key)
  return key

def browser_cookie(raw):
 try:
  cookies=SimpleCookie();cookies.load(raw or '');value=cookies['civic_visit'].value if 'civic_visit' in cookies else ''
 except Exception:value=''
 if re.fullmatch(r'[a-f0-9]{32}',value):return value,None
 value=secrets.token_hex(16)
 return value,'civic_visit='+value+'; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax'
