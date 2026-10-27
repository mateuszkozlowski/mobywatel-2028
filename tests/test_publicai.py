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
import polish_ai as ai
import resource_policy as policy
import prepared_letters
import prepared_replies

class PublicAiTransportTests(unittest.TestCase):
    def test_only_selected_key_and_required_user_agent_are_sent(self):
        calls=[]
        def request(req,timeout):
            calls.append(req)
            return io.BytesIO(json.dumps({'choices':[{'message':{'content':'{"answer":"gotowe"}'}}],'usage':{'prompt_tokens':100,'completion_tokens':10}}).encode())
        with tempfile.TemporaryDirectory() as temp:
            budget=policy.Budget(Path(temp)/'usd.sqlite3','1.00','0.40','0.40')
            with patch.dict(os.environ,{'PUBLICAI_API_KEY':'test-public','SHERLOCK_API_KEY':'test-do-not-send'}),patch.object(ai,'KEY_ENV','PUBLICAI_API_KEY'),patch.object(ai,'BASE','https://api.publicai.co/v1'),patch.object(ai,'PROVIDER_NAME','Public AI'),patch.object(ai,'CLOUD',True),patch.object(ai,'capabilities',return_value={'ready':True}),patch.object(ai,'cloud_budget',return_value=budget),patch.object(ai._opener,'open',side_effect=request):
                result,meta=ai.generate('Odpowiedz.',{'text':'dane fikcyjne'},{'type':'object'},200)
            self.assertEqual(result['answer'],'gotowe');self.assertEqual(meta['provider'],'Public AI / Bielik')
            self.assertEqual(calls[0].full_url,'https://api.publicai.co/v1/chat/completions')
            self.assertEqual(calls[0].get_header('Authorization'),'Bearer test-public')
            self.assertIn('mObywatel2028',calls[0].get_header('User-agent'))
            with budget.connect() as db:self.assertEqual(db.execute('SELECT amount,state FROM reservations').fetchone(),(44,'settled'))

    def test_budget_denial_sends_no_request(self):
        with tempfile.TemporaryDirectory() as temp:
            budget=policy.Budget(Path(temp)/'usd.sqlite3','0.000001','0.40','0.40')
            with patch.object(ai,'CLOUD',True),patch.object(ai,'capabilities',return_value={'ready':True}),patch.object(ai,'cloud_budget',return_value=budget),patch.object(ai._opener,'open') as network:
                self.assertRaises(policy.LimitError,ai.generate,'Odpowiedz.',{'text':'test'},{'type':'object'},200)
                network.assert_not_called()

    def test_usd_ledger_does_not_relabel_eur_history(self):
        with tempfile.TemporaryDirectory() as temp:
            old=policy.Budget(Path(temp)/'ai-budget.sqlite3','1.00');old.reserve(100,100)
            with patch.dict(os.environ,{'CIVIC_STATE_DIR':temp,'CIVIC_AI_PROVIDER':'publicai','CIVIC_AI_CURRENCY':'USD','CIVIC_AI_MONTHLY_LIMIT':'1.00','CIVIC_AI_INPUT_PER_M':'0.40','CIVIC_AI_OUTPUT_PER_M':'0.40'}),patch.object(policy,'_budget',None):
                new=policy.cloud_budget();self.assertTrue(new.path.endswith('ai-budget-usd.sqlite3'));self.assertEqual(new.cost(100,10),44)
                with new.connect() as db:self.assertEqual(db.execute('SELECT COUNT(*) FROM reservations').fetchone()[0],0)
                with old.connect() as db:self.assertEqual(db.execute('SELECT COUNT(*) FROM reservations').fetchone()[0],1)

class DemoCacheTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.mail={'id':'fixed-test','tresc':'Przygotuj faktury.','temat':'Wezwanie'}
        self.sources=[{'kind':'opis_pliku','name':'Faktura testowa','quote':'Razem 10 zł'}]
    def tearDown(self):self.temp.cleanup()

    def test_simultaneous_fixed_drafts_pay_for_one_generation(self):
        def generate(*args):time.sleep(.03);return {'intro':'Przekazuję dokumenty.','closing':'Proszę o ich uwzględnienie.'},{'model':'Bielik'}
        with patch.object(prepared_replies,'ROOT',self.root),patch.object(prepared_replies,'_memory',{}),patch.object(prepared_replies,'_locks',{}),patch.object(ai,'reply_phrases',side_effect=generate) as call:
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                result=list(pool.map(lambda _:prepared_replies.phrases(self.mail,self.sources),range(8)))
            self.assertEqual(call.call_count,1)
            self.assertEqual(sum(not x[1]['cached'] for x in result),1)

    def test_cache_survives_restart_and_invalidates_changed_source(self):
        result=({'intro':'Przekazuję dokumenty.','closing':'Proszę o ich uwzględnienie.'},{'model':'Bielik'})
        with patch.object(prepared_replies,'ROOT',self.root),patch.object(prepared_replies,'_memory',{}),patch.object(ai,'reply_phrases',return_value=result) as call:
            prepared_replies.phrases(self.mail,self.sources)
            prepared_replies._memory.clear()
            self.assertTrue(prepared_replies.phrases(self.mail,self.sources)[1]['cached'])
            prepared_replies.phrases(self.mail,[dict(self.sources[0],quote='Razem 20 zł')])
            self.assertEqual(call.call_count,2)

    def test_own_document_content_is_not_written_to_shared_cache(self):
        with patch.object(prepared_replies,'ROOT',self.root),patch.object(ai,'reply_phrases',return_value=({'intro':'A','closing':'B'},{})):
            prepared_replies.phrases(self.mail,[{'kind':'odczyt_pliku','quote':'private-test-text'}])
        self.assertFalse(list(self.root.iterdir()))

    def test_prepared_letter_reuses_disk_without_model(self):
        result={'text':'Przygotuj faktury.','sources':['Przygotuj faktury.']}
        with patch.object(prepared_letters,'ROOT',self.root),patch.object(prepared_letters,'_memory',{}),patch.object(ai,'explain',return_value=result) as call:
            self.assertFalse(prepared_letters.explain(self.mail)['cached'])
            prepared_letters._memory.clear()
            self.assertTrue(prepared_letters.explain(self.mail)['cached'])
            self.assertEqual(call.call_count,1)

    def test_changed_prompt_or_provider_invalidates_letter(self):
        before=prepared_letters.key_for(self.mail)
        with patch.object(ai,'PROMPT_REVISION','changed-test'):self.assertNotEqual(before,prepared_letters.key_for(self.mail))
        with patch.object(ai,'PROVIDER','changed-test'):self.assertNotEqual(before,prepared_letters.key_for(self.mail))

    def test_publicai_draft_with_uploaded_document_keeps_comparison_without_ai(self):
        import persony,reply_drafts
        persony.ustaw('marta');mail=persony.P()['skrzynka'][0]
        req={'osoba':'marta','mailId':mail['id'],'attachments':['wlasna-faktura.pdf'],'uploadedFiles':[{'name':'wlasna-faktura.pdf','text':'Faktura\nRazem brutto: 100,00 zł'}]}
        with patch.object(ai,'PUBLICAI',True),patch.object(ai,'reply_phrases') as call:
            result=reply_drafts.prepare(req)
        call.assert_not_called();self.assertEqual(result['comparison']['total'],'100.00')
        self.assertEqual(result['method'],'lokalny_sklad_z_danych');self.assertTrue(any('nie wysłano do Public AI' in x for x in result['warnings']))

if __name__=='__main__':unittest.main()
