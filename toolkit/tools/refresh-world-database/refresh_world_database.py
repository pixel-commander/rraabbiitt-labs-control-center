"""Resolve settings, adjacent READMEs and explicitly paired usage skills."""
import sqlite3
import sys
from contextlib import closing
import hashlib
import json
from pathlib import Path
import re
import os
import yaml

def read_skill(file):
    """Read YAML skills plus the legacy injected-id + JSON skill format."""
    text = file.read_text(encoding='utf-8-sig')
    try:
        skill = yaml.safe_load(text)
    except yaml.YAMLError:
        legacy = re.fullmatch(r'\s*id:\s*(\d+)\s*\r?\n(\s*\{.*\})\s*', text, re.DOTALL)
        if not legacy:
            raise
        skill = json.loads(legacy.group(2))
        if not isinstance(skill, dict):
            raise ValueError(f'Invalid legacy skill: {file}')
        skill.setdefault('id', int(legacy.group(1)))
    if not isinstance(skill, dict):
        raise ValueError(f'Invalid skill: {file}')
    return skill

def prepare_catalog(project, *, skip_missing_owners=False, all_settings=False, warnings=None):
    project = Path(project).resolve()
    def read(file):
        return json.loads(file.read_text(encoding='utf-8-sig'))
    def allowed(file):
        parts = [p.casefold() for p in file.relative_to(project).parts]
        return (file.resolve().is_relative_to(project)
                and not file.is_symlink()
                and not any(p in {'template','templates','node_modules','.git','.tmp','dist','build','coverage','checkpoints','.venv','venv'} for p in parts))
    def source(file, kind):
        return dict(path=file.relative_to(project).as_posix(), kind=kind,
                    sha256=hashlib.sha256(file.read_bytes()).hexdigest())
    files = set()
    locations = [{'path': '.'}] if all_settings else read(project/'rab.project.json')['paths']
    pending = list(locations)
    seen_beacons = set()
    while pending:
        location = pending.pop(0)
        if location.get('file'):
            target=project/location['path'].replace('\\','/')/location['file']
            if not target.resolve().is_relative_to(project):
                raise ValueError('Registered file escapes project')
            if target.name == 'rab.beacon.json' and target.is_file() and allowed(target):
                if target in seen_beacons:
                    continue
                seen_beacons.add(target)
                beacon = read(target)
                if not isinstance(beacon.get('paths'), list):
                    raise ValueError('Beacon paths must be an array: '+str(target))
                for child in beacon['paths']:
                    folder = (target.parent/child.get('path', '.').replace('\\','/')).resolve()
                    if not folder.is_relative_to(project):
                        raise ValueError('Beacon path escapes project: '+str(target))
                    pending.append({**child, 'path': folder.relative_to(project).as_posix()})
                continue
            if target.is_file() and allowed(target) and (target.name=='rab.settings.json' or target.name.endswith('.skill.yaml')):
                files.add(target)
            continue
        folder = (project/location['path'].replace('\\','/')).resolve()
        if not folder.is_relative_to(project):
            raise ValueError('Registered path escapes project')
        for directory, children, names in os.walk(folder, followlinks=False):
            children[:] = [name for name in children if allowed(Path(directory)/name)]
            files.update(Path(directory)/name for name in names
                         if (name=='rab.settings.json' or name.endswith('.skill.yaml'))
                         and allowed(Path(directory)/name))
    records=[]; owners={}
    for file in sorted(f for f in files if f.name=='rab.settings.json'):
        record=read(file)
        if not all_settings and record.get('type')=='path' and record.get('id') is None:
            continue
        key=file.parent.relative_to(project).as_posix()
        record.update(path=key, record_key=key, sources=[source(file,'settings')], skills=[])
        fields=[str(record.get(k,'')) for k in ('name','title','type','description')]
        fields+=[' '.join(record.get('tags',[])),key]
        for doc in sorted(file.parent.iterdir()):
            if doc.is_file() and doc.name.casefold() in ('readme.txt','readme.md') and allowed(doc):
                fields.append(doc.read_text(encoding='utf-8-sig'))
                record['sources'].append(source(doc,'readme'))
        record['text']='\n\n'.join(x for x in fields if x)
        records.append(record)
        # An implementation reference must resolve to the actual declared file.
        target=file.parent/record.get('file','rab.settings.json')
        owners.setdefault(target.resolve(),[]).append(record)
    for file in sorted(f for f in files if f.name.endswith('.skill.yaml')):
        skill=read_skill(file)
        text='\n\n'.join(str(skill.get(k,'')) for k in ('name','title','description','instructions'))
        linked=[]
        if skill.get('owner') is not None:
            declared=skill['owner']
            if not isinstance(declared,dict) or type(declared.get('id')) is not int:
                raise ValueError('Skill owner requires numeric id: '+str(file))
            matches=[r for r in records if r.get('id')==declared['id']]
            if len(matches)!=1:
                if skip_missing_owners and not matches:
                    continue
                if not all_settings or len(matches)>1:
                    raise ValueError('Skill owner ID missing or ambiguous: '+str(file))
                if warnings is not None:
                    warnings.append(dict(file=str(file),owner=declared['id'],error='Owner ID absent from rab.settings.json; skill indexed without owner link.'))
            linked=matches
        ref=source(file,'skill')
        house_fields=('id','name','title','description','type','path','file')
        owner_keys={k:linked[0][k] for k in house_fields if k in linked[0]} if linked else None
        skill_keys={k:skill[k] for k in ('id','name','title','description') if k in skill}
        skill_keys.update(path=ref['path'],instructions=skill.get('instructions',''))
        for owner in linked:
            owner['skills'].append(skill_keys)
            owner['sources'].append(ref)
            owner['text']+='\n\n'+text
        # An adjacent usage guide without its own ID stays attached to its owner.
        # It is not a separately registered skill record.
        if 'id' not in skill:
            continue
        key=file.relative_to(project).as_posix()
        record={k:skill[k] for k in ('id','name','title','description','tags','context','intent','outputs') if k in skill}
        record.update(type='skill',path=file.parent.relative_to(project).as_posix(),file=file.name,
                      record_key=key,text=text,sources=[ref],skills=[],instructions=skill.get('instructions',''))
        if owner_keys: record['owner']=owner_keys
        records.append(record)
    return records


