// Zero-dependency local server. Run: node server.js  ->  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 4000;
const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
// DATA_DIR lets a host keep editable data (products, enquiries, backups) on a permanent disk, outside the code folder.
const DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const SUBS = path.join(DATA, 'submissions');
fs.mkdirSync(SUBS, { recursive: true });
// First start on a fresh disk: copy the default content from the code folder (never overwrites existing data).
for (const f of ['products.json', 'site.json', 'services.json']) {
  const dst = path.join(DATA, f), src = path.join(ROOT, 'data', f);
  if (!fs.existsSync(dst) && fs.existsSync(src)) fs.copyFileSync(src, dst);
}
const PROD = process.env.NODE_ENV === 'production';
// Behind a host's proxy the real visitor address and the https scheme come from forwarded headers.
const TRUST_PROXY = !!process.env.TRUST_PROXY || PROD;
const siteOrigin = (req) => `${TRUST_PROXY ? String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim() : 'http'}://${req.headers.host}`;

// Admin password: ADMIN_PASSWORD env, else a random one saved in data/.admin-password
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  const f = path.join(DATA, '.admin-password');
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(9).toString('base64url'));
  ADMIN_PASSWORD = fs.readFileSync(f, 'utf8').trim();
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const STATUSES = ['draft', 'in_development', 'coming_soon', 'private_beta', 'public_beta', 'live', 'deprecated', 'archived'];
// allowed lifecycle transitions
const FLOW = {
  draft: ['in_development', 'coming_soon', 'archived'],
  in_development: ['draft', 'coming_soon', 'private_beta', 'archived'],
  coming_soon: ['in_development', 'private_beta', 'public_beta', 'live', 'archived'],
  private_beta: ['public_beta', 'live', 'coming_soon', 'archived'],
  public_beta: ['live', 'private_beta', 'archived'],
  live: ['deprecated', 'archived'],
  deprecated: ['archived', 'live'],
  archived: ['draft']
};

const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJSON = (f, v) => { fs.writeFileSync(f + '.tmp', JSON.stringify(v, null, 2)); fs.renameSync(f + '.tmp', f); };
const productsFile = path.join(DATA, 'products.json');
const servicesFile = path.join(DATA, 'services.json');
const readServices = () => (fs.existsSync(servicesFile) ? readJSON(servicesFile) : { groups: {}, services: [] });
const subFile = (n) => path.join(SUBS, n + '.json');
const readSubs = (n) => (fs.existsSync(subFile(n)) ? readJSON(subFile(n)) : []);

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN', ...(PROD ? { 'Strict-Transport-Security': 'max-age=15552000' } : {}) });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const body = (req) => new Promise((ok, bad) => {
  let s = ''; req.on('data', (c) => { s += c; if (s.length > 20000) { bad(new Error('too large')); req.destroy(); } });
  req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { bad(e); } });
});

// simple per-IP rate limit: 8 submissions / 10 min
const hits = new Map();
function limited(ip) {
  const now = Date.now(); const a = (hits.get(ip) || []).filter((t) => now - t < 600000);
  a.push(now); hits.set(ip, a); return a.length > 8;
}
const emailOk = (e) => typeof e === 'string' && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

function adminOk(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const pass = Buffer.from(h.slice(6), 'base64').toString().split(':').slice(1).join(':');
  const a = Buffer.from(pass), b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const publicProduct = (p) => {
  const q = { ...p };
  // never expose a launch action unless the URL exists and product is launched
  return q;
};

// New enquiries and waitlist sign-ups are always logged. If NOTIFY_WEBHOOK_URL is set
// (e.g. a Slack/Discord/Zapier/Make webhook), they are also posted there as { text, content }.
function notify(text) {
  console.log('[lead]', text);
  const hook = process.env.NOTIFY_WEBHOOK_URL;
  if (!hook) return;
  fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, content: text }) }).catch(() => {});
}

