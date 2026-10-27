"""Reuse validated phrases only for the application's fixed fictional sources."""
import hashlib,json,os,threading,time
from pathlib import Path
import polish_ai

ROOT=Path(os.environ.get('CIVIC_STATE_DIR',Path(__file__).parent/'.state'))/'prepared-replies'
_guard=threading.Lock()
_locks={}
_memory={}

def phrases(mail,sources):
    # Never persist content or output derived from an uploaded document here.
    if any(s.get('kind')!='opis_pliku' for s in sources):
        return polish_ai.reply_phrases(mail,sources)
    value=dict(mail=mail,sources=sources,model=polish_ai.MODEL,provider=polish_ai.PROVIDER,base=polish_ai.BASE,revision=polish_ai.PROMPT_REVISION)
    key=hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    with _guard:lock=_locks.setdefault(key,threading.Lock())
    with lock:
        record=_memory.get(key)
        if not record:
            try:
                path=ROOT/(key+'.json')
                if path.stat().st_size<20000:record=json.loads(path.read_text())
            except (OSError,ValueError):pass
        if isinstance(record,dict) and record.get('key')==key and type(record.get('at')) in (int,float) and 0<=time.time()-record['at']<7*86400:
            text=record.get('phrases');meta=record.get('meta')
            if isinstance(text,dict) and all(isinstance(text.get(k),str) for k in ('intro','closing')) and isinstance(meta,dict):
                _memory[key]=record
                return text,dict(meta,cached=True)
        text,meta=polish_ai.reply_phrases(mail,sources)
        record=dict(key=key,at=time.time(),phrases=text,meta=meta)
        _memory[key]=record
        try:
            ROOT.mkdir(parents=True,exist_ok=True)
            temporary=ROOT/(key+'.tmp');temporary.write_text(json.dumps(record,ensure_ascii=False));os.replace(temporary,ROOT/(key+'.json'))
        except OSError:pass
        return text,dict(meta,cached=False)
