"""Publiczne punkty PSP. Własny indeks, bez dopisywania klasy ochrony lub otwarcia."""
import csv,gzip,io,json,math,os,re,threading,time,urllib.request
from pathlib import Path
from datetime import datetime,timezone

URL='https://gdziesieukryc.pl/PS_XML/punkty_schronienia.csv'
SOURCE='https://dane.gov.pl/pl/dataset/28058,punkty-schronienia-w-polsce'
CACHE_DIR=Path(os.environ.get('CIVIC_PUBLIC_CACHE',Path(__file__).parent/'.public-cache'))
_cache=None
_attempt=float('-inf')
_lock=threading.Lock()
TTL=6*3600
_opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))

def fold(s):
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD',s.lower().replace('ł','l')) if not unicodedata.combining(c))

def parse_csv(raw):
    if len(raw)>24*1024*1024:raise ValueError('Zbyt duży zbiór.')
    reader=csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    required={'Identyfikator publiczny','Nazwa','Rodzaj obiektu','Szerokosc geograficzna','Dlugosc geograficzna','Adres','Dostepnosc','Gmina','Powiat','Wojewodztwo'}
    if not required.issubset(reader.fieldnames or []):raise ValueError('Zmienił się format zbioru PSP.')
    items=[];seen=set();skipped=0
    for row in reader:
        try:lat=float(row['Szerokosc geograficzna']);lon=float(row['Dlugosc geograficzna'])
        except (ValueError,TypeError):skipped+=1;continue
        id=row['Identyfikator publiczny']
        if not id or id in seen or not 49<=lat<=55.5 or not 14<=lon<=24.5:skipped+=1;continue
        seen.add(id)
        items.append(dict(id=id,name=row['Nazwa'],kind=row['Rodzaj obiektu'],description=row.get('Opis ogolny',''),city=row['Gmina'],county=row['Powiat'],region=row['Wojewodztwo'],lat=lat,lon=lon,address=row['Adres'],availability=row['Dostepnosc']))
    if not items:raise ValueError('Nie odczytano punktów PSP.')
    return items,skipped

def get_feed():
    global _cache,_attempt
    with _lock:
        if _cache is None:
            try:
                path=CACHE_DIR/'shelters.json.gz'
                if path.stat().st_size<20*1024*1024:
                    with gzip.open(path,'rt',encoding='utf-8') as f:saved=json.load(f)
                    if saved.get('source')==URL and isinstance(saved.get('items'),list):_cache=saved
            except (OSError,ValueError,TypeError):pass
        now=time.time()
        if _cache and 0<=now-_cache['at']<TTL:return dict(_cache,stale=False,error=None)
        if now-_attempt<30:return dict(_cache or {},stale=True,error='Nie udało się odświeżyć danych PSP.')
        _attempt=now
        try:
            request=urllib.request.Request(URL,headers={'User-Agent':'Civic-prototype/1.0 (public PSP data reader)','Accept':'text/csv'})
            with _opener.open(request,timeout=12) as response:
                raw=response.read(24*1024*1024+1);modified=response.headers.get('Last-Modified')
            items,skipped=parse_csv(raw)
            _cache=dict(items=items,at=time.time(),fetchedAt=datetime.now(timezone.utc).isoformat(),modified=modified,source=URL,skipped=skipped)
            try:
                CACHE_DIR.mkdir(parents=True,exist_ok=True)
                with gzip.open(CACHE_DIR/'shelters.json.gz','wt',encoding='utf-8') as f:json.dump(_cache,f,ensure_ascii=False)
            except OSError:pass
            return dict(_cache,stale=False,error=None)
        except Exception:return dict(_cache or {},stale=True,error='Nie udało się odświeżyć danych PSP.')

def distance(lat,lon,a,b):
    p1,p2=map(math.radians,[lat,a]);dp=math.radians(a-lat);dl=math.radians(b-lon)
    h=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 6371000*2*math.atan2(math.sqrt(h),math.sqrt(max(0,1-h)))

def needs_address_check(p):
    if not p.get('address','').strip():return True
    unknown=not p.get('city') or fold(p['city']).startswith(('nieznan','brak'))
    return bool(unknown and re.match(r'^\s*\d+[a-zA-Z]?(?:[/\-]\d+[a-zA-Z]?)?\s*,',p['address']))

def search(req):
    if not isinstance(req,dict):raise ValueError('Nieprawidłowe kryteria.')
    query=str(req.get('q') or '').strip();street=str(req.get('street') or '').strip()
    if len(query)>80 or len(street)>100:raise ValueError('Skróć nazwę miejscowości lub ulicy.')
    position=req.get('lat') is not None and req.get('lon') is not None
    accuracy=None
    if position:
        if req.get('accuracy') is not None:
            try:accuracy=float(req['accuracy'])
            except (TypeError,ValueError):raise ValueError('Nie odczytano dokładności położenia.')
            if not math.isfinite(accuracy) or not 0<=accuracy<=1000:raise ValueError('Położenie jest zbyt mało dokładne. Wpisz miejscowość.')
        try:lat=float(req['lat']);lon=float(req['lon'])
        except (TypeError,ValueError):raise ValueError('Nie odczytano położenia.')
        if not math.isfinite(lat) or not math.isfinite(lon) or not 49<=lat<=55.5 or not 14<=lon<=24.5:raise ValueError('Ten zbiór dotyczy Polski. Wybierz miejscowość w Polsce.')
    elif len(query)<3:raise ValueError('Wpisz co najmniej 3 litery miejscowości, gminy lub powiatu.')
    feed=get_feed();items=feed.get('items',[])
    if query:
        words=fold(query).split();items=[p for p in items if all(w in fold(p['city']+' '+p['county']) or re.search(r'\b'+re.escape(w)+r'\b',fold(p['address'])) for w in words)]
    if street:items=[p for p in items if fold(street) in fold(p['address'])]
    if position:items=sorted((dict(p,distanceMeters=round(distance(lat,lon,p['lat'],p['lon']))) for p in items),key=lambda p:p['distanceMeters'])
    else:
        def address_key(p):
            address=re.sub(r'^(?:ulica|ul\.)\s*','',fold(p['address']))
            return (needs_address_check(p),tuple(int(v) if v.isdigit() else v for v in re.split(r'(\d+)',address)))
        items=sorted(items,key=address_key)
    if position:items=[p for p in items if p['distanceMeters']<=30000]
    return dict(items=[dict(p,addressNeedsCheck=needs_address_check(p)) for p in items[:100]],total=len(items),limited=len(items)>100,positionUsed=position,positionAccuracyMeters=accuracy,fetchedAt=feed.get('fetchedAt'),modified=feed.get('modified'),stale=feed['stale'],error=feed.get('error'),source=SOURCE,license='CC BY 4.0',attribution='KG PSP; filtrowanie, porządkowanie i odległości: opracowanie własne',skipped=feed.get('skipped',0))
