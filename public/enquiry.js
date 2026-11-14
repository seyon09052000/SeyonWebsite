// One shared popup for every "Request a demo / Ask a question / Request beta access / Get notified" button.
// Usage: <button data-enquiry="demo|question|beta|waitlist" data-product="slug">…</button>
// or in code: openEnquiry({ type: 'demo', product: 'zenfit' })
(function () {
  const CSS = `
  .eq{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,14,30,.45);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:eqfade .2s ease}
  .eq-card{position:relative;width:min(480px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--card,#fff);color:var(--text,#000);border-radius:26px;padding:26px 24px 24px;box-shadow:0 30px 80px rgba(0,0,0,.35);animation:eqpop .28s cubic-bezier(.2,.9,.3,1.1)}
  .eq-card h3{margin:0 0 4px;font-size:1.45rem;letter-spacing:-.02em}.eq-card .eq-sub{margin:0 0 16px;color:var(--muted,#6c6c70);font-size:.95rem}
  .eq-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border:0;border-radius:50%;background:var(--fill,rgba(120,120,128,.14));color:var(--text,#000);font-size:1.1rem;line-height:1;cursor:pointer}
  .eq-x:hover{filter:brightness(.92)}
  .eq-card label{display:block;font-size:.8rem;font-weight:600;color:var(--muted,#6c6c70);margin:12px 0 5px}
  .eq-card input,.eq-card select,.eq-card textarea{width:100%;font:inherit;padding:12px 14px;border:0;border-radius:12px;background:var(--fill,rgba(120,120,128,.14));color:var(--text,#000)}
  .eq-card textarea{min-height:100px;resize:vertical}
  .eq-card input:focus,.eq-card select:focus,.eq-card textarea:focus{outline:2px solid var(--accent,#0a84ff)}
  .eq-consent{display:flex;gap:10px;align-items:flex-start;margin:14px 0 4px;font-size:.88rem}.eq-consent input{width:auto;margin-top:3px}
  .eq-actions{display:flex;gap:10px;margin-top:18px}.eq-actions .btn{flex:1;text-align:center}
  .eq-msg{min-height:1.2em;margin-top:10px;font-size:.9rem}.eq-msg.err{color:#ff3b30}
  .eq-done{text-align:center;padding:14px 4px 4px}.eq-done .tick{width:64px;height:64px;margin:0 auto 14px;border-radius:50%;background:#34c759;color:#fff;font-size:2rem;display:grid;place-items:center;animation:eqpop .4s cubic-bezier(.2,.9,.3,1.4)}
  .eq-done p{color:var(--muted,#6c6c70)}
  .eq .hp{position:absolute;left:-9999px}
  @keyframes eqfade{from{opacity:0}}@keyframes eqpop{from{opacity:0;transform:translateY(18px) scale(.96)}}
  @media(max-width:560px){.eq{align-items:flex-end;padding:0}.eq-card{border-radius:26px 26px 0 0;width:100%;max-height:92vh;animation:eqsheet .3s ease}@keyframes eqsheet{from{transform:translateY(100%)}}}
  @media(prefers-reduced-motion:reduce){.eq,.eq-card,.eq-done .tick{animation:none}}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  const TITLES = {
    demo: ['Book a free demo', 'Tell us what you run and what you would like to see. Our team will contact you to discuss the right software for your business.', 'Send request'],
    question: ['Ask a question', 'We will get back to you as soon as we can and help you choose the right product.', 'Send message'],
    beta: ['Request beta access', 'Tell us how you would use it and we will be in touch about access and onboarding.', 'Request access'],
    waitlist: ['Get notified', 'Leave your email and we will tell you when it launches and what you can expect.', 'Join waitlist']
  };
  let root, lastFocus;

  async function openEnquiry(opts) {
    opts = opts || {}; if (root) return;
    const { products } = await catalog();
    const type = TITLES[opts.type] ? opts.type : 'demo';
    const [title, sub, cta] = TITLES[type];
    const prod = products.find((p) => p.slug === opts.product);
    lastFocus = document.activeElement;
    root = document.createElement('div'); root.className = 'eq';
    root.innerHTML = `<div class="eq-card" role="dialog" aria-modal="true" aria-labelledby="eq-t">
      <button class="eq-x" type="button" aria-label="Close">✕</button>
      <h3 id="eq-t">${esc(title)}</h3><p class="eq-sub">${esc(sub)}</p>
      <form novalidate>
        <label for="eq-p">Product</label>
        <select id="eq-p" name="product" aria-label="Select a product">${type === 'waitlist' ? products.map((p) => `<option value="${esc(p.slug)}" ${prod && p.slug === prod.slug ? 'selected' : ''}>${esc(p.name)}</option>`).join('') : `<optgroup label="Software">${products.map((p) => `<option value="${esc(p.slug)}" ${prod && p.slug === prod.slug ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup><optgroup label="Hardware and IT services"><option value="hardware" ${opts.product === 'hardware' ? 'selected' : ''}>Hardware, repair and IT services</option></optgroup>`}</select>
        ${type === 'waitlist' ? '' : `<label for="eq-n">Your name</label><input id="eq-n" name="name" maxlength="120" autocomplete="name" required aria-required="true">`}
        <label for="eq-e">Email</label><input id="eq-e" type="email" name="email" maxlength="200" autocomplete="email" required aria-required="true">
        ${type === 'waitlist' ? '' : `<label for="eq-m">Message</label><textarea id="eq-m" name="message" maxlength="3000" required aria-required="true" placeholder="Tell us your business type and what you want to improve."></textarea>`}
        ${opts.type ? '' : `<label for="eq-t2">I'm asking for</label><select id="eq-t2" name="type" aria-label="Choose the request type"><option value="demo">A demo</option><option value="question">A question</option></select>`}
        ${type === 'waitlist' ? `<label class="eq-consent"><input type="checkbox" name="consent" required aria-required="true"> I agree to be emailed about this product's launch.</label>` : ''}
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="eq-msg" role="status" aria-live="polite"></div>
        <div class="eq-actions"><button class="btn primary" type="submit">${esc(cta)}</button></div>
      </form></div>`;
    document.body.appendChild(root); document.body.style.overflow = 'hidden';
    const card = root.querySelector('.eq-card'), form = root.querySelector('form'), msg = root.querySelector('.eq-msg');
    root.addEventListener('mousedown', (e) => { if (e.target === root) closeEnquiry(); });
    root.querySelector('.eq-x').onclick = closeEnquiry;
    const firstField = root.querySelector('#eq-n, #eq-e, #eq-p');
    if (firstField) firstField.focus();

    form.onsubmit = async (e) => {
      e.preventDefault(); const f = new FormData(form); const email = String(f.get('email') || '').trim();
      const bad = (t) => { msg.className = 'eq-msg err'; msg.textContent = t; };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad('Please enter a valid email.');
      let url, body = { product: f.get('product'), email, website: f.get('website') };
      if (type === 'waitlist') {
        if (!f.get('consent')) return bad('Please tick the consent box.');
        url = '/api/waitlist'; body.consent = true;
      } else {
        const name = String(f.get('name') || '').trim(), message = String(f.get('message') || '').trim();
        if (!name) return bad('Please enter your name.'); if (message.length < 5) return bad('Please write a short message.');
        url = '/api/inquiry'; Object.assign(body, { name, message, type: opts.type ? type : f.get('type'), ...(opts.service ? { service: opts.service } : {}) });
      }
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; msg.className = 'eq-msg'; msg.textContent = 'Sending…';
      try {
        let j = {};
        if (window.SEYON_STATIC) {
          // Static hosting has no server: send to the configured form service, or hand over to WhatsApp.
          if (body.website) throw new Error('Please try again.');            // honeypot
          const { site, products } = await catalog();
          const pname = body.product === 'hardware' ? 'Hardware, repair and IT services' : ((products.find((p) => p.slug === body.product) || {}).name || body.product);
          const lines = [`New ${type === 'waitlist' ? 'waitlist sign-up' : (body.type || type) + ' enquiry'} - ${pname}`, body.name ? `Name: ${body.name}` : '', `Email: ${body.email}`, body.service ? `Service: ${body.service}` : '', body.message ? `Message: ${body.message}` : ''].filter(Boolean);
          if (site.form_endpoint) {
            const r = await fetch(site.form_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...body, product_name: pname, _subject: lines[0] }) });
            if (!r.ok) throw new Error('Could not send right now. Please use WhatsApp or call us.');
          } else {
            j.wa = waLink(site, lines.join('\n'));
          }
        } else {
          const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          j = await r.json(); if (!r.ok) throw new Error(j.error || 'Something went wrong.');
        }
        window.seyonAnalytics && window.seyonAnalytics.track('lead_submitted', {
          type,
          product: body.product || null,
          source: 'enquiry_modal'
        });
        const completion = type === 'demo'
          ? 'Our team will contact you to discuss the product and what you would like to see.'
          : 'We have received your request and will contact you soon.';
        card.innerHTML = `<button class="eq-x" type="button" aria-label="Close">✕</button><div class="eq-done"><div class="tick">✓</div>
          <h3>${j.wa ? 'One last step' : j.duplicate ? 'You are already on the list' : 'Thank you!'}</h3><p>${j.wa ? 'Tap the button to send your details to our team on WhatsApp. Your message is already written for you.' : j.duplicate ? 'We already have your email for this product.' : completion}</p>
          <div class="eq-actions">${j.wa ? `<a class="btn wa" href="${esc(j.wa)}" target="_blank" rel="noopener">💬 Send on WhatsApp</a>` : ''}<button class="btn ${j.wa ? '' : 'primary'}" type="button" data-done>${j.wa ? 'Close' : 'Done'}</button></div></div>`;
        const doneBtn = card.querySelector('[data-done]'); card.querySelector('.eq-x').onclick = closeEnquiry; doneBtn.onclick = closeEnquiry; (card.querySelector('.wa') || doneBtn).focus();
      } catch (err) { btn.disabled = false; bad(err.message); }
    };
    // keep focus inside the dialog
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return; const f = [...card.querySelectorAll('button,input,select,textarea')].filter((x) => !x.disabled && x.offsetParent);
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); }
    });
  }
  function closeEnquiry() { if (!root) return; root.remove(); root = null; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root) closeEnquiry(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-enquiry]'); if (!b) return; e.preventDefault();
    openEnquiry({ type: b.dataset.enquiry, product: b.dataset.product, service: b.dataset.service });
  });
  window.openEnquiry = openEnquiry; window.closeEnquiry = closeEnquiry;
})();
