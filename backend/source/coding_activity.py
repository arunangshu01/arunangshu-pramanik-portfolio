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
