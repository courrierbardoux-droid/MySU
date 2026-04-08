/* ============================================
   MySU — Mode apprentissage (étiquette inconnue) — Phase 5
   ============================================ */

const Rules = (() => {
  const STORAGE_KEY = 'mysu_learned_rules';

  // Get all learned rules
  function getRules() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }

  // Save a rule for a product type
  function saveRule(productName, rule) {
    const rules = getRules();
    rules[productName.toUpperCase()] = rule;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }

  // Get rule for a product
  function getRule(productName) {
    return getRules()[productName.toUpperCase()] || null;
  }

  // Delete a rule
  function deleteRule(productName) {
    const rules = getRules();
    delete rules[productName.toUpperCase()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }

  // Start the learning flow — 5 questions
  function startLearning(callback) {
    const modal = document.getElementById('learning-modal');
    const content = document.getElementById('learning-content');
    let step = 0;
    const answers = {};

    function render() {
      switch (step) {
        case 0: // Q1: Product name
          content.innerHTML = `
            <h3>Mode Apprentissage</h3>
            <p class="learning-subtitle">Étiquette inconnue — aide-moi à la reconnaître</p>
            <div class="learning-step">Question 1/5</div>
            <div class="learning-question">Quel est le nom de ce produit ?</div>
            <input type="text" id="learn-product" class="learning-input" placeholder="Ex: MOVE5000, A920PRO..." list="learn-product-list">
            <datalist id="learn-product-list">
              <option value="MOVE5000">
              <option value="A920PRO">
              <option value="P2PRO">
              <option value="DESK1500">
              <option value="DESK1600">
              <option value="DESK5000">
              <option value="ICT250">
              <option value="IWL250">
              <option value="IWL253">
              <option value="AXIUM DX8000">
              <option value="Q25">
            </datalist>
            <button class="learning-btn-next" id="learn-next">Suivant</button>
            <button class="learning-btn-cancel" id="learn-cancel">Annuler</button>
          `;
          bind('learn-next', () => {
            const v = document.getElementById('learn-product').value.trim().toUpperCase();
            if (!v) { UI.showToast('Nom du produit requis'); return; }
            answers.product = v;
            step++; render();
          });
          break;

        case 1: // Q2: Stock or Demandes
          content.innerHTML = `
            <h3>Mode Apprentissage</h3>
            <div class="learning-step">Question 2/5</div>
            <div class="learning-question">Ce produit va dans quel tableau ?</div>
            <div class="learning-choices">
              <button class="learning-choice" data-value="stock">📦 Tableau Stock</button>
              <button class="learning-choice" data-value="demandes">📋 Tableau Demandes</button>
            </div>
            <button class="learning-btn-cancel" id="learn-cancel">Annuler</button>
          `;
          content.querySelectorAll('.learning-choice').forEach(btn => {
            btn.addEventListener('click', () => {
              answers.table = btn.dataset.value;
              step++; render();
            });
          });
          break;

        case 2: // Q3: Has base?
          content.innerHTML = `
            <h3>Mode Apprentissage</h3>
            <div class="learning-step">Question 3/5</div>
            <div class="learning-question">Ce produit a-t-il une Base ?</div>
            <div class="learning-choices">
              <button class="learning-choice" data-value="same_line">✅ Oui, même ligne</button>
              <button class="learning-choice" data-value="separate">✅ Oui, ligne séparée</button>
              <button class="learning-choice" data-value="none">❌ Non</button>
            </div>
            <button class="learning-btn-cancel" id="learn-cancel">Annuler</button>
          `;
          content.querySelectorAll('.learning-choice').forEach(btn => {
            btn.addEventListener('click', () => {
              answers.base = btn.dataset.value;
              step++; render();
            });
          });
          break;

        case 3: // Q4: Bank
          content.innerHTML = `
            <h3>Mode Apprentissage</h3>
            <div class="learning-step">Question 4/5</div>
            <div class="learning-question">Quelle banque ?</div>
            <div class="learning-choices">
              <button class="learning-choice" data-value="JDC">🏦 JDC</button>
              <button class="learning-choice" data-value="CRCA31">🏦 CRCA31</button>
              <button class="learning-choice" data-value="">Autre</button>
            </div>
            <button class="learning-btn-cancel" id="learn-cancel">Annuler</button>
          `;
          content.querySelectorAll('.learning-choice').forEach(btn => {
            btn.addEventListener('click', () => {
              answers.banque = btn.dataset.value;
              step++; render();
            });
          });
          break;

        case 4: // Q5: Client
          content.innerHTML = `
            <h3>Mode Apprentissage</h3>
            <div class="learning-step">Question 5/5</div>
            <div class="learning-question">Quel client ?</div>
            <div class="learning-choices">
              <button class="learning-choice" data-value="MLSTECH / BARDOUX A.">MLSTECH / BARDOUX A.</button>
              <button class="learning-choice" data-value="RECEP. (RET. GARANTIE)">RECEP. (RET. GARANTIE)</button>
              <button class="learning-choice" data-value="RECEPTION">RECEPTION</button>
              <button class="learning-choice" data-value="">Autre</button>
            </div>
            <button class="learning-btn-cancel" id="learn-cancel">Annuler</button>
          `;
          content.querySelectorAll('.learning-choice').forEach(btn => {
            btn.addEventListener('click', () => {
              answers.client = btn.dataset.value;
              // Save and finish
              saveRule(answers.product, {
                table: answers.table,
                base: answers.base,
                banque: answers.banque,
                client: answers.client,
                createdAt: new Date().toISOString()
              });
              modal.classList.remove('visible');
              UI.showToast('Schéma mémorisé pour ' + answers.product + ' !');
              if (callback) callback(answers);
            });
          });
          break;
      }

      // Bind cancel
      const cancelBtn = content.querySelector('#learn-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          modal.classList.remove('visible');
        });
      }
    }

    function bind(id, fn) {
      document.getElementById(id).addEventListener('click', fn);
    }

    modal.classList.add('visible');
    render();
  }

  // Sync rules to Google Drive as JSON (when online)
  async function syncToDrive() {
    const token = App.getToken();
    if (!token) return;

    const rules = getRules();
    const content = JSON.stringify(rules, null, 2);
    const blob = new Blob([content], { type: 'application/json' });

    const metadata = {
      name: 'mysu_learned_rules.json',
      mimeType: 'application/json'
    };

    // Check if file already exists
    const fileId = localStorage.getItem('mysu_rules_drive_id');

    try {
      if (fileId) {
        // Update existing
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: blob
        });
      } else {
        // Create new
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: form
        });

        const data = await res.json();
        if (data.id) localStorage.setItem('mysu_rules_drive_id', data.id);
      }
    } catch (err) {
      console.error('Rules sync error:', err);
    }
  }

  return { getRules, getRule, saveRule, deleteRule, startLearning, syncToDrive };
})();
