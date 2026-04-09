/* ============================================
   MySU — Logique principale + OAuth2
   ============================================ */

const App = (() => {
  const CLIENT_ID = '519874498864-f7ke2aqc28u6s90cmffojpjv6j0gq0jv.apps.googleusercontent.com';
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
  const PICKER_API_KEY = ''; // Optional, works without for Drive-authorized files

  let tokenClient = null;
  let accessToken = null;
  let userEmail = null;
  let sheetId = null;
  let pickerInited = false;
  let gapiInited = false;

  // ---- INIT ----

  function init() {
    UI.init();
    loadSavedState();
    setupActionBar();
    setupOfflineDetection();
    setupTheme();
    Offline.init();

    // Check if already has a valid session
    if (sheetId && accessToken) {
      showApp();
      refresh();
    }
  }

  function loadSavedState() {
    sheetId = localStorage.getItem('mysu_sheet_id') || null;
    // Token is not persisted (security), user must re-auth each session
  }

  // ---- GOOGLE IDENTITY SERVICES ----

  function onGisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: onTokenResponse
    });
  }

  function onTokenResponse(response) {
    if (response.error) {
      console.error('OAuth error:', response);
      UI.showToast('Erreur de connexion Google');
      return;
    }

    accessToken = response.access_token;
    fetchUserEmail();

    if (sheetId) {
      showApp();
      refresh();
    } else {
      showOnboarding();
    }
  }

  async function fetchUserEmail() {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      const data = await res.json();
      userEmail = data.email || '';
      document.getElementById('user-email').textContent = userEmail;
    } catch (e) {
      console.error('Failed to fetch user email', e);
    }
  }

  function login() {
    if (tokenClient) {
      tokenClient.requestAccessToken();
      return;
    }

    // Google script not loaded yet — try to init
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
      onGisLoaded();
      if (tokenClient) {
        tokenClient.requestAccessToken();
        return;
      }
    }

    // Still not ready — wait and retry
    UI.showToast('Chargement Google en cours...');
    let attempts = 0;
    const retry = setInterval(() => {
      attempts++;
      if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        clearInterval(retry);
        onGisLoaded();
        tokenClient.requestAccessToken();
      } else if (attempts >= 15) {
        clearInterval(retry);
        UI.showToast('Google bloqué — vérifie ta connexion ou désactive le bloqueur de pubs.');
      }
    }, 500);
  }

  function logout() {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken);
    }
    accessToken = null;
    userEmail = null;
    sheetId = null;
    localStorage.removeItem('mysu_sheet_id');
    localStorage.removeItem('mysu_sheet_name');
    localStorage.removeItem('mysu_statuses');
    sessionStorage.clear();
    showLogin();
    UI.showToast('Déconnecté');
  }

  // ---- GAPI (for Picker) ----

  function onGapiLoaded() {
    gapi.load('picker', () => { pickerInited = true; });
  }

  // ---- SCREENS ----

  function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'none';
  }

  function showOnboarding() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('onboarding-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
  }

  function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
  }

  // ---- ONBOARDING ----

  function onPickExisting() {
    // Show the Sheet ID input dialog instead of Picker (more reliable)
    document.getElementById('sheet-id-dialog').classList.add('visible');
  }

  function onSheetIdSubmit() {
    let input = document.getElementById('sheet-id-input').value.trim();
    if (!input) {
      UI.showToast('Colle le lien ou l\'ID du Sheet');
      return;
    }

    // Extract ID from full URL if pasted
    // Format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
    const urlMatch = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      input = urlMatch[1];
    }

    sheetId = input;
    localStorage.setItem('mysu_sheet_id', sheetId);
    document.getElementById('sheet-id-dialog').classList.remove('visible');

    // Try to read the sheet to verify
    UI.showLoading(true);
    Sheets.readStock(sheetId)
      .then(rows => {
        localStorage.setItem('mysu_sheet_name', 'Inventaire');
        showApp();
        UI.renderTable(rows);
        UI.showLoading(false);
        UI.showToast('Sheet connecté !');
      })
      .catch(err => {
        UI.showLoading(false);
        sheetId = null;
        localStorage.removeItem('mysu_sheet_id');
        UI.showToast('Erreur : ' + (err.message || 'impossible de lire ce Sheet — vérifie ta connexion'));
        console.error('Sheet read error:', err, err.stack);
      });
  }

  function onPickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
      const doc = data.docs[0];
      sheetId = doc.id;
      localStorage.setItem('mysu_sheet_id', sheetId);
      localStorage.setItem('mysu_sheet_name', doc.name);
      showApp();
      refresh();
      UI.showToast('Sheet connecté !');
    }
  }

  async function onCreateNew() {
    const now = new Date();
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const name = `Inventaire ${months[now.getMonth()]} ${now.getFullYear()}`;

    UI.showLoading(true);
    try {
      sheetId = await Sheets.createSheet(name);
      localStorage.setItem('mysu_sheet_id', sheetId);
      localStorage.setItem('mysu_sheet_name', name);
      showApp();
      refresh();
      UI.showToast('Sheet "' + name + '" créé !');
    } catch (err) {
      UI.showToast('Erreur : ' + err.message);
      console.error(err);
    } finally {
      UI.showLoading(false);
    }
  }

  function changeSheet() {
    sheetId = null;
    localStorage.removeItem('mysu_sheet_id');
    localStorage.removeItem('mysu_sheet_name');
    localStorage.removeItem('mysu_statuses');
    showOnboarding();
  }

  // ---- REFRESH DATA ----

  async function refresh() {
    if (!sheetId || !accessToken) return;

    UI.showLoading(true);
    try {
      const rows = await Sheets.readStock(sheetId);
      UI.renderTable(rows);
    } catch (err) {
      // Try offline cache
      const cached = localStorage.getItem('mysu_cache');
      if (cached) {
        UI.renderTable(JSON.parse(cached));
        UI.showToast('Données en cache (hors ligne)');
      } else {
        UI.showToast('Erreur : ' + err.message);
      }
      console.error(err);
    } finally {
      UI.showLoading(false);
    }
  }

  // ---- ACTION BAR ----

  function setupActionBar() {
    document.getElementById('btn-menu').addEventListener('click', UI.openMenu);
    // Scan mode chooser
    document.getElementById('btn-scan').addEventListener('click', () => {
      document.getElementById('scan-chooser').classList.add('visible');
    });
    document.getElementById('btn-mode-barcode').addEventListener('click', () => {
      document.getElementById('scan-chooser').classList.remove('visible');
      Scanner.open();
    });
    document.getElementById('btn-mode-camera').addEventListener('click', () => {
      document.getElementById('scan-chooser').classList.remove('visible');
      OCR.captureCamera();
    });
    document.getElementById('btn-mode-gallery').addEventListener('click', () => {
      document.getElementById('scan-chooser').classList.remove('visible');
      OCR.selectGallery();
    });
    document.getElementById('btn-scan-chooser-close').addEventListener('click', () => {
      document.getElementById('scan-chooser').classList.remove('visible');
    });
    document.getElementById('btn-scanner-close').addEventListener('click', () => Scanner.close());

    // OCR file input
    document.getElementById('ocr-file-input').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        OCR.onFileSelected(e.target.files[0]);
      }
    });
    document.getElementById('btn-add').addEventListener('click', UI.openAddForm);
    document.getElementById('btn-email').addEventListener('click', () => Clipboard.showBasketPreview());
    document.getElementById('btn-basket-send').addEventListener('click', () => {
      Clipboard.closeBasketPreview();
      Clipboard.sendEmail();
    });
    document.getElementById('btn-basket-clear').addEventListener('click', () => {
      Clipboard.clearBasket();
      Clipboard.closeBasketPreview();
      UI.showToast('Panier vidé');
    });
    document.getElementById('btn-basket-close').addEventListener('click', () => Clipboard.closeBasketPreview());
    document.getElementById('btn-login').addEventListener('click', login);
    document.getElementById('btn-pick-existing').addEventListener('click', onPickExisting);
    document.getElementById('btn-create-new').addEventListener('click', onCreateNew);
    document.getElementById('btn-sheet-id-submit').addEventListener('click', onSheetIdSubmit);
    document.getElementById('btn-sheet-id-cancel').addEventListener('click', () => {
      document.getElementById('sheet-id-dialog').classList.remove('visible');
    });
    document.getElementById('btn-refresh').addEventListener('click', refresh);
  }

  // ---- OFFLINE ----

  function setupOfflineDetection() {
    // Handled by Offline.init() now
    // Keep this for backward compat
  }

  // ---- THEME ----

  function setupTheme() {
    const saved = localStorage.getItem('mysu_theme') || 'light';
    applyTheme(saved);

    document.getElementById('btn-theme-light').addEventListener('click', () => {
      applyTheme('light');
      localStorage.setItem('mysu_theme', 'light');
    });

    document.getElementById('btn-theme-dark').addEventListener('click', () => {
      applyTheme('dark');
      localStorage.setItem('mysu_theme', 'dark');
    });
  }

  function applyTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.getElementById('btn-theme-light').classList.toggle('selected', theme === 'light');
    document.getElementById('btn-theme-dark').classList.toggle('selected', theme === 'dark');
  }

  // ---- PUBLIC API ----

  return {
    init,
    login,
    logout,
    refresh,
    changeSheet,
    getToken: () => accessToken,
    getSheetId: () => sheetId,
    getUserEmail: () => userEmail,
    onGisLoaded,
    onGapiLoaded
  };
})();

// ---- BOOTSTRAP ----

document.addEventListener('DOMContentLoaded', () => App.init());

// Called by Google Identity Services script
function onGisLoaded() { App.onGisLoaded(); }
function onGapiLoaded() { App.onGapiLoaded(); }
