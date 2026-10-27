"""Origin checks for localhost and explicitly configured HTTPS deployments.

Origin is a browser boundary, not authentication. Public deployments still
use request limits, a persistent AI budget and the public-demo route policy.
"""
from urllib.parse import urlsplit

def canonical_origin(value):
    try:
        p = urlsplit(value)
        if p.scheme not in ('http', 'https') or not p.hostname or p.username or p.password or p.path or p.query or p.fragment:
            return None
        port = p.port
        host = p.hostname.lower()
        host = '[' + host + ']' if ':' in host else host
        suffix = '' if port is None or port == (443 if p.scheme == 'https' else 80) else ':' + str(port)
        return p.scheme + '://' + host + suffix
    except (ValueError, TypeError):
        return None

def origin_allowed(origin, host, public_origins=''):
    if origin is None:
        return True  # Non-browser calls remain subject to the same request and cost limits.
    normalized = canonical_origin(origin)
    if not normalized:
        return False
    allowed = {canonical_origin(x.strip()) for x in public_origins.split(',') if x.strip()}
    allowed.discard(None)
    if normalized in allowed:
        return True
    local = canonical_origin('http://' + host)
    try:
        is_local = urlsplit(local or '').hostname in ('127.0.0.1', 'localhost', '::1')
    except ValueError:
        is_local = False
    return is_local and normalized == local
