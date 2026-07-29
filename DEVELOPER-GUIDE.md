# Tail End Sanctuary — Handoff Guide for the New Maintainer

**Live site:** https://tailendsanctuary.org
**Repository:** `TailEndSanctuary` (being transferred to you on GitHub)

Welcome — and thank you for taking this on. This document is everything you need to run this website. Read it top to bottom once and you'll know where every single thing lives.

---

## 0. How to use this document

**If you write code:** read it straight through. It's ordered from "what is this" → "how do I change something" → "how do I take ownership."

**If you'd rather work with an AI assistant (Claude, ChatGPT, Copilot, Cursor):** this file is written to be dropped straight into one. Download the project, then start a conversation like this:

> I've taken over a small charity website. Here is the handoff guide — read it, then help me make changes.
> *(attach this file, plus the HTML/CSS files you want to change)*

Then ask for what you want in plain language, e.g. *"Add a new dog named Rosa to the Meet the Dogs page using the story below and the photo rosa.jpg"*. The site is deliberately simple — plain HTML and CSS — which is exactly the kind of thing AI assistants handle very reliably.

---

## 1. The 60-second version

- It's a **plain static website**: hand-written HTML and CSS. **No** React, no WordPress, no database, no server code, no build step, no `npm install`.
- **What you see is what runs.** Editing `index.html` edits the homepage. That's it.
- It's hosted **free on GitHub Pages**. **Pushing to the `main` branch publishes the site**, live in about a minute.
- Five pages, two stylesheets, one folder of images. Under 1,000 lines of HTML total.

---

## 2. What you're getting — access checklist

Ask the outgoing developer (Ryan) and the sanctuary for these:

| # | Item | Who provides it | Notes |
|---|---|---|---|
| 1 | **The GitHub repository** | Ryan transfers it to your GitHub account | This is the site itself. See §12. |
| 2 | **GoDaddy account access** (domain/DNS) | The sanctuary | Needed for the one DNS change in §12, and any future domain work. |
| 3 | **Stripe account access** | The sanctuary (Jena) | For the donate button + setting up recurring gifts. |
| 4 | **PayPal account access** | The sanctuary (Jena) | Same. |
| 5 | ~~Formspree account~~ | **Don't ask — make your own** | The current newsletter form is on Ryan's personal account. See §11. |

> **You do not need any passwords from Ryan.** Everything transfers by account, not by shared credentials. If anyone offers to email you passwords, decline — use proper account transfers and invites instead.

---

## 3. How the site is built

```
Browser loads index.html
      ↓
  style.css      ← original base styles (1,561 lines) — colors, buttons, nav, footer, cards
      ↓
  redesign.css   ← current design layer (188 lines) — LOADED SECOND, so it WINS
      ↓
  a few inline <script> blocks at the bottom of each page
```

**Important:** `redesign.css` loads *after* `style.css` and overrides it. **Most current design decisions live in `redesign.css`.** If you change something in `style.css` and nothing happens, it's because `redesign.css` is overriding it — look there.

The only JavaScript is two tiny inline blocks at the bottom of the pages:
1. **Scroll reveal** — fades sections in as you scroll (anything with `class="reveal"`).
2. **Newsletter form** — on `get-involved.html` only; submits without leaving the page.

There is no other JS, no jQuery, no dependencies.

---

## 4. File map — where everything is

### Live pages (these are the website)
| File | Page | ~Lines |
|---|---|---|
| `index.html` | Home | 184 |
| `about.html` | About Us | 174 |
| `dogs.html` | Meet the Dogs | 196 |
| `get-involved.html` | Get Involved | 172 |
| `donate.html` | Donate | 168 |

### Styles
| File | Role |
|---|---|
| `style.css` | Base styles. Brand colors are CSS variables at the very top. |
| `redesign.css` | **Current design layer — start here.** Overrides `style.css`. |

### Config (don't delete these)
| File | Why it matters |
|---|---|
| `CNAME` | Contains `tailendsanctuary.org`. **Deleting it breaks the custom domain.** |
| `.nojekyll` | Tells GitHub Pages to serve files as-is. |
| `.gitignore` | Keeps working files out of the repo. |

