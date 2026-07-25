# Tail End Sanctuary — Developer Guide

Everything needed to take over and run **https://tailendsanctuary.org**.

---

## 1. What this site is

A **plain static website** — hand-written HTML and CSS. There is **no framework, no build step, no database, no server code**. If you can edit an HTML file, you can edit this site. Any developer (or a capable person with an AI assistant) can maintain it.

**Pages**
| File | Page |
|---|---|
| `index.html` | Home |
| `about.html` | About Us |
| `dogs.html` | Meet the Dogs |
| `get-involved.html` | Get Involved |
| `donate.html` | Donate |

**Stylesheets** — load in this order, later overrides earlier:
1. `style.css` — original base styles
2. `redesign.css` — the current design layer (**most active styling lives here**)

**Other**
- `images/` — all photos, logo, favicon, and the Teddy video
- `CNAME` — holds the custom domain (required by GitHub Pages; do not delete)
- `.nojekyll` — tells GitHub Pages to serve files as-is
- Each page has two small inline `<script>` blocks: a scroll-reveal animation and the newsletter form handler

---

## 2. How it's hosted (and how to publish changes)

Hosted free on **GitHub Pages**, served from the `main` branch, root folder, with HTTPS enforced.

**Publishing is just pushing to `main`:**
```bash
git add -A
git commit -m "describe the change"
git push origin main
```
GitHub rebuilds automatically; the live site updates in about a minute.

**To preview locally before publishing:**
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000

> **Tip:** image and video filenames stay the same when updated, so browsers cache them. After publishing, hard-refresh (**Ctrl/Cmd + Shift + R**) to see changes.

---

## 3. Branches

| Branch | What it is |
|---|---|
| `main` | **Live site.** Pushing here publishes. |
| `original-design` | The site's original design, before the 2026 redesign. A safety net — `git checkout original-design` to see/restore it. |
| `redesign-2026` | Snapshot of the redesign. |

---

## 4. Domain & DNS

The domain **tailendsanctuary.org** is registered at **GoDaddy**. Current DNS:

| Type | Name | Value | Purpose |
|---|---|---|---|
| A | `@` | `185.199.108.153` | GitHub Pages |
| A | `@` | `185.199.109.153` | GitHub Pages |
| A | `@` | `185.199.110.153` | GitHub Pages |
| A | `@` | `185.199.111.153` | GitHub Pages |
| CNAME | `www` | `ryandavis23.github.io.` | GitHub Pages |
| MX | `@` | `smtp.secureserver.net` | **Email — do not touch** |
| CNAME | `email`, `secureserver1._domainkey`, `secureserver2._domainkey` | (GoDaddy) | **Email — do not touch** |

> ⚠️ **The four `A` records are GitHub's shared IPs and stay the same for any owner. The `www` CNAME is account-specific — if the repository moves to a different GitHub account, change `www` to point to `THAT-ACCOUNT.github.io`.**
>
> ⚠️ **Never modify the MX or `_domainkey` records** — that would break the sanctuary's email.

---

## 5. Common edits

**Change wording** — open the page's `.html` and edit the text.

**Replace a photo** — put the new file in `images/`, then update the `src="..."` in the HTML. Keep photos under ~500 KB for fast loading:
```bash
sips -Z 1600 -s format jpeg -s formatOptions 85 big-photo.jpg --out images/new-photo.jpg
```

**Add a dog** — in `dogs.html`, copy an existing `<div class="card reveal">…</div>` block and change the image, name, and story.

**Change colors/spacing** — edit `redesign.css`. Brand colors are CSS variables near the top of `style.css`:
`--sage-dark:#4E5E46` (green) · `--cream:#F6F1E7` · `--terracotta:#B76E4A` (accent).

**Key CSS classes:** `.hero-ed` (page hero) · `.bare-media` (photo, no frame) · `.media-name` (name under a hero photo) · `.factsband` (green stats bar) · `.feature-row` (two-column section) · `.pullquote` · `.cards-grid` / `.card` (dog cards) · `.banner-sage` (green call-to-action).

---

## 6. Third-party services

| Service | What it does | Notes |
|---|---|---|
| **GitHub Pages** | Hosting | Free. Settings → Pages. |
| **Formspree** | Newsletter signup on Get Involved | Form ID is in `get-involved.html` (`formspree.io/f/…`). **This form belongs to the previous developer's account** — create a free Formspree form and replace the ID so submissions come to you. |
| **Stripe** | "Donate with Card" button | Sanctuary's own account. It's a payment link in `donate.html`. |
| **PayPal** | "Donate with PayPal" button | Sanctuary's own account. Form action in `donate.html`. |

> **Recurring donations** are configured **inside the Stripe and PayPal dashboards** (create a recurring/subscription payment link), then paste the new link into `donate.html`. It cannot be done in the website code alone.

---

## 7. Images & video notes

- The logo (`images/logo-full.png`) is a transparent PNG. The footer version is flipped white with CSS (`filter: brightness(0) invert(1)`) — so **keep it transparent** if you replace it.
- The Teddy video (`images/teddy.mp4`) is ~10 MB, 93 seconds, **with sound**. It uses `preload="metadata"` so it doesn't slow the page down — it only downloads when played.
- `images/teddy-poster.jpg` is the still shown before the video plays.

---

## 8. Taking ownership

To get full control, the repository should be **transferred** to your GitHub account (GitHub: repo → Settings → General → Danger Zone → *Transfer ownership*). After the transfer:

1. In the new account: **Settings → Pages** → confirm source is `main` / `/ (root)`, set the custom domain to `tailendsanctuary.org`, and enable **Enforce HTTPS**.
2. In GoDaddy DNS: change the **`www` CNAME** to `YOUR-ACCOUNT.github.io` (leave the four `A` records and all email records alone).
3. Create your own **Formspree** form and swap the ID in `get-involved.html`.

Alternatively, you can download the files and host them anywhere that serves static sites (Netlify, Cloudflare Pages, or any web host) — just point the DNS accordingly.
