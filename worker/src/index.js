// Tail End Sanctuary — editor backend.
//
// A small Cloudflare Worker that sits between the /editor page and GitHub.
// It holds the GitHub token (the browser never sees it), checks the shared
// password, applies content changes, re-renders the HTML pages, and commits
// everything to the repository — which makes GitHub Pages redeploy the site.
//
// Endpoints (all JSON):
//   POST /api/login        {password}                    -> {token}
//   GET  /api/state                                      -> {content}
//   GET  /api/last-change                                -> {undoable, description}
//   POST /api/publish      {editor, summary, ops, images} -> {ok}
//   POST /api/undo         {editor}                       -> {ok, description}
//
// Required secrets (wrangler secret put ...):
//   SITE_PASSWORD   shared password the editors type in
//   SESSION_SECRET  random string used to sign login tokens
//   GITHUB_TOKEN    fine-grained PAT with Contents read/write on the repo
// Vars (wrangler.toml): GITHUB_REPO, GITHUB_BRANCH, ALLOWED_ORIGINS

import { renderSite, PAGE_TEMPLATES } from './render.js';

const TOKEN_TTL_DAYS = 60;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // post-resize images are ~300 KB; this is a hard cap
const COMMIT_TAG = '[site-editor]';

// Which parts of content.json the editor may touch. Segments are checked one
// by one: a literal name, a number (array index), or "*" for any object key.
const ALLOWED_OP_PATHS = [
  /^site\.logo$/,
  /^(home|about|dogsPage|donate|getInvolved)\.[A-Za-z0-9]+$/,
  /^(home|about|dogsPage|donate|getInvolved)\.[A-Za-z0-9]+\.(src|width|height|alt)$/,
  /^home\.facts\.\d+\.(fig|lbl)$/,
  /^(dogs|founders)$/,
  /^(dogs|founders)\.\d+$/,
  /^(dogs|founders)\.\d+\.(name|meta|story|role)$/,
  /^(dogs|founders)\.\d+\.photo$/,
  /^(dogs|founders)\.\d+\.photo\.(src|alt)$/,
];
const ALLOWED_IMAGE_PATH = /^images\/uploads\/[a-z0-9][a-z0-9-]{0,80}\.(jpg|jpeg|png)$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (url.pathname === '/api/login' && request.method === 'POST') {
        return json(await login(request, env), cors);
      }

      // Everything below requires a valid token.
      const auth = request.headers.get('Authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (!(await verifyToken(token, env))) {
        return json({ error: 'not-logged-in' }, cors, 401);
      }

      if (url.pathname === '/api/state' && request.method === 'GET') {
        const content = await ghJson(env, `contents/content/content.json?ref=${env.GITHUB_BRANCH}`);
        return json({ content: JSON.parse(fromBase64(content.content)) }, cors);
      }
      if (url.pathname === '/api/last-change' && request.method === 'GET') {
        return json(await lastChange(env), cors);
      }
      if (url.pathname === '/api/publish' && request.method === 'POST') {
        return json(await publish(await request.json(), env), cors);
      }
      if (url.pathname === '/api/undo' && request.method === 'POST') {
        return json(await undo(await request.json(), env), cors);
      }
      return json({ error: 'not-found' }, cors, 404);
    } catch (err) {
      console.error(err.stack || String(err));
      return json({ error: 'server-error', detail: String(err.message || err) }, cors, 500);
    }
  },
};

// ---------------------------------------------------------------- auth

async function login(request, env) {
  const { password } = await request.json();
  const ok =
    typeof password === 'string' &&
    (await timingSafeEqual(password.trim(), env.SITE_PASSWORD));
  if (!ok) {
    // A soft delay blunts brute-force guessing without hurting real users.
    await new Promise((r) => setTimeout(r, 800));
    return { error: 'wrong-password' };
  }
  const expires = Date.now() + TOKEN_TTL_DAYS * 24 * 3600 * 1000;
  return { token: `${expires}.${await hmac(String(expires), env)}` };
}

async function verifyToken(token, env) {
  const [expires, sig] = token.split('.');
  if (!expires || !sig) return false;
  if (Number(expires) < Date.now()) return false;
  return timingSafeEqual(sig, await hmac(expires, env));
}

async function hmac(message, env) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function timingSafeEqual(a, b) {
  const [ha, hb] = [await sha256(a), await sha256(b)];
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

async function sha256(s) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}

// ---------------------------------------------------------------- publish

