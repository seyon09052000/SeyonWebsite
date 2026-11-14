// Shared helpers: layout, catalog, product cards, forms.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STATUS = {
  live: ['Live', 'b-live'], public_beta: ['Public Beta', 'b-beta'], private_beta: ['Private Beta', 'b-beta'],
  coming_soon: ['Coming Soon', 'b-soon'], in_development: ['In Development', 'b-dev'],
  draft: ['Status to be confirmed', 'b-draft'], deprecated: ['Deprecated', 'b-old']
};
const badge = (s) => { const [t, c] = STATUS[s] || [s, 'b-draft']; return `<span class="badge ${c}">${t}</span>`; };
function productArtworkAlt(p) {
  const labels = { screenshot: 'product screen', illustration: 'illustrative product preview', promotional: 'promotional artwork' };
  return `${p.name} ${labels[p.artwork_type] || 'product image'}`;
}
function productArtworkNote(p) {
  const notes = {
    screenshot: 'Screenshot from the product app.',
    illustration: 'Illustrative product UI using sample data.',
    promotional: 'Promotional graphic from the product materials.'
  };
  return notes[p.artwork_type] || 'Product image from the product source materials.';
}
const PRODUCT_ART_SCREENS = {
  vidyaone: 'cal',
  invoicely: 'list',
  motorhub: 'kanban',
  kadai: 'form',
  arenabook: 'slots',
  zenfit: 'qr'
};

let _catalog;
async function catalog() {
  // The static GitHub Pages build ships the same data as a plain file (window.SEYON_STATIC is set by the build).
  if (!_catalog) { const r = await fetch(window.SEYON_STATIC ? '/api/catalog.json' : '/api/catalog'); _catalog = await r.json(); }
  return _catalog;
}

// The site uses the light theme only (no dark mode, whatever the visitor's device is set to).
function theme() {
  document.documentElement.dataset.theme = 'light';
  try { localStorage.removeItem('theme'); } catch {}
}
theme();

window.seyonAnalytics = {
  track(eventName, payload = {}) {
    const event = {
      event: eventName,
      page: window.location.pathname,
      title: document.title,
      timestamp: new Date().toISOString(),
      payload
    };
    try {
      const key = 'seyon-analytics-events';
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      current.push(event);
      localStorage.setItem(key, JSON.stringify(current.slice(-100)));
    } catch {}
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('seyon:analytics', { detail: event }));
    }
    if (window.SEYON_ANALYTICS_ENDPOINT) {
      try {
        fetch(window.SEYON_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true
        }).catch(() => {});
      } catch {}
    }
    return event;
  },
  getEvents() {
    try { return JSON.parse(localStorage.getItem('seyon-analytics-events') || '[]'); } catch { return []; }
  }
};

(async () => {
  const analyticsReady = () => window.seyonAnalytics && window.seyonAnalytics.track;
  if (analyticsReady()) {
    window.seyonAnalytics.track('page_view', { referrer: document.referrer || null });
  }
})();

// Services offered through our supporting partner LapupTech (https://www.lapuptech.com/).
const LAPUPTECH_URL = 'https://www.lapuptech.com/';
const SERVICES = [
  ['laptop-desktop-sales', '💻', 'Laptop and desktop sales', 'New and refurbished options, matched to your needs.'],
  ['laptop-repair', '🛠️', 'Laptop repair', 'Motherboard-level servicing and fault finding.'],
  ['servicing-thermal-paste', '🌡️', 'Servicing and thermal paste', 'Cleaning and thermal paste replacement to fix heat and noise.'],
  ['part-replacement', '🔧', 'Part replacement', 'Screen, keyboard, battery, hinge, RAM and SSD.'],
  ['custom-gaming-pcs', '🎮', 'Custom gaming PCs', 'Built around your games and budget.'],
  ['workstations', '🖥️', 'Workstations', 'High-performance systems for video editing and professional apps.'],
  ['spare-parts', '🧩', 'Spare parts', 'RAM, SSDs, graphics cards, processors and motherboards.'],
  ['windows-software-setup', '🪟', 'Windows and software setup', 'Installation, drivers and software configuration.'],
  ['data-recovery', '💾', 'Data recovery and troubleshooting', 'Help for failed drives and system problems.'],
  ['remote-support', '🌐', 'Remote support', 'Help with software and setup problems over the internet.'],
  ['custom-software', '⌨️', 'Custom software', 'Web applications, bike showroom and school management software.']
];
const serviceMenuHTML = () => `<div class="mega" id="svcMenu" role="region" aria-label="Services"><div class="wrap mega-inner">
  <div class="mega-grid">${SERVICES.map(([id, ic, t, d]) => `<a class="mega-item" href="/services#${id}"><span class="mega-ic" aria-hidden="true">${ic}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></a>`).join('')}</div>
  <div class="mega-foot"><span>Doorstep laptop service · Remote support available · Services by our partner LapupTech</span><span class="mega-links"><a href="/services">All services</a><a href="${LAPUPTECH_URL}" target="_blank" rel="noopener">More at lapuptech.com ↗</a></span></div>
</div></div>`;

