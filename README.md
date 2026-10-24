# Arunangshu Pramanik — Portfolio

Personal portfolio with a J.A.R.V.I.S.-themed React frontend and a FastAPI backend serving portfolio data, resume PDFs, contact emails, and analytics.

- GCP target site (available after provisioning and deployment): https://arunangshu-pramanik-portfolio.web.app/
- GCP API docs (same Hosting origin): https://arunangshu-pramanik-portfolio.web.app/arunangshu_pramanik/portfolio/v1/docs
- Previous Render site: https://arunangshu-pramanik-portfolio-frontend.onrender.com/
- Detailed API reference: [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

## Repository layout

| Path | Purpose |
| --- | --- |
| `frontend/` | React 18, Create React App, Tailwind CSS, Framer Motion, react-icons |
| `backend/` | Python 3.12, FastAPI, Pydantic, Uvicorn |
| `backend/information/` | Portfolio JSON data |
| `backend/assets/` | Resume PDF |
| `.github/workflows/ci.yml` | Backend tests and frontend tests/build |
| `.github/CODEOWNERS` | Review routing to @arunangshu01 |

The frontend includes an animated boot sequence, skills grid, experience timeline, awards, responsive light/dark themes, resume links, contact form, optional ambient audio, and SEO metadata. API GET requests retry transient failures to accommodate hosting cold starts.

## Local setup

Prerequisites: Python 3.12 and Node.js 22 with npm. Run commands from the repository root unless a `cd` is shown.

### Backend

```sh
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

On Windows, activate with `.venv\Scripts\activate` instead. Local Swagger UI is at `http://localhost:8080/arunangshu_pramanik/portfolio/v1/docs`.

Edit `backend/.env` to configure email and analytics. Portfolio GET endpoints work without mail credentials. Never commit populated environment files.

### Frontend

In a separate terminal:

```sh
cd frontend
npm ci
cp .env.example .env.development.local
npm start
```

Open `http://localhost:3000`. The development proxy forwards `/arunangshu_pramanik/*` to `API_PROXY_TARGET`, including resume PDF navigation. Restart the dev server after changing environment variables.

## Configuration

### Backend environment

| Variable | Purpose / default |
| --- | --- |
| `HOST`, `PORT` | Application bind settings, `0.0.0.0:8080`; the documented Uvicorn CLI command sets these explicitly |
| `DEBUG_MODE` | FastAPI debug mode; set `false` in production |
| `CORS_ORIGINS` | Comma-separated frontend origins; defaults to `http://localhost:3000` |
| `BREVO_API_KEY` | Server-side Brevo API key for contact email |
| `MAIL_FROM` | Sender address verified in Brevo |
| `RECEIVER_EMAIL` | Contact-form destination inbox |
| `EMAIL_RATE_LIMIT_MAX_REQUESTS` | Contact requests per IP per window, `3` |
| `EMAIL_RATE_LIMIT_WINDOW_SECONDS` | Contact rate-limit window, `3600` |
| `ANALYTICS_ADMIN_TOKEN` | Secret required in `X-Admin-Token` for analytics summary; unset returns `503` |
| `ANALYTICS_RATE_LIMIT_MAX_REQUESTS` | Analytics requests per IP per window, `30` |
| `ANALYTICS_RATE_LIMIT_WINDOW_SECONDS` | Analytics rate-limit window, `60` |

### Frontend environment

| Variable | Purpose |
| --- | --- |
| `API_PROXY_TARGET` | Development-only backend origin, e.g. `http://localhost:8080` |
| `REACT_APP_API_BASE` | `/arunangshu_pramanik/portfolio/v1` for local proxy and Firebase Hosting; a full URL is only needed for a separately hosted API |
| `REACT_APP_ENABLE_ANALYTICS` | Optional `true`/`false` override; analytics defaults on for production builds, off for development |

`REACT_APP_*` variables are public build-time values, not secrets. Never put backend credentials or the analytics admin token in the frontend. Rebuild after changing production frontend variables.

## API overview

All paths below are prefixed with `/arunangshu_pramanik/portfolio/v1`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/personal_info` | Personal details and social profiles |
| GET | `/profile_summary` | Professional summary |
| GET | `/education_details` | Education |
| GET | `/skills` | Categorized skills |
| GET | `/experience` | Roles and responsibilities |
| GET | `/awards_recognitions` | Awards |
| GET | `/resume/view` | Inline resume PDF |
| GET | `/resume/download` | Resume PDF attachment |
| POST | `/send_email` | Multipart contact form; rate-limited, Brevo delivery in background |
| POST | `/analytics/track` | JSON analytics event; rate-limited |
| GET | `/analytics/summary` | Counts; requires `X-Admin-Token` |

Frontend events include page/section views, CTA/social clicks, theme toggles, and music playback. Resume and contact events are recorded server-side.

## Verification and contribution workflow

Backend (with its virtual environment activated):

```sh
cd backend
python -m pytest tests -v
```

Frontend:

```sh
cd frontend
npm ci
CI=true npm test -- --watchAll=false
CI=true npm run build
```

Backend tests mock email delivery; CI requires no production secrets. Backend CI also builds the Linux/amd64 API container before merging. Frontend production builds treat warnings as errors in CI.

Work on a feature branch, run the checks, and open a pull request into the default branch. Include a summary, test results, UI screenshots when applicable, and any deployment/environment changes. Never include real credentials or private contact-form payloads.

CI runs both jobs for every pull request, pushes to `main`/`master`, and manual dispatch. There are no path filters, so required checks are not left pending for documentation-only changes. CODEOWNERS requests review; GitHub rulesets enforce approval and checks, not this file alone.

## Deployment: Google Cloud (same pattern as Mahakal)

```text
Firebase Hosting: arunangshu-pramanik-portfolio
  /                         React static build + CDN + TLS
  /arunangshu_pramanik/**    Cloud Run: portfolio-api (asia-south1)
                              Secret Manager: email credentials and analytics token
GitHub main push -> CI passes -> Deploy -> health checks
```

This portfolio uses GCP project `ap-portfolio-241026` (project number `782289955945`), separate from Mahakal. The owner has created Firebase Hosting site `arunangshu-pramanik-portfolio`. No Firestore, OAuth client, or Google API key is needed by the current app.

Setup status on 24 October 2026: required APIs, the `portfolio` Artifact Registry repository in `asia-south1`, runtime/deployer service accounts, four populated secrets with enabled versions and runtime access, and repository-restricted WIF authentication have been provisioned. GitHub deployment variables and a `main`-only `production` environment are configured. The active `protect-main` ruleset requires PRs, resolved conversations, and both up-to-date CI checks; force pushes/deletion are blocked, with no bypass actors or mandatory reviewer approvals. Secret-version readiness has been verified without accessing payloads. The first deployment proceeds through the PR and CI workflow below.

| File | Purpose |
| --- | --- |
| `firebase.json` | CRA output `frontend/build`, API rewrite before SPA fallback, cache/security headers |
| `backend/Dockerfile`, `backend/.dockerignore` | Non-root Python container; excludes local environment files and virtualenv |
| `deploy/cloud-run.env.yaml` | Non-secret production settings |
| `.github/workflows/deploy.yml` | Keyless GCP authentication, verification, image push, backend and frontend deployment |

Automatic deploys require successful CI on a push to `main`. Manual deploys are also restricted to `main` and rerun backend/frontend checks before authentication. Stale main commits are rejected. The `production` environment can add an approval gate. No production secrets or service-account JSON keys belong in GitHub.

Cloud Run uses one Uvicorn worker, scales to zero, and is capped at one instance to limit costs and reduce split in-memory state. **Analytics and rate limits are still best-effort, process-local, and reset on restarts; rolling revisions can overlap.** Do not rely on these limits for strong abuse protection. Durable analytics/distributed rate limiting would require a separate storage design. The Cloud Run service is publicly invokable for Firebase Hosting compatibility; CORS does not make the direct API private. Proxy headers are trusted in this managed deployment; do not reuse this container on an untrusted proxy network without revisiting that setting.

### Manual GCP setup — do these in order

The setup commands below are retained as a provisioning reference. Check the status above before running them: do not recreate existing resources. Secret entry in step 4 is complete; publishing and deployment follow step 8. Use an administrator account for any remaining provisioning. Stop if a command fails; these creation commands are not an idempotent setup script.

#### 1. Create the project, link billing, and add Firebase

1. In Google Cloud Console, create a **new portfolio project** with an available project ID. Do not select `mahakal-ai-230925`.
2. Link billing. In Billing → Budgets & alerts, create a project-scoped budget with email alerts. A budget is an alert, **not a spending cap**; free-tier eligibility and actual usage determine charges.
3. In Firebase Console, choose **Add Firebase to an existing Google Cloud project**, select the new project, and finish setup. Google Analytics is optional and not needed for the app's own analytics.
4. In Firebase Hosting, create the site ID **`arunangshu-pramanik-portfolio`**. If unavailable, choose another ID and update `firebase.json`, `deploy/cloud-run.env.yaml`, `frontend/public/index.html`, `frontend/public/robots.txt`, `frontend/public/sitemap.xml`, and the target URLs in this README before merging. No Firebase SDK/web app registration is needed for this static site.

#### 2. Authenticate your terminal and set identifiers

Install Google Cloud CLI and GitHub CLI if missing; use Node.js 22 for Firebase CLI. Run from the repository root:

```bash
gcloud auth login
gh auth login
export PROJECT_ID='ap-portfolio-241026'
export REGION='asia-south1'
export GITHUB_REPO='arunangshu01/arunangshu-pramanik-portfolio'
export RUN_SA="portfolio-run@${PROJECT_ID}.iam.gserviceaccount.com"
export DEPLOY_SA="portfolio-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud config set project "$PROJECT_ID"
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
export REPO_ID=$(gh api "repos/$GITHUB_REPO" --jq '.id')
export OWNER_ID=$(gh api "repos/$GITHUB_REPO" --jq '.owner.id')
```

Use the same terminal for subsequent commands so the variables remain set. The workflow assumes `main` is the production branch; if yours differs, update deployment guards, branch filters, WIF conditions, and GitHub environment restrictions consistently.

#### 3. Enable services and create the Docker registry

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  secretmanager.googleapis.com firebase.googleapis.com \
  firebasehosting.googleapis.com cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com

gcloud artifacts repositories create portfolio \
  --repository-format=docker --location="$REGION" \
  --description='Portfolio API images'
```

In Artifact Registry, review storage usage and configure a cleanup policy after deciding your rollback retention. No automatic image deletion policy is applied by this repo.

#### 4. Create runtime identity and secrets

```bash
gcloud iam service-accounts create portfolio-run \
  --display-name='Portfolio Cloud Run runtime'

for secret in portfolio-brevo-api-key portfolio-mail-from portfolio-receiver-email portfolio-analytics-admin-token; do
  gcloud secrets create "$secret" --replication-policy=automatic
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:$RUN_SA" --role=roles/secretmanager.secretAccessor
done
```

In **Secret Manager → each secret → New version**, enter the value directly in the console:

| Secret ID | Value |
| --- | --- |
| `portfolio-brevo-api-key` | Your Brevo API key |
| `portfolio-mail-from` | Sender address verified in Brevo |
| `portfolio-receiver-email` | Inbox for contact messages |
| `portfolio-analytics-admin-token` | Strong random token generated by your password manager |

Keep values out of terminal history, chat, Git, and frontend settings. Every secret needs an enabled version before deployment. Cloud Run injects these as environment variables; the application needs no Secret Manager SDK or additional Python dependency. The runtime identity has access only to these four secrets, not project-wide Secret Manager access. Secret changes take effect on a **new revision**: rerun Deploy after rotation. Rotate any credential previously exposed in Git history; `.gitignore` does not remove it from history.

#### 5. Create the GitHub deployer identity

```bash
gcloud iam service-accounts create portfolio-deployer \
  --display-name='Portfolio GitHub deployer'

for role in roles/run.admin roles/firebasehosting.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$DEPLOY_SA" --role="$role"
done

gcloud artifacts repositories add-iam-policy-binding portfolio --location="$REGION" \
  --member="serviceAccount:$DEPLOY_SA" --role=roles/artifactregistry.writer

gcloud iam service-accounts add-iam-policy-binding "$RUN_SA" \
  --member="serviceAccount:$DEPLOY_SA" --role=roles/iam.serviceAccountUser
```

The deployer can update Cloud Run and Hosting in this dedicated project but cannot read secret values directly. It can deploy code running as the runtime identity, so protect its GitHub workflow and repository access accordingly. Organization policies must permit a publicly invokable Cloud Run service; ask your administrator if public IAM is prohibited rather than weakening an organization policy.

#### 6. Configure keyless GitHub authentication (WIF)

```bash
gcloud iam workload-identity-pools create github --location=global \
  --display-name='Portfolio GitHub Actions'

gcloud iam workload-identity-pools providers create-oidc portfolio-repo \
  --location=global --workload-identity-pool=github \
  --display-name='Portfolio production workflow' \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id' \
  --attribute-condition="assertion.repository_id=='${REPO_ID}' && assertion.repository_owner_id=='${OWNER_ID}' && assertion.ref=='refs/heads/main' && assertion.workflow_ref=='${GITHUB_REPO}/.github/workflows/deploy.yml@refs/heads/main'"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository_id/${REPO_ID}"

printf 'GCP_PROJECT_ID=%s\nGCP_DEPLOY_SA=%s\nGCP_WIF_PROVIDER=projects/%s/locations/global/workloadIdentityPools/github/providers/portfolio-repo\n' \
  "$PROJECT_ID" "$DEPLOY_SA" "$PROJECT_NUMBER"
```

The condition uses immutable repository/owner IDs and restricts authentication to the production workflow on `main`. Do not create or upload a service-account JSON key. Allow a few minutes for new IAM/WIF bindings to propagate if the first authentication attempt fails.

#### 7. Configure GitHub variables, environment, and gatekeeping

In **Settings → Secrets and variables → Actions → Variables**, add the three identifiers printed above:

| Variable | Value |
| --- | --- |
| `GCP_PROJECT_ID` | Your new project ID |
| `GCP_DEPLOY_SA` | `portfolio-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com` |
| `GCP_WIF_PROVIDER` | Full provider resource name printed in step 6 |

Then:

1. Create **Settings → Environments → `production`**. Limit deployment branches to `main`. Add a required reviewer if your plan supports it and you want approval before every deployment; ensure your self-review setting does not block a solo-maintainer deployment.
2. Enable Actions and permit the Google authentication/setup actions. Keep default token permissions read-only; only Deploy requests OIDC permission. Require approval for workflows from outside contributors as appropriate.
3. Add an active default-branch ruleset requiring PRs, conversation resolution, up-to-date branches, and the checks **`Backend tests`** and **`Frontend tests and build`** after their first run. Block force pushes and branch deletion.
4. For a solo maintainer, leave merge approval requirements off: you cannot approve your own PR. With another trusted maintainer, require an approval and CODEOWNERS review. Confirm `@arunangshu01` has write access. Limit write/admin access and explicitly review bypass permissions.
5. Enable dependency alerts/security updates, secret scanning, and push protection where supported. GitHub plan/repository visibility affect whether rulesets and environment protections are enforced; verify availability rather than assuming a saved setting is active.

#### 8. Validate locally, merge, and perform the first deploy

1. Start Docker Desktop. From the repo root, build with `docker build --platform linux/amd64 -t portfolio-api:local backend`. Run `docker run --rm -p 8080:8080 -e DEBUG_MODE=false portfolio-api:local`, then check `http://localhost:8080/arunangshu_pramanik/portfolio/v1/health` in another terminal. This checks container startup without production mail secrets.
2. Run the backend/frontend verification commands above. Create local env files from the examples only if you need local mail functionality.
3. Commit and push this feature branch; open a PR into `main`. Confirm both CI checks pass before merging.
4. Merge the PR. When CI passes on the `main` push, **Actions → Deploy** builds and deploys Cloud Run first, checks its health, deploys Firebase Hosting, then checks the site and same-origin API rewrite. Approve the environment gate if configured.
5. To retry after fixing setup, use **Actions → Deploy → Run workflow → main**. Manual runs repeat tests/build; they do not bypass verification. A rejected stale commit means a newer main deployment should run instead.
6. Open the Hosting URL shown in Firebase Console. Check portfolio sections, resume view/download, the API docs, theme switching, and actual contact email delivery. The automated smoke test does not send email.
7. Verify `/analytics/summary` returns an authorization failure without a token and succeeds with the configured `X-Admin-Token`. Do not put the token in a browser URL.

#### 9. Monitoring, cutover, and rollback

- In Cloud Monitoring, add an HTTPS uptime check for your Hosting domain at `/arunangshu_pramanik/portfolio/v1/health` and an email notification channel; configure availability and Cloud Run 5xx alerts. Review monitoring costs before enabling checks.
- Use Cloud Run → Logs for startup and delivery failures. Never add credential values or contact message bodies to logs.
- Keep the old Render services during validation. Update external profile links/Search Console to the new site only after successful smoke tests. Disable old Render auto-deploys after cutover; suspend/delete resources only when you decide they are no longer needed.
- SEO canonical/Open Graph/sitemap URLs target the proposed Firebase site. If you later add a custom domain, verify its DNS/TLS in Firebase and update SEO URLs plus allowed origins in the same PR.
- Backend and frontend updates are sequential, not atomic. Keep API changes backward-compatible. If Hosting deployment fails after API deployment, the previous frontend remains live against the new API.
- For a normal rollback, revert the faulty change via a new PR, pass CI, and merge. For an emergency, a GCP administrator can route Cloud Run traffic to a known-good revision and restore a previous Firebase Hosting release in the consoles; coordinate both sides. A later Deploy will replace that manual rollback.
- Review billing, registry storage, and Secret Manager usage regularly. Scale-to-zero and instance limits reduce usage but **do not guarantee a zero bill**.

## Asset maintenance

From `frontend/`:

- `python3 scripts/gen_og_image.py` regenerates `public/og-image.png`.
- `python3 scripts/gen_ambient.py` generates the ambient loop WAV.
- On macOS, `afconvert -f m4af -d aac -b 96000 /tmp/ambient.wav public/ambient.m4a` encodes the ambient audio.

These optional asset scripts are separate from the application build and may require additional local tooling.

## License

[Apache License 2.0](LICENSE), preserved from the original frontend and backend repositories. Third-party trademarks and assets remain subject to their respective rights.
