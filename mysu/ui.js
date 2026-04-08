/* ============================================
   MySU — Interface utilisateur
   ============================================ */

const UI = (() => {
  // Known product types
  const PRODUCTS = [
    'A920PRO', 'A99CLAVIER', 'A99WIFI4GBT', 'AXIUM DX8000',
    'BASE A920PRO', 'BASE A99', 'BASE DX8000',
    'DESK1500', 'DESK1600', 'DESK5000', 'DESK5000CL2LSMBW',
    'ICT250', 'IWL250', 'IWL253',
    'MOVE5000',
    'P2PRO',
    'POL-A99', 'POL-DESK5000', 'POL-DESK5000CL2LSMBW',
    'Q25'
  ];

  // Products that have a base on the same line
  const HAS_BASE = ['MOVE5000', 'A920PRO', 'P2PRO', 'IWL250', 'IWL253'];

  const BANQUES = ['JDC', 'CRCA31'];
  const CLIENTS = ['MLSTECH / BARDOUX A.', 'RECEP. (RET. GARANTIE)', 'RECEPTION'];

  let selectedRows = new Set();
  let currentActionRow = null;

  function init() {
    setupAddForm();
    setupMenu();
    setupActionSheet();
    setupConfirmDialog();
    setupSelectionBanner();
  }

  // ---- RENDER TABLE ----

  function renderTable(rows) {
    const { stock, demandes } = Sheets.parseRows(rows);

    // Cache data for offline
    try { localStorage.setItem('mysu_cache', JSON.stringify(rows)); } catch(e) {}

    renderStockTable(stock);
    renderDemandesTable(demandes);
    Gestures.init();
    selectedRows.clear();
    updateSelectionBanner();
  }

  function renderStockTable(stock) {
    const tbody = document.querySelector('#stock-table tbody');
    tbody.innerHTML = '';

    if (stock.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">Aucun article en stock</td></tr>';
      return;
    }

    stock.forEach(item => {
      const tr = document.createElement('tr');
      tr.dataset.rowIndex = item.rowIndex;
      tr.dataset.product = item.data[0] || '';

      // Check for status (stored in localStorage)
      const status = getRowStatus(item.rowIndex);
      if (status) tr.classList.add('status-' + status);

      const cells = [
        `<td class="col-check"><input type="checkbox" data-row="${item.rowIndex}"></td>`,
        `<td>${esc(item.data[0] || '')}</td>`,
        `<td>${esc(item.data[1] || '')}</td>`,
        `<td>${esc(item.data[2] || '')}</td>`,
        `<td>${esc(item.data[3] || '')}</td>`,
        `<td>${esc(item.data[4] || '')}</td>`,
        `<td>${esc(item.data[5] || '')}</td>`
      ];

      tr.innerHTML = cells.join('');

      // Checkbox event
      const cb = tr.querySelector('input[type="checkbox"]');
      cb.addEventListener('change', () => onCheckboxChange(item.rowIndex, cb.checked));

      tbody.appendChild(tr);
    });
  }

  function renderDemandesTable(demandes) {
    const tbody = document.querySelector('#demandes-table tbody');
    tbody.innerHTML = '';

    if (demandes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:20px;">Aucune demande</td></tr>';
      return;
    }

    demandes.forEach(item => {
      const tr = document.createElement('tr');
      const cells = [
        `<td>${esc(item.data[0] || '')}</td>`,
        `<td>${esc(item.data[1] || '')}</td>`,
        `<td>${esc(item.data[2] || '')}</td>`
      ];
      tr.innerHTML = cells.join('');
      tbody.appendChild(tr);
    });
  }

  // ---- SELECTION ----

  function onCheckboxChange(rowIndex, checked) {
    if (checked) {
      selectedRows.add(rowIndex);
    } else {
      selectedRows.delete(rowIndex);
    }
    updateSelectionBanner();
  }

  function updateSelectionBanner() {
    const banner = document.getElementById('selection-banner');
    const count = document.getElementById('sel-count');

    if (selectedRows.size > 0) {
      banner.classList.add('visible');
      count.textContent = selectedRows.size + ' article(s) sélectionné(s)';
    } else {
      banner.classList.remove('visible');
    }
  }

  function setupSelectionBanner() {
    document.getElementById('btn-sel-copy').addEventListener('click', () => {
      copySelectedToClipboard();
    });

    document.getElementById('btn-sel-email').addEventListener('click', () => {
      const articles = getSelectedData();
      if (articles.length > 0) {
        Clipboard.addToBasket(articles);
        clearSelection();
      }
    });

    document.getElementById('btn-sel-cancel').addEventListener('click', () => {
      clearSelection();
    });
  }

  function clearSelection() {
    selectedRows.clear();
    document.querySelectorAll('#stock-table input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateSelectionBanner();
  }

  function getSelectedData() {
    const rows = [];
    const allTrs = document.querySelectorAll('#stock-table tbody tr');
    allTrs.forEach(tr => {
      const ri = parseInt(tr.dataset.rowIndex);
      if (selectedRows.has(ri)) {
        const tds = tr.querySelectorAll('td');
        rows.push({
          product: tds[1]?.textContent || '',
          tpe: tds[2]?.textContent || '',
          base: tds[3]?.textContent || '',
          banque: tds[4]?.textContent || ''
        });
      }
    });
    return rows;
  }

  function formatArticles(articles) {
    return articles.map((a, i) => {
      let line = `Article ${i + 1} : ${a.product}`;
      if (a.tpe) line += ` | TPE: ${a.tpe}`;
      if (a.base && a.base !== '—') line += ` | Base: ${a.base}`;
      if (a.banque) line += ` | ${a.banque}`;
      return line;
    }).join('\n');
  }

  async function copySelectedToClipboard() {
    const articles = getSelectedData();
    if (articles.length === 0) return;

    const text = formatArticles(articles);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copié dans le presse-papier !');
    } catch {
      showToast('Erreur de copie');
    }
    clearSelection();
  }

  // ---- ADD FORM ----

  function setupAddForm() {
    const modal = document.getElementById('add-modal');
    const select = document.getElementById('add-product');
    const baseGroup = document.getElementById('add-base-group');

    // Populate product list
    PRODUCTS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      select.appendChild(opt);
    });
    const optNew = document.createElement('option');
    optNew.value = '__new__';
    optNew.textContent = '+ Nouveau type...';
    select.appendChild(optNew);

    // Show/hide base field based on product
    select.addEventListener('change', () => {
      const showBase = HAS_BASE.includes(select.value);
      baseGroup.style.display = showBase ? 'block' : 'none';
    });

    // Set default date
    document.getElementById('add-date').valueAsDate = new Date();

    // Banque buttons
    setupChoiceButtons('banque-buttons', 'add-banque-value');

    // Client buttons
    setupChoiceButtons('client-buttons', 'add-client-value');

    // Submit
    document.getElementById('btn-add-submit').addEventListener('click', onAddSubmit);

    // Cancel
    document.getElementById('btn-add-cancel').addEventListener('click', () => {
      modal.classList.remove('visible');
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('visible');
    });
  }

  function setupChoiceButtons(containerId, hiddenId) {
    const container = document.getElementById(containerId);
    const hidden = document.getElementById(hiddenId);

    container.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        hidden.value = btn.dataset.value;
      });
    });
  }

  function openAddForm() {
    const modal = document.getElementById('add-modal');
    // Reset form
    document.getElementById('add-product').value = PRODUCTS[0];
    document.getElementById('add-tpe').value = '';
    document.getElementById('add-base').value = '';
    document.getElementById('add-date').valueAsDate = new Date();
    document.getElementById('add-banque-value').value = 'JDC';
    document.getElementById('add-client-value').value = 'MLSTECH / BARDOUX A.';
    document.getElementById('add-base-group').style.display =
      HAS_BASE.includes(PRODUCTS[0]) ? 'block' : 'none';

    // Reset button selections
    document.querySelectorAll('#banque-buttons .choice-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.value === 'JDC');
    });
    document.querySelectorAll('#client-buttons .choice-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.value === 'MLSTECH / BARDOUX A.');
    });

    modal.classList.add('visible');
  }

  async function onAddSubmit() {
    const product = document.getElementById('add-product').value;
    let productName = product;

    if (product === '__new__') {
      productName = prompt('Nom du nouveau type de produit :');
      if (!productName) return;
      productName = productName.toUpperCase().trim();
    }

    const tpe = document.getElementById('add-tpe').value.trim();
    const base = document.getElementById('add-base').value.trim();
    const banque = document.getElementById('add-banque-value').value;
    const dateInput = document.getElementById('add-date').value;
    const client = document.getElementById('add-client-value').value;

    // Format date JJ/MM/AAAA
    let dateFormatted = '';
    if (dateInput) {
      const d = new Date(dateInput);
      dateFormatted = String(d.getDate()).padStart(2, '0') + '/' +
                      String(d.getMonth() + 1).padStart(2, '0') + '/' +
                      d.getFullYear();
    }

    const values = [productName, tpe, base, banque, dateFormatted, client];

    document.getElementById('add-modal').classList.remove('visible');

    if (!navigator.onLine) {
      Offline.queueAdd(values);
      return;
    }

    showLoading(true);

    try {
      await Sheets.addRow(App.getSheetId(), values);
      showToast('Article ajouté !');
      await App.refresh();
    } catch (err) {
      // If network error, queue for later
      if (!navigator.onLine) {
        Offline.queueAdd(values);
      } else {
        showToast('Erreur : ' + err.message);
        console.error(err);
      }
    } finally {
      showLoading(false);
    }
  }

  // ---- ACTION SHEET (swipe actions) ----

  function setupActionSheet() {
    document.getElementById('btn-action-cancel').addEventListener('click', closeActionSheet);
    document.getElementById('action-sheet').addEventListener('click', (e) => {
      if (e.target.id === 'action-sheet') closeActionSheet();
    });
  }

  function showActionSheet(type, rowIndex, product) {
    currentActionRow = rowIndex;
    const sheet = document.getElementById('action-sheet');
    const content = document.getElementById('action-sheet-content');

    const subtitle = document.querySelector('.action-subtitle');
    subtitle.textContent = product || 'Ligne ' + (rowIndex + 1);

    const optionsContainer = document.getElementById('action-options');
    optionsContainer.innerHTML = '';

    if (type === 'sortie') {
      content.querySelector('h3').textContent = 'Sortie';
      optionsContainer.innerHTML = `
        <div class="action-option green" data-action="pose">
          <div class="action-icon">📦</div>
          <div>
            <div class="action-text">Poser chez client</div>
            <div class="action-desc">Marquer comme posé (fond vert)</div>
          </div>
        </div>
        <div class="action-option gray" data-action="transfer">
          <div class="action-icon">🤝</div>
          <div>
            <div class="action-text">Transférer à un collègue</div>
            <div class="action-desc">Marquer comme transféré (fond gris)</div>
          </div>
        </div>
      `;
    } else {
      content.querySelector('h3').textContent = 'Retour';
      optionsContainer.innerHTML = `
        <div class="action-option blue" data-action="agence">
          <div class="action-icon">🏢</div>
          <div>
            <div class="action-text">Renvoyer en agence</div>
            <div class="action-desc">Retour du TPE à l'agence</div>
          </div>
        </div>
        <div class="action-option red" data-action="delete">
          <div class="action-icon">🗑️</div>
          <div>
            <div class="action-text">Supprimer</div>
            <div class="action-desc">Retirer du stock (suppression Sheet)</div>
          </div>
        </div>
      `;
    }

    // Bind clicks
    optionsContainer.querySelectorAll('.action-option').forEach(opt => {
      opt.addEventListener('click', () => onActionSelected(opt.dataset.action));
    });

    sheet.classList.add('visible');
  }

  function closeActionSheet() {
    document.getElementById('action-sheet').classList.remove('visible');
    currentActionRow = null;
  }

  async function onActionSelected(action) {
    closeActionSheet();
    const rowIndex = currentActionRow;
    if (rowIndex === null) return;

    switch (action) {
      case 'pose':
        setRowStatus(rowIndex, 'posed');
        updateRowVisual(rowIndex, 'posed');
        showToast('Marqué comme posé');
        break;

      case 'transfer':
        setRowStatus(rowIndex, 'transferred');
        updateRowVisual(rowIndex, 'transferred');
        showToast('Marqué comme transféré');
        break;

      case 'agence':
        setRowStatus(rowIndex, 'deleted');
        updateRowVisual(rowIndex, 'deleted');
        showToast('Marqué pour retour agence');
        break;

      case 'delete':
        showConfirm(
          'Supprimer cet article ?',
          'Cette action supprimera la ligne dans le Google Sheet.',
          async () => {
            showLoading(true);
            try {
              await Sheets.deleteRow(App.getSheetId(), rowIndex);
              removeRowStatus(rowIndex);
              showToast('Article supprimé');
              await App.refresh();
            } catch (err) {
              showToast('Erreur : ' + err.message);
            } finally {
              showLoading(false);
            }
          }
        );
        break;
    }
  }

  function updateRowVisual(rowIndex, status) {
    const tr = document.querySelector(`#stock-table tbody tr[data-row-index="${rowIndex}"]`);
    if (!tr) return;
    tr.classList.remove('status-posed', 'status-transferred', 'status-deleted');
    if (status) tr.classList.add('status-' + status);
  }

  // ---- ROW STATUS (localStorage) ----

  function getStatusStore() {
    try { return JSON.parse(localStorage.getItem('mysu_statuses') || '{}'); } catch { return {}; }
  }

  function getRowStatus(rowIndex) {
    return getStatusStore()[rowIndex] || null;
  }

  function setRowStatus(rowIndex, status) {
    const store = getStatusStore();
    store[rowIndex] = status;
    localStorage.setItem('mysu_statuses', JSON.stringify(store));
  }

  function removeRowStatus(rowIndex) {
    const store = getStatusStore();
    delete store[rowIndex];
    localStorage.setItem('mysu_statuses', JSON.stringify(store));
  }

  // ---- MENU ----

  function setupMenu() {
    document.getElementById('btn-menu-close').addEventListener('click', closeMenu);
    document.getElementById('menu-overlay').addEventListener('click', closeMenu);

    document.getElementById('btn-logout').addEventListener('click', () => {
      closeMenu();
      App.logout();
    });

    document.getElementById('btn-change-sheet').addEventListener('click', () => {
      closeMenu();
      App.changeSheet();
    });

    // Save settings on change
    document.getElementById('menu-sheet-name').addEventListener('change', (e) => {
      localStorage.setItem('mysu_sheet_name', e.target.value);
    });
  }

  function openMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');

    // Fill current values
    document.getElementById('menu-sheet-name').value =
      localStorage.getItem('mysu_sheet_name') || '';
    document.getElementById('menu-sheet-id').value =
      App.getSheetId() || '';
    document.getElementById('menu-email').textContent =
      App.getUserEmail() || 'Non connecté';

    menu.classList.add('open');
    overlay.classList.add('visible');
  }

  function closeMenu() {
    document.getElementById('side-menu').classList.remove('open');
    document.getElementById('menu-overlay').classList.remove('visible');
  }

  // ---- CONFIRM DIALOG ----

  let confirmCallback = null;

  function setupConfirmDialog() {
    document.getElementById('btn-confirm-no').addEventListener('click', () => {
      document.getElementById('confirm-dialog').classList.remove('visible');
    });
    document.getElementById('btn-confirm-yes').addEventListener('click', () => {
      document.getElementById('confirm-dialog').classList.remove('visible');
      if (confirmCallback) confirmCallback();
    });
  }

  function showConfirm(title, message, callback) {
    document.querySelector('#confirm-dialog-box h3').textContent = title;
    document.querySelector('#confirm-dialog-box p').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirm-dialog').classList.add('visible');
  }

  // ---- TOAST ----

  let toastTimer = null;

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  // ---- LOADING ----

  function showLoading(show) {
    document.getElementById('loading').classList.toggle('visible', show);
  }

  // ---- UTILS ----

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- PUBLIC ----

  return {
    init,
    renderTable,
    openAddForm,
    openMenu,
    showActionSheet,
    showToast,
    showLoading,
    showConfirm,
    formatArticles,
    getSelectedData,
    clearSelection
  };
})();
