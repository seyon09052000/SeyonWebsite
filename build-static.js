// Builds a plain-files copy of the site into docs/ for free hosting (GitHub Pages).
//   node build-static.js            (domain defaults to www.seyonsolutions.lapuptech.com)
//   SITE_DOMAIN=www.example.com node build-static.js
// Re-run it after changing anything in public/ or data/, then commit docs/ and push.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname, PUB = path.join(ROOT, 'public'), DATA = path.join(ROOT, 'data'), OUT = path.join(ROOT, 'docs');
const DOMAIN = process.env.SITE_DOMAIN || 'www.seyonsolutions.lapuptech.com';
const ORIGIN = `https://${DOMAIN}`;
const rj = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const write = (rel, body) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); };

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1) copy everything public, except the admin page (it needs the server)
fs.cpSync(PUB, OUT, { recursive: true, filter: (src) => path.basename(src) !== 'admin.html' });

// 2) static flag in every page, so scripts use the file-based catalog and the WhatsApp/form-service submit
const flag = '<script>window.SEYON_STATIC=true</script>';
const pages = fs.readdirSync(OUT).filter((f) => f.endsWith('.html'));
for (const f of pages) {
  const p = path.join(OUT, f); let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('SEYON_STATIC')) s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + flag);
  fs.writeFileSync(p, s);
}

// 3) the catalog as a file (same shape as /api/catalog)
const pd = rj(path.join(DATA, 'products.json')), sv = rj(path.join(DATA, 'services.json')), site = rj(path.join(DATA, 'site.json'));
const products = pd.products.filter((x) => x.published && x.status !== 'archived');
write('api/catalog.json', JSON.stringify({ categories: pd.categories, products, site, services: { groups: sv.groups, items: sv.services.filter((x) => x.published !== false) } }));

// 4) clean URLs: /about, /contact, /services, /products, /privacy, /terms -> folder/index.html
for (const n of ['about', 'contact', 'services', 'privacy', 'terms']) write(`${n}/index.html`, fs.readFileSync(path.join(OUT, `${n}.html`), 'utf8'));
write('products/index.html', fs.readFileSync(path.join(OUT, 'products.html'), 'utf8'));

// 5) product pages with their SEO tags filled in (so link previews and search engines see them)
const tpl = fs.readFileSync(path.join(OUT, 'product.html'), 'utf8');
for (const p of products) {
  const html = tpl.replace('<title>Product</title>', () => `<title>${esc(p.name + ' — ' + p.tagline)}</title>`)
    .replace('<meta name="description" content="">', () => `<meta name="description" content="${esc(p.overview.slice(0, 155))}">`)
    .replace('<link rel="canonical" href="">', () => `<link rel="canonical" href="${ORIGIN}/products/${p.slug}">`)
    .replace('<meta property="og:title" content="">', () => `<meta property="og:title" content="${esc(p.name)}">`)
    .replace('<meta property="og:description" content="">', () => `<meta property="og:description" content="${esc(p.tagline)}">`)
    .replace('<meta property="og:image" content="">', () => `<meta property="og:image" content="${ORIGIN}${esc(p.artwork || p.logo)}">`);
  write(`products/${p.slug}/index.html`, html);
}
// the old VidyaOne address
write('products/aarambh/index.html', `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/products/vidyaone"><link rel="canonical" href="${ORIGIN}/products/vidyaone"><a href="/products/vidyaone">VidyaOne</a>`);

// 6) crawler files, custom domain, and "do not run Jekyll"
const urls = ['/', '/products', '/services', '/about', '/contact', '/privacy', '/terms', ...products.map((x) => '/products/' + x.slug)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${ORIGIN}${u}</loc></url>`).join('')}</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
write('CNAME', DOMAIN + '\n');
write('.nojekyll', '');

console.log(`Built ${fs.readdirSync(OUT).length} entries into docs/ for ${DOMAIN} (${products.length} products, ${urls.length} pages in sitemap).`);
