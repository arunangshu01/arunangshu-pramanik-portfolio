from fastapi import Request
from utility import settings

_FROM_SETTINGS = object()


def client_ip(request: Request, proxy_hops=_FROM_SETTINGS) -> str:
    """Return the client address a trusted proxy recorded, never a client-written one.

    Each proxy appends to X-Forwarded-For, so only the rightmost entries were written
    by infrastructure; anything further left can be forged by the caller.
    """
    if proxy_hops is _FROM_SETTINGS:
        proxy_hops = settings.CLIENT_IP_PROXY_HOPS
    peer = request.client.host if request.client else "unknown"
    if proxy_hops is None:
        return peer
    entries = [entry.strip() for header in request.headers.getlist("x-forwarded-for")
               for entry in header.split(",") if entry.strip()]
    if not entries:
        return peer
    return entries[max(0, len(entries) - 1 - proxy_hops)]
