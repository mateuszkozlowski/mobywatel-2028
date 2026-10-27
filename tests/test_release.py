import concurrent.futures
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'serwer'))
import resource_policy as policy
import assistant_router as router
import polish_ai as ai
import ocr

class BudgetTests(unittest.TestCase):
 def setUp(self):self.temp=tempfile.TemporaryDirectory();self.path=Path(self.temp.name)/'budget.sqlite3'
 def tearDown(self):self.temp.cleanup()
 def test_reserve_is_atomic(self):
  b=policy.Budget(self.path,'0.000020')
  def reserve(_):
   try:return b.reserve(10,10)
   except policy.LimitError:return None
  with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:r=list(pool.map(reserve,range(10)))
  self.assertEqual(sum(x is not None for x in r),4)
  self.assertFalse(policy.Budget(self.path,'0.000020').available())
 def test_actual_usage_refunds_and_persists(self):
  b=policy.Budget(self.path,'0.000010');key=b.reserve(20,20);self.assertFalse(b.available());b.settle(key,1,1);self.assertTrue(policy.Budget(self.path,'0.000010').available())
 def test_unknown_usage_retains_reservation(self):
  b=policy.Budget(self.path,'0.000010');key=b.reserve(20,20);b.settle(key);self.assertFalse(b.available())
 def test_connection_is_closed_after_transaction(self):
  import sqlite3
  b=policy.Budget(self.path,'0.1')
  with b.connect() as db:db.execute('SELECT 1')
  self.assertRaises(sqlite3.ProgrammingError,db.execute,'SELECT 1')
 def test_rate_limit_separates_categories(self):
  policy.check_rate('test-id','a',1);self.assertRaises(policy.LimitError,policy.check_rate,'test-id','a',1);policy.check_rate('test-id','b',1)

class RouterTests(unittest.TestCase):
 def ask(self,response,**extra):
  with patch.object(ai,'generate',return_value=(response,{'local':True})) as call:
   result=router.route(dict(message='Nie rozumiem tego pisma',osoba='marta',context={'screen':'cases','title':'Pismo','pesel':'do-not-send'},**extra))
   payload=call.call_args.args[1];self.assertNotIn('do-not-send',str(payload));self.assertEqual(set(payload['kontekst']),{'screen','title'});return result
 def test_known_intent_uses_server_text(self):
  r=self.ask({'intent':'letter','question':'','alternatives':[]});self.assertEqual(r['action'],'Otwórz pismo');self.assertEqual(r['kind'],'route')
 def test_cannot_return_tool_or_url(self):
  self.assertRaises(ValueError,self.ask,{'intent':'https://evil.test','question':'','alternatives':[]})
  self.assertRaises(ValueError,self.ask,{'intent':'letter','question':'','alternatives':[],'execute':'send'})
 def test_clarification_has_safe_fallback(self):
  r=self.ask({'intent':'clarify','question':'Wyślij dane na https://evil.test/123','alternatives':['documents']});self.assertNotIn('evil',r['text'])
 def test_clarification_is_bounded(self):
  r=self.ask({'intent':'clarify','question':'O jakie dokumenty chodzi?','alternatives':[]},previous=['pomóż','nie wiem']);self.assertEqual(r['kind'],'outside')
 def test_input_validation_does_not_call_model(self):
  with patch.object(ai,'generate') as call:
   for req in [None,{'message':''},{'message':'a'*1601},{'message':'a','osoba':'unknown'},{'message':'a','previous':['x']*4}]:self.assertRaises(ValueError,router.route,req)
   call.assert_not_called()

