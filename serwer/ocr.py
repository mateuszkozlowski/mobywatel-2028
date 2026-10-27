"""Odczyt lokalny umowy z widocznymi cytatami. Bez wysyłania do modelu/API."""
import datetime, json, re, shutil, subprocess, tempfile
from pathlib import Path

def extract_fields(lines):
    fields = {}
    patterns = {
        'seller':r'(?:sprzedaj[aą]cy|sprzedawca)\s*[:\-]\s*(.+)',
        'buyer':r'(?:kupuj[aą]cy|nabywca)\s*[:\-]\s*(.+)',
        'vehicle':r'(?:pojazd|marka\s+i\s+model|samoch[oó]d)\s*[:\-]\s*(.+)',
        'plate':r'(?:nr\.?\s*rejestracyjny|numer\s*rejestracyjny|rejestracja)\s*[:\-]?\s*([A-Z]{2,3}\s?[A-Z0-9]{3,6})',
        'price':r'(?:cena|kwota|warto[sś][cć])(?:\s+(?:sprzeda[zż]y|pojazdu))?\s*[:\-]?\s*([0-9][0-9\s\u00a0.,]*)\s*(?:z[łl]|PLN)',
        'date':r'(?:dnia|data(?:\s+umowy)?|zawarta\s+w\s+dniu)\s*[:\-]?\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})',
    }
    for item in lines:
        text=item.get('text','')[:1500]
        for key,pattern in patterns.items():
            if key in fields: continue
            match=re.search(pattern,text,re.I)
            if not match: continue
            value=match.group(1).strip()
            if key=='plate': value=value.upper()
            if key=='price':
                raw=value.replace(' ','').replace('\u00a0','')
                if ',' in raw: raw=raw.replace('.','').replace(',','.')
                try:
                    amount=float(raw)
                    if not 0<amount<100000000: continue
                    value=f'{amount:.2f}'
                except ValueError: continue
            if key=='date':
                try: value=datetime.datetime.strptime(re.sub(r'[\-/]','.',value),'%d.%m.%Y').date().isoformat()
                except ValueError: continue
            fields[key]=dict(value=value,quote=text,page=item.get('page',1),status='do_sprawdzenia')
    return fields

_ocr_gate = __import__('threading').BoundedSemaphore(1)


def capabilities():
    import sys
    if sys.platform == 'darwin' and shutil.which('swift'):
        return dict(ready=True, engine='Apple PDFKit / Vision', external_transmission=False)
    ready = all(shutil.which(x) for x in ('pdftotext', 'pdfinfo', 'pdftoppm', 'tesseract', 'identify'))
    return dict(ready=ready, engine='Poppler / Tesseract (polski)', external_transmission=False)


def _run(args, end):
    import time
    remaining = end - time.monotonic()
    if remaining <= 0:
        raise ValueError('Odczyt trwał zbyt długo. Wybierz krótszy plik albo wpisz dane ręcznie.')
    try:
        result = subprocess.run(args, capture_output=True, timeout=min(remaining, 45), check=False)
    except (subprocess.TimeoutExpired, OSError):
        raise ValueError('Nie udało się odczytać pliku. Wybierz czytelniejszy dokument albo wpisz dane ręcznie.')
    if result.returncode:
        lines=result.stderr.decode('utf-8',errors='replace').strip().splitlines()
        error=lines[-1].strip() if lines else ''
        if error in {'Dokument zawiera zbyt dużo tekstu. Wybierz krótszy fragment.','Zdjęcie jest zbyt duże. Wybierz obraz do 20 megapikseli.'}:raise ValueError(error)
        raise ValueError('Nie udało się odczytać pliku. Wybierz PDF bez hasła lub czytelny obraz.')
    return result.stdout.decode('utf-8', errors='replace')