def prepare_world(world_root, database_project, warnings=None):
    """Index registered projects, retaining the database project's existing keys."""
    world_root, database_project = Path(world_root).resolve(), Path(database_project).resolve()
    world = json.loads((world_root/'rab.world.json').read_text(encoding='utf-8-sig'))
    records, seen_projects = [], set()
    for entry in world['paths']:
        if entry.get('type') != 'project':
            continue
        project = (world_root/entry['path']).resolve(strict=True)
        if not project.is_relative_to(world_root):
            raise ValueError('Registered project escapes world: '+str(project))
        if project in seen_projects:
            continue
        seen_projects.add(project)
        prefix = '' if project == database_project else project.relative_to(world_root).as_posix()+'/'
        for record in prepare_catalog(project, all_settings=True, warnings=warnings):
            for key in ('path', 'record_key'):
                record[key] = prefix+record[key]
            for source in record['sources']:
                source['path'] = prefix+source['path']
            if record.get('owner'):
                record['owner']['path'] = prefix+record['owner']['path']
            for skill in record['skills']:
                skill['path'] = prefix+skill['path']
            records.append(record)
    return records


def include_registered_toolkits(project, records, warnings):
    """Include exactly this world's toolkit registrations, with local copies first."""
    world_file = project/'rab.world.json'
    if not world_file.is_file():
        return records
    world = json.loads(world_file.read_text(encoding='utf-8-sig'))
    boundary = project
    seen_ids = {row['id'] for row in records}
    seen_folders = set()
    for entry in world.get('toolkits', []):
        folder = (project/entry['path']).resolve(strict=True)
        if not folder.is_relative_to(boundary):
            raise ValueError('Registered toolkit escapes this project: '+str(folder))
        if folder in seen_folders:
            continue
        seen_folders.add(folder)
        prefix = Path(os.path.relpath(folder, project)).as_posix()+'/'
        for row in prepare_catalog(folder, all_settings=True, warnings=warnings):
            if row.get('id') in seen_ids:
                continue
            for key in ('path', 'record_key'):
                row[key] = prefix+row[key]
            for source in row['sources']:
                source['path'] = prefix+source['path']
            if row.get('owner'):
                row['owner']['path'] = prefix+row['owner']['path']
            for skill in row['skills']:
                skill['path'] = prefix+skill['path']
            records.append(row)
            seen_ids.add(row.get('id'))
    return records


