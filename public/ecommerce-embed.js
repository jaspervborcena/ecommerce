(function () {
  try {
    const widgets = document.querySelectorAll('[id="tovrika-buy-button"][data-token][data-product-id][data-store-id]');
    if (!widgets.length) {
      return;
    }

    const scriptEl = document.currentScript;
    const hostUrl = scriptEl && scriptEl.src
      ? new URL(scriptEl.src).origin
      : window.location.origin;

    widgets.forEach(widget => {
      if (widget.dataset.rendered === '1') return;

      const token = widget.dataset.token || 'unknown-token';
      const productId = widget.dataset.productId || 'unknown-product';
      const storeId = widget.dataset.storeId || 'unknown-store';
      const previewUrl = productId && productId !== 'unknown-product'
        ? `${hostUrl}/product/${encodeURIComponent(productId)}`
        : `${hostUrl}/store/${encodeURIComponent(storeId)}`;

      const container = document.createElement('div');
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.border = '1px solid #d1d5db';
      container.style.borderRadius = '12px';
      container.style.background = '#ffffff';
      container.style.padding = '16px';
      container.style.maxWidth = '360px';
      container.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.08)';
      container.style.color = '#111827';
      container.style.boxSizing = 'border-box';

      const title = document.createElement('div');
      title.textContent = 'Tovrika Storefront';
      title.style.fontSize = '16px';
      title.style.fontWeight = '700';
      title.style.marginBottom = '10px';
      container.appendChild(title);

      const info = document.createElement('div');
      info.style.fontSize = '14px';
      info.style.color = '#4b5563';
      info.style.marginBottom = '12px';
      info.innerHTML = `Product <strong>${productId}</strong><br/>Store <strong>${storeId}</strong>`;
      container.appendChild(info);

      const button = document.createElement('button');
      button.textContent = 'Open Storefront Preview';
      button.style.border = 'none';
      button.style.borderRadius = '8px';
      button.style.background = '#4338ca';
      button.style.color = '#ffffff';
      button.style.cursor = 'pointer';
      button.style.fontSize = '14px';
      button.style.padding = '10px 18px';
      button.style.fontWeight = '600';
      button.addEventListener('click', function () {
        window.open(previewUrl, '_blank', 'noopener,noreferrer,width=1080,height=900');
      });
      container.appendChild(button);

      const note = document.createElement('div');
      note.style.fontSize = '12px';
      note.style.color = '#6b7280';
      note.style.marginTop = '12px';
      note.textContent = 'Opens the hosted storefront preview for this product or store.';
      container.appendChild(note);

      widget.innerHTML = '';
      widget.appendChild(container);
      widget.dataset.rendered = '1';
    });
  } catch (error) {
    console.error('Tovrika embed script error:', error);
  }
})();
