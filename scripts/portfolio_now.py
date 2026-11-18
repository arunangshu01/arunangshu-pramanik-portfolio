#!/usr/bin/env python3
"""Update the portfolio "now" badge from the terminal.

Usage:
    export ANALYTICS_ADMIN_TOKEN=...
    python3 scripts/portfolio_now.py "fixing airflow retries"
    python3 scripts/portfolio_now.py "Designing Data-Intensive Applications" \
        --kind reading --url https://dataintensive.net
    python3 scripts/portfolio_now.py --show     # print the current status
    python3 scripts/portfolio_now.py --reset    # revert to backend/information/now_status.json

Env vars:
    PORTFOLIO_API          site origin (default: https://arunangshupramanik.com)
    ANALYTICS_ADMIN_TOKEN  admin token (required for updates and --reset)
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

API = os.getenv("PORTFOLIO_API", "https://arunangshupramanik.com").rstrip("/")
PATH = "/arunangshu_pramanik/portfolio/v1/status"
KINDS = ["building", "reading", "learning", "exploring", "listening"]


def request(method: str, token: str = "", body: dict | None = None) -> int:
    headers = {"Accept": "application/json"}
    if token:
        headers["X-Admin-Token"] = token
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{API}{PATH}", method=method, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status = json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        print(f"{method} failed ({error.code}): {error.read().decode()}", file=sys.stderr)
        return 1
    except (urllib.error.URLError, TimeoutError) as error:
        print(f"Could not reach {API}: {error}", file=sys.stderr)
        return 1
    link = f" -> {status['url']}" if status.get("url") else ""
    print(f"{status['kind'].upper()} · {status['label']}{link}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Update the portfolio now-status badge.")
    parser.add_argument("label", nargs="?", help="what you're doing (1-120 chars)")
    parser.add_argument("--kind", default="building", choices=KINDS)
    parser.add_argument("--url", help="optional https link the badge points to")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--show", action="store_true", help="print the current status")
    group.add_argument("--reset", action="store_true", help="revert to the committed default")
    args = parser.parse_args()

    if args.show or (not args.label and not args.reset):
        return request("GET")
    token = os.getenv("ANALYTICS_ADMIN_TOKEN", "")
    if not token:
        parser.error("ANALYTICS_ADMIN_TOKEN is not set")
    if args.reset:
        return request("DELETE", token)
    if not 1 <= len(args.label.strip()) <= 120:
        parser.error("label must be 1-120 characters")
    if args.url and not args.url.startswith("https://"):
        parser.error("--url must start with https://")
    body = {"kind": args.kind, "label": args.label.strip()}
    if args.url:
        body["url"] = args.url
    return request("PUT", token, body)


if __name__ == "__main__":
    raise SystemExit(main())
