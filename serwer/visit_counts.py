"""Aggregate document views only; daily unlinkable browser counts; no IPs, headers or event histories."""
from contextlib import closing
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
from urllib.parse import parse_qs
import os,sqlite3,secrets,hmac,hashlib,re,threading
_KEY_LOCK=threading.Lock()
from http.cookies import SimpleCookie
DB=Path(os.environ.get('CIVIC_STATE_DIR',Path(__file__).parent/'.state'))/'visits.sqlite3'
PAGES={'/':'strona','/pokaz.html':'strona','/aplikacja':'aplikacja','/index.html':'aplikacja','/materialy.html':'materialy'}
def record(path,destination,query='',db=None,now=None,visitor=None,count=True):
 if destination!='document' or path not in PAGES or parse_qs(query).get('qa')==['1']:return False
 file=Path(db or DB);stamp=now or datetime.now(ZoneInfo('Europe/Warsaw'));file.parent.mkdir(parents=True,exist_ok=True)
 try:
  with closing(sqlite3.connect(file,timeout=2)) as conn:
   with conn:
    conn.execute('CREATE TABLE IF NOT EXISTS counts(day TEXT NOT NULL,page TEXT NOT NULL,views INTEGER NOT NULL,last_seen TEXT NOT NULL,PRIMARY KEY(day,page))')
    conn.execute('CREATE TABLE IF NOT EXISTS browsers(day TEXT NOT NULL,signature TEXT NOT NULL,PRIMARY KEY(day,signature))')
    if visitor and re.fullmatch(r'[a-f0-9]{32}',visitor):
     signature=hmac.new(visitor_key(file), (stamp.date().isoformat()+':'+visitor).encode(),hashlib.sha256).hexdigest()
     conn.execute('INSERT OR IGNORE INTO browsers VALUES(?,?)',(stamp.date().isoformat(),signature))
    if count:conn.execute('INSERT INTO counts VALUES(?,?,1,?) ON CONFLICT(day,page) DO UPDATE SET views=views+1,last_seen=excluded.last_seen',(stamp.date().isoformat(),PAGES[path],stamp.isoformat(timespec='seconds')))
  return True
 except (OSError,sqlite3.Error):return False

def summary(db=None):
 file=Path(db or DB)
 if not file.exists():return dict(totals={},days=[],last_seen=None,browsers={})
 with closing(sqlite3.connect('file:'+str(file)+'?mode=ro',uri=True,timeout=2)) as conn:
  totals=dict(conn.execute('SELECT page,SUM(views) FROM counts GROUP BY page'))
  rows=[dict(day=a,page=b,views=c) for a,b,c in conn.execute('SELECT day,page,views FROM counts ORDER BY day DESC,page')]
  last=conn.execute('SELECT MAX(last_seen) FROM counts').fetchone()[0]
  has_browsers=bool(conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='browsers'").fetchone())
  browsers=dict(conn.execute('SELECT day,COUNT(*) FROM browsers GROUP BY day')) if has_browsers else {}
 return dict(totals=totals,days=rows,last_seen=last,browsers=browsers)

def visitor_key(db=None):
 file=Path(db or DB).with_suffix('.key');file.parent.mkdir(parents=True,exist_ok=True)
 with _KEY_LOCK:
  if file.exists():
   key=file.read_bytes()
   if len(key)!=32:raise OSError('Invalid analytics key')
   return key
  fd=os.open(file,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
  key=secrets.token_bytes(32)
  with os.fdopen(fd,'wb') as stream:stream.write(key)
  return key

def browser_cookie(raw):
 try:
  cookies=SimpleCookie();cookies.load(raw or '');value=cookies['civic_visit'].value if 'civic_visit' in cookies else ''
 except Exception:value=''
 if re.fullmatch(r'[a-f0-9]{32}',value):return value,None
 value=secrets.token_hex(16)
 return value,'civic_visit='+value+'; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax'