async function publish(body, env) {
  const { editor, summary, ops = [], images = [] } = body;
  if (typeof editor !== 'string' || !editor.trim() || editor.length > 60) {
    return { error: 'bad-editor' };
  }
  if (typeof summary !== 'string' || !summary.trim() || summary.length > 200) {
    return { error: 'bad-summary' };
  }
  if (!ops.length) return { error: 'no-changes' };

  for (const op of ops) {
    if (!isAllowedOp(op)) return { error: 'bad-change', detail: JSON.stringify(op).slice(0, 200) };
  }
  for (const img of images) {
    if (!ALLOWED_IMAGE_PATH.test(img.path || '')) return { error: 'bad-image-path' };
    if (typeof img.base64 !== 'string' || img.base64.length > MAX_IMAGE_BYTES * 1.4) {
      return { error: 'image-too-big' };
    }
  }

  // Always start from the freshest content so two editors working the same
  // afternoon never overwrite each other's fields.
  const head = await ghJson(env, `git/ref/heads/${env.GITHUB_BRANCH}`);
  const headSha = head.object.sha;
  const contentFile = await ghJson(env, `contents/content/content.json?ref=${headSha}`);
  const content = JSON.parse(fromBase64(contentFile.content));

  for (const op of ops) applyOp(content, op);

  // Fetch templates at publish time so Ryan's template edits are always used.
  const templates = {};
  for (const [page, path] of Object.entries(PAGE_TEMPLATES)) {
    const f = await ghJson(env, `contents/${path}?ref=${headSha}`);
    templates[page] = fromBase64(f.content);
  }
  const pages = renderSite(templates, content);

  // Build one commit: content.json + all rendered pages + any new images.
  const blobs = [
    { path: 'content/content.json', content: JSON.stringify(content, null, 2) + '\n' },
    ...Object.entries(pages).map(([path, html]) => ({ path, content: html })),
  ];
  const tree = [];
  for (const b of blobs) {
    const blob = await ghJson(env, 'git/blobs', { content: b.content, encoding: 'utf-8' });
    tree.push({ path: b.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  for (const img of images) {
    const blob = await ghJson(env, 'git/blobs', { content: img.base64, encoding: 'base64' });
    tree.push({ path: img.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const headCommit = await ghJson(env, `git/commits/${headSha}`);
  const newTree = await ghJson(env, 'git/trees', { base_tree: headCommit.tree.sha, tree });
  const commit = await ghJson(env, 'git/commits', {
    message: `${COMMIT_TAG} ${editor.trim()}: ${summary.trim()}`,
    tree: newTree.sha,
    parents: [headSha],
    author: {
      name: `${editor.trim()} (via site editor)`,
      email: 'editor@tailendsanctuary.org',
      date: new Date().toISOString(),
    },
  });
  await ghJson(env, `git/refs/heads/${env.GITHUB_BRANCH}`, { sha: commit.sha }, 'PATCH');
  return { ok: true };
}

function isAllowedOp(op) {
  if (!op || typeof op.path !== 'string') return false;
  if (!ALLOWED_OP_PATHS.some((re) => re.test(op.path))) return false;
  if (op.op === 'set') return op.value !== undefined && JSON.stringify(op.value).length < 20000;
  if (op.op === 'push') return /^(dogs|founders)$/.test(op.path) && op.value && typeof op.value === 'object';
  if (op.op === 'remove') return /^(dogs|founders)\.\d+$/.test(op.path);
  return false;
}

function applyOp(content, op) {
  const segs = op.path.split('.');
  const last = segs.pop();
  let target = content;
  for (const s of segs) {
    if (target[s] == null) throw new Error(`missing path: ${op.path}`);
    target = target[s];
  }
  if (op.op === 'set') {
    target[last] = op.value;
  } else if (op.op === 'push') {
    if (!Array.isArray(target[last])) throw new Error(`not a list: ${op.path}`);
    target[last].push(op.value);
  } else if (op.op === 'remove') {
    if (!Array.isArray(target)) throw new Error(`not a list: ${op.path}`);
    target.splice(Number(last), 1);
  }
}

// ---------------------------------------------------------------- undo

async function lastChange(env) {
  const commits = await ghJson(env, `commits?sha=${env.GITHUB_BRANCH}&per_page=1`);
  const head = commits[0];
  const msg = head?.commit?.message || '';
  if (!msg.startsWith(COMMIT_TAG)) return { undoable: false };
  return { undoable: true, description: msg.slice(COMMIT_TAG.length).trim().split('\n')[0] };
}

async function undo(body, env) {
  const editor = (body.editor || 'Someone').slice(0, 60);
  const commits = await ghJson(env, `commits?sha=${env.GITHUB_BRANCH}&per_page=1`);
  const head = commits[0];
  const message = head?.commit?.message || '';
  // Only the most recent change can be undone, and only if the editor made it —
  // anything older or hand-made is Ryan's to sort out in git.
  if (!message.startsWith(COMMIT_TAG)) return { error: 'nothing-to-undo' };

  const detail = await ghJson(env, `commits/${head.sha}`);
  const parentSha = head.parents[0].sha;

  const tree = [];
  for (const f of detail.files || []) {
    if (f.status === 'added') {
      tree.push({ path: f.filename, mode: '100644', type: 'blob', sha: null });
    } else {
      const prev = await ghJson(
        env,
        `contents/${encodeURIComponent(f.filename).replace(/%2F/g, '/')}?ref=${parentSha}`
      );
      const blob = await ghJson(env, 'git/blobs', { content: prev.content, encoding: 'base64' });
      tree.push({ path: f.filename, mode: '100644', type: 'blob', sha: blob.sha });
    }
  }

  const headCommit = await ghJson(env, `git/commits/${head.sha}`);
  const newTree = await ghJson(env, 'git/trees', { base_tree: headCommit.tree.sha, tree });
  const undone = message.slice(COMMIT_TAG.length).trim().split('\n')[0];
  const commit = await ghJson(env, 'git/commits', {
    message: `${COMMIT_TAG} ${editor}: Undid "${undone}"`,
    tree: newTree.sha,
    parents: [head.sha],
    author: {
      name: `${editor} (via site editor)`,
      email: 'editor@tailendsanctuary.org',
      date: new Date().toISOString(),
    },
  });
  await ghJson(env, `git/refs/heads/${env.GITHUB_BRANCH}`, { sha: commit.sha }, 'PATCH');
  return { ok: true, description: undone };
}

// ---------------------------------------------------------------- github + http helpers

async function ghJson(env, path, body, method) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'tailend-site-editor',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`GitHub ${method || 'GET'} ${path}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

function fromBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, cors, status) {
  return new Response(JSON.stringify(data), {
    status: status || (data && data.error ? 400 : 200),
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