### Images actually used by the live site
```
images/
├── logo-full.png          ← the logo (transparent PNG) — used in nav AND footer on every page
├── favicon-32.png         ← browser tab icon
├── apple-touch-icon.png   ← icon when saved to a phone home screen
├── home-hero.jpg          ← Home hero photo ("Mamá")
├── about-cindy.jpg        ← About hero photo ("Cindy")
├── senta.jpg              ← Get Involved hero photo ("Senta")
├── donate.jpg             ← Donate hero photo ("Carolyn")
├── teddy.mp4              ← Teddy video, 93s, ~10 MB, HAS SOUND
├── teddy-poster.jpg       ← still image shown before the video plays
├── dogs/
│   ├── pugsley-2026.jpg   ← Meet the Dogs hero ("Pugsley, our blind senior")
│   ├── teddy-2026.jpg     ├─┐
│   ├── nita.jpg           │ │
│   ├── valentino-2026.jpg │ ├─ the six dog cards on dogs.html
│   ├── coffee-2026.jpg    │ │
│   ├── benito.png         │ │
│   └── chester.jpeg       ─┘
└── founders/              ← the three founder portraits on about.html
```

> ⚠️ **Naming tip:** files ending in `-2026` are the current photos. Older files with the same dog's name (e.g. `teddy.jpeg`, `valentino.jpeg`) are **outdated leftovers** — see §14.

---

## 5. Page anatomy

Every page has the same skeleton, so once you learn one you know all five:

```html
<head>   … stylesheets + favicon …            </head>
<nav>    … logo + menu + Donate button …      </nav>   ← identical on all 5 pages
<main>
  <section class="hero-ed">  … page title + hero photo …  </section>
  … content sections …
</main>
<footer> … logo + Explore + Support + Connect … </footer>  ← identical on all 5 pages
<script> … scroll reveal … </script>
```

> **The nav and footer are copy-pasted into each page** (there are no templates/includes in plain HTML). **If you change the menu or footer, you must make the same edit in all five files.** This is the single easiest thing to get wrong.

**Section-by-section:**

- **Home** — hero (Mamá) → green facts band (Since 2022 · 15 dogs · For life · Mexico) → mission → Teddy video feature → pull-quote → "Seen at last" feature → green call-to-action.
- **About** — hero (Cindy) → "How Tail End began" story → green pull-quote → three founders → green call-to-action.
- **Meet the Dogs** — hero (Pugsley) → intro line → 6 dog cards → green call-to-action (includes the tailendplanning.org message).
- **Get Involved** — hero (Senta) → 4 action cards (Donate / Give Monthly / Spread the Word / newsletter signup) → green call-to-action.
- **Donate** — hero (Carolyn) → "Where your gift goes" (3 cards) → Ways to Give (Stripe, PayPal, wire-transfer contact note).

---

## 6. The design system

**Brand colors** — CSS variables at the top of `style.css`:
```css
--sage-dark: #4E5E46;   /* primary green — buttons, headings, green bands */
--sage:      #8B9A7B;   /* lighter green */
--cream:     #F6F1E7;   /* page background */
--cream-dark:#EBE2D0;   /* alternating section background */
--terracotta:#B76E4A;   /* small accent — the little uppercase labels */
--text:      #3A352E;
```

**Fonts** — Cormorant Garamond (headings, serif) + Inter (body). Loaded from Google Fonts in each page's `<head>`.

**Classes you'll actually use** (defined in `redesign.css`):

