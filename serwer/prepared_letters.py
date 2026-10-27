"""Cache of real model explanations for the fixed fictional demo letters only."""
import hashlib,json,os,re,threading,time
from datetime import datetime,timezone
from pathlib import Path
import polish_ai

_locks={}
_guard=threading.Lock()
_memory={}
ROOT=Path(os.environ.get('CIVIC_STATE_DIR',Path(__file__).parent/'.state'))/'prepared-letters'

def key_for(mail):
    source=json.dumps(dict(mail=mail,model=polish_ai.MODEL,provider=polish_ai.PROVIDER,base=polish_ai.BASE,revision=polish_ai.PROMPT_REVISION),sort_keys=True,ensure_ascii=False)
    return hashlib.sha256(source.encode()).hexdigest()

def cached(key):
    record=_memory.get(key)
    if not record:
        try:
            path=ROOT/(key+'.json')
            if path.stat().st_size<50000:record=json.loads(path.read_text())
        except (OSError,ValueError):record=None
    if isinstance(record,dict) and record.get('key')==key and type(record.get('at')) in (int,float) and 0<=time.time()-record['at']<7*86400 and isinstance(record.get('preparedAt'),str) and bool(record['preparedAt']) and isinstance(record.get('result'),dict):
        value=record['result']
        if isinstance(value.get('text'),str) and isinstance(value.get('sources'),list):
            _memory[key]=record
            return dict(value,preparedAt=record['preparedAt'],cached=True,revision=polish_ai.PROMPT_REVISION)
    return None

def peek(mail):
    return cached(key_for(mail))

def explain(mail):
    if not mail.get('termin') and len(mail.get('tresc',''))<320 and re.search(r'stypendium|potwierdzenie zmiany wpisu',mail.get('temat',''),re.I):
        return dict(text=mail['tresc'],sources=[mail['tresc']],deadline=None,meta=dict(method='source',local=True),cached=False,revision=polish_ai.PROMPT_REVISION)
    key=key_for(mail)
    with _guard:
        lock=_locks.setdefault(key,threading.Lock())
    with lock:
        value=cached(key)
        if value:return value
        result=polish_ai.explain(mail)
        record=dict(key=key,at=time.time(),preparedAt=datetime.now(timezone.utc).isoformat(),result=result)
        _memory[key]=record
        try:
            ROOT.mkdir(parents=True,exist_ok=True)
            temporary=ROOT/(key+'.tmp')
            temporary.write_text(json.dumps(record,ensure_ascii=False))
            os.replace(temporary,ROOT/(key+'.json'))
        except OSError:pass
        return dict(result,preparedAt=record['preparedAt'],cached=False,revision=polish_ai.PROMPT_REVISION)
