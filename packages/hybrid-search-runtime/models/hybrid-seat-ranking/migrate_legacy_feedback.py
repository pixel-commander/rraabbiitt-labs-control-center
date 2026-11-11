"""Explicit migration of user-authorized legacy feedback IDs, never model proposals."""
import json
import sqlite3
from contextlib import closing

def migrate(root, ids):
    changed=[]
    with closing(sqlite3.connect(root/'data/feedback.sqlite')) as connection:
        with connection:
            for ident in ids:
                found=connection.execute('SELECT payload FROM feedback WHERE id=?',(ident,)).fetchone()
                if not found: raise ValueError(f'Missing feedback row {ident}')
                row=json.loads(found[0])
                if row.get('approval_source')=='user-authorized-legacy-migration': continue
                if row.get('origin') or row.get('review_status'): raise ValueError(f'Row {ident} already has provenance; refusing to override it')
                if row.get('vote') not in ('up','part','down') or row.get('field') not in ('name','title','description') or not row.get('query') or not row.get('record_key'):
                    raise ValueError(f'Row {ident} is not a legacy field feedback record')
                row.update(origin='user:field-feedback',review_status='approved',approval_source='user-authorized-legacy-migration')
                connection.execute('UPDATE feedback SET payload=? WHERE id=?',(json.dumps(row),ident));changed.append(ident)
    return changed
