function productLogoMarkup(product) {
  const logo = product.slug === 'kadai' ? '/assets/products/kadai/logo-mark.svg' : product.logo;
  return `<span class="product-symbol" data-product="${esc(product.slug)}">
    <img src="${esc(logo)}" alt="" width="152" height="152">
  </span>`;
}

function initProductExplorer(products) {
  const switcher = document.getElementById('productSwitcher');
  const preview = document.getElementById('heroVis');
  const description = document.getElementById('previewDescription');
  const link = document.getElementById('previewLink');
  const previous = document.getElementById('previewPrev');
  const next = document.getElementById('previewNext');
  const motionToggle = document.getElementById('motionToggle');
  const featuredProducts = document.getElementById('featuredProducts');

  motionToggle.addEventListener('click', () => {
    const paused = document.body.classList.toggle('motion-paused');
    const label = paused ? 'Play animations' : 'Pause animations';
    motionToggle.textContent = paused ? '▶ Play' : 'Ⅱ Pause';
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.setAttribute('aria-label', label);
    motionToggle.title = label;
  });

  if (!products.length) {
    featuredProducts.innerHTML = '<p class="empty">Product details will be available here.</p>';
    preview.innerHTML = '<p class="empty">Product previews will be available here.</p>';
    previous.disabled = true;
    next.disabled = true;
    return;
  }

  let selected = 0;
  featuredProducts.innerHTML = products.map(product => `
    <a class="featured-product" href="/products/${esc(product.slug)}"
      style="--product-accent:${esc(product.accent || '#6366f1')}">
      <span class="featured-icon">${productLogoMarkup(product)}</span>
      <div><h3>${esc(product.name)}</h3><p>${esc(product.summary || product.tagline)}</p></div>
    </a>`).join('');
  switcher.innerHTML = products.map((product, index) => {
    return `<button type="button" class="product-choice" data-index="${index}"
      aria-label="Preview ${esc(product.name)}" aria-pressed="false" aria-controls="heroVis"
      style="--product-accent:${esc(product.accent || '#6366f1')}">
      <span class="product-logo-tile">${productLogoMarkup(product)}</span>
      <span class="product-logo-name">${esc(product.name)}</span>
    </button>`;
  }).join('');

  function render(index) {
    preview.style.setProperty('--preview-enter-x', index < selected ? '-20px' : '20px');
    selected = (index + products.length) % products.length;
    const product = products[selected];
    preview.style.setProperty('--product-accent', product.accent || '#6366f1');
    preview.parentElement.style.setProperty('--product-accent', product.accent || '#6366f1');
    const previewScreen = product.screens && product.screens.find((screen) => screen.kind === PRODUCT_ART_SCREENS[product.slug]);
    const artwork = product.artwork
      ? `<img class="product-artwork" src="${esc(product.artwork)}" alt="${esc(productArtworkAlt(product))}" decoding="async">`
      : previewScreen && typeof screenHTML === 'function' ? screenHTML(product, previewScreen) : mock(product, true);
    preview.innerHTML = `<div class="preview-window ${product.frame === 'phone' ? 'mobile-preview' : ''}">
      <div class="preview-brand"><img src="${esc(product.logo)}" alt="" width="100" height="54">
        <strong>${esc(product.name)}</strong><span>${esc(product.category)}</span></div>
      <div class="preview-screen product-art-${esc(product.slug)}">${artwork}</div>
    </div>`;
    description.innerHTML = `<strong>${esc(product.name)}</strong><span>${esc(product.tagline)}</span>`;
    link.href = '/products/' + product.slug;
    link.innerHTML = `Explore ${esc(product.name)} <span aria-hidden="true">↗</span>`;
    link.setAttribute('aria-label', 'View ' + product.name);
    switcher.querySelectorAll('button').forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === selected));
    });
  }

  switcher.addEventListener('click', event => {
    const button = event.target.closest('button[data-index]');
    if (button) render(Number(button.dataset.index));
  });
  previous.addEventListener('click', () => render(selected - 1));
  next.addEventListener('click', () => render(selected + 1));
  previous.disabled = products.length < 2;
  next.disabled = products.length < 2;
  render(selected);
}
