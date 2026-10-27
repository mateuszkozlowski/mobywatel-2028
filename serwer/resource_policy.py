"""Persistent, conservative cost reservation; no prompts or IP addresses on disk."""
import hashlib
from contextlib import contextmanager
import hmac
import os
import secrets
import sqlite3
import tempfile
import threading
import time
from datetime import datetime, timezone
from decimal import Decimal, ROUND_CEILING
from pathlib import Path


class LimitError(ValueError):
    status = 429


class Budget:
    def __init__(self, path, limit_eur, input_price='0.20', output_price='0.30'):
        self.path = str(path)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.limit = int(Decimal(str(limit_eur)) * 1000000)
        self.input_price = Decimal(str(input_price))
        self.output_price = Decimal(str(output_price))
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, month TEXT NOT NULL, amount INTEGER NOT NULL, state TEXT NOT NULL)')

    @contextmanager
    def connect(self):
        db=sqlite3.connect(self.path, timeout=5)
        try:
            with db:
                yield db
        finally:
            db.close()

    def cost(self, input_tokens, output_tokens):
        return int((self.input_price * max(0, input_tokens) + self.output_price * max(0, output_tokens)).to_integral_value(rounding=ROUND_CEILING))

    def reserve(self, input_upper_bound, output_upper_bound):
        month = datetime.now(timezone.utc).strftime('%Y-%m')
        amount = self.cost(input_upper_bound, output_upper_bound)
        key = secrets.token_hex(16)
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            used = db.execute('SELECT COALESCE(SUM(amount),0) FROM reservations WHERE month=?', (month,)).fetchone()[0]
            if amount + used > self.limit:
                raise LimitError('Wykorzystano budżet AI na ten miesiąc. Nadal możesz czytać pisma i samodzielnie przygotować odpowiedź.')
            db.execute('INSERT INTO reservations VALUES (?,?,?,?)', (key, month, amount, 'reserved'))
        return key

    def settle(self, key, input_tokens=None, output_tokens=None):
        # If usage is unknown (timeout, malformed response), retain the reservation.
        with self.connect() as db:
            if type(input_tokens) is int and type(output_tokens) is int and input_tokens >= 0 and output_tokens >= 0:
                db.execute('UPDATE reservations SET amount=?,state=? WHERE id=?', (self.cost(input_tokens, output_tokens), 'settled', key))
            else:
                db.execute('UPDATE reservations SET state=? WHERE id=?', ('unknown', key))

    def available(self):
        month = datetime.now(timezone.utc).strftime('%Y-%m')
        with self.connect() as db:
            return db.execute('SELECT COALESCE(SUM(amount),0) FROM reservations WHERE month=?', (month,)).fetchone()[0] < self.limit


_budget = None
_budget_lock = threading.Lock()


def cloud_budget():
    global _budget
    with _budget_lock:
        if _budget is None:
            folder = Path(os.environ.get('CIVIC_STATE_DIR', str(Path(tempfile.gettempdir()) / 'mobywatel-demo-state')))
            currency=os.environ.get('CIVIC_AI_CURRENCY','USD' if os.environ.get('CIVIC_AI_PROVIDER')=='publicai' else 'EUR').upper()
            if currency not in ('USD','EUR'):raise ValueError('Nieobsługiwana waluta budżetu AI.')
            # Do not combine USD spending with the historical EUR ledger.
            if currency=='USD':
                _budget=Budget(folder/'ai-budget-usd.sqlite3',os.environ.get('CIVIC_AI_MONTHLY_LIMIT','1.00'),os.environ.get('CIVIC_AI_INPUT_PER_M','0.40'),os.environ.get('CIVIC_AI_OUTPUT_PER_M','0.40'))
            else:
                _budget=Budget(folder/'ai-budget.sqlite3',os.environ.get('CIVIC_AI_MONTHLY_LIMIT',os.environ.get('CIVIC_AI_MONTHLY_EUR','0.65')),os.environ.get('CIVIC_AI_INPUT_PER_M',os.environ.get('CIVIC_AI_INPUT_EUR_M','0.20')),os.environ.get('CIVIC_AI_OUTPUT_PER_M',os.environ.get('CIVIC_AI_OUTPUT_EUR_M','0.30')))
        return _budget


_rate_lock = threading.Lock()
_rate_salt = secrets.token_bytes(32)
_rates = {}


def check_rate(identity, category='request', limit=90, window=60):
    """Ephemeral, salted identifiers. Restart does not reset the durable AI budget."""
    key = hmac.new(_rate_salt, (category + ':' + str(identity)).encode(), hashlib.sha256).digest()
    now = time.monotonic()
    with _rate_lock:
        if len(_rates) > 10000:
            for old in [k for k, v in _rates.items() if v[0] <= now]:
                _rates.pop(old, None)
            if len(_rates) > 10000:
                raise LimitError('Dużo osób korzysta teraz z pokazu. Spróbuj za chwilę.')
        end, count = _rates.get(key, (now + window, 0))
        if end <= now:
            end, count = now + window, 0
        if count >= limit:
            raise LimitError('Zbyt wiele prób. Odczekaj minutę i spróbuj ponownie.')
        _rates[key] = (end, count + 1)
