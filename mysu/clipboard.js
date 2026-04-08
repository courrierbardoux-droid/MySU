/* ============================================
   MySU — Panier email cumulatif — Phase 3
   ============================================ */

const Clipboard = (() => {
  // Cumulative email basket (persists during session)
  let basket = [];

  function getBasket() {
    return basket;
  }

  function getCount() {
    return basket.length;
  }

  // Add articles to the basket
  function addToBasket(articles) {
    basket.push(...articles);
    updateBadge();
    UI.showToast(articles.length + ' article(s) ajouté(s) au panier email');
  }

  // Clear the basket
  function clearBasket() {
    basket = [];
    updateBadge();
  }

  // Remove a single article from basket by index
  function removeFromBasket(index) {
    basket.splice(index, 1);
    updateBadge();
  }

  // Format all basket articles into a text block
  function formatBasket() {
    return basket.map((a, i) => {
      let line = `Article ${i + 1} : ${a.product}`;
      if (a.tpe) line += ` | TPE: ${a.tpe}`;
      if (a.base && a.base !== '—' && a.base !== '') line += ` | Base: ${a.base}`;
      if (a.banque) line += ` | ${a.banque}`;
      return line;
    }).join('\n');
  }

  // Copy basket content to clipboard and open Gmail
  async function sendEmail() {
    if (basket.length === 0) {
      UI.showToast('Le panier email est vide');
      return;
    }

    const text = formatBasket();

    try {
      await navigator.clipboard.writeText(text);
      UI.showToast('Copié ! Gmail s\'ouvre...');

      // Open Gmail compose (native intent on Android, web on desktop)
      const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&body=' +
                        encodeURIComponent(text);

      // Try Android intent first, fallback to web Gmail
      const intentUrl = 'intent://compose?body=' + encodeURIComponent(text) +
                         '#Intent;scheme=mailto;package=com.google.android.gm;end';

      // Check if on mobile
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

      if (isMobile && /Android/i.test(navigator.userAgent)) {
        // Try Gmail app intent
        window.location.href = 'mailto:?body=' + encodeURIComponent(text);
      } else {
        window.open(gmailUrl, '_blank');
      }
    } catch (err) {
      // Fallback: try mailto
      window.location.href = 'mailto:?body=' + encodeURIComponent(text);
      UI.showToast('Contenu prêt à coller dans l\'email');
    }
  }

  // Update the badge counter on the Email button
  function updateBadge() {
    const badge = document.getElementById('email-badge');
    if (basket.length > 0) {
      badge.textContent = basket.length;
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  }

  // Show basket preview
  function showBasketPreview() {
    if (basket.length === 0) {
      UI.showToast('Le panier email est vide');
      return;
    }

    const modal = document.getElementById('basket-modal');
    const list = document.getElementById('basket-list');

    list.innerHTML = '';
    basket.forEach((a, i) => {
      const div = document.createElement('div');
      div.className = 'basket-item';
      div.innerHTML = `
        <div class="basket-item-info">
          <strong>${esc(a.product)}</strong>
          ${a.tpe ? `<span>TPE: ${esc(a.tpe)}</span>` : ''}
          ${a.banque ? `<span>${esc(a.banque)}</span>` : ''}
        </div>
        <button class="basket-item-remove" data-index="${i}">✕</button>
      `;
      list.appendChild(div);
    });

    // Bind remove buttons
    list.querySelectorAll('.basket-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromBasket(parseInt(btn.dataset.index));
        showBasketPreview(); // Refresh
      });
    });

    document.getElementById('basket-count').textContent =
      basket.length + ' article(s) dans le panier';

    modal.classList.add('visible');
  }

  function closeBasketPreview() {
    document.getElementById('basket-modal').classList.remove('visible');
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    getBasket,
    getCount,
    addToBasket,
    clearBasket,
    sendEmail,
    showBasketPreview,
    closeBasketPreview,
    updateBadge
  };
})();
