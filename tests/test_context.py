import io,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'serwer'))
import assistant_router as router,polish_ai as ai,prepared_letters,resource_policy,scenario_clock
from datetime import date

class ScreenContextTests(unittest.TestCase):
 def test_letter_answer_uses_exact_resource_and_profile(self):
  answer={'text':'Urząd prosi o wyjaśnienie korekty.','sources':['Źródło'],'meta':{'provider':'Public AI / Bielik'},'cached':True}
  with patch.object(prepared_letters,'explain',return_value=answer) as explain,patch.object(ai,'generate') as model:
   result=router.route({'osoba':'jan','message':'Wyjaśnij mi to pismo','context':{'kind':'letter','resourceId':'US-1','title':'do-not-trust'}})
  self.assertEqual(result['kind'],'answer');self.assertIn('VAT',explain.call_args.args[0]['temat']);model.assert_not_called()
  self.assertEqual(result['alternatives'][1]['intent'],'letter_reply');self.assertEqual(result['context']['resourceId'],'US-1');self.assertEqual(result['sources'],['Źródło'])
 def test_message_reference_in_letter_does_not_trigger_phishing(self):
  with patch.object(prepared_letters,'explain',return_value={'text':'Wyjaśnienie.','sources':['Źródło.'],'meta':{},'cached':True}),patch.object(ai,'generate') as model:
   result=router.route({'osoba':'marta','message':'Co oznacza ta wiadomość?','context':{'kind':'letter','resourceId':'US-1'}})
  model.assert_not_called();self.assertEqual(result['kind'],'answer');self.assertEqual(result['text'],'Wyjaśnienie.')
 def test_prepare_reply_is_a_proposal_not_execution(self):
  with patch.object(ai,'generate') as model:
   result=router.route({'osoba':'marta','message':'Przygotuj odpowiedź','context':{'kind':'letter','resourceId':'US-1'}})
  model.assert_not_called();self.assertEqual(result['intent'],'letter_reply');self.assertNotIn('sent',result);self.assertNotIn('token',result)
 def test_two_vehicles_are_not_mixed(self):
  for day,expected_bus in [(date(2026,10,26),'03.11.2026'),(date(2026,10,27),'04.11.2026')]:
   with self.subTest(day=day),patch.object(scenario_clock,'today',return_value=day),patch.object(ai,'generate') as model:
    bus=router.route({'osoba':'jan','message':'Kiedy kończy się OC?','context':{'kind':'vehicle','resourceId':'KR 2M884'}})
    car=router.route({'osoba':'jan','message':'Kiedy kończy się OC?','context':{'kind':'vehicle','resourceId':'KR 7G210'}})
   model.assert_not_called();self.assertIn(expected_bus,bus['text']);self.assertNotIn('02.03.2027',bus['text']);self.assertIn('02.03.2027',car['text'])
 def test_forged_resource_is_rejected_before_model(self):
  with patch.object(ai,'generate') as model:
   self.assertRaises(ValueError,router.route,{'osoba':'marta','message':'Wyjaśnij to','context':{'kind':'vehicle','resourceId':'KR 2M884'}})
  model.assert_not_called()
 def test_scam_safety_precedes_context(self):
  with patch.object(ai,'generate') as model,patch.object(prepared_letters,'explain') as explain:
   result=router.route({'osoba':'marta','message':'SMS każe mi się zalogować na https://example.org/login','context':{'kind':'letter','resourceId':'US-1'}})
  model.assert_not_called();explain.assert_not_called();self.assertEqual(result['intent'],'phishing')
 def test_explicit_new_topic_overrides_visible_resource(self):
  with patch.object(ai,'generate',return_value=({'intent':'pesel','question':'','alternatives':[]},{})),patch.object(prepared_letters,'explain') as explain:
   result=router.route({'osoba':'marta','message':'Wyjaśnij jak zastrzec PESEL','context':{'kind':'letter','resourceId':'US-1'}})
  explain.assert_not_called();self.assertEqual(result['intent'],'pesel');self.assertNotIn('context',result)
 def test_untrusted_context_content_is_not_sent(self):
  with patch.object(ai,'generate',return_value=({'intent':'letter','question':'','alternatives':[]},{})) as model:
   router.route({'osoba':'marta','message':'Pomóż','context':{'kind':'letter','resourceId':'US-1','title':'PRIVATE_TEST_TITLE','uploadedFiles':'PRIVATE_FILE_TEXT'}})
  self.assertNotIn('PRIVATE',str(model.call_args.args[1]));self.assertEqual(model.call_args.args[1]['kontekst']['resourceId'],'US-1')
 def test_missing_container_can_be_closed_without_creating_text(self):
  self.assertEqual(ai.parse_model_object('{"why":"Urząd sprawdza.","source_ids":[0]'),{'why':'Urząd sprawdza.','source_ids':[0]})
 def test_incomplete_string_is_not_repaired(self):
  self.assertRaises(ValueError,ai.parse_model_object,'{"why":"Urząd sprawdza urw')
 def test_schema_envelope_can_be_unwrapped_without_accepting_arbitrary_fields(self):
  response={'choices':[{'message':{'content':'{"type":"object","properties":{"why":"Urząd sprawdza zeznanie.","next_step":"Przygotuj faktury."}}'}}],'usage':{'prompt_tokens':1,'completion_tokens':1}}
  schema={'type':'object','properties':{'why':{'type':'string'},'next_step':{'type':'string'}}}
  with tempfile.TemporaryDirectory() as temp:
   with patch.object(ai,'CLOUD',True),patch.object(ai,'capabilities',return_value={'ready':True}),patch.object(ai,'cloud_budget',return_value=resource_policy.Budget(Path(temp)/'b','1.00')),patch.object(ai._opener,'open',return_value=io.BytesIO(json.dumps(response).encode())):
    result,_=ai.generate('Skróć tekst.',{},schema)
  self.assertEqual(result,{'why':'Urząd sprawdza zeznanie.','next_step':'Przygotuj faktury.'})

if __name__=='__main__':unittest.main()
