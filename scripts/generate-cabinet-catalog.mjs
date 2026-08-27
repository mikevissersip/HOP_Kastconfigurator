import { access, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cabinetsRoot = path.join(projectRoot, 'public', 'Kasten');
const outputFile = path.join(projectRoot, 'src', 'cabinetCatalog.ts');

const entries = await readdir(cabinetsRoot, { withFileTypes: true });
const cabinets = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const modelPath = path.join(cabinetsRoot, entry.name, 'kast.gltf');
  try {
    await access(modelPath);
    const model = JSON.parse(await readFile(modelPath, 'utf8'));
    const fallbackBuffer = path.join(path.dirname(modelPath), 'buffer.bin');

    for (const buffer of model.buffers ?? []) {
      if (!buffer.uri || buffer.uri.startsWith('data:')) continue;
      const referencedBuffer = path.join(path.dirname(modelPath), buffer.uri);
      try {
        await access(referencedBuffer);
      } catch {
        await access(fallbackBuffer);
        await copyFile(fallbackBuffer, referencedBuffer);
      }
    }

    const modelFile = `Kasten/${entry.name}/kast.gltf`;
    cabinets.push({ id: entry.name, name: entry.name, modelFile });
  } catch {
    // Ignore folders that do not contain the expected model path.
  }
}

cabinets.sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));

const output = `export interface CabinetCatalogItem {\n  id: string;\n  name: string;\n  modelFile: string;\n}\n\nexport const cabinetCatalog: CabinetCatalogItem[] = ${JSON.stringify(cabinets, null, 2)};\n`;
await writeFile(outputFile, output, 'utf8');
console.log(`Generated cabinet catalog with ${cabinets.length} model(s).`);
