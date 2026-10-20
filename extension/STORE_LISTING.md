# Chrome Web Store listing — Pursuit

Copy these into the Developer Dashboard. Replace `your-pursuit-domain` with your real URL.

## Store listing

**Name:** Pursuit — Job application tracker

**Summary (max 132 characters):**
Log job applications to Pursuit straight from the job page, with follow-up reminders and a nudge right after you apply.

**Description:**
Pursuit keeps your job search in one calm pipeline. This extension saves you from logging
every application by hand.

• One click on any job page — company, role and link are filled in for you; review and save.
• Optional auto-prompt — after you submit on Greenhouse, Lever, Ashby or Workday, a small card
  offers to log the application with a follow-up reminder.
• Duplicate check — warns you if that job is already in your pipeline.
• Private by design — nothing is saved without your click, details go only to your own Pursuit
  account, and you can disconnect the extension any time.

Requires a free Pursuit account (sign in with Google at your-pursuit-domain).

**Category:** Productivity → Workflow & Planning · **Language:** English

**Screenshots** (1280×800, 24-bit PNG, in [`store-assets/`](store-assets/) — upload in this order):

1. `1-log-in-one-click.png` — the popup filled in from a job posting
2. `2-prompt-after-applying.png` — the auto-prompt on a confirmation page
3. `3-no-duplicates.png` — the duplicate warning
4. `4-your-pipeline.png` — the saved job in the Pursuit pipeline
5. `5-connect-once.png` — the one-click Connect page

They show a fictional company (Fernwood) and the demo account, so no real applications appear.

**Small promo tile** (440×280): `store-assets/promo-tile-440x280.png`

**Marquee promo tile** (1400×560): `store-assets/marquee-1400x560.png`

## Privacy practices

**Single purpose:**
Save job applications the user is viewing or has just submitted to the user's Pursuit account.

**Permission justifications:**
- `activeTab` — read the company, role and link of the job page the user is on, only when they
  click the extension icon.
- `scripting` — inject the code that reads those details into that tab, and register the
  optional job-site script once the user enables auto-prompt.
- `storage` — keep the user's Pursuit connection token and the auto-prompt setting.
- Host permission for `your-pursuit-domain` — send saved applications to the user's Pursuit
  account and receive the connection token from Pursuit's Connect page.
- Optional host permissions (`job-boards.greenhouse.io`, `job-boards.eu.greenhouse.io`,
  `boards.greenhouse.io`, `jobs.lever.co`, `jobs.eu.lever.co`, `jobs.ashbyhq.com`,
  `*.myworkdayjobs.com`) — requested only if the user turns on auto-prompt. Used to detect the
  "application submitted" confirmation on these job-board pages and show a small "Log to
  Pursuit?" card. The extension doesn't read form inputs, doesn't modify the page beyond adding
  that card, and sends nothing unless the user clicks to log the application.

**Remote code:** No, the extension does not use remote code.

**Data usage disclosures — collected:**
- *Website content*: job title, company name and job posting URL from the job page, only when
  the user chooses to save it.
- *Authentication information*: a Pursuit access token, stored locally to connect to the
  user's account.

**Certifications (all true):** not sold to third parties; not used or transferred for purposes
unrelated to the item's single purpose; not used to determine creditworthiness or for lending.

**Privacy policy URL:** https://your-pursuit-domain/privacy
