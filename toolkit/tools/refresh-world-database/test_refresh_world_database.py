from contextlib import closing
import json
import shutil
import sqlite3
import tempfile
import unittest
from pathlib import Path
from refresh_world_database import refresh, prepare_world, include_registered_toolkits


class WorldIndexTests(unittest.TestCase):
    def test_world_coverage_id_links_and_transaction(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            toolkit = root/'rraabbiitt-toolkits'
            components = root/'components'
            def write(file, value):
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(json.dumps(value))
            write(root/'rab.world.json', {'paths': [
                {'type':'project','name':'rraabbiitt-toolkits','path':'rraabbiitt-toolkits'},
                {'type':'project','name':'components','path':'components'}]})
            write(toolkit/'rab.project.json', {'paths':[
                {'name':'database','path':'db','file':'catalog.sqlite'},
                {'name':'tools','path':'tools'}]})
            write(components/'rab.project.json', {'paths':[]})
            write(toolkit/'tools/example/rab.settings.json', {'id':1,'name':'example','type':'tool'})
            write(components/'unregistered/deep/rab.settings.json', {'id':2,'name':'Card','type':'component'})
            write(components/'scaffolds/example/rab.settings.json', {'id':3,'name':'scaffold','type':'tool'})
            write(components/'template/rab.settings.json', {'id':2,'name':'placeholder'})
            write(components/'unregistered/deep/use.skill.yaml', {'id':4,'name':'Use Card','owner':{'id':2},'instructions':'Use it.'})
            template=Path(__file__).resolve().parents[1]/'generate-world-database/template/catalog.sqlite'
            (toolkit/'db').mkdir()
            shutil.copyfile(template, toolkit/'db/catalog.sqlite')
            rows=prepare_world(root,toolkit)
            self.assertEqual({r['id'] for r in rows},{1,2,3,4})
            self.assertEqual(next(r for r in rows if r['id']==1)['record_key'],'tools/example')
            skill=next(r for r in rows if r['id']==4)
            self.assertEqual(skill['owner']['id'],2)
            self.assertEqual(skill['record_key'],'components/unregistered/deep/use.skill.yaml')
            self.assertEqual(refresh({'path':str(root)})['status'],'complete')
            with closing(sqlite3.connect(toolkit/'db/catalog.sqlite')) as db:
                before=db.execute('SELECT id,path,data FROM records ORDER BY id').fetchall()
            # An explicit child project must not inherit its parent's world.
            refresh({'path':str(toolkit)})
            with closing(sqlite3.connect(toolkit/'db/catalog.sqlite')) as db:
                self.assertEqual([1], [row[0] for row in db.execute('SELECT id FROM records ORDER BY id')])
            # World-wide indexing requires the explicit world entry point.
            refresh({'path':str(root)})
            with closing(sqlite3.connect(toolkit/'db/catalog.sqlite')) as db:
                self.assertEqual(before,db.execute('SELECT id,path,data FROM records ORDER BY id').fetchall())
            write(components/'duplicate/rab.settings.json',{'id':2,'name':'duplicate','type':'component'})
            with self.assertRaises(ValueError): refresh({'path':str(root)})
            with closing(sqlite3.connect(toolkit/'db/catalog.sqlite')) as db:
                self.assertEqual(before,db.execute('SELECT id,path,data FROM records ORDER BY id').fetchall())

    def test_registered_toolkit_cannot_escape_project(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            project, sibling = root/'project', root/'sibling'
            project.mkdir()
            sibling.mkdir()
            (project/'rab.world.json').write_text(json.dumps({
                'toolkits': [{'path': '../sibling'}]
            }))
            with self.assertRaisesRegex(ValueError, 'escapes this project'):
                include_registered_toolkits(project, [], [])


if __name__ == '__main__':
    unittest.main()
