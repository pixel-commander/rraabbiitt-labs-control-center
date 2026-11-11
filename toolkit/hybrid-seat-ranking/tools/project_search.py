"""Read-only binding of the established hybrid engine to the registered lab catalog."""
import argparse
import contextlib
import json
import sys
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--project', required=True)
parser.add_argument('--catalog', required=True)
parser.add_argument('--operation', choices=('search',), default='search')
args = parser.parse_args()
project = Path(args.project).resolve(strict=True)
world = json.loads((project / 'rab.world.json').read_text(encoding='utf-8-sig'))


def location(name):
    matches = [entry for entry in world['paths'] if entry.get('name') == name]
    if len(matches) != 1:
        raise ValueError(f'Register exactly one {name} location in rab.world.json.')
    return (project / matches[0]['path']).resolve(strict=True)


root = location('hybrid-seat-ranking')
if not root.is_relative_to(project):
    raise ValueError('Project model state must stay inside its project.')
code = location('hybrid-seat-ranking-runtime')
sys.path.insert(0, str(code))

with contextlib.redirect_stdout(sys.stderr):
    import retrieval
    retrieval.ROOT = root
    retrieval.PROJECT = project
    from functools import partial
    from seats import dispatch as seat_dispatch
    seat_dispatch.dispatch = partial(seat_dispatch.dispatch, root=root / 'seats')

    def current_catalog():
        records = json.loads(Path(args.catalog).read_text(encoding='utf-8-sig'))
        if not isinstance(records, list) or not records:
            raise ValueError('Exported catalog must contain records.')
        ids, keys = set(), set()
        for record in records:
            identifier, key = record.get('id'), record.get('record_key')
            if type(identifier) is not int or identifier in ids or not isinstance(key, str) or not key or key in keys:
                raise ValueError('Catalog needs unique numeric IDs and record keys.')
            for field in ('name', 'title', 'description'):
                if record.get(field) is None:
                    record[field] = ''
                elif not isinstance(record[field], str):
                    raise ValueError('Invalid text field: ' + field)
            ids.add(identifier)
            keys.add(key)
        return records

    def readonly_write(*_args, **_kwargs):
        raise RuntimeError('The shipped hybrid baseline is read-only.')

    retrieval.current_catalog = current_catalog
    retrieval.write = readonly_write
    settings = json.load(sys.stdin)
    options = json.loads(settings.get('content') or '{}')
    if not isinstance(options, dict) or options:
        raise ValueError('This connection searches the shipped baseline and live catalog; custom search options are not enabled.')
    from learned_lessons import lesson_steps
    steps, stale = lesson_steps(project, location('learning'), current_catalog())
    if steps:
        import established_runtime
        response = established_runtime.search(
            retrieval.established_api(), settings.get('query', ''), preview_steps=steps)
        result = {'status': 'complete', 'settings': settings, 'response': response}
    else:
        result = retrieval.dispatch('search', settings)
    if result['status'] == 'complete':
        body = json.loads(result['response']['body'])
        body['learning'] = {'method': 'established-supervised-evidence',
                            'approved_steps': len(steps), 'stale_lessons': stale,
                            'encoder_frozen': True, 'neural_weight_updates': False}
        result['response']['body'] = json.dumps(body)

print(json.dumps(result, ensure_ascii=False))
if result['status'] != 'complete':
    sys.exit(1)
