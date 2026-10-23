import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac } from 'node:crypto';
import { transformCsv } from './admissions.mjs';

try {
  const [mode, ...args] = process.argv.slice(2);
  if (!['validate', 'load-local'].includes(mode)) throw new Error('Use validate or load-local --file PATH --year 2569 --round TCAS1 [--source stable.csv] [--db demo.sqlite]');
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--file', '--year', '--round', '--source', '--db'].includes(args[i]) || !args[i + 1] || Object.hasOwn(options, args[i])) throw new Error('Invalid or duplicate arguments');
    options[args[i]] = args[i + 1];
  }
  if (!options['--file']) throw new Error('--file is required');
  const salt = process.env.ADMISSIONS_STUDENT_HASH_SALT;
  const batch = transformCsv(readFileSync(options['--file'], 'utf8'), { year: Number(options['--year']), round: options['--round'], source: options['--source'] ?? path.basename(options['--file']), salt });
  console.log(JSON.stringify(batch.report, null, 2));
  if (batch.report.errors.length) process.exitCode = 1;
  else if (mode === 'load-local') {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.etl-local');
    const name = options['--db'] ?? 'admissions-test.sqlite';
    if (!/^[a-zA-Z0-9_-]+\.sqlite$/.test(name)) throw new Error('--db must be a simple .sqlite filename');
    mkdirSync(root, { recursive: true });
    const { openWarehouse, loadLocal } = await import('./local-warehouse.mjs');
    const db = openWarehouse(path.join(root, name));
    try { console.log(JSON.stringify({ mode: 'local-sqlite-only', ...loadLocal(db, batch, createHmac('sha256', salt).update('etl-local-salt-check').digest('hex')) })); }
    finally { db.close(); }
  }
} catch (error) {
  // Never print raw rows, database credentials or parser input.
  console.error(error.code ? `ETL failed (${error.code})` : error.message);
  process.exitCode = 1;
}