| Class | What it does |
|---|---|
| `.hero-ed` | The top section of a page (title on one side, photo on the other) |
| `.bare-media` | A photo with rounded corners + soft shadow, **no frame** |
| `.bare-figure` / `.media-name` | Wrapper + the dog's name in italics under a hero photo |
| `.eyebrow` | Small uppercase terracotta label above a heading |
| `.factsband` | The green statistics bar on the Home page |
| `.feature-row` | Two-column section (photo + text). Add `reverse` to flip sides |
| `.pullquote` | Large italic quote with a green left bar |
| `.cards-grid` / `.card` | The dog card grid |
| `.giftgrid` / `.gift` | "Where your gift goes" cards on Donate |
| `.action-cards` / `.action-card` | Get Involved cards |
| `.banner-sage` | Full-width green call-to-action band |
| `.btn btn-donate` | Green button |
| `.reveal` | Fades in on scroll — add to any section |
| `.method-card` | A donation method card (add `featured` to make it full-width) |

---

## 7. How to publish a change

**Preview locally first** (from the project folder):
```bash
python3 -m http.server 8000
```
Open http://localhost:8000 — that's the real site running on your machine.

**Publish:**
```bash
git add -A
git commit -m "short description of what changed"
git push origin main
```
GitHub rebuilds automatically. Live in ~1 minute.

> **Always hard-refresh after publishing** — **Ctrl/Cmd + Shift + R**. Photos and the video keep the same filenames, so browsers aggressively cache them. More than one person has thought a change "didn't work" when it was just a cached page.

---

## 8. Recipes — common tasks

### Change any wording
Open the page, find the text, edit it. That's genuinely all.

