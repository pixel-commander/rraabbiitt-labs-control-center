import { DatabaseSync } from 'node:sqlite';
import { readFile, stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeTool as newTable } from '../../../../../toolkit/tools/new-db-table/new-db-table.mjs';

export async function databaseLocation() {
  const manifest = new URL('../../../../../rab.world.json', import.meta.url);
  const world = JSON.parse(await readFile(manifest, 'utf8'));
  const entry = world.paths.find(row => row.name === 'database');
  if (!entry?.path || !entry.file) throw Error('Register the project database.');
  return resolve(fileURLToPath(new URL('.', manifest)), entry.path, entry.file);
}
export async function ensureDiscovery(file) {
  if (!(await stat(file)).isFile()) throw Error('Discovery needs an existing database.');
  const probe = new DatabaseSync(file);
  let exists;
  try { exists = probe.prepare("SELECT 1 FROM sqlite_master WHERE name='discovery'").get(); }
  finally { probe.close(); }
  if (!exists) {
    const { dirname } = await import('node:path');
    const created = await newTable({path:dirname(file), file:basename(file), name:'discovery'});
    if (created.status !== 'complete' && !created.error?.includes('already exists')) throw Error(created.error);
  }
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
    const columns = new Set(db.prepare('PRAGMA table_info(discovery)').all().map(row => row.name));
    for (const [name, type] of [['root','TEXT'], ['date_updated','INTEGER'], ['size','INTEGER']]) {
      if (!columns.has(name)) db.exec(`ALTER TABLE discovery ADD COLUMN ${name} ${type}`);
    }
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS discovery_location ON discovery(root,path,coalesce(file,'')); COMMIT");
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  finally { db.close(); }
}
export async function saveDiscovery(file, root, paths) {
  await ensureDiscovery(file);
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
    const key = row => row.path + '\0' + (row.file ?? '');
    const old = new Map(db.prepare('SELECT id,path,file FROM discovery WHERE root=?').all(root).map(row => [key(row),row.id]));
    let id = Math.max(Date.now(), Number(db.prepare('SELECT max(id) AS id FROM discovery').get().id ?? 0) + 1);
    db.prepare('DELETE FROM discovery WHERE root=?').run(root);
    const insert = db.prepare('INSERT INTO discovery(id,name,type,path,file,root,date_updated,size) VALUES(?,?,?,?,?,?,?,?)');
    const date = Date.now();
    const saved=[];
    for (const row of paths) {
      if (row.error || row.type === 'error') continue;
      const rowId=old.get(key(row)) ?? id++;
      insert.run(rowId,row.name,row.type,row.path,row.file??null,root,date,typeof row.size==='number'&&Number.isSafeInteger(row.size)&&row.size>=0?row.size:null);
      saved.push({...row,id:rowId});
    }
    db.exec('COMMIT');
    return saved;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  finally { db.close(); }
}
