# arunangshu

Arunangshu Pramanik's resume, in your terminal.

```bash
npx arunangshu
```

## Options

| Flag | Effect |
| --- | --- |
| `--full` | Include role responsibilities and project highlights |
| `--offline` | Skip the network and use the bundled snapshot |
| `--json` | Print the raw resume data as JSON |
| `--no-color` | Disable colors (`NO_COLOR` and non-TTY output also disable them) |
| `--open` | Open the portfolio website in your browser |
| `-h`, `--help` | Show help |
| `-v`, `--version` | Show the version |

## How it works

The card is fetched live from the portfolio API (`/personal_info`, `/profile_summary`, `/experience`, `/skills`, `/projects`, `/education_details`) with a 4-second timeout per request. Any section that fails falls back to `data/snapshot.json`, which is bundled in the package, so the card always renders - offline, during API cold starts, or in an outage. The footer says whether the output is live, partly live, or from the snapshot.

Zero runtime dependencies; requires Node 18+. Control characters are stripped from all fetched text, so remote data cannot inject terminal escape sequences.

## Development

```bash
cd cli
npm start            # run locally
npm test             # node:test suite
npm run snapshot     # regenerate data/snapshot.json from backend/information/*.json
```

## Publishing

`prepublishOnly` regenerates the snapshot and runs the tests, so a publish always ships current data:

```bash
cd cli
npm login
npm publish --access public
```

Bump `version` in `package.json` before each publish (`npm version patch`).

Website: https://arunangshu-pramanik-portfolio.web.app/
