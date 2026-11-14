// Illustrated feature screens (sample data). Each kind draws a different type of app screen.
function screenHTML(p, s) {
  const d = s.data || {};
  const phone = p.frame === 'phone';
  let body = '';
  if (s.kind === 'list') return mock({ ...p, mock: { title: s.title, ...d, callouts: [] } }, false).replace(/<span class="dot d\d">\d<\/span>/g, '');
  if (s.kind === 'bars') {
    body = `<div class="mk-hero"><small>${esc(d.total[0])}</small><strong>${esc(d.total[1])}</strong></div>
      <div class="mk-bars">${d.bars.map((b, i) => `<div class="bar"><span>${esc(b[0])}</span><i style="--w:${b[1]}%;--c:${['var(--a)', '#34c759', '#ff9f0a', '#ff375f', '#af52de'][i % 5]}"></i><em>${esc(b[2])}</em></div>`).join('')}</div>`;
  } else if (s.kind === 'form') {
    body = `<div class="mk-form">${d.lines.map((l) => `<div class="ln"><span>${esc(l[0])}</span><b>${esc(l[1])}</b></div>`).join('')}
      <div class="ln tot"><span>${esc(d.total[0])}</span><b>${esc(d.total[1])}</b></div></div><div class="mk-btn">${esc(d.button)}</div>`;
  } else if (s.kind === 'slots') {
    body = `<div class="mk-slots">${d.slots.map((x) => `<div class="sl ${x[1]}"><b>${esc(x[0])}</b><span>${x[1] === 'free' ? 'Free' : x[1] === 'booked' ? 'Booked' : 'Past'}</span></div>`).join('')}</div><div class="mk-btn">Continue</div>`;
  } else if (s.kind === 'qr') {
    let cells = ''; for (let i = 0; i < 169; i++) { const x = i % 13, y = (i / 13) | 0; const eye = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8); cells += `<i class="${eye || ((x * 7 + y * 13 + x * y) % 3 === 0) ? 'on' : ''}"></i>`; }
    body = `<div class="mk-qr"><div class="qr">${cells}</div><p>${esc(d.caption)}</p></div><div class="mk-btn">${esc(d.button)}</div>`;
  } else if (s.kind === 'cal') {
    const marks = new Set(d.marks || []); let days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x) => `<b>${x}</b>`).join('');
    for (let i = 1; i <= 30; i++) days += `<i class="${marks.has(i) ? 'on' : ''}">${i}</i>`;
    body = `<div class="mk-cal">${days}</div><p class="note" style="text-align:center;margin:0">Sample month</p>`;
  } else if (s.kind === 'kanban') {
    body = `<div class="mk-kan">${d.cols.map((c, i) => `<div class="col"><h6 style="--c:${['#0a84ff', '#ff9f0a', '#34c759'][i % 3]}">${esc(c[0])}</h6>${c[1].map((t) => `<div class="kc">${esc(t)}</div>`).join('')}</div>`).join('')}</div>`;
  } else if (s.kind === 'chat') {
    body = `<div class="mk-chat">${d.msgs.map((m) => `<div class="msg-b ${m[0]}">${esc(m[1])}</div>`).join('')}</div>`;
  }
  const inner = `<div class="mk-bar"><i></i><i></i><i></i><b>${esc(s.title)}</b></div><div class="mk-body">${body}</div>`;
  return `<div class="mk ${phone ? 'phone' : ''}" style="--a:${esc(p.accent)}" role="img" aria-label="Illustrative ${esc(s.title)} screen with sample data">${phone ? `<div class="mk-in">${inner}</div>` : inner}</div>`;
}

// Feature tour: tabs + big screen + caption.
function featureTour(p) {
  if (!p.screens || !p.screens.length) return '';
  const id = 'tour-' + p.slug;
  const html = `<section class="s"><div class="wrap"><h2>Feature <span class="gt">tour</span></h2><p class="sub">Tap through the screens. All illustrations use sample data.</p>
    <div class="tabs" id="${id}-tabs" role="tablist">${p.screens.map((s, i) => `<button role="tab" class="tab ${i ? '' : 'on'}" data-i="${i}" style="--c:${['#0a84ff', '#34c759', '#ff9f0a', '#ff375f', '#af52de', '#5ac8fa'][i % 6]}">${esc(s.tab)}</button>`).join('')}</div>
    <div class="tour" id="${id}-stage"></div></div></section>`;
  setTimeout(() => {
    const stage = document.getElementById(id + '-stage'), tabs = document.getElementById(id + '-tabs'); if (!stage) return;
    const show = (i) => {
      const s = p.screens[i]; const c = ['#0a84ff', '#34c759', '#ff9f0a', '#ff375f', '#af52de', '#5ac8fa'][i % 6];
      stage.style.setProperty('--tc', c);
      stage.innerHTML = `<div class="tour-screen">${screenHTML(p, s)}</div>
        <div class="tour-text"><span class="tag" style="background:${c}">${esc(s.caption)}</span><h3>${esc(s.title)}</h3>
        <ul>${s.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
      tabs.querySelectorAll('.tab').forEach((b, n) => b.classList.toggle('on', n === i));
    };
    tabs.onclick = (e) => { const b = e.target.closest('.tab'); if (b) show(+b.dataset.i); };
    show(0);
    // gentle auto-advance until the visitor interacts
    let n = 0, t = setInterval(() => { n = (n + 1) % p.screens.length; show(n); }, 6000);
    tabs.addEventListener('click', () => clearInterval(t), { once: true });
  }, 0);
  return html;
}
