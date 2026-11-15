import asyncio
import time
from collections import Counter
from datetime import datetime, timedelta, timezone

import httpx

from utility.json_cache import get_json_data
from utility.logger import Logger
from utility.settings import GITHUB_TOKEN, GITHUB_USERNAME, LEETCODE_USERNAME, \
    SOCIAL_CACHE_SECONDS, projects_file

logger = Logger(__name__)

# After a failed upstream call, wait this long before trying again; the last
# good value (if any) keeps being served in the meantime.
FAILURE_BACKOFF_SECONDS = 60
MAX_REPOS = 8

# key -> (fetched_at, value); value may be None for a cached failure.
_cache: dict[str, tuple[float, object]] = {}
_last_good: dict[str, object] = {}
_locks: dict[str, asyncio.Lock] = {}


def _github_headers() -> dict:
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-activity',
               'X-GitHub-Api-Version': '2022-11-28'}
    if GITHUB_TOKEN:
        headers['Authorization'] = f'Bearer {GITHUB_TOKEN}'
    return headers


async def _cached_fetch(key: str, loader):
    """Fresh value, else the last good value during a backoff, else None.

    A per-key lock collapses concurrent cold-cache requests into one upstream
    call, and failures are cached briefly so an outage doesn't hammer the API.
    """
    entry = _cache.get(key)
    if entry:
        fetched_at, value = entry
        ttl = SOCIAL_CACHE_SECONDS if value is not None else FAILURE_BACKOFF_SECONDS
        if time.monotonic() - fetched_at < ttl:
            return value if value is not None else _last_good.get(key)
    lock = _locks.setdefault(key, asyncio.Lock())
    async with lock:
        entry = _cache.get(key)
        if entry and time.monotonic() - entry[0] < (
                SOCIAL_CACHE_SECONDS if entry[1] is not None else FAILURE_BACKOFF_SECONDS):
            return entry[1] if entry[1] is not None else _last_good.get(key)
        try:
            value = await loader()
        except Exception as error:
            logger.warning(f'{key} fetch failed ({type(error).__name__})')
            value = None
        _cache[key] = (time.monotonic(), value)
        if value is not None:
            _last_good[key] = value
            return value
        return _last_good.get(key)


def clear_cache() -> None:
    _cache.clear()
    _last_good.clear()


async def _load_github_events() -> list:
    async with httpx.AsyncClient(timeout=15, headers=_github_headers()) as client:
        resp = await client.get(
            f'https://api.github.com/users/{GITHUB_USERNAME}/events/public',
            params={'per_page': 100})
        resp.raise_for_status()
    events = resp.json()
    if not isinstance(events, list):
        raise ValueError('unexpected GitHub events payload')
    return events


async def _github_events() -> list | None:
    """Shared by activity, feed and wrapped: one upstream call per cache window."""
    return await _cached_fetch('github_events', _load_github_events)


async def _load_github_profile() -> dict:
    async with httpx.AsyncClient(timeout=15, headers=_github_headers()) as client:
        resp = await client.get(f'https://api.github.com/users/{GITHUB_USERNAME}')
        resp.raise_for_status()
    return resp.json()


async def github_activity() -> dict | None:
    """Public profile stats plus a count of recent public events. None on failure."""
    profile, events = await asyncio.gather(
        _cached_fetch('github_profile', _load_github_profile), _github_events())
    if profile is None or events is None:
        return None
    pushes = [event for event in events if event.get('type') == 'PushEvent']
    return {
        'username': GITHUB_USERNAME,
        'public_repos': profile.get('public_repos', 0),
        'followers': profile.get('followers', 0),
        'recent_events': len(events),
        'recent_pushes': len(pushes),
        'latest_activity': max((e.get('created_at') or '' for e in events), default='') or None,
        'profile_url': f'https://github.com/{GITHUB_USERNAME}',
    }


_EVENT_LABELS = {
    'PushEvent': 'pushed to',
    'CreateEvent': 'created',
    'PullRequestEvent': 'opened a pull request in',
    'PullRequestReviewEvent': 'reviewed a pull request in',
    'IssuesEvent': 'opened an issue in',
    'IssueCommentEvent': 'commented on an issue in',
    'ReleaseEvent': 'released',
    'ForkEvent': 'forked',
    'WatchEvent': 'starred',
    'DeleteEvent': 'deleted a ref in',
}


