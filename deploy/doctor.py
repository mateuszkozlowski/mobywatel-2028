"""Read-only HTTP checks. Does not spend AI tokens or upload files."""
import json,sys,urllib.request,urllib.error
base=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8790').rstrip('/')
paths=['/api/health','/api/ai/capabilities','/pokaz.html','/aplikacja?osoba=marta','/materialy.html','/materials.json','/research-results.json']
failed=[]
for path in paths:
 try:
  with urllib.request.urlopen(base+path,timeout=15) as r:
   body=r.read();assert r.status==200
  if path.startswith('/api/'):
   data=json.loads(body)
   if path.endswith('health'):assert data.get('ok') and not data.get('agent')
   elif not data.get('ready'):print('UWAGA: model niedostępny lub nieskonfigurowany')
  print('OK',path)
 except Exception as e:failed.append(path);print('BŁĄD',path,type(e).__name__)
if base.startswith('https://'):print('TLS: certyfikat zweryfikowany przez klienta HTTPS.')
else:print('Lokalny test HTTP. Nie potwierdza publicznego TLS ani DNS.')
sys.exit(bool(failed))