// Dropdown panels for Products, About and Contact (simple details at a glance).
const productMenuHTML = (products) => `<div class="mega" id="menu-products" role="region" aria-label="Products"><div class="wrap mega-inner">
  <div class="mega-grid mega-grid-3">${products.map((p) => `<a class="mega-item" href="/products/${esc(p.slug)}"><span class="mega-ic mega-logo"><img src="${esc(p.logo)}" alt="" loading="lazy"></span><span><b>${esc(p.name)}</b><small>${esc(p.summary || p.tagline)}</small></span></a>`).join('')}</div>
  <div class="mega-foot"><span>${products.length} products for schools, shops, showrooms, gyms and sports venues</span><span class="mega-links"><a href="/products">Browse all products</a><a href="/#find">Find the right one ↗</a></span></div>
</div></div>`;
const ABOUT_MENU = [
  ['🏢', 'Who we are', 'Seyon Solutions, what we build and why.', '/about'],
  ['🎯', 'Our vision', 'Dependable software for every growing business.', '/about#our-vision'],
  ['🧭', 'Our mission', 'Replace paper registers and guesswork with clear screens.', '/about#our-mission'],
  ['✨', 'What we stand for', 'Simple for staff, built for India, your data stays yours.', '/about#stand-for'],
  ['🔒', 'Privacy policy', 'How we handle personal data under Indian law.', '/privacy'],
  ['📄', 'Terms of use', 'The terms for using this website.', '/terms']
];
const aboutMenuHTML = () => `<div class="mega" id="menu-about" role="region" aria-label="About"><div class="wrap mega-inner">
  <div class="mega-grid mega-grid-3">${ABOUT_MENU.map(([ic, t, d, h]) => `<a class="mega-item" href="${h}"><span class="mega-ic" aria-hidden="true">${ic}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></a>`).join('')}</div>
  <div class="mega-foot"><span>Seyon Solutions builds simple, dependable software for Indian businesses</span><span class="mega-links"><a href="/about">About us</a><a href="/services">Our IT services ↗</a></span></div>
</div></div>`;
const contactMenuHTML = (site) => `<div class="mega" id="menu-contact" role="region" aria-label="Contact"><div class="wrap mega-inner"><div class="mega-grid mega-grid-3">
  <a class="mega-item mega-call" href="${telHref(site.whatsapp_display)}"><span class="mega-ic mega-callic" aria-hidden="true">📞</span><span><b>Call us</b><small>${esc(site.whatsapp_display)} · tap to call</small></span></a>
  <a class="mega-item" href="${waLink(site, 'Hello, I would like to know more about your software.')}" target="_blank" rel="noopener"><span class="mega-ic mega-wa" aria-hidden="true">💬</span><span><b>WhatsApp us</b><small>${esc(site.whatsapp_display)}</small></span></a>
  ${site.contacts.map((c) => `<a class="mega-item" href="${telHref(c.phone)}"><span class="mega-ic" aria-hidden="true">📞</span><span><b>${esc(c.name)}</b><small>${esc(c.phone)}</small></span></a>`).join('')}
  ${site.contact_email ? `<a class="mega-item" href="mailto:${esc(site.contact_email)}"><span class="mega-ic" aria-hidden="true">✉️</span><span><b>Email</b><small>${esc(site.contact_email)}</small></span></a>` : ''}
</div><div class="mega-foot"><span>Call or WhatsApp us — we will set up a walkthrough with your own business in mind</span><span class="mega-links"><a href="/contact">Contact page</a><button type="button" class="mega-btn" data-enquiry="demo">Book a free demo</button></span></div></div></div>`;
const navDd = (key, label, panel, active, mini, end) => `<div class="nav-dd${mini ? ' mini' : ''}${end ? ' end' : ''}" data-dd="${key}" data-open="false"><button type="button" class="nav-dd-btn" aria-expanded="false" aria-haspopup="true" ${active === key ? 'aria-current="page"' : ''}>${label} <span class="chev" aria-hidden="true"></span></button>${panel}</div>`;