def build_feed(events: list, limit: int = 12) -> list[dict]:
    feed = []
    seen: set[tuple] = set()
    # GitHub doesn't strictly order events by time; sort newest-first so the
    # dedupe keeps the most recent row and the feed reads chronologically.
    ordered = sorted(events, key=lambda e: e.get('created_at') or '', reverse=True)
    for event in ordered:
        event_type = event.get('type')
        if event_type not in _EVENT_LABELS:
            continue
        repo = (event.get('repo') or {}).get('name', '')
        item = {
            'type': event_type,
            'action': _EVENT_LABELS[event_type],
            'repo': repo,
            'repo_url': f'https://github.com/{repo}',
            'created_at': event.get('created_at'),
        }
        payload = event.get('payload') or {}
        if event_type == 'PushEvent':
            branch = (payload.get('ref') or '').rsplit('/', 1)[-1] or 'main'
            count = payload.get('size') or len(payload.get('commits') or [])
            item['detail'] = f"{count} commit(s) to {branch}" if count else f"to {branch}"
        elif event_type == 'CreateEvent':
            item['detail'] = payload.get('ref_type')
        elif event_type == 'ReleaseEvent':
            item['detail'] = (payload.get('release') or {}).get('tag_name')
        # Collapse duplicate action+repo rows (e.g. a burst of PR events).
        key = (item['action'], repo)
        if key in seen:
            continue
        seen.add(key)
        feed.append(item)
        if len(feed) >= limit:
            break
    return feed


async def github_feed(limit: int = 12) -> dict | None:
    """Recent public GitHub events rendered as a changelog feed. None on failure."""
    events = await _github_events()
    if events is None:
        return None
    return {'username': GITHUB_USERNAME, 'events': build_feed(events, limit)}


def build_wrapped(events: list, today=None) -> dict:
    days: set[str] = set()
    types: Counter = Counter()
    repos: Counter = Counter()
    for event in events:
        created = event.get('created_at')
        if created:
            days.add(created[:10])
        types[event.get('type') or 'Other'] += 1
        repo = (event.get('repo') or {}).get('name', '').split('/')[-1]
        if repo:
            repos[repo] += 1
    # Streak: consecutive active days ending today, or yesterday if today is quiet.
    today = today or datetime.now(timezone.utc).date()
    day = today if today.isoformat() in days else today - timedelta(days=1)
    streak = 0
    while day.isoformat() in days:
        streak += 1
        day -= timedelta(days=1)
    return {
        'username': GITHUB_USERNAME,
        'window_days': 90,
        'total_events': len(events),
        'active_days': len(days),
        'current_streak': streak,
        'top_repos': [{'repo': name, 'events': count} for name, count in repos.most_common(5)],
        'event_types': dict(types.most_common()),
    }


async def github_wrapped() -> dict | None:
    """Aggregate stats over the ~90 days of public events GitHub exposes."""
    events = await _github_events()
    return None if events is None else build_wrapped(events)


def showcased_repos() -> list[str]:
    try:
        projects = get_json_data(projects_file)
    except Exception:
        return []
    repos = []
    for project in projects if isinstance(projects, list) else []:
        url = (project.get('github_url') or '').rstrip('/')
        if url.startswith('https://github.com/'):
            name = url.removeprefix('https://github.com/')
            if name.count('/') == 1 and name not in repos:
                repos.append(name)
    return repos[:MAX_REPOS]


async def _load_repo_health() -> dict | None:
    repos = showcased_repos()
    if not repos:
        return None
    async with httpx.AsyncClient(timeout=15, headers=_github_headers()) as client:
        responses = await asyncio.gather(
            *(client.get(f'https://api.github.com/repos/{name}') for name in repos),
            return_exceptions=True)
    results = []
    for resp in responses:
        if isinstance(resp, Exception) or resp.status_code != 200:
            continue
        data = resp.json()
        results.append({
            'repo': data.get('name'),
            'repo_url': data.get('html_url'),
            'stars': data.get('stargazers_count', 0),
            'open_issues': data.get('open_issues_count', 0),
            'language': data.get('language'),
            'pushed_at': data.get('pushed_at'),
        })
    if not results:
        raise ValueError('no repository data available')
    return {'repos': results}


async def repo_health() -> dict | None:
    """Per-repo stats for showcased projects: stars, issues, last push, language."""
    return await _cached_fetch('repo_health', _load_repo_health)


LEETCODE_QUERY = """
query userStats($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal {
      acSubmissionNum { difficulty count }
    }
    profile { ranking }
  }
}
"""


async def _load_leetcode() -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            'https://leetcode.com/graphql',
            headers={'Content-Type': 'application/json',
                     'Referer': f'https://leetcode.com/u/{LEETCODE_USERNAME}/',
                     'User-Agent': 'portfolio-activity'},
            json={'query': LEETCODE_QUERY, 'variables': {'username': LEETCODE_USERNAME}},
        )
        response.raise_for_status()
    user = (response.json().get('data') or {}).get('matchedUser')
    if not user:
        raise ValueError('LeetCode user not found')
    counts = {row['difficulty']: row['count']
              for row in user['submitStatsGlobal']['acSubmissionNum']}
    return {
        'username': LEETCODE_USERNAME,
        'solved': counts.get('All', 0),
        'easy': counts.get('Easy', 0),
        'medium': counts.get('Medium', 0),
        'hard': counts.get('Hard', 0),
        'ranking': (user.get('profile') or {}).get('ranking'),
        'profile_url': f'https://leetcode.com/u/{LEETCODE_USERNAME}/',
    }


async def leetcode_stats() -> dict | None:
    """Solved-problem counts from LeetCode's public GraphQL API. None on failure."""
    return await _cached_fetch('leetcode', _load_leetcode)
