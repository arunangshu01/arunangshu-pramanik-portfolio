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
        if event_type == 'PushEvent':
            payload = event.get('payload') or {}
            commits = payload.get('commits') or []
            item['detail'] = f"{payload.get('size', len(commits))} commit(s) to " \
                             f"{(payload.get('ref') or '').rsplit('/', 1)[-1] or 'main'}"
        elif event_type == 'CreateEvent':
            item['detail'] = (event.get('payload') or {}).get('ref_type')
        elif event_type == 'ReleaseEvent':
            item['detail'] = ((event.get('payload') or {}).get('release') or {}).get('tag_name')
        feed.append(item)
        if len(feed) >= limit:
            break
    return _store('github_feed', {'username': GITHUB_USERNAME, 'events': feed})


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
