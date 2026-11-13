"""Evaluate frozen system records with the shipped engine; never load site data."""
import contextlib
import hashlib
import json
import math
import sys
import time
from functools import partial
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reject_write(*_args, **_kwargs):
    raise RuntimeError('Baseline checks cannot write model state.')


def main():
    config = json.load(sys.stdin)
    folder = Path(__file__).resolve().parent
    fixture = json.loads((folder/'expectations.json').read_text(encoding='utf-8'))
    catalog_file = folder/'catalog.json'
    catalog = json.loads(catalog_file.read_text(encoding='utf-8'))
    if len(catalog) != fixture['records'] or len({r['id'] for r in catalog}) != len(catalog):
        raise ValueError('Frozen catalog count or original IDs do not match.')
    if any(type(r['id']) is not int for r in catalog):
        raise ValueError('Catalog requires original numeric House IDs.')
    root = Path(config['model']).resolve(strict=True)
    checkpoint = root/'checkpoints'/fixture['checkpoint']
    for name in ('examples.json', 'record-examples.json'):
        if json.loads((checkpoint/name).read_text(encoding='utf-8')) != []:
            raise ValueError('Baseline must have no customer or trained examples.')
    # Record every shipped file before inference so an unexpected write fails.
    before = {p.relative_to(root).as_posix(): digest(p) for p in root.rglob('*') if p.is_file()}
    engine = json.loads((checkpoint/'engine.json').read_text(encoding='utf-8'))
    sys.path.insert(0, config['runtime'])
    with contextlib.redirect_stdout(sys.stderr):
        import retrieval
        import established_runtime
        from seats import dispatch as seat_dispatch
        retrieval.ROOT = root
        retrieval.PROJECT = folder
        retrieval.current_catalog = lambda: catalog
        retrieval.write = reject_write
        seat_dispatch.dispatch = partial(seat_dispatch.dispatch, root=root/'seats')
        api = retrieval.established_api()
        # Bind only the known shipped checkpoint and frozen catalog.
        api.checkpoint_folder = lambda _checkpoint=None: checkpoint
        rows = []
        started = time.monotonic()
        for case in fixture['cases']:
            found = established_runtime.search(api, case['query'])['paths']
            rank = next((i+1 for i, record in enumerate(found) if record['id'] == case['expected_id']), None)
            valid = all(record['ranking']['score_kind'] == 'bm25-sentence-transformers-rrf'
                        and math.isfinite(record['ranking']['score']) for record in found)
            if case.get('instructions_include'):
                selected = next((record for record in found if record['id'] == case['expected_id']), {})
                valid = valid and case['instructions_include'] in selected.get('instructions', '')
            passed = rank is not None and rank <= case['max_rank'] and valid
            rows.append(dict(**case, actual_rank=rank, passed=passed,
                             top=[dict(id=r['id'], title=r.get('title'), score=r['ranking']['score']) for r in found[:3]]))
            print(('PASS' if passed else 'FAIL')+': '+case['query']+' -> rank '+str(rank), file=sys.stderr, flush=True)
        elapsed = round((time.monotonic()-started)*1000)
    after = {p.relative_to(root).as_posix(): digest(p) for p in root.rglob('*') if p.is_file()}
    unchanged = before == after
    result = dict(status='PASS' if all(r['passed'] for r in rows) and unchanged else 'FAIL',
                  date=int(time.time()*1000), checkpoint=fixture['checkpoint'],
                  catalog_sha256=fixture['catalog_sha256'], records=len(catalog),
                  shipped_files_unchanged=unchanged, project_database_used=False,
                  customer_lessons_used=False, training=False, elapsed_ms=elapsed, cases=rows)
    print(json.dumps(result))
    return 0 if result['status'] == 'PASS' else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(json.dumps(dict(status='ERROR', error=str(error))))
        sys.exit(1)