def refresh(settings):
    """Index registered records and skills in one database transaction."""
    root = Path(__file__).resolve().parents[3]
    supplied = None
    if 'path' in settings:
        if not isinstance(settings['path'], str) or not settings['path'].strip():
            raise ValueError('path must be a nonempty string when supplied.')
        supplied = Path(settings['path']).resolve(strict=True)
        if supplied.is_dir():
            root = supplied
        else:
            for folder in supplied.parents:
                config = folder / 'rab.project.json'
                if config.is_file() and json.loads(config.read_text(encoding='utf-8-sig')).get('type') == 'project':
                    root = folder
                    break
            else:
                raise ValueError('Cannot find project settings for supplied database.')
    world_root = None
    if (root/'rab.world.json').is_file():
        registered_world = json.loads((root/'rab.world.json').read_text(encoding='utf-8-sig'))
        if any(entry.get('name') == 'rraabbiitt-toolkits' and entry.get('type') == 'project' for entry in registered_world.get('paths', [])):
            world_root = root
    if world_root is not None:
        world = json.loads((world_root/'rab.world.json').read_text(encoding='utf-8-sig'))
        projects = [entry for entry in world['paths'] if entry.get('name') == 'rraabbiitt-toolkits' and entry.get('type') == 'project']
        if len(projects) != 1:
            raise ValueError('Register exactly one rraabbiitt-toolkits database project.')
        root = (world_root/projects[0]['path']).resolve(strict=True)
        if not root.is_relative_to(world_root):
            raise ValueError('Database project escapes world.')
    config = json.loads((root / 'rab.project.json').read_text(encoding='utf-8-sig'))
    entries = [entry for entry in config['paths'] if entry.get('name') == 'database']
    if len(entries) != 1 or not isinstance(entries[0].get('path'), str) or not isinstance(entries[0].get('file'), str):
        raise ValueError('Root rab.project.json must define one database path and file.')
    database = (root / entries[0]['path'] / entries[0]['file']).resolve(strict=True)
    if not database.is_relative_to(root):
        raise ValueError('Configured database path escapes the project root.')
    if supplied is not None and supplied.is_file() and supplied != database:
        raise ValueError('Refresh requires the root-configured database.')
    warnings = []
    catalog = prepare_world(world_root, root, warnings) if world_root else include_registered_toolkits(root, prepare_catalog(root), warnings)
    seen = set()
    for row in catalog:
        if type(row.get('id')) is not int:
            raise ValueError('Missing numeric House ID: ' + row['record_key'])
        if row['id'] in seen:
            raise ValueError('Duplicate House ID: ' + str(row['id']))
        seen.add(row['id'])
    with closing(sqlite3.connect(database.as_uri() + '?mode=rw', uri=True)) as db:
        db.execute('PRAGMA foreign_keys=ON')
        with db:
            for row in catalog:
                tags = json.dumps(row.get('tags', []))
                paths = json.dumps(row.get('paths', []))
                values = [row['id']] + [row.get(k) for k in ('name','title','description','type','path','file')] + [tags,paths,json.dumps(row)]
                db.execute('''INSERT INTO records(id,name,title,description,type,path,file,tags,paths,data)
                    VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name,title=excluded.title,description=excluded.description,type=excluded.type,
                    path=excluded.path,file=excluded.file,tags=excluded.tags,paths=excluded.paths,data=excluded.data''', values)
                identifier = row['id']
                db.execute('DELETE FROM record_words WHERE record_id=?', (identifier,))
                db.execute('DELETE FROM record_pairs WHERE record_id=?', (identifier,))
                for field in ('name','title','description','path','file','type','tags','instructions'):
                    value = row.get(field, '')
                    values_to_index = value if isinstance(value,list) else [value]
                    position = 0
                    for value in values_to_index:
                        previous = None
                        for word in re.findall(r'[^\W_]+',str(value).casefold()):
                            db.execute('INSERT OR IGNORE INTO words(word) VALUES(?)',(word,))
                            word_id = db.execute('SELECT id FROM words WHERE word=?',(word,)).fetchone()[0]
                            db.execute('INSERT INTO record_words VALUES(?,?,?,?)',(identifier,field,position,word_id))
                            if previous is not None:
                                db.execute('INSERT INTO record_pairs VALUES(?,?,?,?,?)',(identifier,field,position-1,previous,word_id))
                            previous = word_id
                            position += 1
            # Delete only source-managed records. Application data stays intact.
            for identifier, data in db.execute('SELECT id,data FROM records').fetchall():
                if json.loads(data).get('record_key') is not None and identifier not in seen:
                    db.execute('DELETE FROM records WHERE id=?', (identifier,))
        counts = dict(records=sum(row['type'] != 'skill' for row in catalog),
                      skill=sum(row['type'] == 'skill' for row in catalog))
    return dict(status='complete',settings=settings,response=dict(
        summary=dict(count=len(catalog)),body=json.dumps(dict(counts=counts,catalog=len(catalog),warnings=warnings)),path=str(database.parent)))


if __name__ == '__main__':
    sys.stdin.reconfigure(encoding='utf-8-sig')
    sys.stdout.reconfigure(encoding='utf-8')
    settings = {}
    try:
        settings = json.load(sys.stdin)
        print(json.dumps(refresh(settings),ensure_ascii=False))
    except Exception as error:
        print(json.dumps(dict(status='error',settings=settings,error=str(error))))
        sys.exit(1)
