import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { dumbot, responder, fillContract, confirmContract, executionReply } from '../../models/dumbot/dumbot.ts';
import { randomUUID, createHash } from 'node:crypto';
import { run as useTool } from '../../toolkit/rab-world/runners/runner-use-tool/runner-use-tool.ts';
import { readDbRecords, configuredPaths, fillPathSlots } from '../../src/pages/DumBot/db-pairs.adapter.ts';

const proposals = new Map();
const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const executableValues = (root, values) => Object.fromEntries(Object.entries(values).map(([key, value]) =>
  [key, key === 'path' && typeof value === 'string' && value !== '' ? resolve(root, value) : value]));
async function getRequirements(root, record, data) {
  const owner = record.type === 'skill' ? data.find(row => row.id === record.owner?.id) : record;
  if (!owner) throw Error('This skill has no registered owner with settings.');
  const source = owner.sources?.find(source => source.kind === 'settings');
  if (!source?.path) throw Error('This result has no registered settings file.');
  const base = await realpath(root);
  const file = await realpath(resolve(base, source.path));
  const local = relative(base, file);
  if (local.startsWith('..') || isAbsolute(local)) throw Error('Settings must be inside this project.');
  const settings = JSON.parse(await readFile(file, 'utf8'));
  if (settings.id !== owner.id) throw Error('Settings ID does not match the selected record.');
  return { owner, reqs: Array.isArray(settings.settings) ? settings.settings : [], registration: settings };
}
function parseAnswer(text, prop) {
  if (prop.type === 'number' || prop.type === 'integer') {
    const number = Number(text);
    if (!text.trim() || !Number.isFinite(number) || (prop.type === 'integer' && !Number.isInteger(number))) throw Error('Enter a valid number.');
    return number;
  }
  if (prop.type === 'boolean') {
    if (!/^(true|false)$/i.test(text.trim())) throw Error('Enter true or false.');
    return text.trim().toLowerCase() === 'true';
  }
  if (prop.type === 'array' || prop.type === 'object') {
    const value = JSON.parse(text);
    if (prop.type === 'array' ? !Array.isArray(value) : value === null || typeof value !== 'object' || Array.isArray(value)) throw Error(`Enter a JSON ${prop.type}.`);
    return value;
  }
  return text;
}
export async function searchDumbot(world, settings) {
  try {
    if (typeof settings?.query !== 'string' || !settings.query.trim() || settings.query.length > 2000 || !Number.isSafeInteger(settings.message)) throw Error('Supply query and saved message ID.');
    const project = JSON.parse(await readFile(resolve(world.path, 'rab.project.json'), 'utf8'));
    const registration = project.paths.find(entry => entry.name === 'database');
    const db = new DatabaseSync(resolve(world.path, registration.path, registration.file), { readOnly: true });
    try {
      const message = db.prepare('SELECT type, description FROM messages WHERE id=?').get(settings.message);
      if (message?.type !== 'user' || message.description.trim() !== settings.query.trim()) throw Error('Query must match the saved user message.');
    } finally { db.close(); }
    const data = await readDbRecords({ path: world.path });
    const paths = await configuredPaths();
    const result = dumbot({ query: settings.query, data, project_slots: Object.fromEntries(Object.keys(paths).map(key => [key, []])) });
    let reply = result.paths.length ? `I found ${result.summary.total} matching results.` : "I didn't find a matching result.";
    let contract;
    const continuing = settings.select === undefined && settings.contract && ["filling", "confirming"].includes(settings.contract.phase);
    const selected = settings.select ?? (continuing ? settings.contract.id : result.paths[0]?.id);
    if (selected !== undefined) {
      if (!Number.isSafeInteger(selected)) throw Error('Selected result must be a numeric ID.');
      const record = data.find(row => row.id === selected);
      if (!record) throw Error('Selected result is no longer registered.');
      let requirements;
      try { requirements = await getRequirements(world.path, record, data); }
      catch (error) {
        if (continuing || settings.select !== undefined) throw error;
        return { code: 200, body: { status: 'complete', return_type: 'api-call', settings,
          response: { ...result, reply: 'The top result is “' + (record.title ?? record.name) + '”, but it has no usable registered contract. ' + error.message } } };
      }
      const { owner, reqs, registration } = requirements;
      const supplied = continuing ? settings.contract.values ?? {} : {};
      if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) throw Error('Contract values must be an object.');
      let values = Object.fromEntries(reqs.filter(prop => Object.hasOwn(supplied, prop.name)).map(prop => [prop.name, supplied[prop.name]]));
      // Fill only exact unambiguous slot values; never use a guessed value as a required answer.
      if (!continuing) for (const prop of reqs) {
        const matches = [...new Set(result.slots.filter(slot => slot.slot === prop.name).map(slot => slot.normalized))];
        if (matches.length === 1) values[prop.name] = matches[0];
      }
      if (!continuing) {
        values = fillContract(settings.query, reqs, values);
        values = fillPathSlots(values, reqs, result.slots, paths);
        if (Object.hasOwn(values, 'path')) result.slots.push({ slot: 'path', word: '', stem: '', normalized: values.path, source: 'contract' });
      }
      const before = responder(reqs, values);
      let error = '';
      if (continuing && settings.contract.phase === "filling" && before.next) {
        try { values[before.next] = parseAnswer(settings.query, reqs.find(prop => prop.name === before.next)); }
        catch (reason) { error = reason.message + ' '; }
      }
      const answer = confirmContract(owner.title ?? owner.name, reqs, values,
        undefined);
      contract = { id: owner.id, values: answer.values, next: answer.next, phase: answer.phase,
        action: continuing ? settings.contract.action : result.slots.find(slot => slot.slot === 'action')?.normalized,
        type: continuing ? settings.contract.type : result.slots.find(slot => slot.slot === 'type')?.normalized };
      reply = error + answer.text;
      if (answer.phase === 'confirming') {
        if (!['tool', 'runner'].includes(owner.type)) throw Error('The selected result is not an executable tool or runner.');
        const toolkits = world.toolkits.map(entry => ({ ...entry, path: resolve(world.path, entry.path) }));
        const decision = settings.query.trim().toLowerCase().replace(/[.!?]+$/, '');
        const prior = continuing && settings.contract.phase === 'confirming' ? proposals.get(settings.contract.token) : undefined;
        if (continuing && settings.contract.phase === 'confirming') {
          if (!prior || prior.root !== world.path || prior.id !== owner.id || prior.expires < Date.now()) throw Error('Confirmation expired. Start a new search to review the tool again.');
          if (prior.used) throw Error('This confirmation has already been used. The tool was not run again.');
          if (prior.fingerprint !== fingerprint({ registration, values: answer.values })) throw Error('The proposed tool or values changed. Start a new search to review them.');
        }
        if (prior && decision === 'no') {
          prior.used = true;
          contract.phase = 'cancelled';
          reply = 'Cancelled. Nothing was executed.';
          answer.phase = 'cancelled';
        } else if (prior && decision === 'yes') {
          prior.used = true;
          const receipts = await useTool({ id: prior.id, content: JSON.stringify(prior.values), toolkits });
          const failed = receipts.find(step => step.status === 'error');
          contract.phase = failed ? 'failed' : 'complete';
          reply = executionReply(receipts, prior.request);
          answer.execution = receipts;
          answer.executed = true;
          answer.phase = contract.phase;
        } else {
          const inspection = await useTool({ id: owner.id, toolkits });
          const failed = inspection.find(step => step.status === 'error');
          if (failed) throw Error(failed.error ?? 'Cannot load the registered tool and its usage skill.');
          for (const [key, proposal] of proposals) if (proposal.expires < Date.now()) proposals.delete(key);
          if (prior) prior.used = true;
          const token = randomUUID();
          const executionValues = executableValues(world.path, answer.values);
          proposals.set(token, { root: world.path, id: owner.id, values: executionValues, request: { action: contract.action, type: contract.type, name: answer.values.name, path: answer.values.save_path ?? answer.values.path },
            fingerprint: fingerprint({ registration, values: answer.values }), expires: Date.now() + 600000, used: false });
          contract.token = token;
          answer.proposal = { id: owner.id, title: owner.title, values: executionValues };
          answer.inspection = inspection;
          reply = answer.text + ' This will run ' + (owner.title ?? owner.name) + ' (ID ' + owner.id + ') with ' + JSON.stringify(executionValues) + '.';
        }
      }
      // Follow-up answers retain selected result; they are not a new search intent.
      if (continuing) result.paths = [{ ...owner, record_key: owner.record_key ?? String(owner.id), score: 0, ranking: { rank: 1, score: 0, score_kind: 'selected-contract' } }];
      result.response = { ...answer, reqs };
    }
    return { code: 200, body: { status: 'complete', return_type: 'api-call', settings,
      response: { ...result, reply, contract } } };
  } catch (error) {
    return { code: 400, body: { status: 'error', return_type: 'api-call', settings, error: error.message } };
  }
}
