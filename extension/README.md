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
The four job-site hosts are optional and requested only when you turn on *Auto-prompt*.

**Sign-in.** The extension uses a personal access token from Pursuit's `/extension/connect`
page (stored hashed on the server, revocable from your profile). It can log and look up
applications — it can't export data, delete the account or create more tokens.

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
