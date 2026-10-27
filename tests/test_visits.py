import unittest,tempfile,sys
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'serwer'))
import visit_counts
class VisitCountTests(unittest.TestCase):
 def setUp(self):self.temp=tempfile.TemporaryDirectory();self.db=Path(self.temp.name)/'counts.sqlite3';self.now=datetime(2026,10,26,14,0,tzinfo=ZoneInfo('Europe/Warsaw'))
 def tearDown(self):self.temp.cleanup()
 def test_views_are_aggregated_and_persist(self):
  for _ in range(2):self.assertTrue(visit_counts.record('/pokaz.html','document',db=self.db,now=self.now))
  self.assertEqual(visit_counts.summary(self.db)['totals'],{'strona':2})
 def test_embedded_app_and_api_do_not_inflate_site_views(self):
  self.assertFalse(visit_counts.record('/aplikacja','iframe',db=self.db));self.assertFalse(visit_counts.record('/api/health','document',db=self.db));self.assertFalse(self.db.exists())
 def test_qa_views_are_not_counted(self):
  self.assertFalse(visit_counts.record('/pokaz.html','document','qa=1',db=self.db));self.assertFalse(self.db.exists())
 def test_page_types_are_separate(self):
  visit_counts.record('/','document',db=self.db,now=self.now);visit_counts.record('/aplikacja','document',db=self.db,now=self.now)
  result=visit_counts.summary(self.db);self.assertEqual(result['totals'],{'aplikacja':1,'strona':1});self.assertEqual(len(result['days']),2)

 def test_public_view_signal_records_only_a_known_page(self):
  import server,json,threading,urllib.request,urllib.error
  from unittest.mock import patch
  srv=server.CivicHTTPServer(('127.0.0.1',0),server.H);thread=threading.Thread(target=srv.serve_forever,daemon=True);thread.start()
  try:
   with patch.object(server,'PUBLIC_DEMO',True),patch.object(visit_counts,'DB',self.db):
    def post(page):
     req=urllib.request.Request('http://127.0.0.1:'+str(srv.server_address[1])+'/api/page-view',data=json.dumps({'page':page}).encode(),headers={'Content-Type':'application/json'})
     return urllib.request.urlopen(req)
    with post('strona') as response:self.assertTrue(json.load(response)['recorded'])
    with self.assertRaises(urllib.error.HTTPError) as error:post('unknown')
    self.assertEqual(error.exception.code,400);error.exception.close();self.assertEqual(visit_counts.summary(self.db)['totals'],{'strona':1})
  finally:srv.shutdown();srv.server_close();thread.join()
