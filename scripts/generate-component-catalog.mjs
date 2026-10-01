import ExcelJS from 'exceljs';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workbookPath = path.join(projectRoot, 'public', 'Componentenlijst.xlsx');
const outputDirectory = path.join(projectRoot, 'src');
const sectionNames = new Map([
  ['kastbehuizingen', 'Kastbehuizing'],
  ['overstroombeveiliging/installatieautomaten', 'Installatieautomaat'],
  ['io-units', 'IO-unit'],
  ['io-unit voetjes', 'IO-unit voetje'],
  ['klemmen', 'Klem'],
  ['voedingen', 'Voeding'],
]);

function getCellValue(cell) {
  const value = cell.value;
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'object') return value;
  if ('result' in value) return value.result ?? null;
  if ('text' in value) return value.text;
  if ('richText' in value) return value.richText.map((part) => part.text).join('');
  return String(value);
}

function normalizeHeader(value) {
  return String(value).trim().toLocaleLowerCase('nl-NL').replace(/[^a-z0-9]/g, '');
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(workbookPath);
const worksheet = workbook.worksheets[0];
if (!worksheet) throw new Error('Componentenlijst.xlsx bevat geen werkblad.');

const components = [];
let category = null;
let headers = [];

worksheet.eachRow((row, rowNumber) => {
  const firstValue = getCellValue(row.getCell(1));
  const normalizedFirstValue = typeof firstValue === 'string' ? firstValue.trim().toLocaleLowerCase('nl-NL') : '';
  const populatedValues = row.values.slice(1).map((value) => value ?? null).filter((value) => value !== null && value !== '').length;

  if (populatedValues === 1 && sectionNames.has(normalizedFirstValue)) {
    category = sectionNames.get(normalizedFirstValue);
    headers = [];
    return;
  }

  if (normalizedFirstValue === 'onderdeel') {
    headers = row.values.slice(1).map((value, index) => ({
      column: index + 1,
      label: String(value ?? '').trim(),
      normalized: normalizeHeader(value ?? ''),
    })).filter((header) => header.label);
    return;
  }

  if (!category || headers.length === 0) return;
  const code = String(firstValue ?? '').trim();
  if (!code || normalizeHeader(code) === 'onderdeel') return;

  const properties = {};
  headers.forEach((header) => {
    const value = getCellValue(row.getCell(header.column));
    if (value === null) return;
    if (header.normalized === 'onderdeel' || header.normalized === 'merk'
      || header.normalized === 'prijseuro' || header.normalized === 'levertijddagen') return;
    properties[header.label] = value;
  });

  const brandHeader = headers.find((header) => header.normalized === 'merk');
  const priceHeader = headers.find((header) => header.normalized === 'prijseuro');
  const deliveryHeader = headers.find((header) => header.normalized === 'levertijddagen');
  const brand = brandHeader ? getCellValue(row.getCell(brandHeader.column)) : null;
  const price = priceHeader ? getCellValue(row.getCell(priceHeader.column)) : null;
  const deliveryDays = deliveryHeader ? getCellValue(row.getCell(deliveryHeader.column)) : null;
  const modelFile = `Onderdelen/${code}/${category === 'Kastbehuizing' ? 'kast' : 'component'}.gltf`;

  components.push({
    code,
    category,
    brand: brand ? String(brand) : null,
    name: String(properties['Omschrijving / type'] ?? code),
    modelFile,
    price: price === null ? null : Number(price),
    deliveryDays: deliveryDays === null ? null : Number(deliveryDays),
    properties,
  });
});

if (components.length === 0) throw new Error('Componentenlijst.xlsx bevat geen componentregels.');

const seenCodes = new Set();
for (const component of components) {
  const normalizedCode = component.code.toLocaleLowerCase('nl-NL');
  if (seenCodes.has(normalizedCode)) throw new Error(`Dubbele artikelcode: ${component.code}.`);
  seenCodes.add(normalizedCode);

  if (component.price !== null && (!Number.isFinite(component.price) || component.price < 0)) {
    throw new Error(`Ongeldige prijs voor ${component.code}.`);
  }
  if (component.deliveryDays !== null && (!Number.isFinite(component.deliveryDays) || component.deliveryDays < 0)) {
    throw new Error(`Ongeldige levertijd voor ${component.code}.`);
  }

  const modelPath = path.join(projectRoot, 'public', component.modelFile);
  await access(modelPath);
  const model = JSON.parse(await readFile(modelPath, 'utf8'));
  for (const buffer of model.buffers ?? []) {
    if (!buffer.uri || buffer.uri.startsWith('data:')) continue;
    await access(path.resolve(path.dirname(modelPath), buffer.uri));
  }
}

const componentSource = `export interface ComponentCatalogEntry {
  code: string;
  category: string;
  brand: string | null;
  name: string;
  modelFile: string;
  price: number | null;
  deliveryDays: number | null;
  properties: Record<string, string | number>;
}

export const componentCatalog: ComponentCatalogEntry[] = ${JSON.stringify(components, null, 2)};
`;

const cabinetEntries = components
  .filter((component) => component.category === 'Kastbehuizing')
  .map(({ code, modelFile }) => ({ id: code, name: code, modelFile }));
const cabinetSource = `export interface CabinetCatalogItem {
  id: string;
  name: string;
  modelFile: string;
}

export const cabinetCatalog: CabinetCatalogItem[] = ${JSON.stringify(cabinetEntries, null, 2)};
`;

const priceEntries = components.map(({ code, price, deliveryDays }) => ({ code, price, deliveryDays }));
const priceSource = `export interface PriceCatalogEntry {
  code: string;
  price: number | null;
  deliveryDays: number | null;
}

export const priceCatalog: PriceCatalogEntry[] = ${JSON.stringify(priceEntries, null, 2)};
`;

await Promise.all([
  writeFile(path.join(outputDirectory, 'componentCatalog.ts'), componentSource, 'utf8'),
  writeFile(path.join(outputDirectory, 'cabinetCatalog.ts'), cabinetSource, 'utf8'),
  writeFile(path.join(outputDirectory, 'priceCatalog.ts'), priceSource, 'utf8'),
]);

console.log(`Generated component catalog with ${components.length} item(s).`);