"""Read approved installation lessons for the established engine's evidence API."""
import json
from pathlib import Path


def lesson_steps(project, learning, catalog):
    project, learning = Path(project).resolve(), Path(learning).resolve()
    if not learning.is_relative_to(project):
        raise ValueError('Learning files must stay inside this project.')
    rows = []
    for subject in ('search-results', 'question-rephrasing'):
        folder = learning / 'learned-on-site' / subject / 'lessons'
        for file in sorted(folder.glob('message-*.json')):
            row = json.loads(file.read_text(encoding='utf-8-sig'))
            if row.get('approved') is True and row.get('name') == 'all':
                rows.append(row)
    rows.sort(key=lambda row: (row['date'], row['sequence']))
    latest = {}
    for row in rows:
        key = (row['query'].strip().casefold(), row['id'])
        latest.pop(key, None)
        latest[key] = row
    if len(latest) > 50:
        raise ValueError('The established evidence API supports 50 distinct question/result lessons; consolidation is required. No history was truncated.')
    known = {record['id']: record for record in catalog}
    steps, stale = [], []
    for row in latest.values():
        record = known.get(row['id'])
        source = row['source']['record']
        snapshot = source.get('data') or source
        if not record or any(
            (snapshot.get(field) or '') != (record.get(field) or '')
            for field in ('name', 'title', 'description')
        ):
            stale.append({'id': row['id'], 'query': row['query'], 'reason': 'Source record changed or is missing.'})
            continue
        vote = row['content']['vote']
        if vote not in ('up', 'part', 'down'):
            raise ValueError('Invalid approved lesson vote.')
        # The taught question is its own group. A lower-ranked rephrase does not
        # turn the original source question into a positive alias.
        steps.append({
            'query': row['query'].strip(), 'id': row['id'],
            'path': record['record_key'], 'name': 'all',
            'content': json.dumps({'vote': vote, 'origin': 'user', 'review_status': 'approved'})
        })
    return steps, stale