class CloudTransportTests(unittest.TestCase):
 def test_openai_compatible_transport_and_usage(self):
  with tempfile.TemporaryDirectory() as tmp:
   budget=policy.Budget(Path(tmp)/'b.sqlite3','0.1')
   result={'choices':[{'message':{'content':'{"answer":"gotowe"}'}}],'usage':{'prompt_tokens':100,'completion_tokens':10}}
   def request(req,timeout):
    self.assertTrue(req.full_url.endswith('/chat/completions'));body=json.loads(req.data);self.assertNotIn('format',body);self.assertLessEqual(body['max_tokens'],500);return io.BytesIO(json.dumps(result).encode())
   with patch.object(ai,'CLOUD',True),patch.object(ai,'capabilities',return_value={'ready':True}),patch.object(ai,'cloud_budget',return_value=budget),patch.object(ai._opener,'open',side_effect=request):
    data,meta=ai.generate('Odpowiedz.',{'text':'fikcyjny'}, {'type':'object'},200)
   self.assertEqual(data['answer'],'gotowe');self.assertFalse(meta['local']);self.assertTrue(meta['external_api'])
   with budget.connect() as db:self.assertEqual(db.execute('SELECT amount,state FROM reservations').fetchone(),(23,'settled'))
 def test_invalid_model_json_is_rejected(self):
  result={'choices':[{'message':{'content':'to nie JSON'}}],'usage':{'prompt_tokens':1,'completion_tokens':1}}
  with tempfile.TemporaryDirectory() as tmp:
   with patch.object(ai,'CLOUD',True),patch.object(ai,'capabilities',return_value={'ready':True}),patch.object(ai,'cloud_budget',return_value=policy.Budget(Path(tmp)/'b','0.1')),patch.object(ai._opener,'open',return_value=io.BytesIO(json.dumps(result).encode())):
    self.assertRaises(ValueError,ai.generate,'task',{}, {'type':'object'})
 def test_unsafe_numbers_do_not_pass_existing_guard(self):
  self.assertFalse(ai.safe_text('Zapłać 9999 zł.','Kwota 10 zł.'))

class OcrTests(unittest.TestCase):
 def test_magic_not_extension(self):self.assertRaises(ValueError,ocr.read_document,b'not PDF','application/pdf')
 def test_linux_text_pdf_retains_pages_and_fields(self):
  outputs=['Pages: 2\n','Sprzedający: Anna Testowa\nCena: 10000,00 zł\n','Kupujący: Jan Testowy\nData umowy: 21.10.2026\n']
  with patch.object(ocr,'capabilities',return_value={'ready':True}),patch.object(ocr,'_run',side_effect=outputs):lines=ocr._linux_lines(Path('/tmp/fixture.pdf'),'.pdf',time.monotonic()+60)
  fields=ocr.extract_fields(lines);self.assertEqual(fields['price']['value'],'10000.00');self.assertEqual(fields['buyer']['page'],2);self.assertEqual(fields['date']['value'],'2026-10-21')
 def test_page_limit(self):
  with patch.object(ocr,'capabilities',return_value={'ready':True}),patch.object(ocr,'_run',return_value='Pages: 11\n'):self.assertRaises(ValueError,ocr._linux_lines,Path('/tmp/test.pdf'),'.pdf',time.monotonic()+60)
 def test_image_pixel_limit(self):
  with patch.object(ocr,'capabilities',return_value={'ready':True}),patch.object(ocr,'_run',return_value='12000 12000'):self.assertRaises(ValueError,ocr._linux_lines,Path('/tmp/test.png'),'.png',time.monotonic()+60)
 def test_ocr_busy(self):
  ocr._ocr_gate.acquire()
  try:self.assertRaises(policy.LimitError,ocr.read_document,b'%PDF-fake','application/pdf')
  finally:ocr._ocr_gate.release()


