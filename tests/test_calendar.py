import unittest,sys,copy
from datetime import date
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'serwer'))
import scenario_clock,persony
class ScenarioCalendarTests(unittest.TestCase):
 def test_response_deadline_and_original_stay_in_sync(self):
  p=scenario_clock.person(persony.PERSONY['marta'],persony.PERSONY,date(2026,11,30));m=p['skrzynka'][0]
  self.assertEqual(m['termin'],'2026-11-30');self.assertIn('30.11.2026',m['tresc']);self.assertIn('2025 r.',m['tresc']);self.assertIn('32 520 zł',m['tresc'])
 def test_identity_history_is_not_rolled_forward(self):
  source=persony.PERSONY['jan'];p=scenario_clock.person(source,persony.PERSONY,date(2027,3,28))
  self.assertEqual(p['osoba']['data_urodzenia'],source['osoba']['data_urodzenia']);self.assertEqual(p['dokumenty']['dowod']['wazny_do'],source['dokumenty']['dowod']['wazny_do'])
 def test_jan_has_two_days_in_a_new_demo(self):
  p=scenario_clock.person(persony.PERSONY['jan'],persony.PERSONY,date(2027,3,28));self.assertEqual(p['skrzynka'][0]['termin'],'2027-03-30')
 def test_original_fixture_is_not_mutated(self):
  before=copy.deepcopy(persony.PERSONY);scenario_clock.person(persony.PERSONY['marta'],persony.PERSONY,date(2027,1,2));self.assertEqual(persony.PERSONY,before)

 def test_plain_notice_reads_source_without_generation(self):
  from unittest.mock import patch
  import prepared_letters
  mail=persony.PERSONY['kacper']['skrzynka'][0]
  with patch.object(prepared_letters.polish_ai,'explain',side_effect=AssertionError('No model for a plain notice')):result=prepared_letters.explain(mail)
  self.assertEqual(result['text'],mail['tresc']);self.assertEqual(result['meta']['method'],'source')
