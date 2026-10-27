"""Lista Ostrzeżeń CERT Polska: pobieramy publiczny feed, nigdy badany link/SMS."""
import ipaddress,re,threading,time,urllib.request,urllib.parse
from datetime import datetime,timezone

URL='https://hole.cert.pl/domains/v2/domains.txt'
SOURCE='https://wiedza.cert.pl/systemy-cert-polska/uslugi/lista-ostrzezen/'
TTL=300
_cache=None
_last_attempt=float('-inf')
_lock=threading.Lock()
_opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))

def normalize_domain(value):
    try:
        value=value.strip().rstrip('.').lower().encode('idna').decode('ascii')
        ipaddress.ip_address(value);return None
    except ValueError:pass
    except (UnicodeError,AttributeError):return None
    if len(value)>253 or '.' not in value:return None
    labels=value.split('.')
    if any(not re.fullmatch(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?',p) for p in labels):return None
    if labels[-1].isdigit() or len(labels[-1])<2:return None
    return value

def extract_domains(text):
    result=[]
    # Cały URL jest konsumowany przed bare-domain, więc gov.pl@inna.pl nie daje gov.pl.
    pattern=r'https?://[^\s<>"\x00-\x20]+|(?<![\w@.-])(?:[\w\-]+\.)+[\w\-]{2,}(?::\d+)?(?:/[^\s<>"\x00-\x20]*)?'
    for match in re.finditer(pattern,text,re.I):
        candidate=match.group(0).rstrip('.,;!?)\u201d\u2019')
        try:host=urllib.parse.urlsplit(candidate if '://' in candidate else '//'+candidate).hostname
        except ValueError:continue
        domain=normalize_domain(host or '')
        if domain and domain not in result:result.append(domain)
    return result

def parse_feed(raw):
    if len(raw)>16*1024*1024:raise ValueError('Lista jest zbyt duża.')
    domains=frozenset(filter(None,(normalize_domain(line) for line in raw.decode('utf-8-sig').splitlines() if line.strip() and not line.lstrip().startswith('#'))))
    if not domains:raise ValueError('Lista nie zawiera domen.')
    return domains

def _download():
    request=urllib.request.Request(URL,headers={'User-Agent':'Civic-prototype/1.0 (public CERT feed reader)','Accept':'text/plain'})
    with _opener.open(request,timeout=6) as r:
        raw=r.read(16*1024*1024+1);modified=r.headers.get('Last-Modified')
    return dict(domains=parse_feed(raw),fetchedAt=datetime.now(timezone.utc).isoformat(),modified=modified,at=time.monotonic())

def get_feed():
    global _cache,_last_attempt
    with _lock:
        now=time.monotonic()
        if _cache and now-_cache['at']<TTL:return dict(_cache,stale=False,error=None)
        if now-_last_attempt<30:return dict(_cache or {},stale=True,error='Nie udało się odświeżyć Listy Ostrzeżeń.')
        _last_attempt=now
        try:_cache=_download();return dict(_cache,stale=False,error=None)
        except Exception:return dict(_cache or {},stale=True,error='Nie udało się odświeżyć Listy Ostrzeżeń.')

def match_domain(domain,listed):
    labels=domain.split('.')
    for index in range(len(labels)-1):
        candidate='.'.join(labels[index:])
        if candidate in listed:return candidate
    return None

def check(text):
    if not isinstance(text,str) or not 1<=len(text.strip())<=12000:raise ValueError('Wklej wiadomość lub adres strony, do 12 000 znaków.')
    domains=extract_domains(text)
    if len(domains)>30:raise ValueError('W wiadomości jest wiele adresów. Sprawdź fragment zawierający do 30 domen.')
    if not domains:return dict(status='no_domain',domains=[],fetchedAt=None,stale=False,source=SOURCE,results=[],error=None)
    feed=get_feed();listed=feed.get('domains')
    results=[dict(domain=d,matched=match_domain(d,listed) if listed else None) for d in domains]
    status='unavailable' if listed is None else 'stale' if feed['stale'] else 'listed' if any(r['matched'] for r in results) else 'not_listed'
    return dict(status=status,domains=domains,results=results,fetchedAt=feed.get('fetchedAt'),modified=feed.get('modified'),stale=feed['stale'],source=SOURCE,error=feed.get('error'))
