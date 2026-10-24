import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
API_COMMON_PREFIX = '/arunangshu_pramanik/portfolio/v1'

HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', '8080'))
DEBUG_MODE = "True" if os.getenv('DEBUG_MODE', True) in [True, 'True', 1, '1', 'true', 'TRUE'] else False
BREVO_API_KEY = os.getenv('BREVO_API_KEY')
MAIL_FROM = os.getenv('MAIL_FROM')
RECEIVER_EMAIL = os.getenv('RECEIVER_EMAIL')

# Comma-separated list of frontend origins allowed to call the API.
CORS_ORIGINS = [o.strip() for o in os.getenv(
    'CORS_ORIGINS', 'http://localhost:3000').split(',') if o.strip()]

# Rate limit for the contact-email endpoint (per client IP).
EMAIL_RATE_LIMIT_MAX_REQUESTS = int(os.getenv('EMAIL_RATE_LIMIT_MAX_REQUESTS', '3'))
EMAIL_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv('EMAIL_RATE_LIMIT_WINDOW_SECONDS', '3600'))

# Analytics: admin token for GET /analytics/summary and rate limit for POST /analytics/track.
VIEW_COUNTER_BACKEND = os.getenv('VIEW_COUNTER_BACKEND', 'memory')
GOOGLE_CLOUD_PROJECT = os.getenv('GOOGLE_CLOUD_PROJECT')
if VIEW_COUNTER_BACKEND not in ('memory', 'firestore'):
    raise ValueError('VIEW_COUNTER_BACKEND must be memory or firestore')

ANALYTICS_ADMIN_TOKEN = os.getenv('ANALYTICS_ADMIN_TOKEN')
ANALYTICS_RATE_LIMIT_MAX_REQUESTS = int(os.getenv('ANALYTICS_RATE_LIMIT_MAX_REQUESTS', '30'))
ANALYTICS_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv('ANALYTICS_RATE_LIMIT_WINDOW_SECONDS', '60'))


personal_info_file = os.path.join(f'{BASE_DIR.parent}/information', 'personal_info.json')
experience_file = os.path.join(f'{BASE_DIR.parent}/information', 'experience.json')
skills_file = os.path.join(f'{BASE_DIR.parent}/information', 'skills.json')
education_details_file = os.path.join(f'{BASE_DIR.parent}/information', 'education_details.json')
profile_summary_file = os.path.join(f'{BASE_DIR.parent}/information', 'profile_summary.json')
awards_recognitions_file = os.path.join(f'{BASE_DIR.parent}/information', 'awards_recognitions.json')
resume_file = os.path.join(f'{BASE_DIR.parent}/assets', 'Arunangshu_Pramanik_CV.pdf')

# JSON payloads are served through utility.json_cache.get_json_data(), which
# caches per file and reloads automatically when the file's mtime changes.


