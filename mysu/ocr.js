/* ============================================
   MySU — OCR photo étiquette (Tesseract.js) — Phase 4
   ============================================ */

const OCR = (() => {
  let worker = null;
  let processing = false;

  // Barcode patterns
  const PATTERN_INGENICO = /\b(\d{24})\b/;
  const PATTERN_PAX = /\b([A-Z0-9]{10})\b/;
  const PATTERN_IWL = /\b([A-Z0-9]{8,15})\b/;

  // Known product names to search for in OCR text
  const PRODUCT_KEYWORDS = [
    'MOVE5000', 'MOVE 5000',
    'A920PRO', 'A920 PRO', 'A920',
    'P2PRO', 'P2 PRO',
    'DESK1500', 'DESK 1500', 'DESK1600', 'DESK 1600',
    'DESK5000', 'DESK 5000', 'DESK5000CL2LSMBW',
    'ICT250', 'ICT 250',
    'IWL250', 'IWL 250', 'IWL253', 'IWL 253',
    'DX8000', 'DX 8000', 'AXIUM',
    'A99', 'A99CLAVIER', 'A99WIFI',
    'Q25',
    'POL-DESK5000', 'POL-A99'
  ];

  // Bank keywords
  const BANK_KEYWORDS = {
    'CRCA': 'CRCA31', 'CREDIT AGRICOLE': 'CRCA31', 'CA31': 'CRCA31', 'CRCA31': 'CRCA31',
    'JDC': 'JDC'
  };

  async function initWorker() {
    if (worker) return worker;

    worker = await Tesseract.createWorker('fra', 1, {
      workerPath: './tesseract-worker.min.js'
    });

    return worker;
  }

  // Open the OCR capture screen
  function open() {
    const overlay = document.getElementById('ocr-overlay');
    overlay.classList.add('visible');
  }

  function close() {
    const overlay = document.getElementById('ocr-overlay');
    overlay.classList.remove('visible');
    // Reset file input
    document.getElementById('ocr-file-input').value = '';
  }

  // Capture from camera
  function captureCamera() {
    const input = document.getElementById('ocr-file-input');
    input.setAttribute('capture', 'environment');
    input.click();
  }

  // Select from gallery
  function selectGallery() {
    const input = document.getElementById('ocr-file-input');
    input.removeAttribute('capture');
    input.click();
  }

  // Handle file selected
  async function onFileSelected(file) {
    if (!file || processing) return;
    processing = true;

    close();
    UI.showLoading(true);

    const statusEl = document.getElementById('ocr-progress-text');
    showOcrProgress('Analyse de l\'image en cours...');

    try {
      // Initialize worker if needed
      await initWorker();

      // Run OCR
      const result = await worker.recognize(file);

      const text = result.data.text || '';
      const confidence = result.data.confidence || 0;

      hideOcrProgress();
      UI.showLoading(false);

      if (confidence < 30 || text.trim().length < 5) {
        // Image too blurry / unreadable
        showOcrResult({
          success: false,
          confidence: Math.round(confidence),
          text: text,
          file: file
        });
      } else {
        // Parse the OCR text
        const parsed = parseOcrText(text);
        parsed.confidence = Math.round(confidence);
        parsed.rawText = text;

        // Check for multiple articles
        const articles = detectMultiArticles(text);

        if (articles.length > 1) {
          showMultiArticles(articles);
        } else {
          showOcrResult({
            success: true,
            ...parsed,
            file: file
          });
        }
      }
    } catch (err) {
      console.error('OCR error:', err);
      hideOcrProgress();
      UI.showLoading(false);
      UI.showToast('Erreur OCR : ' + err.message);
    } finally {
      processing = false;
    }
  }

  // Parse OCR text to extract fields
  function parseOcrText(text) {
    const upperText = text.toUpperCase();
    const result = {
      product: '',
      tpe: '',
      base: '',
      banque: 'JDC', // default
      confidence: 0
    };

    // Find product name
    for (const keyword of PRODUCT_KEYWORDS) {
      if (upperText.includes(keyword.toUpperCase())) {
        // Normalize the product name
        result.product = normalizeProduct(keyword);
        break;
      }
    }

    // Find barcodes — look for the LONGEST number (rule: always take the long number)
    const numbers = text.match(/\b\d{8,30}\b/g) || [];
    if (numbers.length > 0) {
      // Sort by length descending, take longest
      numbers.sort((a, b) => b.length - a.length);
      result.tpe = numbers[0];

      // If there's a second long number, it might be the base
      if (numbers.length > 1 && numbers[1].length >= 10) {
        result.base = numbers[1];
      }
    }

    // Also check for PAX-style barcodes (10 alphanumeric)
    if (!result.tpe) {
      const paxMatch = upperText.match(/\b[A-Z0-9]{10}\b/g);
      if (paxMatch) {
        // Filter out common words
        const filtered = paxMatch.filter(m => /\d/.test(m));
        if (filtered.length > 0) result.tpe = filtered[0];
      }
    }

    // Find bank
    for (const [keyword, bank] of Object.entries(BANK_KEYWORDS)) {
      if (upperText.includes(keyword)) {
        result.banque = bank;
        break;
      }
    }

    // If barcode is unreadable, leave blank (RULE: never guess)
    if (result.tpe && !/^[A-Za-z0-9]+$/.test(result.tpe)) {
      result.tpe = ''; // Contains invalid chars, probably misread
    }

    return result;
  }

  function normalizeProduct(keyword) {
    const map = {
      'MOVE5000': 'MOVE5000', 'MOVE 5000': 'MOVE5000',
      'A920PRO': 'A920PRO', 'A920 PRO': 'A920PRO', 'A920': 'A920PRO',
      'P2PRO': 'P2PRO', 'P2 PRO': 'P2PRO',
      'DESK1500': 'DESK1500', 'DESK 1500': 'DESK1500',
      'DESK1600': 'DESK1600', 'DESK 1600': 'DESK1600',
      'DESK5000': 'DESK5000', 'DESK 5000': 'DESK5000',
      'DESK5000CL2LSMBW': 'DESK5000CL2LSMBW',
      'ICT250': 'ICT250', 'ICT 250': 'ICT250',
      'IWL250': 'IWL250', 'IWL 250': 'IWL250',
      'IWL253': 'IWL253', 'IWL 253': 'IWL253',
      'DX8000': 'AXIUM DX8000', 'DX 8000': 'AXIUM DX8000', 'AXIUM': 'AXIUM DX8000',
      'A99': 'A99CLAVIER', 'A99CLAVIER': 'A99CLAVIER', 'A99WIFI': 'A99WIFI4GBT',
      'Q25': 'Q25',
      'POL-DESK5000': 'POL-DESK5000', 'POL-A99': 'POL-A99'
    };
    return map[keyword.toUpperCase()] || keyword.toUpperCase();
  }

  // Detect if OCR text contains multiple articles
  function detectMultiArticles(text) {
    const upperText = text.toUpperCase();
    const found = [];

    // Split text by product keywords found
    for (const keyword of PRODUCT_KEYWORDS) {
      const idx = upperText.indexOf(keyword.toUpperCase());
      if (idx !== -1) {
        found.push({ keyword, position: idx });
      }
    }

    // If only 0 or 1 product found, single article
    if (found.length <= 1) return [text];

    // Sort by position and extract sections
    found.sort((a, b) => a.position - b.position);
    const sections = [];
    for (let i = 0; i < found.length; i++) {
      const start = found[i].position;
      const end = i + 1 < found.length ? found[i + 1].position : text.length;
      sections.push(text.substring(start, end));
    }

    return sections;
  }

  // Show OCR result
  function showOcrResult(data) {
    const modal = document.getElementById('ocr-result');
    const content = document.getElementById('ocr-result-content');

    if (!data.success) {
      // Unreadable
      content.innerHTML = `
        <h3 style="color:var(--red);">Image peu lisible</h3>
        <div class="ocr-confidence bad">${data.confidence}% de lisibilité</div>
        <p style="color:#666;text-align:center;margin:12px 0;">L'image n'est pas assez nette pour être analysée. La photo sera sauvegardée pour traitement ultérieur.</p>
        <div class="ocr-raw-text">${esc(data.text || 'Aucun texte détecté')}</div>
        <button class="scan-result-btn-secondary" id="btn-ocr-retry">Reprendre une photo</button>
        <button class="scan-result-btn-cancel" id="btn-ocr-close">Fermer</button>
      `;

      document.getElementById('btn-ocr-retry').addEventListener('click', () => {
        closeOcrResult();
        open();
      });
    } else {
      // Readable — show pre-filled form
      const fieldsOk = data.product || data.tpe;
      content.innerHTML = `
        <h3 style="color:var(--green);">Étiquette analysée</h3>
        <div class="ocr-confidence ${data.confidence >= 70 ? 'good' : 'medium'}">${data.confidence}% de confiance</div>
        <div class="ocr-fields">
          <div class="ocr-field">
            <label>Produit</label>
            <input type="text" id="ocr-product" value="${esc(data.product)}" placeholder="Non détecté">
          </div>
          <div class="ocr-field">
            <label>Barcode TPE</label>
            <input type="text" id="ocr-tpe" value="${esc(data.tpe)}" placeholder="${data.tpe ? '' : 'Non détecté — LAISSER VIDE si illisible'}">
            ${!data.tpe ? '<div class="ocr-warning">Barcode non détecté — ne pas deviner</div>' : ''}
          </div>
          <div class="ocr-field">
            <label>Barcode Base</label>
            <input type="text" id="ocr-base" value="${esc(data.base)}" placeholder="Non détecté">
          </div>
          <div class="ocr-field">
            <label>Banque</label>
            <input type="text" id="ocr-banque" value="${esc(data.banque)}" placeholder="JDC">
          </div>
        </div>
        <details style="margin:12px 0;">
          <summary style="font-size:12px;color:#999;cursor:pointer;">Voir le texte brut OCR</summary>
          <div class="ocr-raw-text">${esc(data.rawText)}</div>
        </details>
        <button class="basket-btn-send" id="btn-ocr-add">AJOUTER AU STOCK</button>
        <button class="scan-result-btn-secondary" id="btn-ocr-retry2">Reprendre une photo</button>
        <button class="scan-result-btn-cancel" id="btn-ocr-close2">Fermer</button>
      `;

      document.getElementById('btn-ocr-add').addEventListener('click', () => {
        addFromOcr();
      });

      document.getElementById('btn-ocr-retry2').addEventListener('click', () => {
        closeOcrResult();
        open();
      });
    }

    const closeBtn = content.querySelector('#btn-ocr-close, #btn-ocr-close2');
    if (closeBtn) closeBtn.addEventListener('click', closeOcrResult);

    modal.classList.add('visible');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeOcrResult();
    }, { once: true });
  }

  // Show multi-article processing
  function showMultiArticles(sections) {
    let currentIndex = 0;

    function processNext() {
      if (currentIndex >= sections.length) {
        UI.showToast('Tous les articles traités !');
        return;
      }

      const parsed = parseOcrText(sections[currentIndex]);
      parsed.rawText = sections[currentIndex];

      UI.showToast(`Article ${currentIndex + 1}/${sections.length}`);

      showOcrResult({
        success: true,
        ...parsed,
        multiIndex: currentIndex + 1,
        multiTotal: sections.length
      });

      currentIndex++;
    }

    processNext();
  }

  // Add article from OCR result to stock
  async function addFromOcr() {
    const product = (document.getElementById('ocr-product').value || '').trim().toUpperCase();
    const tpe = (document.getElementById('ocr-tpe').value || '').trim();
    const base = (document.getElementById('ocr-base').value || '').trim();
    const banque = (document.getElementById('ocr-banque').value || '').trim() || 'JDC';

    if (!product) {
      UI.showToast('Le nom du produit est requis');
      return;
    }

    // Format today's date
    const now = new Date();
    const dateFormatted = String(now.getDate()).padStart(2, '0') + '/' +
                          String(now.getMonth() + 1).padStart(2, '0') + '/' +
                          now.getFullYear();

    const values = [product, tpe, base, banque, dateFormatted, 'MLSTECH / BARDOUX A.'];

    closeOcrResult();
    UI.showLoading(true);

    try {
      await Sheets.addRow(App.getSheetId(), values);
      UI.showToast('Article ajouté !');
      await App.refresh();
    } catch (err) {
      UI.showToast('Erreur : ' + err.message);
    } finally {
      UI.showLoading(false);
    }
  }

  function closeOcrResult() {
    document.getElementById('ocr-result').classList.remove('visible');
  }

  function showOcrProgress(msg) {
    const el = document.getElementById('ocr-progress');
    document.getElementById('ocr-progress-text').textContent = msg;
    el.classList.add('visible');
  }

  function hideOcrProgress() {
    document.getElementById('ocr-progress').classList.remove('visible');
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { open, close, captureCamera, selectGallery, onFileSelected };
})();
