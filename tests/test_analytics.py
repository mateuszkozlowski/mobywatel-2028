import unittest,tempfile,sys,sqlite3,json,threading,urllib.request,urllib.error
from pathlib import Path
from contextlib import closing
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'serwer'))
import visit_counts,admin_panel,server
class AnalyticsTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.db=Path(self.tmp.name)/'visits.sqlite3';self.now=datetime(2026,10,27,14,30,tzinfo=ZoneInfo('Europe/Warsaw'))
 def tearDown(self):self.tmp.cleanup()
 def test_legacy_aggregate_rows_survive_extension(self):
  with closing(sqlite3.connect(self.db)) as c, c:
   c.execute('CREATE TABLE counts(day TEXT,page TEXT,views INTEGER,last_seen TEXT,PRIMARY KEY(day,page))');c.execute('INSERT INTO counts VALUES(?,?,?,?)',('2026-10-27','strona',1,self.now.isoformat()))
  visit_counts.record('/pokaz.html','document',source='challenge',device='small',db=self.db,now=self.now)
  s=visit_counts.summary(self.db);self.assertEqual(s['totals'],{'strona':2});self.assertTrue(s['details_since']);self.assertEqual(admin_panel.metric_rows(s,'source'),{'challenge':1})
 def test_events_are_aggregates_without_individual_identifiers(self):
  for _ in range(2):self.assertTrue(visit_counts.record_action({'page':'strona','event':'scene_open','target':'marta-letter'},db=self.db,now=self.now))
  s=visit_counts.summary(self.db);self.assertEqual(s['totals'],{});self.assertEqual(admin_panel.metric_rows(s,'scene_open'),{'marta-letter':2});self.assertEqual(len(s['measurements']),1)
  with closing(sqlite3.connect(self.db)) as c, c:self.assertEqual([r[1] for r in c.execute('PRAGMA table_info(measurements)')],['day','hour','page','kind','target','value'])
 def test_untrusted_content_and_bad_duration_are_rejected(self):
  invalid=[{'page':'strona','event':'scene_open','target':'https://private.example/?token=x'},{'page':'strona','event':'github_click','text':'private message'},{'page':{},'event':'demo_open'},{'page':'strona','event':'engagement','seconds':True},{'page':'strona','event':'engagement','seconds':-1},{'page':'strona','event':'engagement','seconds':31},{'page':'admin','event':'demo_open'},{'page':'strona','event':'unknown'}]
  for item in invalid:self.assertFalse(visit_counts.record_action(item,db=self.db,now=self.now))
  self.assertFalse(self.db.exists())
 def test_activity_seconds_and_page_denominator_are_separate(self):
  visit_counts.record('/pokaz.html','document',source='direct',device='large',db=self.db,now=self.now)
  for seconds in [15,12]:visit_counts.record_action({'page':'strona','event':'engagement','seconds':seconds},db=self.db,now=self.now)
  s=visit_counts.summary(self.db);self.assertEqual(admin_panel.metric_total(s,'engagement'),27);self.assertEqual(admin_panel.metric_total(s,'measured_view'),1);self.assertEqual(s['totals']['strona'],1)
 def test_cookie_choice_does_not_create_another_view_or_source(self):
  visit_counts.record('/pokaz.html','document',source='direct',device='small',db=self.db,now=self.now)
  visit_counts.record('/pokaz.html','document',visitor='a'*32,count=False,source='direct',device='small',db=self.db,now=self.now)
  s=visit_counts.summary(self.db);self.assertEqual(s['totals'],{'strona':1});self.assertEqual(admin_panel.metric_rows(s,'source'),{'direct':1});self.assertEqual(sum(s['browsers'].values()),1)
 def test_range_respects_warsaw_calendar_and_crosses_month(self):
  for delta in [0,1,7]:visit_counts.record('/pokaz.html','document',db=self.db,now=self.now-timedelta(days=delta))
  self.assertEqual(sum(visit_counts.summary(self.db,days=7,now=self.now)['totals'].values()),2)
  self.assertEqual(sum(visit_counts.summary(self.db,days=1,now=self.now)['totals'].values()),1)
  self.assertEqual(admin_panel.period_days('days=999'),7);self.assertEqual(admin_panel.period_days('days=90'),90)
 def test_retention_removes_old_details_but_keeps_legacy_counts(self):
  visit_counts.record('/pokaz.html','document',source='google',device='small',db=self.db,now=self.now-timedelta(days=100))
  visit_counts.record('/pokaz.html','document',source='direct',device='large',db=self.db,now=self.now)
  s=visit_counts.summary(self.db);self.assertEqual(sum(s['totals'].values()),2);self.assertEqual(admin_panel.metric_rows(s,'source'),{'direct':1})
 def test_dashboard_handles_old_counts_without_new_details(self):
  with closing(sqlite3.connect(self.db)) as c, c:
   c.execute('CREATE TABLE counts(day TEXT,page TEXT,views INTEGER,last_seen TEXT,PRIMARY KEY(day,page))');c.execute('INSERT INTO counts VALUES(?,?,?,?)',('2026-10-27','strona',1,self.now.isoformat()))
  with patch.object(visit_counts,'DB',self.db):
   text=admin_panel.dashboard(7,now=self.now);self.assertIn('Odsłony dzisiaj: 1',text);self.assertIn('Szczegółowy pomiar rozpocznie',text);self.assertIn('Uruchomienia aplikacji',text)
 def test_csv_exports_only_aggregates(self):
  visit_counts.record('/pokaz.html','document',visitor='a'*32,source='direct',device='small',db=self.db)
  visit_counts.record_action({'page':'strona','event':'scene_open','target':'marta-letter'},db=self.db)
  with patch.object(visit_counts,'DB',self.db):text=admin_panel.export_csv(7).decode('utf-8-sig')
  self.assertIn('marta-letter',text);self.assertNotIn('signature',text);self.assertNotIn('a'*32,text);self.assertNotIn('civic_visit',text)
 def test_http_rejects_unknown_payload_and_does_not_set_cookie_for_events(self):
  srv=server.CivicHTTPServer(('127.0.0.1',0),server.H);t=threading.Thread(target=srv.serve_forever,daemon=True);t.start();base='http://127.0.0.1:'+str(srv.server_address[1])
  def post(value):return urllib.request.urlopen(urllib.request.Request(base+'/api/analytics',data=json.dumps(value).encode(),headers={'Content-Type':'application/json'}))
  try:
   with patch.object(server,'PUBLIC_DEMO',True),patch.object(visit_counts,'DB',self.db):
    with post({'page':'strona','event':'github_click'}) as r:self.assertTrue(json.load(r)['recorded']);self.assertIsNone(r.headers.get('Set-Cookie'))
    with self.assertRaises(urllib.error.HTTPError) as err:post({'page':'strona','event':'github_click','url':'https://secret.example'})
    self.assertEqual(err.exception.code,400);err.exception.close()
    with self.assertRaises(urllib.error.HTTPError) as err:
     urllib.request.urlopen(urllib.request.Request(base+'/api/analytics',data=b'{"page":"strona","event":"github_click"}',headers={'Content-Type':'application/json','Origin':'https://other.example'}))
    self.assertEqual(err.exception.code,403);err.exception.close()
    class NoRedirect(urllib.request.HTTPRedirectHandler):
     def redirect_request(self,*args):return None
    with self.assertRaises(urllib.error.HTTPError) as err:urllib.request.build_opener(NoRedirect).open(base+'/admin/export.csv?days=7')
    self.assertEqual(err.exception.code,303);err.exception.close()
  finally:srv.shutdown();srv.server_close();t.join()

 def test_out_of_order_writes_do_not_move_last_seen_backwards(self):
  visit_counts.record('/pokaz.html','document',db=self.db,now=self.now)
  visit_counts.record('/pokaz.html','document',db=self.db,now=self.now-timedelta(minutes=10))
  self.assertEqual(visit_counts.summary(self.db)['last_seen'],self.now.isoformat(timespec='seconds'))
 def test_owner_can_export_csv_without_exposing_browser_signatures(self):
  auth=Path(self.tmp.name)/'auth.json';auth.write_text(json.dumps({'session_key':'ab'*32}))
  visit_counts.record('/pokaz.html','document',visitor='a'*32,db=self.db)
  srv=server.CivicHTTPServer(('127.0.0.1',0),server.H);t=threading.Thread(target=srv.serve_forever,daemon=True);t.start()
  try:
   with patch.object(admin_panel,'AUTH_PATH',auth),patch.object(visit_counts,'DB',self.db):
    token=admin_panel.issue_session();request=urllib.request.Request('http://127.0.0.1:'+str(srv.server_address[1])+'/admin/export.csv?days=7',headers={'Cookie':'civic_admin='+token})
    with urllib.request.urlopen(request) as r:
     body=r.read().decode('utf-8-sig');self.assertEqual(r.status,200);self.assertIn('no-store',r.headers['Cache-Control']);self.assertIn('attachment',r.headers['Content-Disposition']);self.assertIn('odslony',body);self.assertNotIn('a'*32,body)
  finally:srv.shutdown();srv.server_close();t.join()

 def test_inactive_details_are_hidden_after_ninety_days_without_deleting_daily_counts(self):
  visit_counts.record('/pokaz.html','document',source='direct',device='large',db=self.db,now=self.now)
  s=visit_counts.summary(self.db,now=self.now+timedelta(days=100))
  self.assertEqual(s['totals'],{'strona':1});self.assertEqual(s['measurements'],[])
