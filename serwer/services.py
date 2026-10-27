"""Deterministyczne wejścia do tego samego fikcyjnego świata co agent.
Nie łączy się z rejestrami ani usługami podpisu. Preview nie wykonuje akcji.
"""
import copy, secrets, threading, time, math
import dane, akcje, persony
from narzedzia import ODCZYTY, AKCJE

SCHEMAS = {x['name']: x['input_schema'] for x in ODCZYTY + AKCJE}
READS = {x['name'] for x in ODCZYTY} - {'ustaw_przypomnienie'}
PENDING = {}
LOCK = threading.Lock()
PERSONAS = {'marta', 'jan', 'ewa', 'kacper'}

def validate(name, args):
    if name not in SCHEMAS or not isinstance(args, dict):
        raise ValueError('Nie rozpoznano usługi.')
    schema = SCHEMAS[name]
    props = schema.get('properties', {})
    if set(args) - set(props):
        raise ValueError('Formularz zawiera nieznane pola.')
    for key in schema.get('required', []):
        if key not in args or args[key] in ('', None, []):
            raise ValueError('Uzupełnij wymagane pola.')
    for key, val in args.items():
        prop = props[key]
        typ = prop.get('type', 'string')
        good = isinstance(val, str) if typ == 'string' else isinstance(val, list) if typ == 'array' else isinstance(val, bool) if typ == 'boolean' else isinstance(val, (int, float)) and not isinstance(val, bool)
        if typ in ('number','integer') and isinstance(val,(int,float)) and not math.isfinite(val):
            good=False
        if not good:
            raise ValueError('Sprawdź format danych w formularzu.')
        if 'enum' in prop and val not in prop['enum']:
            raise ValueError('Wybierz wartość z listy.')
        if typ == 'array':
            if len(val) > 30 or any(not isinstance(v, str) or len(v) > 4000 for v in val):
                raise ValueError('Sprawdź zaznaczone wartości.')
            allowed = prop.get('items', {}).get('enum')
            if allowed and any(v not in allowed for v in val):
                raise ValueError('Wybierz wartości z listy.')
        if isinstance(val, str) and len(val) > 6000:
            raise ValueError('Skróć treść pola do 6000 znaków.')
    return args

def handle(req):
    if not isinstance(req, dict): raise ValueError('Nieprawidłowe dane żądania.')
    if not isinstance(req.get('context',{}), dict): raise ValueError('Nieprawidłowy kontekst sprawy.')
    mode, name = req.get('mode', 'read'), req.get('name')
    who = req.get('osoba', 'marta')
    if who not in PERSONAS:
        raise ValueError('Nie rozpoznano profilu.')
    persony.ustaw(who)
    import scenario_clock
    dane.DZIS=scenario_clock.today()
    if mode == 'confirm':
        token = req.get('token', '')
        with LOCK:
            draft = PENDING.get(token)
            if not draft or draft['expires'] < time.monotonic() or draft['osoba'] != who:
                raise ValueError('Podsumowanie wygasło. Sprawdź dane ponownie.')
            PENDING.pop(token)
        data, card = akcje.A[draft['name']]['wykonaj'](draft['args'], draft['state'])
        if draft['name']=='wyslij_pismo':
            card['title']='Potwierdzenie'
            card['note']='Wynik zapisano w tej aplikacji.'
            card['rows']=[[('Numer zapisu' if 'numer' in str(k).casefold() else k),(str(v).replace('PISMO/','POKAZ/') if isinstance(v,str) else v)] for k,v in card.get('rows',[])]
        return dict(card=card, data=data, state=draft['state'], operation=draft['name'], review=draft.get('review'), parameters=draft['args'], simulated=True)
    args = validate(name, req.get('args', {}))
    base = dane.stan_poczatkowy()
    state = req.get('state')
    if state is not None and not isinstance(state, dict):
        raise ValueError('Nie udało się odczytać zapisanego stanu.')
    state = copy.deepcopy(state or base)
    for key, value in base.items():
        state.setdefault(key, value)
        if not isinstance(state[key], type(value)): raise ValueError('Nie udało się odczytać zapisanego stanu spraw. Odśwież aplikację.')
    if mode == 'read' and name in READS:
        data, card = dane.READ[name](args, state)
        if isinstance(data, dict) and data.get('blad'):
            raise ValueError(data['blad'])
        return dict(card=card, data=data, state=state, simulated=True)
    if mode == 'preview' and name in akcje.A:
        if name == 'wyslij_pismo':
            reply_to = (req.get('context') or {}).get('replyTo')
            if reply_to:
                mail = next((m for m in persony.P()['skrzynka'] if m['id'] == reply_to), None)
                if not mail or args.get('adresat','').strip().casefold() != mail['od'].strip().casefold():
                    raise ValueError('Adresat nie odpowiada pismu źródłowemu. Popraw dane albo rozpocznij nowe pismo.')
                args = dict(args, _reply_to=reply_to)
        card = akcje.A[name]['podglad'](args, state)
        if name=='wyslij_pismo':
            import reply_drafts
            known=[x['nazwa'] for x in persony.P().get('pliki',[])]+[x['name'] for x in (req.get('context') or {}).get('uploadedFiles',[]) if isinstance(x,dict) and isinstance(x.get('name'),str)]
            reply_drafts.check_attachments(args.get('tresc',''),args.get('zalaczniki',[]),known)
        if name=='wyslij_pismo' and args.get('_reply_to') and args.get('zalaczniki'):
            import reply_drafts
            comparison=reply_drafts.prepare(dict(osoba=who,mailId=args['_reply_to'],attachments=args['zalaczniki'],uploadedFiles=req.get('context',{}).get('uploadedFiles',[]),useModel=False))
            card['comparison']=comparison['comparison']
            card['warnings']=comparison['warnings']
            card['comparisonSource']='Kwoty z opisów plików' if any(x['kind']=='opis_pliku' for x in comparison['sources']) else 'Kwoty z odczytanych plików'
        token = secrets.token_urlsafe(24)
        with LOCK:
            now = time.monotonic()
            for key in list(PENDING):
                if PENDING[key]['expires'] < now:
                    PENDING.pop(key)
            if len(PENDING) >= 200:
                PENDING.pop(next(iter(PENDING)))
            PENDING[token] = dict(osoba=who, name=name, args=copy.deepcopy(args), state=state, review=copy.deepcopy(card), expires=now+900)
        return dict(card=card, token=token, operation=name, simulated=True)
    raise ValueError('Ta operacja nie jest dostępna w tym miejscu.')
