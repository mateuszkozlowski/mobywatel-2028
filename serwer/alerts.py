"""Publiczne ostrzeżenia IMGW: stałe źródło, jawny czas pobrania, bez lokalizacji użytkownika."""
import json, threading, urllib.request, hashlib
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
SOURCE='https://danepubliczne.imgw.pl/api/data/warningsmeteo'
_cache=None
_lock=threading.Lock()
def iso(value):
    try:return datetime.strptime(value,'%Y-%m-%d %H:%M:%S').replace(tzinfo=ZoneInfo('Europe/Warsaw')).isoformat()
    except (ValueError,TypeError):return None
def normalize(rows):
    if not isinstance(rows,list):raise ValueError('Nieprawidłowa odpowiedź IMGW')
    items=[]
    for row in rows[:500]:
        if not isinstance(row,dict) or not row.get('id'):continue
        areas=[str(t) for t in row.get('teryt',[]) if len(str(t))==4 and str(t).isdigit()]
        start,end=iso(row.get('obowiazuje_od')),iso(row.get('obowiazuje_do'))
        if not start or not end:continue
        level=str(row.get('stopien',''))
        items.append(dict(id=str(row['id'])[:100],title=str(row.get('nazwa_zdarzenia','Ostrzeżenie'))[:150],level=int(level) if level in ('1','2','3') else None,areas=areas,start=start,end=end,published=iso(row.get('opublikowano')),text=str(row.get('tresc',''))[:8000],comment=str(row.get('komentarz',''))[:2000],office=str(row.get('biuro','IMGW-PIB'))[:300],source='IMGW-PIB'))
    return dict(items=items,fetchedAt=datetime.now(timezone.utc).isoformat(),source=SOURCE,stale=False)
def get_alerts():
    global _cache
    with _lock:
        if _cache and (datetime.now(timezone.utc)-datetime.fromisoformat(_cache['fetchedAt'])).total_seconds()<300:return _cache
        try:
            request=urllib.request.Request(SOURCE,headers={'User-Agent':'mObywatel-UI-Research/1.0','Accept':'application/json'})
            with urllib.request.urlopen(request,timeout=10) as response:
                body=response.read(2_000_001)
            if len(body)>2_000_000:raise ValueError('Zbyt duża odpowiedź')
            _cache=normalize(json.loads(body))
            return _cache
        except Exception:
            if _cache:return dict(_cache,stale=True,error='Nie udało się odświeżyć danych IMGW.')
            return dict(items=[],fetchedAt=None,source=SOURCE,stale=True,error='Nie udało się pobrać danych IMGW.')

HYDRO_SOURCE='https://danepubliczne.imgw.pl/api/data/warningshydro'
_hydro_cache=None
_hydro_lock=threading.Lock()
def normalize_hydro(rows):
    if not isinstance(rows,list):raise ValueError('Nieprawidłowa odpowiedź IMGW')
    items=[]
    for row in rows[:500]:
        if not isinstance(row,dict):continue
        start=iso(row.get('data_od'));raw_end=row.get('data_do','');ongoing=raw_end.startswith('9999-')
        end=None if ongoing else iso(raw_end)
        if not start or not (end or ongoing):continue
        level=str(row.get('stopień',row.get('stopien','')))
        regions=[dict(name=str(a.get('wojewodztwo',''))[:60],description=str(a.get('opis',''))[:1000],catchments=[str(c)[:60] for c in a.get('kod_zlewni',[])][:100]) for a in row.get('obszary',[]) if isinstance(a,dict)]
        identity='|'.join(str(row.get(k,'')) for k in ['numer','biuro','opublikowano'])
        probability=str(row.get('prawdopodobienstwo',''))
        items.append(dict(id=hashlib.sha256(identity.encode()).hexdigest()[:20],title=str(row.get('zdarzenie','Ostrzeżenie hydrologiczne'))[:200],level=int(level) if level in ('-1','0','1','2','3') else None,regions=regions,start=start,end=end,untilNotice=ongoing,published=iso(row.get('opublikowano')),probability=int(probability) if probability.isdigit() and 0<=int(probability)<=100 else None,text=str(row.get('przebieg',''))[:8000],comment=str(row.get('komentarz',''))[:2000],office=str(row.get('biuro','IMGW-PIB'))[:300]))
    return dict(items=items,fetchedAt=datetime.now(timezone.utc).isoformat(),source=HYDRO_SOURCE,stale=False)

def get_hydro():
    global _hydro_cache
    with _hydro_lock:
        if _hydro_cache and (datetime.now(timezone.utc)-datetime.fromisoformat(_hydro_cache['fetchedAt'])).total_seconds()<300:return _hydro_cache
        try:
            req=urllib.request.Request(HYDRO_SOURCE,headers={'User-Agent':'mObywatel-UI-Research/1.0','Accept':'application/json'})
            with urllib.request.urlopen(req,timeout=10) as response:body=response.read(2_000_001)
            if len(body)>2_000_000:raise ValueError('Zbyt duża odpowiedź')
            _hydro_cache=normalize_hydro(json.loads(body));return _hydro_cache
        except Exception:
            return dict(_hydro_cache,stale=True,error='Nie udało się odświeżyć danych hydrologicznych.') if _hydro_cache else dict(items=[],fetchedAt=None,source=HYDRO_SOURCE,stale=True,error='Nie udało się pobrać danych hydrologicznych.')
