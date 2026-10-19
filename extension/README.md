# Pursuit browser extension

Log job applications to Pursuit straight from the job page — or get a prompt right after you
submit on Greenhouse, Lever, Ashby or Workday. Built with [WXT](https://wxt.dev) (Manifest V3,
React, TypeScript, Tailwind).

## How it works

| Part | File | What it does |
|---|---|---|
| Popup | `entrypoints/popup/` | The window from the toolbar icon: a pre-filled form to log the current job. |
| Extractor | `entrypoints/extract.ts`, `lib/extract.ts` | Injected into the active tab on click (`activeTab`) to read company, role and link. |
| Background | `entrypoints/background.ts` | Registers content scripts, opens the Connect page on install, saves on behalf of the in-page prompt. |
| Bridge | `entrypoints/pursuit-bridge.content.ts` | Runs on Pursuit only; receives the token from the Connect page. |
| Job sites | `entrypoints/job-sites.content/` | Optional. Detects "application submitted" and shows the in-page prompt. |

Details are read in this order: schema.org `JobPosting` JSON-LD → known job-site URLs →
page title/meta tags. Everything stays editable before saving.

**Permissions.** At install: `storage`, `activeTab`, `scripting` and your Pursuit site only.
Job-board sites are optional and requested only when you turn on *Auto-prompt* — see
[Permissions, explained](#permissions-explained).

**Sign-in.** The extension uses a personal access token from Pursuit's `/extension/connect`
page (stored hashed on the server, revocable from your profile). It can log and look up
applications — it can't export data, delete the account or create more tokens.

## Permissions, explained

| Permission | When | Why |
|---|---|---|
| `activeTab` | Install (no warning) | Read the job page you're on, only at the moment you click the Pursuit icon. |
| `scripting` | Install | Inject the code that reads that page, and register the optional job-site script. |
| `storage` | Install | Keep your connection token and the auto-prompt setting. |
| Your Pursuit site | Install | Save applications to your account; receive the token from the Connect page. |
| Job-board sites | Only if you turn on **Auto-prompt** | Notice the "application submitted" moment and offer to log it. |

### The job-board permission

Turning on auto-prompt makes Chrome ask to **"Read and change your data"** on:

- `job-boards.greenhouse.io`, `job-boards.eu.greenhouse.io`, `boards.greenhouse.io`
- `jobs.lever.co`, `jobs.eu.lever.co`
- `jobs.ashbyhq.com`
- `*.myworkdayjobs.com` (Workday gives each company its own subdomain)

Chrome uses that wording for **any** extension that runs on a site — there's no read-only
version of this permission. Here's what Pursuit actually does there:

- **Reads** the page address, the job's title and company (from the page heading or the
  site's structured job data), and the visible page text — to spot "Thank you for applying" or
  "Application submitted". It does **not** read what you type into application forms.
- **Changes** one thing: it adds a small "Log to Pursuit?" card in the bottom-right corner after
  you submit. The card lives in its own Shadow DOM (the site can't style it, it can't affect
  the site) and goes away when dismissed. It never edits, fills, clicks or submits anything.
- **Sends** nothing on its own. Only when you click **Log to Pursuit** does it send the company,
  role and job link — to your own Pursuit account, nowhere else.

The access is scoped to the job-board subdomains above — not the rest of those companies'
websites — and can be switched off any time from the popup (which also gives the permission
back to Chrome).

**If you click Deny,** everything else keeps working: the toolbar button reads the page you're
on through `activeTab`, which needs no permission prompt.

The list lives in [`lib/job-sites.ts`](lib/job-sites.ts) (used by both the manifest and the
runtime code); `lib/job-sites.test.ts` checks it covers the supported job pages and nothing
broader.

## Develop

```bash
cd extension
cp .env.example .env        # WXT_PURSUIT_URL=http://localhost:5173 for local Pursuit
npm install
npm run dev                 # opens Chrome with the extension loaded, reloads on save
```

Run Pursuit locally too (backend + `npm run dev` in `frontend/`). On first install the
extension opens the Connect page — sign in and click **Connect extension**.

Manual loading instead of `npm run dev`: `npm run build`, open `chrome://extensions`, turn on
**Developer mode**, click **Load unpacked** and pick `extension/.output/chrome-mv3`.

```bash
npm test          # unit tests for extraction and submission detection
npm run typecheck
```

## Build for the Chrome Web Store

```bash
WXT_PURSUIT_URL=https://your-pursuit-domain npm run zip
# → .output/pursuit-extension-<version>-chrome.zip
```

The URL is baked into the build (API calls and the Connect page), so always zip with your
production Pursuit URL. Bump `version` in `package.json` for every update.

## Publish

1. **Developer account** — sign in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole),
   pay the one-time US$5 registration fee and turn on 2-step verification.
2. **New item** → upload the zip.
3. **Store listing** — copy the texts from [`STORE_LISTING.md`](STORE_LISTING.md); upload the
   128×128 icon (`public/icon/128.png`) and at least one 1280×800 screenshot.
4. **Privacy practices** — single purpose, permission justifications and data disclosures are
   in `STORE_LISTING.md`; the privacy policy URL is `https://your-pursuit-domain/privacy`.
5. **Distribution** — start with **Unlisted** (installable by link) and switch to **Public** later.
6. **Submit for review.** Typically a few days; minimal permissions keep it quick.
7. After approval, add the store link to the README. Updates: bump the version, zip, upload.
