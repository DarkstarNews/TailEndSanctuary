// Tiny template renderer shared by build.js (local) and the Cloudflare Worker.
//
// Supported syntax:
//   {{path.to.value}}      insert value, HTML-escaped
//   {{{path.to.value}}}    insert value, escaped except <strong> <em> <br>
//   {{#each path}}...{{/each}}   repeat block for each item in an array;
//                                inside the block, item properties resolve first
//
// Editors only ever supply plain text (with optional <strong>/<em>), so
// escaping here is what guarantees they can never break the page markup.

export const PAGE_TEMPLATES = {
  'index.html': 'templates/index.html',
  'about.html': 'templates/about.html',
  'dogs.html': 'templates/dogs.html',
  'donate.html': 'templates/donate.html',
  'get-involved.html': 'templates/get-involved.html',
};

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Escape everything, then let a small allowlist of inline tags back through.
function rich(s) {
  return esc(s).replace(/&lt;(\/?(?:strong|em|br))&gt;/g, '<$1>');
}

export function render(template, data) {
  let out = template.replace(
    /\{\{#each ([\w.]+)\}\}\n?([\s\S]*?)\{\{\/each\}\}\n?/g,
    (m, path, body) => {
      const arr = get(data, path);
      if (!Array.isArray(arr)) return '';
      return arr.map((item) => render(body, { ...data, ...item })).join('');
    }
  );
  out = out.replace(/\{\{\{([\w.]+)\}\}\}/g, (m, path) => {
    const v = get(data, path);
    return v == null ? '' : rich(v);
  });
  out = out.replace(/\{\{([\w.]+)\}\}/g, (m, path) => {
    const v = get(data, path);
    return v == null ? '' : esc(v);
  });
  return out;
}

// templates: { 'index.html': '<template source>', ... }
export function renderSite(templates, content) {
  const files = {};
  for (const name of Object.keys(templates)) {
    files[name] = render(templates[name], content);
  }
  return files;
}