// Copy data/ to backups/<timestamp>/ on start and every 24h; keep the newest 14.
const BACKUPS = process.env.DATA_DIR ? path.join(DATA, 'backups') : path.join(ROOT, 'backups');
function backup() {
  try {
    const dest = path.join(BACKUPS, new Date().toISOString().replace(/[:.]/g, '-'));
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(DATA, dest, { recursive: true, filter: (src) => path.basename(src) !== '.admin-password' && !src.startsWith(BACKUPS) });
    const all = fs.readdirSync(BACKUPS).sort();
    for (const old of all.slice(0, Math.max(0, all.length - 14))) fs.rmSync(path.join(BACKUPS, old), { recursive: true, force: true });
  } catch (e) { console.error('backup failed:', e.message); }
}
backup();
setInterval(backup, 24 * 3600 * 1000).unref();

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);
  // Old VidyaOne address (was "aarambh") -> new one
  if (p === '/products/aarambh') { res.writeHead(301, { Location: '/products/vidyaone' }); return res.end(); }
  const ip = (TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress;
  try {
    // ---------- public API ----------
    if (p === '/api/catalog' && req.method === 'GET') {
      const d = readJSON(productsFile);
      return send(res, 200, { categories: d.categories, products: d.products.filter((x) => x.published && x.status !== 'archived').map(publicProduct), site: readJSON(path.join(DATA, 'site.json')),
        services: (() => { const s = readServices(); return { groups: s.groups, items: s.services.filter((x) => x.published !== false) }; })() });
    }
    if ((p === '/api/waitlist' || p === '/api/inquiry') && req.method === 'POST') {
      if (limited(ip)) return send(res, 429, { error: 'Too many requests. Try again later.' });
      const b = await body(req);
      if (b.website) return send(res, 200, { ok: true }); // honeypot
      const d = readJSON(productsFile);
      // 'hardware' is the enquiry category for hardware and IT services (kept apart from software products)
      const isHw = b.product === 'hardware' && p === '/api/inquiry';
      const prod = isHw ? { slug: 'hardware', name: 'Hardware and IT services' } : d.products.find((x) => x.slug === b.product);
      if (!prod) return send(res, 400, { error: 'Unknown product.' });
      if (!emailOk(b.email)) return send(res, 400, { error: 'Enter a valid email.' });
      if (p === '/api/waitlist') {
        if (!b.consent) return send(res, 400, { error: 'Consent is required.' });
        const list = readSubs('waitlist'); const email = b.email.toLowerCase();
        if (list.some((r) => r.product === prod.slug && r.email === email)) return send(res, 200, { ok: true, duplicate: true });
        list.push({ id: crypto.randomUUID(), product: prod.slug, email, consent: true, verification: 'unverified', created_at: new Date().toISOString() });
        writeJSON(subFile('waitlist'), list);
      } else {
        const name = clean(b.name, 120), message = clean(b.message, 3000);
        if (!name || message.length < 5) return send(res, 400, { error: 'Name and message are required.' });
        const type = ['demo', 'question', 'beta'].includes(b.type) ? b.type : 'question';
        const list = readSubs('inquiries');
        const svc = isHw && readServices().services.find((x) => x.id === b.service);
        list.push({ id: crypto.randomUUID(), category: isHw ? 'hardware' : 'software', product: prod.slug, ...(svc ? { service: svc.id } : {}), name, email: b.email, message, type, status: 'new', created_at: new Date().toISOString() });
        writeJSON(subFile('inquiries'), list);
        notify(`New ${type} enquiry for ${prod.name} from ${name} <${b.email}>: ${message.slice(0, 300)}`);
      }
      if (p === '/api/waitlist') notify(`New waitlist sign-up for ${prod.name}: ${b.email}`);
      return send(res, 200, { ok: true });
    }

    // ---------- admin API ----------
    if (p.startsWith('/api/admin')) {
      if (!adminOk(req)) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin"' }); return res.end('Login required'); }
      if (p === '/api/admin/overview') {
        const d = readJSON(productsFile); const c = (s) => d.products.filter((x) => s.includes(x.status)).length;
        return send(res, 200, {
          total: d.products.length, live: c(['live']), beta: c(['private_beta', 'public_beta']), upcoming: c(['coming_soon', 'in_development']), draft: c(['draft']),
          waitlist: readSubs('waitlist').length, inquiries: readSubs('inquiries').length, products: d.products, statuses: STATUSES, flow: FLOW,
          waitlistRows: readSubs('waitlist').reverse(), inquiryRows: readSubs('inquiries').reverse(),
          services: readServices().services, serviceGroups: readServices().groups
        });
      }
      const ms = p.match(/^\/api\/admin\/services\/([a-z0-9-]+)$/);
      if (ms && req.method === 'POST') {
        const b = await body(req); const sd = readServices(); const svc = sd.services.find((x) => x.id === ms[1]);
        if (!svc) return send(res, 404, { error: 'Not found' });
        for (const k of ['title', 'description']) if (typeof b[k] === 'string' && b[k].trim()) svc[k] = clean(b[k], k === 'title' ? 120 : 400);
        if (typeof b.published === 'boolean') svc.published = b.published;
        if (b.group && sd.groups[b.group]) svc.group = b.group;
        writeJSON(servicesFile, sd); return send(res, 200, { ok: true, service: svc });
      }
      const m = p.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
      if (m && req.method === 'POST') {
        const b = await body(req); const d = readJSON(productsFile);
        const prod = d.products.find((x) => x.slug === m[1]);
        if (!prod) return send(res, 404, { error: 'Not found' });
        if (b.status && b.status !== prod.status) {
          if (!(FLOW[prod.status] || []).includes(b.status)) return send(res, 400, { error: `Cannot move ${prod.status} -> ${b.status}` });
          prod.status = b.status;
        }
        for (const k of ['tagline', 'overview']) if (typeof b[k] === 'string') prod[k] = clean(b[k], 3000);
        for (const k of ['app_url', 'download_url', 'demo_url', 'docs_url']) if (typeof b[k] === 'string') {
          const v = b[k].trim(); if (v && !/^(https?:\/\/|\/assets\/)/i.test(v)) return send(res, 400, { error: `${k} must start with http(s)://` });
          prod[k] = v;
        }
        for (const k of ['published', 'featured']) if (typeof b[k] === 'boolean') prod[k] = b[k];
        if (b.launch_date !== undefined) prod.launch_date = clean(b.launch_date, 20);
        writeJSON(productsFile, d); return send(res, 200, { ok: true, product: prod });
      }
      return send(res, 404, { error: 'Not found' });
    }

    // ---------- pages ----------
    let file;
    if (p === '/admin' || p === '/admin/') {
      if (!adminOk(req)) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin"' }); return res.end('Login required'); }
      file = path.join(PUB, 'admin.html');
    } else if (p === '/') file = path.join(PUB, 'index.html');
    else if (p === '/products' || p === '/products/') file = path.join(PUB, 'products.html');
    else if (/^\/products\/[a-z0-9-]+$/.test(p)) {
      // Fill SEO tags on the server so crawlers and link previews see them without running JS.
      const prod = readJSON(productsFile).products.find((x) => x.slug === p.split('/')[2] && x.published && x.status !== 'archived');
      let html = fs.readFileSync(path.join(PUB, 'product.html'), 'utf8');
      if (prod) {
        const origin = siteOrigin(req), a = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        html = html.replace('<title>Product</title>', () => `<title>${a(prod.name + ' — ' + prod.tagline)}</title>`)
          .replace('<meta name="description" content="">', () => `<meta name="description" content="${a(prod.overview.slice(0, 155))}">`)
          .replace('<link rel="canonical" href="">', () => `<link rel="canonical" href="${origin}/products/${prod.slug}">`)
          .replace('<meta property="og:title" content="">', () => `<meta property="og:title" content="${a(prod.name)}">`)
          .replace('<meta property="og:description" content="">', () => `<meta property="og:description" content="${a(prod.tagline)}">`)
          .replace('<meta property="og:image" content="">', () => `<meta property="og:image" content="${origin}${a(prod.artwork || prod.logo)}">`);
      }
      return send(res, prod ? 200 : 404, html, TYPES['.html']);
    } else if (p === '/about' || p === '/contact' || p === '/services') file = path.join(PUB, p.slice(1) + '.html');
    else if (p === '/robots.txt') {
      return send(res, 200, `User-agent: *\nDisallow: /admin\nDisallow: /api/admin\nSitemap: ${siteOrigin(req)}/sitemap.xml\n`, TYPES['.txt']);
    }
    else if (p === '/sitemap.xml') {
      const d = readJSON(productsFile); const host = siteOrigin(req);
      const urls = ['/', '/products', '/services', '/about', '/contact', '/privacy', '/terms', ...d.products.filter((x) => x.published && x.status !== 'archived').map((x) => '/products/' + x.slug)];
      return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${host}${u}</loc></url>`).join('')}</urlset>`, TYPES['.xml']);
    } else if (p === '/privacy' || p === '/terms') file = path.join(PUB, p.slice(1) + '.html');
    else file = path.join(PUB, p);

    file = path.normalize(file);
    if (!file.startsWith(PUB + path.sep) || path.basename(file) === 'admin.html' && p !== '/admin' && p !== '/admin/') return send(res, 404, 'Not found', 'text/plain');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const nf = path.join(PUB, '404.html'), has = fs.existsSync(nf);
      return send(res, 404, has ? fs.readFileSync(nf) : 'Not found', has ? TYPES['.html'] : 'text/plain');
    }
    return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
}).listen(PORT, () => {
  console.log(`Website:  http://localhost:${PORT}`);
  console.log(`Admin:    http://localhost:${PORT}/admin   (any username / password: ${process.env.ADMIN_PASSWORD ? '[from ADMIN_PASSWORD]' : ADMIN_PASSWORD})`);
});
