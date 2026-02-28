'use strict';

const ExcelJS = require('exceljs');

const EDITORIAL_HEADERS = [
  'Titre',
  'Date de publication',
  'Notes',
];

const EVENT_HEADERS = [
  'Titre',
  'Type',
  'Date début',
  'Date fin',
  'Statut',
  'Visibilité',
  'Description',
];

const parseNetworkLinksCell = (value) => {
  if (!value) return {};
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const [network, ...rest] = entry.split('=');
      const key = String(network || '').trim().toLowerCase();
      const link = rest.join('=').trim();
      if (!key || !link) return acc;
      acc[key] = link;
      return acc;
    }, {});
};

const stringifyNetworkLinks = (links) => {
  if (!links || typeof links !== 'object') return '';
  return Object.entries(links)
    .filter(([k, v]) => k && v)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
};

const parseListCell = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const parseDateCell = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const extractCellValue = (cell) => {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === 'object' && cell.text) return cell.text;
  if (typeof cell === 'object' && cell.richText) {
    return cell.richText.map((r) => r.text || '').join('');
  }
  if (typeof cell === 'object' && cell.result !== undefined) return cell.result;
  return cell;
};

const readWorksheetRows = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  console.log('[DEBUG readWorksheetRows] loading buffer, size:', buffer?.length || 0);
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  console.log('[DEBUG readWorksheetRows] sheet found:', !!sheet, '| name:', sheet?.name || 'N/A');
  if (!sheet) return [];

  console.log('[DEBUG readWorksheetRows] total row count:', sheet.rowCount);
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    console.log('[DEBUG readWorksheetRows] row', rowNumber, '| raw values:', JSON.stringify(row.values));
    if (rowNumber === 1) return;
    const values = row.values.slice(1).map(extractCellValue);
    console.log('[DEBUG readWorksheetRows] row', rowNumber, '| extracted:', JSON.stringify(values));
    if (values.every((v) => v === null || v === undefined || String(v).trim() === '')) return;
    rows.push(values);
  });
  console.log('[DEBUG readWorksheetRows] total data rows:', rows.length);
  return rows;
};

const buildWorkbook = async ({ headers, rows, sheetName }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => {
    column.width = 24;
  });
  return workbook.xlsx.writeBuffer();
};

const parseEditorialImport = async (buffer) => {
  console.log('[DEBUG editorial import] buffer type:', typeof buffer, '| length:', buffer?.length || 0);
  const rows = await readWorksheetRows(buffer);
  console.log('[DEBUG editorial import] rows parsed:', rows.length);
  if (rows.length > 0) {
    console.log('[DEBUG editorial import] first row sample:', JSON.stringify(rows[0]));
  }
  return rows.map((values) => ({
    publication_title: values[0] ? String(values[0]).trim() : null,
    publication_date: parseDateCell(values[1]),
    notes: values[2] ? String(values[2]).trim() : null,
  }));
};

const parseEventsImport = async (buffer) => {
  const rows = await readWorksheetRows(buffer);
  return rows.map((values) => ({
    title: values[0] ? String(values[0]).trim() : null,
    type: values[1] ? String(values[1]).trim() : null,
    start_date: parseDateCell(values[2]),
    end_date: parseDateCell(values[3]),
    status: values[4] ? String(values[4]).trim() : null,
    visibility: values[5] ? String(values[5]).trim() : null,
    description: values[6] ? String(values[6]).trim() : null,
  }));
};

const buildEditorialExport = async (items) => buildWorkbook({
  headers: EDITORIAL_HEADERS,
  sheetName: 'Calendrier editorial',
  rows: items.map((item) => [
    item.publication_title || '',
    item.publication_date || '',
    item.notes || '',
  ]),
});

const buildEventsExport = async (items) => buildWorkbook({
  headers: EVENT_HEADERS,
  sheetName: 'Calendrier evenements',
  rows: items.map((item) => [
    item.title || '',
    item.type || '',
    item.start_date || '',
    item.end_date || '',
    item.status || '',
    item.visibility || '',
    item.description || '',
  ]),
});

module.exports = {
  parseEditorialImport,
  parseEventsImport,
  buildEditorialExport,
  buildEventsExport,
};

