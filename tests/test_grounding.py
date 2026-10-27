import unittest,sys
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'serwer'))
import polish_ai as ai,persony
class ExplanationGroundingTests(unittest.TestCase):
 def setUp(self):self.mail=persony.PERSONY['jan']['skrzynka'][0]
 def test_vat_does_not_accept_the_old_example(self):
  self.assertFalse(ai.explanation_matches_source(['Urząd sprawdza odliczenie w Twoim zeznaniu.','Przygotuj faktury za wskazane prace.'],self.mail))
 def test_vat_keeps_both_requested_documents(self):
  self.assertTrue(ai.explanation_matches_source(['Urząd pyta o powód korekty podatku.','Wyjaśnij korektę i dołącz dowód zapłaty oraz protokół dostawy.'],self.mail))
 def test_missing_documents_get_one_bounded_repair(self):
  bad=dict(why='Urząd sprawdza odliczenie.',next_step='Przygotuj faktury.',source_ids=[0])
  good=dict(why='Urząd pyta o powód korekty podatku.',next_step='Wyjaśnij korektę i dołącz dowód zapłaty oraz protokół dostawy.',source_ids=[0,1])
  with patch.object(ai,'generate',side_effect=[(bad,{}),(good,{})]) as call:result=ai.explain(self.mail)
  self.assertEqual(call.call_count,2);self.assertIn('protokół dostawy',result['text'])
 def test_a_second_incomplete_answer_is_not_published(self):
  bad=dict(why='Urząd sprawdza odliczenie.',next_step='Przygotuj faktury.',source_ids=[0])
  with patch.object(ai,'generate',return_value=(bad,{})) as call:self.assertRaises(ValueError,ai.explain,self.mail)
  self.assertEqual(call.call_count,2)

 def test_settlement_period_can_be_written_as_a_month_name(self):
  self.assertTrue(ai.safe_text('Korekta za sierpień 2026.',self.mail['tresc']))
  self.assertFalse(ai.safe_text('Korekta za sierpień 2027.',self.mail['tresc']))
