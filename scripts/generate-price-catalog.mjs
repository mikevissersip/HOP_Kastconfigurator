import ExcelJS from 'exceljs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(projectRoot, 'public', 'Price_and_Delivery.xlsx');
const outputPath = path.join(projectRoot, 'src', 'priceCatalog.ts');
const workbook = new ExcelJS.Workbook();

await workbook.xlsx.readFile(sourcePath);

const worksheet = workbook.worksheets[0];
if (!worksheet) throw new Error('Price_and_Delivery.xlsx contains no worksheets.');

const entries = [];
const names = new Set();
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return;

  const name = String(row.getCell(1).value ?? '').trim();
  if (!name) return;

  const price = Number(row.getCell(2).value);
  const deliveryDays = Number(row.getCell(3).value);
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(deliveryDays) || deliveryDays < 0) {
    throw new Error(`Invalid price or delivery time in spreadsheet row ${rowNumber}.`);
  }

  const normalizedName = name.toLocaleLowerCase('nl-NL');
  if (names.has(normalizedName)) throw new Error(`Duplicate item in price catalog: ${name}.`);
  names.add(normalizedName);
  entries.push({ name, price, deliveryDays });
});

if (entries.length === 0) throw new Error('Price_and_Delivery.xlsx contains no price entries.');

const source = `export interface PriceCatalogEntry {
  name: string;
  price: number;
  deliveryDays: number;
}

export const priceCatalog: PriceCatalogEntry[] = ${JSON.stringify(entries, null, 2)};
`;

await writeFile(outputPath, source, 'utf8');
console.log(`Generated price catalog with ${entries.length} item(s).`);