function wireDropdowns() {
  const all = [...document.querySelectorAll('.nav-dd')]; if (!all.length) return;
  const fine = () => matchMedia('(hover:hover) and (min-width:1151px)').matches;
  const closeAll = (except) => all.forEach((d) => { if (d !== except) { d.dataset.open = 'false'; d.querySelector('.nav-dd-btn').setAttribute('aria-expanded', 'false'); } });
  all.forEach((dd) => {
    const btn = dd.querySelector('.nav-dd-btn'); let t;
    const set = (open) => { clearTimeout(t); if (open) closeAll(dd); dd.dataset.open = String(open); btn.setAttribute('aria-expanded', String(open)); };
    // With a mouse the menu already opens on hover, so a click must keep it open; on touch screens a click toggles.
    btn.addEventListener('click', () => set(fine() ? true : dd.dataset.open !== 'true'));
    dd.addEventListener('mouseenter', () => { if (fine()) set(true); });
    dd.addEventListener('mouseleave', () => { if (fine()) t = setTimeout(() => set(false), 180); });
    dd.querySelectorAll('.mega a, .mega button').forEach((a) => a.addEventListener('click', () => set(false)));
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav-dd')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const o = all.find((d) => d.dataset.open === 'true'); if (o) { closeAll(); o.querySelector('.nav-dd-btn').focus(); } } });
}

function ensureHead() {
  const add = (sel, html) => { if (!document.head.querySelector(sel)) document.head.insertAdjacentHTML('beforeend', html); };
  const title = document.title, desc = document.querySelector('meta[name=description]')?.content || '';
  add('link[rel=icon]', '<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  add('link[rel=manifest]', '<link rel="manifest" href="/site.webmanifest">');
  add('meta[name=theme-color]', '<meta name="theme-color" content="#3b82f6">');
  add('meta[property="og:type"]', '<meta property="og:type" content="website">');
  add('meta[property="og:site_name"]', '<meta property="og:site_name" content="Seyon Solutions">');
  add('meta[property="og:title"]', `<meta property="og:title" content="${esc(title)}">`);
  if (desc) add('meta[property="og:description"]', `<meta property="og:description" content="${esc(desc)}">`);
  add('meta[property="og:image"]', `<meta property="og:image" content="${location.origin}/assets/brand/seyon.png">`);
  add('meta[name="twitter:card"]', '<meta name="twitter:card" content="summary_large_image">');
  add('link[rel=canonical]', `<link rel="canonical" href="${location.origin}${location.pathname}">`);
}

// Legal pages: build a sticky "On this page" list from the section headings and highlight the one being read.
function buildLegalToc() {
  const L = document.querySelector('.legal'); if (!L || L.dataset.toc) return; L.dataset.toc = 1;
  const hs = [...L.querySelectorAll('h2')]; if (hs.length < 3) return;
  hs.forEach((h, i) => { if (!h.id) h.id = 'sec-' + (i + 1); });
  const body = document.createElement('div'); body.className = 'legal-body';
  while (L.firstChild) body.appendChild(L.firstChild);
  const toc = document.createElement('nav'); toc.className = 'legal-toc'; toc.setAttribute('aria-label', 'On this page');
  toc.innerHTML = '<b>On this page</b>' + hs.map((h) => `<a href="#${esc(h.id)}">${esc(h.textContent)}</a>`).join('');
  L.classList.add('legal-layout'); L.append(toc, body);
  if (!('IntersectionObserver' in window)) return;
  const links = new Map([...toc.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { links.forEach((a) => a.classList.remove('on')); links.get(e.target.id)?.classList.add('on'); } }), { rootMargin: '-20% 0px -70% 0px' });
  hs.forEach((h) => io.observe(h));
}

async function layout(active) {
  ensureHead();
  buildLegalToc();
  const { site, products, services } = await catalog();
  // The services list is managed in the admin dashboard (data/services.json); fall back to the built-in list if missing.
  if (services && services.items) { SERVICES.length = 0; services.items.forEach((s) => SERVICES.push([s.id, s.icon, s.title, s.description, s.group])); window.SERVICE_GROUPS = services.groups || {}; }
  document.querySelector('#nav').innerHTML = `<nav class="top site-header" aria-label="Main navigation"><div class="wrap header-inner">
    <div class="header-branding"><a class="brand" href="/" aria-label="${esc(site.company)} home"><span class="logo-crop header-logo"><img src="/assets/brand/seyon.png" alt="${esc(site.company)}"><span class="brand-tag">${esc(site.brand_tagline || '')}</span></span></a>
      <a class="header-partner" href="/services" aria-label="${esc(site.partner)} (IT services)" title="${esc(site.partner)}"><span class="hp-label">Supporting partner</span><img src="/assets/brand/lapuptech.png" alt="${esc(site.partner)}"></a></div>
    <button type="button" class="header-menu-toggle" id="menuBtn" aria-expanded="false" aria-controls="headerMenu"><span class="menu-glyph" aria-hidden="true"></span>Menu</button>
    <div class="header-menu" id="headerMenu">
      <div class="header-nav"><a href="/" ${active === 'home' ? 'aria-current="page"' : ''}>Home</a>${navDd('products', 'Products', productMenuHTML(products), active)}${navDd('services', 'Services', serviceMenuHTML(), active)}${navDd('about', 'About', aboutMenuHTML(), active)}${navDd('contact', 'Contact', contactMenuHTML(site), active)}</div>
      <div class="header-actions"><button type="button" class="header-tool" id="searchBtn" aria-label="Search products"><span class="search-glyph" aria-hidden="true"></span>Search</button>        <a class="header-call" href="${telHref(site.whatsapp_display)}" aria-label="Call us on ${esc(site.whatsapp_display)}"><span class="call-glyph" aria-hidden="true">📞</span><span class="call-text">Call us</span></a>
        <a class="header-demo" href="/#contact">Book a demo <span aria-hidden="true">↗</span></a></div>
    </div></div></nav>`;
  document.querySelector('#foot').innerHTML = `<footer class="site-footer"><div class="wrap">
    <div class="footer-top">
    <nav class="footer-products" aria-label="Product links"><h3>Our software</h3><div>${products.map(product => `<a href="/products/${esc(product.slug)}"><span class="footer-product-dot" style="--product-accent:${esc(product.accent || '#73d6dc')}" aria-hidden="true"></span>${esc(product.name)}</a>`).join('')}</div></nav>
    <nav class="footer-links" aria-label="Footer"><h3>Quick links</h3><a href="/products">All products <span aria-hidden="true">↗</span></a><a href="/services">IT services</a><a href="/about">About us</a><a href="/contact">Contact</a>${site.contact_email ? `<a href="mailto:${esc(site.contact_email)}">${esc(site.contact_email)}</a>` : ''}<a href="/privacy">Privacy policy</a><a href="/terms">Terms of use</a></nav></div>
    </div><div class="footer-bottom">
      <a class="footer-signature" href="/" aria-label="${esc(site.company)} home"><span class="logo-crop"><img src="/assets/brand/seyon-light.png" alt="${esc(site.company)}"></span><span class="brand-tag">${esc(site.brand_tagline || '')}</span></a>
      <p>© ${new Date().getFullYear()}, ${esc(site.company)}. All rights reserved.</p>
      <a class="footer-back-top" href="#nav">Back to top <span aria-hidden="true">↑</span></a>
    </div></footer>
    <a class="wa-float" href="${waLink(site)}" target="_blank" rel="noopener">💬 WhatsApp us</a>
    <div class="lb" id="lb"><img alt=""></div>`;
  if(!window.__fx){window.__fx=1;const s=document.createElement('script');s.src='/fx.js';document.body.appendChild(s);const q=document.createElement('script');q.src='/enquiry.js';document.body.appendChild(q);}
  wireDropdowns();
  const menuButton = document.querySelector('#menuBtn');
  const menu = document.querySelector('#headerMenu');
  menuButton.onclick = () => {
    const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(expanded));
    menu.dataset.open = String(expanded);
  };
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.dataset.open = 'false';
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.dataset.open = 'false';
      menuButton.focus();
    }
  });
  document.addEventListener('click', (e) => {
    const lb = document.querySelector('#lb');
    if (e.target.matches('.gallery img')) { lb.querySelector('img').src = e.target.src; lb.classList.add('on'); }
    else if (lb.contains(e.target)) lb.classList.remove('on');
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-enquiry]');
    if (target) {
      window.seyonAnalytics.track('cta_click', {
        type: target.dataset.enquiry || 'unknown',
        product: target.dataset.product || null,
        location: active || 'page'
      });
    }

    const productLink = event.target.closest('a[href*="/products/"]');
    if (productLink) {
      const slug = productLink.getAttribute('href').split('/products/')[1]?.replace(/\/?$/, '');
      if (slug) {
        window.seyonAnalytics.track('product_click', { slug, source: active || 'page' });
      }
    }
  });
}

