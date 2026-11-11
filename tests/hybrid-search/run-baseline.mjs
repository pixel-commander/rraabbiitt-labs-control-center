import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = dirname(fileURLToPath(import.meta.url));
const project = resolve(folder, '../..');
const world = JSON.parse(await readFile(resolve(project, 'rab.world.json'), 'utf8'));
const location = name => {
  const entries = world.paths.filter(entry => entry.name === name);
  if (entries.length !== 1 || !entries[0].path) throw Error(`Register exactly one ${name} in rab.world.json.`);
  return entries[0];
};
const model = location('hybrid-seat-ranking');
const runtime = location('hybrid-seat-ranking-runtime');
const python = location('search-python');
const executable = resolve(project, python.path, python.file);
await Promise.all([executable, resolve(project, model.path), resolve(project, runtime.path)].map(path => access(path)));
// Resolve relative registrations from this manifest's actual location after transfer.
const config = { model: resolve(project, model.path), runtime: resolve(project, runtime.path) };
const output = resolve(project, '.tmp/hybrid-search-baseline');
await mkdir(output, { recursive: true });
const result = await new Promise((done, fail) => {
  const child = spawn(executable, ['-B', resolve(folder, 'baseline.py')], {
    cwd: project, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1', PYTHONIOENCODING: 'utf-8' },
  });
  let stdout = '', stderr = '';
  const timer = setTimeout(() => { child.kill(); fail(Error('Baseline tests timed out after five minutes.')); }, 300_000);
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; process.stderr.write(chunk); });
  child.on('error', error => { clearTimeout(timer); fail(error); });
  child.stdin.on('error', error => { clearTimeout(timer); fail(error); });
  child.on('close', code => { clearTimeout(timer); done({ code, stdout, stderr }); });
  child.stdin.end(JSON.stringify(config));
});
await writeFile(resolve(output, 'output.log'), result.stderr);
let report;
try { report = JSON.parse(result.stdout); }
catch { throw Error(`Baseline runner returned invalid JSON (exit ${result.code}). See ${output}.`); }
await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2)+'\n');
console.log(`${report.status}: ${report.cases?.filter(row => row.passed).length ?? 0}/${report.cases?.length ?? 0} baseline queries. Report: ${resolve(output, 'report.json')}`);
if (report.error) console.error(report.error);
if (result.code !== 0 || report.status !== 'PASS') process.exitCode = 1;
