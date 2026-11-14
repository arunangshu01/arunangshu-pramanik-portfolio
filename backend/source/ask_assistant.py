import json
import os
import time
from collections import OrderedDict

import httpx

from utility.logger import Logger
from utility.settings import BASE_DIR, GROQ_API_KEY, GROQ_MODEL, GEMINI_API_KEY, GEMINI_MODEL

logger = Logger(__name__)

INFORMATION_DIR = os.path.join(f'{BASE_DIR.parent}', 'information')
CONTEXT_FILES = [
    'personal_info.json', 'profile_summary.json', 'skills.json',
    'experience.json', 'education_details.json', 'awards_recognitions.json',
    'projects.json',
]
SYSTEM_PROMPT = """You are the assistant on Arunangshu Pramanik's portfolio website.
Answer questions about Arunangshu using ONLY the portfolio data below. Stay
grounded: if the data does not cover the question, say so plainly and suggest
reaching out via the site's contact form or arunangshu01@gmail.com. Keep
answers under 120 words, plain text, no markdown. Speak about Arunangshu in
third person. Never invent employers, dates, skills, metrics or contact
details. Decline questions unrelated to Arunangshu or his work politely.

PORTFOLIO DATA:
"""

MAX_CONTEXT_CHARS = 14000
ANSWER_CACHE_SIZE = 200
_answers: OrderedDict[str, tuple[float, str]] = OrderedDict()


def _slim(name: str, data):
    """Drop verbose fields that rarely matter for resume Q&A; they only cost TPM."""
    if name == 'projects.json' and isinstance(data, list):
        return [{k: v for k, v in project.items()
                 if k not in ('case_study', 'highlights')} for project in data]
    if name == 'experience.json':
        return [{**job, 'responsibilities': (job.get('responsibilities') or [])[:4]}
                for job in data.get('experience', [])]
    return data


def _load_context() -> str:
    parts = []
    remaining = MAX_CONTEXT_CHARS
    for name in CONTEXT_FILES:
        try:
            with open(os.path.join(INFORMATION_DIR, name)) as handle:
                data = _slim(name, json.load(handle))
                text = json.dumps(data, separators=(',', ':'))
        except (OSError, ValueError):
            continue
        if len(text) > remaining:
            break
        parts.append(f'[{name}]\n{text}')
        remaining -= len(text)
    return SYSTEM_PROMPT + '\n\n'.join(parts)


def assistant_configured() -> bool:
    return bool(GROQ_API_KEY or GEMINI_API_KEY)


def _cached(question: str) -> str | None:
    entry = _answers.get(question)
    if entry is None:
        return None
    timestamp, answer = entry
    if time.monotonic() - timestamp > 3600:
        _answers.pop(question, None)
        return None
    _answers.move_to_end(question)
    return answer


def _cache(question: str, answer: str) -> None:
    _answers[question] = (time.monotonic(), answer)
    _answers.move_to_end(question)
    while len(_answers) > ANSWER_CACHE_SIZE:
        _answers.popitem(last=False)


async def _ask_groq(system: str, question: str) -> str | None:
    if not GROQ_API_KEY:
        return None
    payload = {
        'model': GROQ_MODEL,
        'max_tokens': 320,
        'temperature': 0.3,
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': question},
        ],
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={'Authorization': f'Bearer {GROQ_API_KEY}'},
            json=payload,
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content'].strip()


async def _ask_gemini(system: str, question: str) -> str | None:
    if not GEMINI_API_KEY:
        return None
    payload = {
        'system_instruction': {'parts': [{'text': system}]},
        'contents': [{'parts': [{'text': question}]}],
        'generationConfig': {'maxOutputTokens': 320, 'temperature': 0.3},
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent',
            headers={'x-goog-api-key': GEMINI_API_KEY},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data['candidates'][0]['content']['parts'][0]['text'].strip()


async def ask(question: str) -> str | None:
    """Answer a portfolio question, or None when no provider is configured."""
    if not assistant_configured():
        return None
    key = ' '.join(question.lower().split())
    cached = _cached(key)
    if cached is not None:
        return cached
    system = _load_context()
    for provider in (_ask_groq, _ask_gemini):
        try:
            answer = await provider(system, question)
        except httpx.HTTPStatusError as exc:
            logger.warning(
                f'Ask-assistant provider {provider.__name__} failed: '
                f'HTTP {exc.response.status_code} {exc.response.text[:200]}')
            continue
        except Exception as exc:
            logger.warning(f'Ask-assistant provider {provider.__name__} failed: {exc!r}')
            continue
        if answer:
            _cache(key, answer)
            return answer
    return None