// WhatsApp + phone helpers (numbers come from data/site.json)
const waLink = (site, text) => `https://wa.me/${site.whatsapp}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const telHref = (n) => 'tel:+91' + n.replace(/\D/g, '');
const contactLinks = (site) => site.contacts.map((c) => `<a href="${telHref(c.phone)}">${esc(c.name)} ${esc(c.phone)}</a>`).join(' · ');

// Original illustrated product screen (sample data, not a real screenshot).
function mock(p, small) {
  const m = p.mock; if (!m) return `<img class="logo" src="${esc(p.logo)}" alt="${esc(p.name)} logo">`;
  const pts = m.hero[2], mx = Math.max(...pts);
  const line = pts.map((v, i) => `${(i * 100 / (pts.length - 1)).toFixed(1)},${(36 - v / mx * 32).toFixed(1)}`).join(' ');
  const dot = (n) => small ? '' : `<span class="dot d${n}">${n}</span>`;
  const inner = `<div class="mk-bar"><i></i><i></i><i></i><b>${esc(m.title)}</b></div><div class="mk-body">
    <div class="rel"><div class="mk-hero"><small>${esc(m.hero[0])}</small><strong>${esc(m.hero[1])}</strong><svg viewBox="0 0 100 40" preserveAspectRatio="none"><polyline points="${line}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>${dot(1)}</div>
    <div class="rel"><div class="mk-stats">${m.stats.map((s) => `<div><b>${esc(s[1])}</b><span>${esc(s[0])}</span></div>`).join('')}</div>${dot(2)}</div>
    <div class="rel"><div class="mk-list">${m.rows.map((r) => `<div class="mk-row"><span class="av">${esc(r[0])}</span><p><b>${esc(r[1])}</b><span>${esc(r[2])}</span></p><em>${esc(r[3])}</em></div>`).join('')}</div>${dot(3)}</div></div>
    <div class="mk-tabs rel">${m.tabs.map((t) => `<span>${esc(t)}</span>`).join('')}${dot(4)}</div>`;
  const body = p.frame === 'phone' ? `<div class="mk-in">${inner}</div>` : inner;
  return `<div class="mk ${p.frame === 'phone' ? 'phone' : ''} ${small ? 'sm' : ''}" style="--a:${esc(p.accent)}" role="img" aria-label="Illustrative ${esc(p.name)} screen with sample data">${body}</div>`;
}

function card(p) {
  const cardScreen = p.screens && p.screens.find((screen) => screen.kind === PRODUCT_ART_SCREENS[p.slug]);
  const media = p.artwork
    ? `<img class="product-artwork" src="${esc(p.artwork)}" alt="${esc(productArtworkAlt(p))}" loading="lazy" decoding="async">`
    : cardScreen && typeof screenHTML === 'function' ? screenHTML(p, cardScreen) : mock(p, true);
  const action = { live: 'View product', public_beta: 'View beta', private_beta: 'View beta', coming_soon: 'Get notified', in_development: 'Get notified' }[p.status] || 'Learn more';
  return `<a class="card" href="/products/${esc(p.slug)}" style="--a:${esc(p.accent || '#3b82f6')}"><div class="shot product-art-${esc(p.slug)}">${media}</div><div class="body">
    <div class="row" style="gap:12px;flex-wrap:nowrap"><span class="clogo"><img src="${esc(p.logo)}" alt="${esc(p.name)} logo"></span><h3 style="font-size:1.3rem">${esc(p.name)}</h3></div><div>${badge(p.status)}</div>
    <p>${esc(p.tagline)}</p>
    <div class="row"><span class="chip">${esc(p.category)}</span>${p.platforms.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>
    <span class="go">${action} →</span></div></a>`;
}

// Forms -------------------------------------------------------------
async function post(url, data, msgEl) {
  msgEl.className = 'msg'; msgEl.textContent = 'Sending…';
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Failed');
    msgEl.className = 'msg ok'; msgEl.textContent = j.duplicate ? 'You are already on the list.' : 'Thank you — we have received it.'; return true;
  } catch (e) { msgEl.className = 'msg err'; msgEl.textContent = e.message; return false; }
}
