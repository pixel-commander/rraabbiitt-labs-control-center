"""Validate the portable search catalog without scanning a repository."""
import json
import sqlite3
from pathlib import Path


def database_path(project):
    project = Path(project).resolve()
    settings = json.loads((project / 'rab.project.json').read_text(encoding='utf-8-sig'))
    entries = [entry for entry in settings['paths'] if entry.get('name') == 'database']
    if len(entries) != 1 or not isinstance(entries[0].get('path'), str) or not isinstance(entries[0].get('file'), str):
        raise ValueError('Register exactly one database path and file in rab.project.json.')
    database = (project / entries[0]['path'].replace('\\', '/') / entries[0]['file']).resolve(strict=True)
    if not database.is_relative_to(project):
        raise ValueError('The database path escapes the project.')
    return database


def indexed_catalog(project):
    database = database_path(project)
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as db:
        records = [json.loads(row[0]) for table in ('records', 'skill')
                   for row in db.execute('SELECT data FROM ' + table + ' ORDER BY id')]
    ids, keys = set(), set()
    for record in records:
        identifier, key = record.get('id'), record.get('record_key')
        if type(identifier) is not int or identifier in ids:
            raise ValueError('Indexed records need unique numeric IDs.')
        if not isinstance(key, str) or not key or key in keys:
            raise ValueError('Indexed records need unique record keys.')
        for field in ('name', 'title', 'description'):
            if record.get(field) is None:
                record[field] = ''
            elif not isinstance(record[field], str):
                raise ValueError('Invalid text field: ' + field)
        ids.add(identifier)
        keys.add(key)
    if not records:
        raise ValueError('The project index is empty. Run npm run index.')
    return records

def load_catalog(path):
    records = json.loads(path.read_text(encoding='utf-8-sig'))
    if not isinstance(records, list) or not records:
        raise ValueError('Catalog must contain at least one record.')
    ids, keys = set(), set()
    for record in records:
        if not isinstance(record, dict):
            raise ValueError('Each catalog record must be an object.')
        identifier, key = record.get('id'), record.get('record_key')
        if type(identifier) is not int or identifier in ids:
            raise ValueError('Catalog IDs must be unique integers.')
        if not isinstance(key, str) or not key.strip() or key in keys:
            raise ValueError('Catalog record_key values must be unique text.')
        if not isinstance(record.get('path'), str) or not record['path'].strip():
            raise ValueError('Each record needs a path.')
        for field in ('name', 'title', 'description'):
            if not isinstance(record.get(field), str):
                raise ValueError(f'Each record needs text in {field}.')
        ids.add(identifier)
        keys.add(key)
    return records
