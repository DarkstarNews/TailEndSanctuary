# Website Editor — Setup (for Ryan)

The `/editor` page lets Juanita, Ronni, and Jena change photos, words, dogs,
and founder bios themselves. Their changes become git commits to `main`, which
GitHub Pages redeploys automatically (~1 minute). This doc is the one-time
setup; after this it runs itself.

## How it fits together

```
tailendsanctuary.org/editor  (static page, this repo, editor/)
        │  shared password login
        ▼
Cloudflare Worker  (worker/, holds the GitHub token)
        │  applies the change to content/content.json,
        │  re-renders the HTML pages, commits to main
        ▼
GitHub Pages redeploys the site
```

- `content/content.json` — every editable word, photo, dog, and founder.
- `templates/*.html` — the pages with `{{placeholders}}` where content goes.
- `build.js` — regenerates the root HTML files (`node build.js`). Run it
  whenever **you** hand-edit a template or content.json. The Worker runs the
  same renderer (`worker/src/render.js`) when **they** publish.
- Editors' input is HTML-escaped at render time, so nothing they type can
  break the page structure.

**Rule of thumb from now on:** edit `templates/` and `content/content.json`,
not the root HTML files — the next editor publish would overwrite hand edits
to the root files. Run `node build.js` and commit both.

## One-time setup (~20 minutes)

### 1. Create a GitHub token for the Worker

GitHub → Settings → Developer settings → Fine-grained personal access tokens →
Generate new token:
- Repository access: **only** `RyanDavis23/TailEndSanctuary`
- Permissions: **Contents: Read and write** (nothing else)
- Expiration: 1 year (put a reminder in your calendar to rotate it)

### 2. Deploy the Worker

```bash
cd worker
npm install -g wrangler         # if you don't have it
wrangler login                  # opens browser, free Cloudflare account is fine
wrangler deploy                 # prints your worker URL, e.g. https://tailend-editor.ryan.workers.dev
wrangler secret put SITE_PASSWORD    # the password the ladies will type
wrangler secret put SESSION_SECRET   # paste output of: openssl rand -hex 32
wrangler secret put GITHUB_TOKEN     # the token from step 1
```

Pick a password that's easy to say over the phone and easy to type on an
iPad — a short phrase like `teddy loves naps` beats `X9$k2!`.

### 3. Point the editor at the Worker

Put the worker URL from step 2 into `editor/config.js`:

```js
window.EDITOR_API = 'https://tailend-editor.YOUR-SUBDOMAIN.workers.dev';
```

Commit and merge this branch to `main`. Once Pages deploys, the editor is
live at **https://tailendsanctuary.org/editor/**.

### 4. Test it yourself, then hand it over

Log in, change a word, check the site updates, use "Undo my last change".
Then send the ladies the guide (`EDITOR-GUIDE.md`) with the password filled in.

## Day-to-day

- **Seeing what they change:** every publish is a commit on `main` like
  `[site-editor] Juanita: Changed the photo: Big photo at the top of the Home page`,
  authored as "Juanita (via site editor)". Watch the repo
  (GitHub → Watch → All activity) to get an email per change.
- **Reverting something:** they have an "Undo my last change" button for the
  most recent change; anything older is a normal `git revert` for you.
- **Uploaded photos** land in `images/uploads/` (browser-resized to ≤1600px
  JPEG, so the repo won't bloat). Old replaced photos stay in the repo/history.
- **What they can't touch** (comes to you, on purpose): page structure, nav,
  footer, donate payment details/links, the Teddy video, CSS.

## Costs & limits

- Cloudflare Workers free tier: 100k requests/day — a few edits a week won't
  register.
- The shared password can be changed any time with
  `wrangler secret put SITE_PASSWORD` (existing logins stay valid up to 60
  days; also rotate SESSION_SECRET to force everyone to log in again).
