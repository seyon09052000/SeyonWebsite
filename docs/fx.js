// Visual effects + interactive features. Loaded by layout() on every page.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  // scroll progress bar
  const bar = document.createElement('div'); bar.className = 'progress'; document.body.appendChild(bar);
  addEventListener('scroll', () => {
    const h = document.documentElement; bar.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
  }, { passive: true });

  // reveal on scroll + counters
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
    if (e.target.dataset.count) count(e.target);
  }), { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  function count(el) {
    const n = +el.dataset.count; if (reduce || !n) { el.textContent = n; return; }
    const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  function scan() {
    document.querySelectorAll('.card,.hl>div,.quote,.callouts li,.contacts a,.stat2,.vision>div,main h2,section.s h2,.show>div,.feat li,.rec,.footer-cta').forEach((el) => {
      if (el.dataset.fx) return; el.dataset.fx = 1; if (!reduce) el.classList.add('reveal'); io.observe(el);
    });
    document.querySelectorAll('[data-count]').forEach((el) => { if (!el.dataset.fx) { el.dataset.fx = 1; io.observe(el); } });
  }
  let t; new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 30); }).observe(document.body, { childList: true, subtree: true });
  scan();

  // card spotlight + tilt
  if (false && fine && !reduce) {
    document.addEventListener('pointermove', (e) => {
      const c = e.target.closest && e.target.closest('.card'); if (!c) return;
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      c.style.transform = `perspective(900px) rotateX(${((y / r.height) - .5) * -5}deg) rotateY(${((x / r.width) - .5) * 6}deg) translateY(-4px)`;
    });
    document.addEventListener('pointerout', (e) => { const c = e.target.closest && e.target.closest('.card'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });
  }

  // ---------- Command palette (Ctrl/Cmd+K or "/") ----------
  let pal, items = [], sel = 0;
  async function openPalette() {
    if (pal) return; const { products, site } = await catalog();
    items = [
      ...products.map((p) => ({ t: p.name, s: p.tagline, i: p.logo, href: '/products/' + p.slug, k: (p.name + p.tagline + p.category + (p.industries || []).join(' ') + p.platforms.join(' ')).toLowerCase() })),
      { t: 'All products', s: 'Browse the directory', i: '', href: '/products', k: 'products directory all' },
      { t: 'WhatsApp us', s: site.whatsapp_display, i: '', href: waLink(site), ext: 1, k: 'whatsapp chat contact' },
      ...site.contacts.map((c) => ({ t: 'Call ' + c.name, s: c.phone, i: '', href: telHref(c.phone), k: 'call phone contact ' + c.name.toLowerCase() }))
    ];
    pal = document.createElement('div'); pal.className = 'pal';
    pal.innerHTML = `<div class="pal-box" role="dialog" aria-label="Search"><input placeholder="Search products, platforms, industries…" aria-label="Search"><ul></ul><div class="pal-foot">↑↓ to move · Enter to open · Esc to close</div></div>`;
    document.body.appendChild(pal); const inp = pal.querySelector('input'), ul = pal.querySelector('ul');
    const draw = () => {
      const q = inp.value.trim().toLowerCase(); const r = items.filter((x) => !q || q.split(/\s+/).every((w) => x.k.includes(w)));
      sel = Math.min(sel, Math.max(0, r.length - 1)); pal._r = r;
      ul.innerHTML = r.length ? r.map((x, n) => `<li class="${n === sel ? 'on' : ''}" data-n="${n}">${x.i ? `<img src="${esc(x.i)}" alt="">` : '<span class="pi">↗</span>'}<div><b>${esc(x.t)}</b><span>${esc(x.s)}</span></div></li>`).join('') : '<li class="none">No results</li>';
    };
    const go = (x) => { if (!x) return; if (x.ext) open(x.href, '_blank'); else location.href = x.href; };
    inp.oninput = () => { sel = 0; draw(); };
    inp.onkeydown = (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, pal._r.length - 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') go(pal._r[sel]);
    };
    ul.onclick = (e) => { const li = e.target.closest('li[data-n]'); if (li) go(pal._r[+li.dataset.n]); };
    pal.onclick = (e) => { if (e.target === pal) closePalette(); };
    draw(); inp.focus();
  }
  function closePalette() { if (pal) { pal.remove(); pal = null; } }
  addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); pal ? closePalette() : openPalette(); }
    else if (e.key === 'Escape') closePalette();
  });
  document.addEventListener('click', (e) => { if (e.target.closest('#searchBtn')) openPalette(); });
})();