### Replace a photo
1. Resize it first (keep photos under ~500 KB — big phone photos will make the site slow):
   ```bash
   # macOS
   sips -Z 1600 -s format jpeg -s formatOptions 85 huge-photo.jpg --out images/new-photo.jpg
   ```
   (No Mac? Use https://squoosh.app — free, in-browser.)
2. Put it in `images/`
3. Update the `src="..."` in the HTML.

### Add a new dog
In `dogs.html`, copy one whole `<div class="card reveal">…</div>` block, paste it after the last one, then change the image, name, and story:
```html
<div class="card reveal">
  <div class="card-image">
    <img src="images/dogs/rosa.jpg" alt="Rosa">
  </div>
  <div class="card-body">
    <div class="card-title"><h3>Rosa</h3></div>
    <p>Rosa's story goes here.</p>
  </div>
</div>
```

### Remove a dog
Delete that dog's entire `<div class="card reveal">…</div>` block.

### Change a hero photo and its name caption
```html
<figure class="bare-figure" style="max-width:480px;">
  <img class="bare-media" src="images/NEW-PHOTO.jpg" width="1400" height="1432" alt="Name, a senior dog at Tail End Sanctuary">
  <figcaption class="media-name">Name</figcaption>
</figure>
```
Update `width` and `height` to the real pixel dimensions — that stops the page from "jumping" while the image loads.

### Add the social media links (currently a placeholder)
In `get-involved.html`, find:
```html
<span class="btn btn-muted">Social Links Coming Soon</span>
```
Replace with:
```html
<a href="https://facebook.com/YOURPAGE" class="btn btn-donate" target="_blank" rel="noopener">Facebook</a>
<a href="https://instagram.com/YOURPAGE" class="btn btn-donate" target="_blank" rel="noopener">Instagram</a>
```

### Update the donation buttons (e.g. after setting up recurring giving)
In `donate.html`:
- **Stripe** is a plain link — swap the URL:
  ```html
  <a href="https://donate.stripe.com/XXXXXXXX" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">Donate with Card</a>
  ```
- **PayPal** is a small form — swap the `action` URL:
  ```html
  <form action="https://www.paypal.com/ncp/payment/XXXXXXXX" method="post" target="_blank">
    <button type="submit" class="btn btn-secondary">Donate with PayPal</button>
  </form>
  ```

### Change the menu or footer
Make the identical edit in **all five** HTML files.

---

## 9. Images & video — rules that matter

- **The logo (`logo-full.png`) must stay a transparent PNG.** The footer version is turned white by CSS (`filter: brightness(0) invert(1)`). If you replace it with a logo that has a white background, the footer will show an ugly white box. (There's also a known quirk: the original logo file the designer supplied had thin black bars baked into its edges — they were cropped out. If you get a fresh export, check the edges.)
- **The Teddy video** (`images/teddy.mp4`) is ~10 MB, 93 seconds, portrait, **and it has sound** — that was specifically requested, so don't add `muted` back to the `<video>` tag. It uses `preload="metadata"`, so it doesn't slow the page down; it only downloads when someone presses play.
- **`teddy-poster.jpg`** is the still frame shown before playback. If you replace the video, regenerate the poster:
  ```bash
  ffmpeg -ss 1 -i images/teddy.mp4 -frames:v 1 -q:v 3 images/teddy-poster.jpg
  ```
- Keep photos **under ~500 KB**. Many supporters are on mobile connections.

---

## 10. Domain & DNS

Domain **tailendsanctuary.org** is registered at **GoDaddy**.

| Type | Name | Value | Purpose |
|---|---|---|---|
| A | `@` | `185.199.108.153` | GitHub Pages |
| A | `@` | `185.199.109.153` | GitHub Pages |
| A | `@` | `185.199.110.153` | GitHub Pages |
| A | `@` | `185.199.111.153` | GitHub Pages |
| CNAME | `www` | `<github-account>.github.io.` | GitHub Pages |
| MX | `@` | `smtp.secureserver.net` | **Email** |
| CNAME | `email`, `secureserver1._domainkey`, `secureserver2._domainkey` | GoDaddy | **Email** |

> 🚨 **Never touch the MX or `_domainkey` records.** Those run `info@tailendsanctuary.org`. Changing them takes down the sanctuary's email.
>
> ℹ️ The four `A` records are GitHub's shared IPs — the same for everyone, so they never change. **The `www` CNAME is account-specific and must be updated when the repo moves to your account** (see §12).

---

## 11. Third-party services

| Service | What it powers | What you need to know |
|---|---|---|
| **GitHub Pages** | Hosting | Free. Repo → Settings → Pages. |
| **Formspree** | Newsletter signup (Get Involved) | ⚠️ The form ID currently in `get-involved.html` belongs to **the previous developer's personal account**. Create your own free form at formspree.io and replace the ID in the form's `action="https://formspree.io/f/XXXXXX"` — otherwise signups go to someone who's no longer involved. **Do this early.** |
| **Stripe** | "Donate with Card" | The sanctuary's own account. The site only contains a payment link. |
| **PayPal** | "Donate with PayPal" | The sanctuary's own account. The site only contains a payment link. |
| **Google Fonts** | Typefaces | Loaded via a `<link>` in each page. Nothing to manage. |

> **Recurring donations cannot be built in the website code.** You create a recurring/subscription payment link **inside the Stripe and PayPal dashboards**, then paste the resulting links into `donate.html` (see §8).

---

## 12. Taking ownership — do these in order

**Step 1 — Accept the repository transfer.** Ryan transfers it to your GitHub account; you'll get an email to accept. *(You need a free GitHub account: github.com)*

**Step 2 — Turn hosting back on.** In your copy of the repo: **Settings → Pages**
- Source: branch `main`, folder `/ (root)`
- Custom domain: `tailendsanctuary.org`
- Tick **Enforce HTTPS** (may take a few minutes to become available while the certificate is issued)

**Step 3 — Update one DNS record.** In GoDaddy → DNS: change the **`www` CNAME** value to `YOUR-GITHUB-USERNAME.github.io`. Leave the four `A` records and every email record exactly as they are.

**Step 4 — Take over the newsletter form.** Create your own Formspree form and swap the ID in `get-involved.html` (§11).

**Step 5 — Confirm it's working.** Visit https://tailendsanctuary.org and https://www.tailendsanctuary.org, check the padlock icon, and submit a test signup.

> **Prefer to host elsewhere?** You're not locked in. The whole site is static files — you can drag the folder onto Netlify, Cloudflare Pages, or any web host, and point the DNS there instead.

---

## 13. Outstanding requests (as of handoff)

These were requested by the sanctuary but are **not done yet** — they need account access you'll now have:

1. **Recurring donations** for Stripe and PayPal — create recurring payment links in those dashboards, then update `donate.html`.
2. **A smoother wire / electronic transfer process** — the Donate page currently directs people to email `info@tailendsanctuary.org`. This was intentional: the 501(c)(3) name and bank account names are being changed, so the old account details were removed.
3. **Social media links** — Facebook and Instagram are being set up; the Get Involved page shows a "Social Links Coming Soon" placeholder until then (§8).
4. **Formspree ownership** — see §11.

---

## 14. Legacy files — safe to ignore (or delete)

The repo carries some history. **None of the following is used by the live site**, so don't be confused by it:

- **Old pages:** `about-old.html`, `involved.html`, `review-mockups.html`
- **Old notes:** `BUILD-PLAN.md`, `DEPLOYMENT_COMPLETE.md`, `REBUILD_SUMMARY.md`, `REVIEW-NOTES.md`, `QA-REVIEW-APR15.md`, `EDIT-REQUESTS-2026-06-18.md`
- **Old logos:** `logo.png`, `logo.jpg`, `logo-clean.png`, `logo-original-screenshot.png`, `Tailend Logo.png`, `images/logo-mark.png`
- **Old design mockups:** the `mockups/` folder
- **Old script:** `remove-emojis.sh`
- **Superseded photos (~14 MB):** `images/dogs/teddy.jpeg`, `teddy-home.jpg`, `teddy-new.jpeg`, `teddy-cream-candidate-v1.png`, `teddy-cream-candidate-v2.png`, `valentino.jpeg`, `coffee.jpeg`, `pugsley.jpeg`, `ringo.jpeg`, `stevie.jpeg`, `images/get-involved.jpeg`, `images/founders/juanita-photo.png`, `juanita-new.jpeg`, `ronni-photo.jpeg`, `images/favicon-512.png`

Deleting them is safe and would slim the repo by ~14 MB — but **verify with `git grep` first**, and it's fine to just leave them alone.

---

## 15. Gotchas (the things that will actually bite you)

1. **The nav and footer are duplicated in all 5 files.** Change one, change all five.
2. **`redesign.css` beats `style.css`.** Edit the base file and see no change? Look in `redesign.css`.
3. **Browser caching.** Always hard-refresh (**Ctrl/Cmd + Shift + R**) after publishing. Or rename the image file to force a refresh for visitors.
4. **`CNAME` must stay in the repo.** If it disappears, the custom domain drops and the site falls back to a github.io address.
5. **Don't add `muted` to the Teddy video.** The sound was specifically requested.
6. **Sections start invisible** (`class="reveal"`) and fade in on scroll. If a new section seems blank in a screenshot tool, that's why — it appears when scrolled into view. Real visitors see it normally.
7. **Never publish bank details, passwords, or API keys** in the HTML — everything in this repo is publicly visible on the internet.

---

## 16. If something breaks — rollback

Every published version is saved in git history. To undo the most recent publish:
```bash
git revert HEAD
git push origin main
```

There are also two reference branches:
| Branch | What it holds |
|---|---|
| `main` | The live site |
| `original-design` | The site's **original** design, before the 2026 redesign — a safety net |
| `redesign-2026` | Snapshot of the redesign |

To look at an old version without changing anything: `git checkout original-design` (then `git checkout main` to come back).

---

## 17. Quick reference

| | |
|---|---|
| **Live site** | https://tailendsanctuary.org |
| **Publish a change** | `git push origin main` |
| **Preview locally** | `python3 -m http.server 8000` |
| **Contact email on the site** | info@tailendsanctuary.org |
| **Sanctuary founders** | Juanita Crampton, Ronni Coppola, Jena Marie Olio |
| **Hosting** | GitHub Pages (free) |
| **Registrar / DNS** | GoDaddy |
| **Founded / dogs helped** | 2022 · 15 dogs (shown on the Home page — update as this grows) |

---

*The site is small, sturdy, and deliberately boring under the hood — that's what makes it easy to hand over. Good luck, and thank you for looking after it.*

*every tail deserves a happy ending* 🐾
