"""Szkic z wybranych źródeł: lokalny Bielik redaguje tekst, kod składa listę i liczy kwoty."""
import re
from decimal import Decimal, InvalidOperation
from persony import P, ustaw

NUMBER = r'[-+−]?\s*(?:\d{1,3}(?:[ \u00a0\u202f.]\d{3})+|\d+)(?:[,.]\d{2})?'
AMOUNT = re.compile(r'(?<![\w.,])('+NUMBER+r')\s*(?:zł|PLN)\b',re.I)
def amount(value):
    value=re.sub(r'\s+','',value).replace('−','-')
    if ',' in value:value=value.replace('.','').replace(',','.')
    elif re.fullmatch(r'[-+]?\d{1,3}(?:\.\d{3})+',value):value=value.replace('.','')
    try:return Decimal(value).quantize(Decimal('.01'))
    except InvalidOperation:return None
def money(value):return f'{value:,.2f}'.replace(',','\u00a0').replace('.',',')+' zł'
def check_attachments(body,names,known_names):
    text=body.casefold()
    missing=[name for name in known_names if name.casefold() in text and name not in names]
    if missing:raise ValueError('Treść wymienia plik, którego nie ma w załącznikach: '+', '.join(missing)+'. Popraw treść albo wybór plików.')
    if not names and re.search(r'(?:w załączeniu|załączam|przesyłam|przekazuję).{0,60}(?:faktur|załącznik|dokument)',text,re.S) and not re.search(r'\bnie\s+(?:załączam|przesyłam|przekazuję)',text):
        raise ValueError('Treść mówi o przekazaniu dokumentów, ale nie wybrano załączników. Dodaj pliki albo popraw treść.')
def invoice_amount(text,metadata=False):
    lines=text.splitlines()
    candidates=[]
    for line in lines:
        if re.search(r'\(\s*\d[\d ,.\u00a0]*\s*(?:zł|PLN)\s*\)',line,re.I):return None,None
        if metadata or re.search(r'razem\s*(?:brutto|do zapłaty)|do zapłaty|wartość brutto|kwota brutto',line,re.I):
            for match in AMOUNT.finditer(line):
                value=amount(match.group(1))
                if value is not None:candidates.append((value,line.strip()))
    # Niejednoznaczność pozostaje do sprawdzenia, nie wybieramy największej kwoty.
    values={v for v,_ in candidates}
    return candidates[0] if len(values)==1 else (None,None)

