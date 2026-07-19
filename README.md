# Playwright Testing Framework — vranjan.dev

An enterprise-grade Playwright E2E testing framework built against
[vranjan.dev](https://vranjan.dev), a static, server-rendered personal site
(Eleventy/11ty + vanilla JS, hosted on Netlify). There is no separate
application source in this repository — this is a black-box test suite
targeting a live, externally-hosted site.

## Contents

- [Why this architecture](#why-this-architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Running tests](#running-tests)
- [Configuration](#configuration)
- [Writing tests](#writing-tests)
- [Fixtures](#fixtures)
- [Test categories & what they cover](#test-categories--what-they-cover)
- [Known findings from building this suite](#known-findings-from-building-this-suite)
- [Debugging](#debugging)
- [CI](#ci)
- [Repo tooling](#repo-tooling)
- [Best practices this repo follows](#best-practices-this-repo-follows)
- [Common mistakes / troubleshooting](#common-mistakes--troubleshooting)

## Why this architecture

The target is a **live production site with no accessible source code and no
staging backend** — that shapes several decisions:

- **No component tests.** There's no component boundary to test in isolation;
  everything is exercised through the rendered page.
- **No real API/integration tests.** The only "API" is the Netlify Forms
  endpoint the contact form POSTs to. Tests intercept it (see
  [Fixtures](#fixtures)) rather than hitting the real endpoint, so CI never
  spams the site owner's inbox or Netlify dashboard.
- **No auth/permissions suite.** The site has no login, so those categories
  from a typical enterprise checklist are intentionally absent rather than
  faked.
- **Visual regression is scoped, not full-page.** New blog posts, a live
  relative "build time" and "load time" in the footer, and lazy-loaded images
  mean a full-page screenshot diff would be noise. Each visual test targets a
  structurally stable region and masks the few dynamic elements inside it.
- **BASE_URL is the single point of retargeting.** Every page object uses a
  relative `path` (`/work/`, `/blog/`, …) resolved against Playwright's
  `baseURL`. Point the whole suite at a staging URL or deploy preview by
  changing one value — see [Configuration](#configuration).

## Project structure

```text
tests/                     # Spec files, grouped by concern
  smoke/                    # Fast "is the site up" checks - run on every project
  navigation/               # Header nav, mobile menu, skip link, back-to-top
  forms/                    # Contact form validation + mocked submission
  content/                  # Blog pagination, tags, and the Pagefind search overlay
  preferences/              # Theme toggle + settings modal (localStorage-backed)
  accessibility/            # axe-core WCAG scans + keyboard navigation
  visual/                   # Scoped, masked screenshot regression (chromium only)
  performance/              # Console/network health, load timing, resource weight
  security/                 # Response headers, tabnabbing protection, 404s, cookies

pages/                      # Page Object Model
  BasePage.ts                # Shared chrome: nav, settings modal, skip link, back-to-top
  HomePage.ts, WorkPage.ts, BlogPage.ts, BlogPostPage.ts, ContactPage.ts
  components/                # NavigationComponent, SettingsModalComponent

fixtures/index.ts           # Custom test object: page-object fixtures,
                             # the form-submission network guard, an axe builder factory

test-data/                  # Static fixtures data + the accessibility known-issues allowlist
utils/                      # diagnostics.ts (console/network capture), a11y.ts (axe reporting)

playwright.config.ts        # Projects, reporters, timeouts, retries
.github/workflows/playwright.yml
```

## Getting started

```bash
npm install
npx playwright install --with-deps   # downloads Chromium, Firefox, WebKit
cp .env.example .env                 # optional - only needed to override BASE_URL
```

## Running tests

```bash
npm test                    # everything, all projects
npm run test:smoke          # @smoke-tagged tests only (fast sanity check)
npm run test:chromium       # single browser (test:firefox, test:webkit also available)
npm run test:mobile         # Mobile Chrome + Mobile Safari
npm run test:a11y           # accessibility suite
npm run test:visual         # visual regression (chromium only)
npm run test:visual:update  # regenerate visual baselines after an intentional UI change
npm run test:perf           # performance/console-error suite
npm run test:security       # security/response-header suite
npm run test:headed         # full run in a visible browser window
npm run test:ui             # Playwright's interactive UI mode
npm run test:debug          # step-through debugger
npm run report              # open the last HTML report
```

Run a single file or line: `npx playwright test tests/forms/contact-form.spec.ts:64`.

## Configuration

Everything under `use:` and `projects:` lives in `playwright.config.ts`. The
two knobs you'll actually touch:

| Variable     | Default               | Purpose                                                                                                                    |
| ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `BASE_URL`   | `https://vranjan.dev` | Target site. Set in `.env`, or inline (`BASE_URL=... npx playwright test`), to point at a deploy preview or staging build. |
| `PW_WORKERS` | auto                  | Override parallel worker count.                                                                                            |
| `RECORD_HAR` | `0`                   | Set to `1` to record a HAR file per run for network debugging.                                                             |

### Browser/device matrix

| Project                                                | Purpose                                                  |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `chromium`, `firefox`, `webkit`                        | Full functional + a11y + security + performance coverage |
| `Mobile Chrome` (Pixel 7), `Mobile Safari` (iPhone 14) | Smoke + navigation + forms only                          |
| `Tablet` (iPad gen 7)                                  | Smoke + navigation only                                  |
| `visual-chromium`                                      | Visual regression only, fixed viewport, reduced motion   |

Running full functional/a11y/security regression on every mobile/tablet
viewport is redundant cost for a static content site: the risk that's unique
to those viewports is layout and touch interaction, which smoke + navigation +
forms already exercise. Visual regression is isolated to one browser so
baseline images aren't multiplied across every device combination above.

## Writing tests

- **Locators**: prefer `getByRole`, `getByLabel`, `getByText` (see every page
  object under `pages/`). CSS is used only where there's no meaningful
  accessible name (e.g. `.blog-post` as a repeating container).
- **Page Object Model**: each page extends `BasePage` (shared header/settings/
  skip-link/back-to-top) and exposes locators + the few actions specific to
  it. Components (`NavigationComponent`, `SettingsModalComponent`) are
  composed into `BasePage`, not duplicated per page.
- **Tags**: use `test.describe('...', { tag: '@smoke' })` at the describe
  level rather than repeating a tag on every test.
- **Dynamic content**: never hardcode things that will change as the site
  owner publishes content (blog post counts, specific slugs). `BlogPage`
  exposes `postCount()`/`totalPostsFromSummary()`; tests navigate to
  "whichever post is first" rather than a fixed slug.
- **Exploring a new page/flow**: `npm run codegen` opens Playwright's recorder
  against vranjan.dev and generates locator/action code from your clicks — a
  fast way to find the right accessible-name locator before writing the page
  object method by hand. Point it elsewhere with
  `npm run codegen -- https://other-url.com`.

## Fixtures

All fixtures live in `fixtures/index.ts` (import `test`/`expect` from there,
not from `@playwright/test`, in every spec).

- **Page object fixtures** (`homePage`, `workPage`, `blogPage`,
  `blogPostPage`, `contactPage`) — one instance per test, wired to `page`.
- **`formSubmissionGuard`** (auto-applied to _every_ test): intercepts any
  `POST` to the site's root (`/`), which is where the contact form's `fetch()`
  goes. This is a safety net, not just a mocking convenience — without it, any
  test that submits the contact form (intentionally or by a future mistake)
  would create a real Netlify Forms submission and notification email on
  production. Tests that care can configure the response status
  (`respondWith(500)`) or inspect what was sent (`lastSubmission()`).
- **`makeAxeBuilder`** — factory returning a pre-configured
  `AxeBuilder` scoped to WCAG 2.0/2.1/2.2 A+AA rules, per Playwright's
  documented axe-core integration pattern.

## Test categories & what they cover

| Suite           | Covers                                                                                                                         | Doesn't cover (and why)                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `smoke`         | All primary routes return 200 and render their heading/main content                                                            | Deep interaction — that's every other suite                                                                                     |
| `navigation`    | Desktop nav + active-page state, mobile hamburger menu, skip link, back-to-top                                                 | —                                                                                                                               |
| `forms`         | Contact form: required/email/minlength validation, honeypot, XSS-safe input, mocked success/error submission                   | Real submission delivery (deliberately never exercised — see `formSubmissionGuard`)                                             |
| `content`       | Blog pagination, tag filtering, post navigation, Pagefind search overlay (open/close/focus/type)                               | —                                                                                                                               |
| `preferences`   | Theme toggle + settings modal (High Contrast, Reduce Motion, Terminal Mode, Reset), all via `localStorage`                     | —                                                                                                                               |
| `accessibility` | axe WCAG 2.2 AA scans on every primary page + a blog post, keyboard tab order, dialog focus, `prefers-reduced-motion`          | Screen-reader-specific behavior (no automated SR testing tool in this stack)                                                    |
| `visual`        | Scoped screenshots: header (light/dark/mobile), footer skeleton, contact form, work grid, home hero                            | Full-page diffs (see [Why this architecture](#why-this-architecture))                                                           |
| `performance`   | Console errors, uncaught exceptions, failed first-party requests, DOMContentLoaded/load/LCP budgets, oversized resources       | True synthetic Core Web Vitals lab scoring (use Lighthouse/CrUX for that — this suite catches regressions, not absolute scores) |
| `security`      | Response security headers (CSP, HSTS, X-Frame-Options, …), tabnabbing protection on external links, 404 handling, cookie flags | Penetration testing / fuzzing (out of scope for a black-box E2E suite against someone's production site)                        |

## Known findings from building this suite

Building this framework against the real, live site surfaced genuine issues.
Rather than quietly working around them, they're tracked explicitly so they
stay visible and the suite still fails if they regress further or a _new_
issue of the same class appears:

- **`test-data/a11y-known-issues.ts`** — three axe rule IDs (`color-contrast`,
  `scrollable-region-focusable`, `aria-hidden-focus`) currently fail on the
  live site. `utils/a11y.ts` fails the test on anything _not_ in that list,
  and attaches the known ones to the report so they don't silently rot.
- **`tests/content/blog-search.spec.ts`** — `.search-overlay-header` ships
  with `display: none` in production CSS, so the search overlay's close (×)
  button is a real, permanently unreachable 0×0 element. Marked `test.fixme`
  with the root cause in a comment; users can still close the overlay via
  Escape or a backdrop click (both separately tested and passing).
- **`tests/accessibility/a11y.spec.ts`** — tabbing past the last item in the
  settings dialog briefly lands focus on `<body>` before the next Tab reaches
  the close button, instead of wrapping directly back into the dialog. Marked
  `test.fixme`.

Un-fixme / remove from the allowlist once the underlying site issue is fixed —
that's what turns "tracked debt" into "verified regression protection."

## Debugging

```bash
npx playwright test --debug              # Playwright Inspector, step through
npx playwright test --ui                 # interactive UI mode with time-travel
npx playwright show-trace test-results/.../trace.zip
```

Traces are captured `on-first-retry`, screenshots `only-on-failure`, video
`retain-on-failure` — all viewable in the HTML report (`npm run report`).

## CI

`.github/workflows/playwright.yml`:

- **Every PR**: lint + typecheck, then a fast `@smoke`-only run on chromium.
- **Push to `main`, nightly (03:17 UTC), and manual dispatch**: full
  regression across all 7 projects, sharded 4-way for wall-clock time, with a
  final job merging each shard's blob report into one HTML report artifact.
- Manual runs (`workflow_dispatch`) accept a `base_url` input to target a
  deploy preview instead of production.
- Playwright browser binaries are cached between runs keyed on
  `package-lock.json`.

## Repo tooling

- **Pre-commit hook** (husky + lint-staged, set up automatically by `npm
install` via the `prepare` script): runs `eslint --fix` + `prettier` on
  staged `.ts`/`.json`/`.md`/`.yml` files, then a full `tsc --noEmit`, before
  a commit is allowed through. Catches what CI would catch, locally and
  faster.
- **Dependabot** (`.github/dependabot.yml`): weekly PRs for npm dependencies
  (Playwright/axe-core grouped together, lint/format tooling grouped
  separately) and for the GitHub Actions used in the CI workflow itself.
- **Issue templates** (`.github/ISSUE_TEMPLATE/`): a structured form for
  reporting a real site defect this suite surfaced (references the test/rule
  that caught it, affected page, severity), and a separate one for reporting
  flakiness in the suite itself.

## Best practices this repo follows

- Accessible locators (`getByRole`/`getByLabel`/`getByText`) over CSS/XPath
  throughout.
- Page Object Model with shared chrome in `BasePage`, not copy-pasted per page.
- Tests never hardcode content that will drift (post counts, slugs) — they
  read it from the page.
- A dedicated fixture prevents any test from ever reaching the live form
  endpoint, rather than trusting every test author to remember to mock it.
- Cross-engine differences (WebKit's link-tabbing default, a `minlength`
  quirk in this Playwright build's WebKit) are asserted against `browserName`
  and documented inline, not silently deleted or globally disabled.
- Generous, documented timeouts/budgets in the performance suite — this
  targets a real external network, so the goal is catching gross regressions,
  not micro-benchmarking.

## Common mistakes / troubleshooting

- **"A snapshot doesn't exist" on `test:visual`**: expected on a clean
  checkout if `tests/visual/*-snapshots/` wasn't committed. Run
  `npm run test:visual:update` once to generate baselines, review the images,
  then commit them.
- **Flaky results only when running the full suite with many workers
  locally**: this project hits a real external site over the network: high
  local concurrency (`--workers` set high) can produce transient timeouts
  from resource contention on your machine, not from the site or the tests.
  CI's `retries: 2` absorbs this; locally, reduce `--workers` or retry the
  specific failing file.
- **A test passes alone but fails in the full run (or vice versa)**: same
  cause as above — verify with `npx playwright test <file> --workers=1`
  before assuming it's a real regression.
- **Contact form tests seem to "not submit anything"**: intentional — see
  `formSubmissionGuard` in [Fixtures](#fixtures). If you need to verify the
  _real_ Netlify endpoint end-to-end, do that manually and out-of-band; never
  remove the guard from the automated suite.
- **Adding a new page**: create a class extending `BasePage` in `pages/`,
  add a fixture for it in `fixtures/index.ts`, then write specs against the
  fixture rather than instantiating the page object directly in tests.