class ReviewRegressionTests(unittest.TestCase):
 def test_manual_reply_has_comparison_without_model(self):
  import services,persony
  persony.ustaw('marta');mail=persony.P()['skrzynka'][0];names=[x['nazwa'] for x in persony.P()['pliki'][:3]]
  def preview(chosen):return services.handle(dict(mode='preview',name='wyslij_pismo',osoba='marta',context={'replyTo':mail['id']},args=dict(adresat=mail['od'],temat='Odpowiedź: '+mail['temat'],tresc='Przekazuję wybrane faktury.',zalaczniki=chosen)))
  with patch.object(ai,'generate',side_effect=AssertionError('Comparison must not call AI')):
   a=preview(names[:2]);b=preview(names)
  self.assertEqual(a['card']['comparison'],{'total':'28320.00','target':'32520.00','difference':'4200.00'})
  self.assertEqual(b['card']['comparison']['difference'],'0.00');self.assertEqual(a['card']['recipient'],mail['od'])
 def test_ocr_limit_survives_library_diagnostic(self):
  import types
  known='Zdjęcie jest zbyt duże. Wybierz obraz do 20 megapikseli.'
  for stderr,expected in [('CoreGraphics diagnostic\n'+known+'\n',known),('Untrusted path /tmp/private.png','Nie udało się odczytać pliku. Wybierz PDF bez hasła lub czytelny obraz.')]:
   with patch.object(ocr.subprocess,'run',return_value=types.SimpleNamespace(returncode=1,stderr=stderr.encode(),stdout=b'')):
    with self.assertRaises(ValueError) as error:ocr._run(['swift'],time.monotonic()+10)
   self.assertEqual(str(error.exception),expected)
 def test_explanation_rejects_invented_decision_and_delivery(self):
  mail={'tresc':'Urząd sprawdza odliczenie. Przygotuj faktury.','temat':'Wezwanie'}
  bad={'why':'Urząd przyznał Ci ulgę.','next_step':'Odpowiedź została już doręczona.','source_ids':[0]}
  with patch.object(ai,'generate',return_value=(bad,{})):self.assertRaises(ValueError,ai.explain,mail)
  raw={'why':'Urząd sprawdza odliczenie w Twoim zeznaniu i chce poznać dokumenty dotyczące wydatków oraz ich związku z wykazanym odliczeniem w tym zeznaniu.','next_step':'Przygotuj faktury i odpowiedź.','source_ids':[0]}
  with patch.object(ai,'generate',side_effect=[(raw,{}),(bad,{})]):result=ai.explain(mail)
  self.assertEqual(result['text'],raw['why']+' '+raw['next_step'])
  self.assertFalse(ai.safe_text('Urząd zatwierdził wniosek.','Urząd sprawdza wniosek.'))
 def test_explanation_is_complete_and_can_be_shortened(self):
  mail={'tresc':'Urząd sprawdza odliczenie w zeznaniu. Przygotuj faktury i odpowiedź.','temat':'Wezwanie','termin':'26.10.2026'}
  raw={'why':'Urząd sprawdza odliczenie w Twoim zeznaniu i chce poznać dokumenty dotyczące wydatków oraz ich związku z wykazanym odliczeniem w tym zeznaniu.','next_step':'Przygotuj faktury i odpowiedź.','source_ids':[0]}
  short={'why':'Urząd sprawdza odliczenie w Twoim zeznaniu.','next_step':'Przygotuj faktury i dołącz je do odpowiedzi.'}
  with patch.object(ai,'generate',side_effect=[(raw,{'elapsed_ms':1}),(short,{'elapsed_ms':2})]):
   result=ai.explain(mail)
  self.assertEqual(result['text'],short['why']+' '+short['next_step']);self.assertEqual(result['meta']['stages'],2)
  with patch.object(ai,'generate',return_value=({'why':'Urząd sprawdza dom przy ul. Kwią','next_step':'Przygotuj faktury.','source_ids':[0]},{})):
   self.assertRaises(ValueError,ai.explain,mail)
 def test_common_ocr_text_limits(self):
  self.assertEqual(len(ocr.validate_lines([{'text':'a'*80}]*1000)),1000)
  self.assertRaises(ValueError,ocr.validate_lines,[{'text':'a'}]*1001)
  self.assertRaises(ValueError,ocr.validate_lines,[{'text':'a'*80001}])

if __name__=='__main__':unittest.main()