def prepare(req):
    if not isinstance(req,dict):raise ValueError('Nieprawidłowe dane szkicu.')
    who=req.get('osoba','marta')
    if who not in ('marta','jan','ewa','kacper'):raise ValueError('Nie rozpoznano profilu.')
    ustaw(who);profile=P()
    mail=next((m for m in profile['skrzynka'] if m['id']==req.get('mailId')),None)
    if not mail:raise ValueError('Wybierz pismo, na które przygotowujesz odpowiedź.')
    names=req.get('attachments',[])
    uploaded=req.get('uploadedFiles',[])
    if not isinstance(names,list) or not names or len(names)>10 or any(not isinstance(n,str) or len(n)>250 for n in names):raise ValueError('Wybierz od 1 do 10 załączników.')
    if len(names)!=len(set(names)):raise ValueError('Każdy plik wybierz tylko raz.')
    if not isinstance(uploaded,list) or len(uploaded)>10:raise ValueError('Sprawdź listę odczytanych plików.')
    indexed={f['nazwa']:dict(name=f['nazwa'],text=f['opis'],kind='opis_pliku') for f in profile['pliki']}
    for f in uploaded:
        if not isinstance(f,dict) or not isinstance(f.get('name'),str) or not isinstance(f.get('text'),str) or len(f['text'])>80000:raise ValueError('Nieprawidłowy odczyt załącznika.')
        if len(f['name'])>250 or any(ord(c)<32 for c in f['name']):raise ValueError('Zmień nazwę pliku: zawiera nieobsługiwane znaki lub jest za długa.')
        indexed[f['name']]=dict(name=f['name'],text=f['text'],kind='odczyt_pliku')
    if any(n not in indexed for n in names):raise ValueError('Nie odnaleziono wybranego załącznika. Wybierz pliki ponownie.')
    selected=[indexed[n] for n in names]
    sources=[];amounts=[];warnings=[];invoice_count=0
    address_pattern=r'\bul\.?\s+([^\n,;.]+?\s+\d+[a-zA-Z]?(?:/\d+)?)'
    mail_addresses={re.sub(r'\s+',' ',v.strip()).casefold() for v in re.findall(address_pattern,mail['tresc'],re.I)}
    for index,file in enumerate(selected):
        value,quote=invoice_amount(file['text'],file['kind']=='opis_pliku')
        invoice=bool(re.search(r'(^FV\b|faktura)',file['name']+' '+file['text'],re.I))
        if invoice:invoice_count+=1
        if value is not None and invoice:amounts.append(value)
        elif invoice:warnings.append('Sprawdź kwotę dokumentu: '+file['name']+'. Nie rozstrzygamy niejednoznacznych kwot.')
        else:warnings.append('Plik „'+file['name']+'” nie został rozpoznany jako faktura. Nie wliczamy go do sumy. Sprawdź, czy jest potrzebny w odpowiedzi.')
        addresses={re.sub(r'\s+',' ',v.strip()).casefold() for v in re.findall(address_pattern,file['text'],re.I)}
        mail_numbers={re.search(r'(\d+[a-zA-Z]?(?:/\d+)?)$',v).group(1) for v in mail_addresses}
        file_numbers={re.search(r'(\d+[a-zA-Z]?(?:/\d+)?)$',v).group(1) for v in addresses}
        if mail_numbers and file_numbers and mail_numbers.isdisjoint(file_numbers):
            warnings.append(file['name']+': numer budynku w dokumencie różni się od numeru w piśmie. Sprawdź związek załącznika ze sprawą.')
        sources.append(dict(id='zalacznik-'+str(index+1),name=file['name'],kind=file['kind'],quote=(quote or file['text'])[:600],amount=str(value) if value is not None and invoice else None))
    target_match=re.search(r'(?:odliczono|odliczenia|kwota\s+ulgi)\s*[:\-]?\s*('+NUMBER+r')\s*(?:zł|PLN)',mail['tresc'],re.I)
    target=amount(target_match.group(1)) if target_match else None
    total=sum(amounts,Decimal('0.00')) if amounts and len(amounts)==invoice_count else None
    difference=target-total if target is not None and total is not None else None
    if difference is not None and difference!=0:warnings.append('Kwota w piśmie i suma wybranych dokumentów różnią się o '+money(abs(difference))+'. Sprawdź, z czego wynika różnica.')
    metadata=any(f['kind']=='opis_pliku' for f in selected)
    if metadata:warnings.append('Część danych pochodzi z opisów plików. Treść tych dokumentów nie została odczytana.')
    subject=mail['temat']
    owner=profile['osoba']['imie']+' '+profile['osoba']['nazwisko']
    intro='W odpowiedzi na pismo „'+subject+'” przekazuję następujące dokumenty.'
    closing='Proszę o uwzględnienie załączonych dokumentów w tej sprawie.'
    method='lokalny_sklad_z_danych';meta={}
    if req.get('useModel',True):
        import polish_ai
        if polish_ai.PUBLICAI and any(f['kind']=='odczyt_pliku' for f in selected):
            warnings.append('Treści własnych plików nie wysłano do Public AI. Szkic złożono z wybranych danych; możesz go edytować.')
        else:
            try:
                import prepared_replies
                phrases,meta=prepared_replies.phrases(mail,sources);intro=phrases['intro'];closing=phrases['closing'];method='model'
            except ValueError as e:warnings.append(str(e))
    body='Szanowni Państwo,\n\n'+intro+'\n\n'+'\n'.join(str(i+1)+'. '+f['name'] for i,f in enumerate(selected))+'\n\n'+closing+'\n\nZ poważaniem\n'+owner
    return dict(body=body,recipient=mail['od'],subject='Odpowiedź: '+subject,method=method,model=meta.get('model'),meta=meta,sources=sources,warnings=warnings,comparison=dict(total=str(total) if total is not None else None,target=str(target) if target is not None else None,difference=str(difference) if difference is not None else None),sent=False,signed=False)
