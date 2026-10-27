"""Calendar for fictional operational dates; identity and public-source dates stay intact."""
import copy,json,re
from datetime import date,datetime,timedelta
from zoneinfo import ZoneInfo
BASE=date(2026,10,26)
def today():return datetime.now(ZoneInfo('Europe/Warsaw')).date()
def action_dates(people):
 out=set()
 def add(raw,near=False):
  try:d=date.fromisoformat(raw)
  except (ValueError,TypeError):return
  if not near or -30<=(d-BASE).days<=120:out.add(d.isoformat())
 for p in people.values():
  for mail in p.get('skrzynka',[]):
   for key in ('termin','doreczono'):add(mail.get(key))
  for row in p.get('naleznosci',[]):add(row.get('termin'))
  for row in p.get('pojazdy',[]):
   for key in ('oc_do','badanie_do'):add(row.get(key),True)
  for row in p.get('dokumenty',{}).values():add(row.get('wazny_do'),True)
  for row in p.get('recepty',[]):
   raw=row.get('wazna_do','')
   try:add(datetime.strptime(raw,'%d.%m.%Y').date().isoformat(),True)
   except ValueError:pass
 return sorted(out)
def mapping(keys,day=None):
 delta=((day or today())-BASE).days;out={}
 for key in keys:
  d=date.fromisoformat(key);shifted=d+timedelta(days=delta)
  out[d.isoformat()]=shifted.isoformat();out[d.strftime('%d.%m.%Y')]=shifted.strftime('%d.%m.%Y')
 return out
def shift(value,pairs):
 if isinstance(value,dict):return {k:shift(v,pairs) for k,v in value.items()}
 if isinstance(value,list):return [shift(v,pairs) for v in value]
 if isinstance(value,str):return re.sub(r'(?<![0-9])(?:[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\.[0-9]{2}\.[0-9]{4})(?![0-9])',lambda m:pairs.get(m.group(),m.group()),value)
 return copy.deepcopy(value)
def person(value,people,day=None):
 result=shift(value,mapping(action_dates(people),day))
 for row in result.get('naleznosci',[]):
  if row.get('termin'):row['tytul']=row['tytul'].replace(str(BASE.year),row['termin'][:4])
 return result
