/* ============================================
   MySU — Google Sheets API v4
   ============================================ */

const Sheets = (() => {
  const API = 'https://sheets.googleapis.com/v4/spreadsheets';
  const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

  function headers() {
    return { 'Authorization': 'Bearer ' + App.getToken(), 'Content-Type': 'application/json' };
  }

  // Read all data from the sheet
  async function readStock(sheetId) {
    const range = encodeURIComponent('Inventaire TPE');
    const res = await fetch(`${API}/${sheetId}/values/${range}`, { headers: headers() });
    if (!res.ok) throw new Error('Erreur lecture Sheet: ' + res.status);
    const data = await res.json();
    return data.values || [];
  }

  // Parse raw rows into Stock and Demandes tables
  function parseRows(rows) {
    const stock = [];
    const demandes = [];
    let inDemandes = false;
    let blankCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const isEmpty = !row || row.every(cell => !cell || cell.trim() === '');

      if (isEmpty) {
        blankCount++;
        if (blankCount >= 1 && stock.length > 0 && !inDemandes) {
          inDemandes = true;
        }
        continue;
      }

      blankCount = 0;

      if (!inDemandes) {
        stock.push({ rowIndex: i, data: row });
      } else {
        demandes.push({ rowIndex: i, data: row });
      }
    }

    return { stock, demandes };
  }

  // Append a row to the stock section (before the blank separator)
  async function addRow(sheetId, values) {
    // Read current data to find insertion point (alphabetical on column A)
    const rows = await readStock(sheetId);
    const { stock } = parseRows(rows);

    const newProduct = (values[0] || '').toUpperCase();
    let insertIndex = -1;

    for (let i = 0; i < stock.length; i++) {
      const existing = (stock[i].data[0] || '').toUpperCase();
      if (newProduct.localeCompare(existing) < 0) {
        insertIndex = stock[i].rowIndex;
        break;
      }
    }

    // Get the sheet's numeric ID (gid)
    const sheetMeta = await getSheetGid(sheetId);

    if (insertIndex === -1) {
      // Insert after last stock row
      insertIndex = stock.length > 0 ? stock[stock.length - 1].rowIndex + 1 : 0;
    }

    // Insert a blank row at the right position
    await fetch(`${API}/${sheetId}:batchUpdate`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        requests: [{
          insertDimension: {
            range: { sheetId: sheetMeta, dimension: 'ROWS', startIndex: insertIndex, endIndex: insertIndex + 1 },
            inheritFromBefore: insertIndex > 0
          }
        }]
      })
    });

    // Write data to the inserted row
    const range = encodeURIComponent(`Inventaire TPE!A${insertIndex + 1}:F${insertIndex + 1}`);
    await fetch(`${API}/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ values: [values] })
    });
  }

  // Delete a row
  async function deleteRow(sheetId, rowIndex) {
    const sheetMeta = await getSheetGid(sheetId);
    await fetch(`${API}/${sheetId}:batchUpdate`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: { sheetId: sheetMeta, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 }
          }
        }]
      })
    });
  }

  // Get sheet GID (numeric ID of the first sheet tab)
  async function getSheetGid(sheetId) {
    const cached = sessionStorage.getItem('mysu_gid_' + sheetId);
    if (cached) return parseInt(cached);

    const res = await fetch(`${API}/${sheetId}?fields=sheets.properties`, { headers: headers() });
    if (!res.ok) throw new Error('Erreur metadata Sheet: ' + res.status);
    const data = await res.json();

    // Find "Inventaire TPE" tab or use first tab
    let gid = 0;
    for (const sheet of data.sheets) {
      if (sheet.properties.title === 'Inventaire TPE') {
        gid = sheet.properties.sheetId;
        break;
      }
    }

    sessionStorage.setItem('mysu_gid_' + sheetId, gid);
    return gid;
  }

  // Create a new spreadsheet on Drive
  async function createSheet(name) {
    const res = await fetch(API, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        properties: { title: name },
        sheets: [{
          properties: { title: 'Inventaire TPE' },
          data: [{
            startRow: 0, startColumn: 0,
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: 'Produit' } },
                { userEnteredValue: { stringValue: 'TPE' } },
                { userEnteredValue: { stringValue: 'Base' } },
                { userEnteredValue: { stringValue: 'Banque' } },
                { userEnteredValue: { stringValue: 'Date' } },
                { userEnteredValue: { stringValue: 'Client' } }
              ]
            }]
          }]
        }]
      })
    });

    if (!res.ok) throw new Error('Erreur création Sheet: ' + res.status);
    const data = await res.json();
    return data.spreadsheetId;
  }

  return { readStock, parseRows, addRow, deleteRow, createSheet };
})();
