#!/usr/bin/env python3
"""Update the portfolio "now" badge from the terminal.

Usage:
    PORTFOLIO_API=https://arunangshu-pramanik-portfolio.web.app \
    ANALYTICS_ADMIN_TOKEN=... \
    python3 scripts/portfolio_now.py building "fixing airflow retries"

    # optional kind + url flags
    python3 scripts/portfolio_now.py reading "Designing Data-Intensive Applications" \
        --kind reading --url https://example.com/book

Env vars:
    PORTFOLIO_API          site origin (default: https://arunangshu-pramanik-portfolio.web.app)
    ANALYTICS_ADMIN_TOKEN  admin token (required)
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.error

API = os.getenv("PORTFOLIO_API", "https://arunangshu-pramanik-portfolio.web.app").rstrip("/")
PATH = "/arunangshu_pramanik/portfolio/v1/status"
KINDS = ["building", "reading", "learning", "exploring", "listening"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Update the portfolio now-status badge.")
    parser.add_argument("label", nargs="?", help="what you're doing (e.g. 'fixing airflow retries')")
    parser.add_argument("--kind", default="building", choices=KINDS)
    parser.add_argument("--url", default=None, help="optional link the badge points to")
    parser.add_argument("--show", action="store_true", help="print the current status instead")
    args = parser.parse_args()

    token = os.getenv("ANALYTICS_ADMIN_TOKEN", "")
    url = f"{API}{PATH}"

    if args.show or not args.label:
        try:
            print(urllib.request.urlopen(url, timeout=10).read().decode())
            return 0
        except urllib.error.URLError as error:
            print(f"Failed to fetch status: {error}", file=sys.stderr)
            return 1
    if not token:
        print("ANALYTICS_ADMIN_TOKEN is not set.", file=sys.stderr)
        return 1

    body = {"kind": args.kind, "label": args.label}
    if args.url:
        body["url"] = args.url
    request = urllib.request.Request(
        url, method="PUT",
        headers={"Content-Type": "application/json", "X-Admin-Token": token},
        data=json.dumps(body).encode(),
    )
    try:
        print(urllib.request.urlopen(request, timeout=10).read().decode())
        return 0
    except urllib.error.HTTPError as error:
        print(f"Update failed ({error.code}): {error.read().decode()}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
