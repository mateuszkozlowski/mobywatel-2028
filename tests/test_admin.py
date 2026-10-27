import unittest,tempfile,sys,json,hashlib,threading,urllib.request,urllib.error
from pathlib import Path
from unittest.mock import patch
from http.cookies import SimpleCookie
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'serwer'))
import server,admin_panel,visit_counts
class AdminTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();root=Path(self.temp.name);self.auth=root/'admin-auth.json';self.db=root/'counts.sqlite3';salt='ab'*16
  self.auth.write_text(json.dumps(dict(salt=salt,iterations=600000,password_hash=hashlib.pbkdf2_hmac('sha256',b'test-password',bytes.fromhex(salt),600000).hex(),session_key='cd'*32)))
  self.patches=[patch.object(admin_panel,'AUTH_PATH',self.auth),patch.object(visit_counts,'DB',self.db),patch.object(server,'PUBLIC_DEMO',True)]
  for p in self.patches:p.start()
 def tearDown(self):
  for p in reversed(self.patches):p.stop()
  self.temp.cleanup()
 def test_password_requires_correct_username_and_password(self):
  self.assertTrue(admin_panel.password_ok('admin','test-password'));self.assertFalse(admin_panel.password_ok('admin','wrong'));self.assertFalse(admin_panel.password_ok('visitor','test-password'))
 def test_expired_or_tampered_sessions_are_rejected(self):
  token=admin_panel.issue_session(now=100);cookie='civic_admin='+token
  self.assertTrue(admin_panel.session_ok(cookie,now=101));self.assertFalse(admin_panel.session_ok(cookie,now=29000));self.assertFalse(admin_panel.session_ok(cookie[:-2]+'aa',now=101));self.assertFalse(admin_panel.session_ok('invalid',now=101))
 def test_missing_auth_configuration_fails_closed(self):
  with patch.object(admin_panel,'AUTH_PATH',Path(self.temp.name)/'missing'):
   self.assertFalse(admin_panel.password_ok('admin','test-password'));self.assertFalse(admin_panel.session_ok('civic_admin=invalid'))
 def test_daily_browser_count_is_not_pageview_count(self):
  now=datetime(2026,10,26,12,tzinfo=ZoneInfo('Europe/Warsaw'))
  for path in ('/','/materialy.html','/aplikacja'):visit_counts.record(path,'document',visitor='a'*32,db=self.db,now=now)
  visit_counts.record('/','document',visitor='b'*32,db=self.db,now=now)
  visit_counts.record('/','document',visitor='a'*32,db=self.db,now=now+timedelta(days=1))
  data=visit_counts.summary(self.db);self.assertEqual(data['browsers'],{'2026-10-26':2,'2026-10-27':1});self.assertEqual(sum(data['totals'].values()),5)
 def test_browser_cookie_is_validated_and_secure(self):
  visitor,cookie=visit_counts.browser_cookie('civic_visit=bad');self.assertEqual(len(visitor),32)
  for flag in ('HttpOnly','Secure','SameSite=Lax','Max-Age=86400'):self.assertIn(flag,cookie)
  self.assertEqual(visit_counts.browser_cookie('civic_visit='+visitor),(visitor,None))
 def test_optional_browser_count_does_not_add_pageview(self):
  visit_counts.record('/','document',visitor='a'*32,db=self.db,count=False);data=visit_counts.summary(self.db);self.assertEqual(data['totals'],{});self.assertEqual(sum(data['browsers'].values()),1)
 def test_http_login_dashboard_logout_and_cookie_consent(self):
  class NoRedirect(urllib.request.HTTPRedirectHandler):
   def redirect_request(self,*args):return None
  srv=server.CivicHTTPServer(('127.0.0.1',0),server.H);thread=threading.Thread(target=srv.serve_forever,daemon=True);thread.start();base='http://127.0.0.1:'+str(srv.server_address[1]);opener=urllib.request.build_opener(NoRedirect)
  def req(path,data=None,cookie=None,origin=None):
   headers={}
   if cookie:headers['Cookie']=cookie
   if origin:headers['Origin']=origin
   try:return opener.open(urllib.request.Request(base+path,data=data,headers=headers))
   except urllib.error.HTTPError as e:return e
  try:
   with req('/admin') as response:
    text=response.read().decode();self.assertIn('Statystyki projektu',text);self.assertNotIn('Odsłony dzisiaj',text);self.assertIn('no-store',response.headers['Cache-Control'])
   with req('/admin/login',b'username=admin&password=wrong') as response:self.assertEqual(response.code,401)
   with req('/admin/login',b'username=admin&password=test-password',origin='https://other.example') as response:self.assertEqual(response.code,403)
   with req('/admin/login',b'username=admin&password=test-password') as response:
    self.assertEqual(response.code,303);session=response.headers['Set-Cookie'].split(';')[0];self.assertIn('HttpOnly',response.headers['Set-Cookie']);self.assertIn('Secure',response.headers['Set-Cookie'])
   with req('/admin',cookie=session) as response:self.assertIn('Odsłony dzisiaj',response.read().decode())
   with req('/admin/logout',b'',cookie=session) as response:self.assertEqual(response.code,303);self.assertIn('Max-Age=0',response.headers['Set-Cookie'])
   with req('/api/page-view',b'{"page":"strona"}') as response:self.assertIsNone(response.headers.get('Set-Cookie'))
   with req('/api/page-view',b'{"page":"strona","cookie":true,"count":false}') as response:
    self.assertIn('civic_visit=',response.headers['Set-Cookie']);browser=response.headers['Set-Cookie'].split(';')[0]
   with req('/api/page-view',b'{"page":"strona","cookie":false,"count":false}',cookie=browser) as response:self.assertIn('Max-Age=0',response.headers['Set-Cookie'])
   self.assertEqual(visit_counts.summary(self.db)['totals'],{'strona':1})
  finally:srv.shutdown();srv.server_close();thread.join()