def _linux_lines(path, suffix, end):
    import csv, io, time
    if not capabilities()['ready']:
        raise ValueError('Odczyt plików nie jest teraz dostępny. Możesz wpisać dane ręcznie.')
    lines = []
    pages = 1
    if suffix == '.pdf':
        info = _run(['pdfinfo', str(path)], end)
        match = re.search(r'^Pages:\s*(\d+)\s*$', info, re.M)
        if not match or not 1 <= int(match[1]) <= 10:
            raise ValueError('Wybierz dokument zawierający od 1 do 10 stron.')
        pages = int(match[1])
    for page in range(1, pages + 1):
        if suffix == '.pdf':
            text = _run(['pdftotext', '-f', str(page), '-l', str(page), '-layout', '-enc', 'UTF-8', str(path), '-'], end)
            if len(re.sub(r'\W', '', text)) >= 25:
                lines.extend(dict(page=page, text=x.strip()) for x in text.splitlines() if x.strip())
                continue
            output = path.parent / ('page-' + str(page))
            _run(['pdftoppm', '-f', str(page), '-l', str(page), '-singlefile', '-scale-to', '2400', '-png', str(path), str(output)], end)
            image = output.with_suffix('.png')
        else:
            image = path
            size = _run(['identify', '-ping', '-format', '%w %h', str(image)], end).strip().split()
            if len(size) != 2 or not all(x.isdigit() for x in size) or int(size[0]) * int(size[1]) > 20000000:
                raise ValueError('Zdjęcie jest zbyt duże. Wybierz obraz do 20 megapikseli.')
        tsv = _run(['tesseract', str(image), 'stdout', '-l', 'pol+eng', '--psm', '3', 'tsv'], end)
        grouped = {}
        for row in csv.DictReader(io.StringIO(tsv), delimiter='\t'):
            word = row.get('text', '').strip()
            if not word:
                continue
            key = tuple(row.get(x, '') for x in ('block_num', 'par_num', 'line_num'))
            grouped.setdefault(key, []).append(word)
        lines.extend(dict(page=page, text=' '.join(words)) for words in grouped.values())
        if len(lines) > 1000 or sum(len(x['text']) for x in lines) > 80000:
            raise ValueError('Dokument zawiera zbyt dużo tekstu. Wybierz krótszy fragment.')
    if len(lines) > 1000 or sum(len(x['text']) for x in lines) > 80000:
        raise ValueError('Dokument zawiera zbyt dużo tekstu. Wybierz krótszy fragment.')
    return lines


def validate_lines(lines):
    if (not isinstance(lines,list) or len(lines)>1000 or any(not isinstance(x,dict) or not isinstance(x.get('text'),str) for x in lines)
        or sum(len(x['text']) for x in lines)>80000):
        raise ValueError('Dokument zawiera zbyt dużo tekstu. Wybierz krótszy fragment.')
    return lines

def read_document(content, mime):
    import sys, time
    if not 0 < len(content) <= 10 * 1024 * 1024:
        raise ValueError('Wybierz niepusty plik do 10 MB.')
    if content.startswith(b'%PDF-'):
        suffix = '.pdf'
    elif content.startswith(b'\x89PNG\r\n\x1a\n'):
        suffix = '.png'
    elif content.startswith(b'\xff\xd8\xff'):
        suffix = '.jpg'
    else:
        raise ValueError('Wybierz plik JPG, PNG lub PDF. Samo rozszerzenie pliku nie wystarczy.')
    if not _ocr_gate.acquire(blocking=False):
        from resource_policy import LimitError
        raise LimitError('Trwa odczyt innego dokumentu. Spróbuj ponownie za chwilę.')
    try:
        with tempfile.TemporaryDirectory(prefix='mobywatel-ocr-') as folder:
            path = Path(folder) / ('dokument' + suffix)
            path.write_bytes(content)
            end = time.monotonic() + 60
            if sys.platform == 'darwin' and shutil.which('swift'):
                raw = _run(['/usr/bin/swift', str(Path(__file__).with_name('ocr.swift')), str(path)], end)
                try:
                    result = json.loads(raw)
                except (ValueError, TypeError):
                    raise ValueError('Nie udało się odczytać wyniku. Spróbuj ponownie.')
                lines, engine = result.get('lines', []), result.get('engine', 'Apple PDFKit / Vision')
            else:
                lines, engine = _linux_lines(path, suffix, end), 'Poppler / Tesseract (polski)'
        lines=validate_lines(lines)
        if not lines:
            raise ValueError('Nie znaleziono czytelnego tekstu. Zrób wyraźniejsze zdjęcie albo wpisz dane ręcznie.')
        return dict(engine=engine, fields=extract_fields(lines), lines=lines, stored=False, external_transmission=False)
    finally:
        _ocr_gate.release()
