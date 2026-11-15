import time

import httpx

from utility.logger import Logger
from utility.settings import GITHUB_USERNAME, LEETCODE_USERNAME, SOCIAL_CACHE_SECONDS

logger = Logger(__name__)

_cache: dict[str, tuple[float, dict]] = {}


def _cached(key: str) -> dict | None:
    entry = _cache.get(key)
    if entry and time.monotonic() - entry[0] < SOCIAL_CACHE_SECONDS:
        return entry[1]
    return None


def _store(key: str, value: dict) -> dict:
    _cache[key] = (time.monotonic(), value)
    return value


async def github_activity() -> dict | None:
    """Public profile stats plus a count of recent public events. None on failure."""
    cached = _cached('github')
    if cached is not None:
        return cached
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-activity'}
    try:
        async with httpx.AsyncClient(timeout=15, headers=headers) as client:
            profile_resp = await client.get(f'https://api.github.com/users/{GITHUB_USERNAME}')
            profile_resp.raise_for_status()
            events_resp = await client.get(
                f'https://api.github.com/users/{GITHUB_USERNAME}/events/public',
                params={'per_page': 100},
            )
            events_resp.raise_for_status()
        profile = profile_resp.json()
        events = events_resp.json()
    except Exception:
        logger.warning('GitHub activity fetch failed')
        return None
    pushes = [event for event in events if event.get('type') == 'PushEvent']
    latest = events[0].get('created_at') if events else None
    return _store('github', {
        'username': GITHUB_USERNAME,
        'public_repos': profile.get('public_repos', 0),
        'followers': profile.get('followers', 0),
        'recent_events': len(events),
        'recent_pushes': len(pushes),
        'latest_activity': latest,
        'profile_url': f'https://github.com/{GITHUB_USERNAME}',
    })


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


async def github_feed(limit: int = 12) -> dict | None:
    """Recent public GitHub events rendered as a changelog feed. None on failure."""
    cached = _cached('github_feed')
    if cached is not None:
        return cached
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-activity'}
    try:
        async with httpx.AsyncClient(timeout=15, headers=headers) as client:
            events_resp = await client.get(
                f'https://api.github.com/users/{GITHUB_USERNAME}/events/public',
                params={'per_page': 100},
            )
            events_resp.raise_for_status()
        events = events_resp.json()
    except Exception:
        logger.warning('GitHub feed fetch failed')
        return None
    feed = []
    seen: set[tuple] = set()
    for event in events:
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
    return _store('github_feed', {'username': GITHUB_USERNAME, 'events': feed})


async def _github_events() -> list | None:
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-activity'}
    try:
        async with httpx.AsyncClient(timeout=15, headers=headers) as client:
            resp = await client.get(
                f'https://api.github.com/users/{GITHUB_USERNAME}/events/public',
                params={'per_page': 100},
            )
            resp.raise_for_status()
        return resp.json()
    except Exception:
        logger.warning('GitHub events fetch failed')
        return None


async def github_wrapped() -> dict | None:
    """Aggregate stats over the ~90 days of public events GitHub exposes."""
    cached = _cached('github_wrapped')
    if cached is not None:
        return cached
    events = await _github_events()
    if events is None:
        return None
    from collections import Counter
    from datetime import datetime, timezone
    days = set()
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
    # Streak: consecutive active days ending today or yesterday.
    today = datetime.now(timezone.utc).date()
    start = today if today.isoformat() in days else today.fromordinal(today.toordinal() - 1)
    streak = 0
    day = start
    while day.isoformat() in days:
        streak += 1
        day = day.fromordinal(day.toordinal() - 1)
    return _store('github_wrapped', {
        'username': GITHUB_USERNAME,
        'window_days': 90,
        'total_events': len(events),
        'active_days': len(days),
        'current_streak': streak,
        'top_repos': [{'repo': name, 'events': count} for name, count in repos.most_common(5)],
        'event_types': dict(types.most_common()),
    })


_REPO_CACHE_KEY = 'repo_health'


async def repo_health() -> dict | None:
    """Per-repo stats for showcased projects: stars, issues, last push, language."""
    cached = _cached(_REPO_CACHE_KEY)
    if cached is not None:
        return cached
    from utility.json_cache import get_json_data
    from utility.settings import projects_file
    try:
        projects = get_json_data(projects_file)
    except Exception:
        projects = []
    repos = []
    for project in projects or []:
        url = project.get('github_url') or ''
        if 'github.com/' in url:
            repos.append(url.rstrip('/').split('github.com/', 1)[-1])
    if not repos:
        return None
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-activity'}
    results = {}
    try:
        async with httpx.AsyncClient(timeout=15, headers=headers) as client:
            for full_name in repos[:8]:
                resp = await client.get(f'https://api.github.com/repos/{full_name}')
                if resp.status_code != 200:
                    continue
                data = resp.json()
                results[full_name] = {
                    'repo': data.get('name'),
                    'repo_url': data.get('html_url'),
                    'stars': data.get('stargazers_count', 0),
                    'open_issues': data.get('open_issues_count', 0),
                    'language': data.get('language'),
                    'pushed_at': data.get('pushed_at'),
                }
    except Exception:
        logger.warning('Repo health fetch failed')
        return None
    if not results:
        return None
    return _store(_REPO_CACHE_KEY, {'repos': list(results.values())})


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


async def leetcode_stats() -> dict | None:
    """Solved-problem counts from LeetCode's public GraphQL API. None on failure."""
    cached = _cached('leetcode')
    if cached is not None:
        return cached
    try:
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
            return None
        counts = {row['difficulty']: row['count']
                  for row in user['submitStatsGlobal']['acSubmissionNum']}
    except Exception:
        logger.warning('LeetCode stats fetch failed')
        return None
    return _store('leetcode', {
        'username': LEETCODE_USERNAME,
        'solved': counts.get('All', 0),
        'easy': counts.get('Easy', 0),
        'medium': counts.get('Medium', 0),
        'hard': counts.get('Hard', 0),
        'ranking': (user.get('profile') or {}).get('ranking'),
        'profile_url': f'https://leetcode.com/u/{LEETCODE_USERNAME}/',
    })
