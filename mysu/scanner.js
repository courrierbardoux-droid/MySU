/* ============================================
   MySU — Scanner barcode (ZXing-js) — Phase 2
   ============================================ */

const Scanner = (() => {
  let codeReader = null;
  let activeStream = null;
  let scanning = false;
  let lastResult = '';
  let lastResultTime = 0;

  async function open() {
    if (scanning) return;

    const overlay = document.getElementById('scanner-overlay');
    const video = document.getElementById('scanner-video');
    const status = document.getElementById('scanner-status');

    overlay.classList.add('visible');
    status.textContent = 'Initialisation de la caméra...';

    try {
      // Initialize ZXing reader
      if (!codeReader) {
        codeReader = new ZXing.BrowserMultiFormatReader();
      }

      scanning = true;
      lastResult = '';

      // Get available cameras and prefer back camera
      const devices = await codeReader.listVideoInputDevices();
      let selectedId = null;

      for (const device of devices) {
        const label = (device.label || '').toLowerCase();
        if (label.includes('back') || label.includes('arrière') || label.includes('rear') || label.includes('environment')) {
          selectedId = device.deviceId;
          break;
        }
      }

      // If no back camera found, use the last device (usually back on mobile)
      if (!selectedId && devices.length > 0) {
        selectedId = devices[devices.length - 1].deviceId;
      }

      status.textContent = 'Recherche de barcode...';

      // Start continuous decode
      codeReader.decodeFromVideoDevice(selectedId, 'scanner-video', (result, err) => {
        if (result) {
          const code = result.getText();
          const now = Date.now();

          // Debounce: ignore same code within 3 seconds
          if (code === lastResult && now - lastResultTime < 3000) return;

          lastResult = code;
          lastResultTime = now;

          onBarcodeDetected(code, result.getBarcodeFormat());
        }
        // Errors are normal (no barcode in frame), ignore them
      });

    } catch (err) {
      console.error('Scanner error:', err);

      if (err.name === 'NotAllowedError') {
        status.textContent = 'Accès caméra refusé. Autorise la caméra dans les paramètres.';
      } else if (err.name === 'NotFoundError') {
        status.textContent = 'Aucune caméra trouvée.';
      } else {
        status.textContent = 'Erreur caméra : ' + err.message;
      }

      scanning = false;
    }
  }

  function close() {
    scanning = false;

    if (codeReader) {
      codeReader.reset();
    }

    const overlay = document.getElementById('scanner-overlay');
    overlay.classList.remove('visible');
  }

  function onBarcodeDetected(code, format) {
    // Vibrate for feedback
    if (navigator.vibrate) navigator.vibrate(100);

    // Flash the scan zone green
    const scanZone = document.getElementById('scanner-zone');
    scanZone.classList.add('detected');
    setTimeout(() => scanZone.classList.remove('detected'), 500);

    // Update status
    const status = document.getElementById('scanner-status');
    status.textContent = 'Barcode détecté : ' + code;

    // Search in stock
    const match = searchInStock(code);

    if (match) {
      // Found in stock — show result with actions
      close();
      showScanResult(match, code);
    } else {
      // Not found — propose to add
      close();
      showNotFound(code);
    }
  }

  function searchInStock(code) {
    // Search in cached data
    const cached = localStorage.getItem('mysu_cache');
    if (!cached) return null;

    const rows = JSON.parse(cached);
    const { stock } = Sheets.parseRows(rows);

    for (const item of stock) {
      // Check TPE column (index 1) and Base column (index 2)
      const tpe = (item.data[1] || '').trim();
      const base = (item.data[2] || '').trim();

      if (tpe === code || base === code) {
        return item;
      }
    }

    return null;
  }

  function showScanResult(item, code) {
    const sheet = document.getElementById('scan-result');
    const content = document.getElementById('scan-result-content');

    const product = item.data[0] || '';
    const tpe = item.data[1] || '';
    const base = item.data[2] || '';
    const banque = item.data[3] || '';
    const date = item.data[4] || '';
    const client = item.data[5] || '';

    content.innerHTML = `
      <h3>Article trouvé !</h3>
      <div class="scan-result-info">
        <div class="scan-result-row"><strong>Produit :</strong> ${esc(product)}</div>
        <div class="scan-result-row"><strong>TPE :</strong> ${esc(tpe)}</div>
        ${base ? `<div class="scan-result-row"><strong>Base :</strong> ${esc(base)}</div>` : ''}
        <div class="scan-result-row"><strong>Banque :</strong> ${esc(banque)}</div>
        <div class="scan-result-row"><strong>Date :</strong> ${esc(date)}</div>
        <div class="scan-result-row"><strong>Client :</strong> ${esc(client)}</div>
      </div>
      <div class="scan-result-code">Code scanné : ${esc(code)}</div>
      <div id="scan-result-actions">
        <div class="action-option green" data-action="pose" data-row="${item.rowIndex}">
          <div class="action-icon">📦</div>
          <div>
            <div class="action-text">Poser chez client</div>
            <div class="action-desc">Marquer comme posé (fond vert)</div>
          </div>
        </div>
        <div class="action-option gray" data-action="transfer" data-row="${item.rowIndex}">
          <div class="action-icon">🤝</div>
          <div>
            <div class="action-text">Transférer à un collègue</div>
            <div class="action-desc">Marquer comme transféré (fond gris)</div>
          </div>
        </div>
        <div class="action-option red" data-action="delete" data-row="${item.rowIndex}">
          <div class="action-icon">🗑️</div>
          <div>
            <div class="action-text">Supprimer</div>
            <div class="action-desc">Retirer du stock</div>
          </div>
        </div>
      </div>
      <button class="scan-result-btn-secondary" id="btn-scan-result-rescan">Nouveau scan</button>
      <button class="scan-result-btn-cancel" id="btn-scan-result-close">Fermer</button>
    `;

    // Bind action clicks
    content.querySelectorAll('.action-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const action = opt.dataset.action;
        const rowIndex = parseInt(opt.dataset.row);
        closeScanResult();
        UI.showActionSheet(action === 'pose' || action === 'transfer' ? 'sortie' : 'retour', rowIndex, product);
      });
    });

    document.getElementById('btn-scan-result-rescan').addEventListener('click', () => {
      closeScanResult();
      open();
    });

    document.getElementById('btn-scan-result-close').addEventListener('click', closeScanResult);

    sheet.classList.add('visible');
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeScanResult();
    }, { once: true });
  }

  function showNotFound(code) {
    const sheet = document.getElementById('scan-result');
    const content = document.getElementById('scan-result-content');

    content.innerHTML = `
      <h3>Article non trouvé</h3>
      <div class="scan-result-code" style="margin-bottom:16px;">Code scanné : ${esc(code)}</div>
      <p style="color:#666;margin-bottom:20px;text-align:center;">Ce barcode n'existe pas dans ton stock. Tu veux l'ajouter ?</p>
      <div id="scan-result-actions">
        <div class="action-option green" id="btn-scan-add">
          <div class="action-icon">＋</div>
          <div>
            <div class="action-text">Ajouter au stock</div>
            <div class="action-desc">Ouvrir le formulaire pré-rempli</div>
          </div>
        </div>
      </div>
      <button class="scan-result-btn-secondary" id="btn-scan-notfound-rescan">Nouveau scan</button>
      <button class="scan-result-btn-cancel" id="btn-scan-notfound-close">Fermer</button>
    `;

    document.getElementById('btn-scan-add').addEventListener('click', () => {
      closeScanResult();
      openAddFormWithBarcode(code);
    });

    document.getElementById('btn-scan-notfound-rescan').addEventListener('click', () => {
      closeScanResult();
      open();
    });

    document.getElementById('btn-scan-notfound-close').addEventListener('click', closeScanResult);

    sheet.classList.add('visible');
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeScanResult();
    }, { once: true });
  }

  function openAddFormWithBarcode(code) {
    // Detect barcode type to guess product
    const len = code.length;
    let guessedType = '';

    if (/^\d{24}$/.test(code)) {
      // 24 digits = Ingenico
      guessedType = 'ingenico';
    } else if (/^.{10}$/.test(code)) {
      // 10 chars = PAX
      guessedType = 'pax';
    }

    // Open the add form and pre-fill the TPE barcode
    UI.openAddForm();

    // Pre-fill TPE field
    document.getElementById('add-tpe').value = code;

    // Try to select a matching product type
    const select = document.getElementById('add-product');
    if (guessedType === 'pax') {
      // Default to A920PRO for PAX
      select.value = 'A920PRO';
    }
    // For Ingenico, too many options — let user choose

    // Trigger change to show/hide base field
    select.dispatchEvent(new Event('change'));
  }

  function closeScanResult() {
    document.getElementById('scan-result').classList.remove('visible');
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { open, close };
})();
