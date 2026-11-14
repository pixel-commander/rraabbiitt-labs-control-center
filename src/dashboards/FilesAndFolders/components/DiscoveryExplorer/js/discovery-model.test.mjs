import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFolderModel, filePath, isWithin, pathKey } from './discovery-model.ts';
const row=(id,path,name,type,file)=>({id,path,name,type,...(file?{file}:{})});
test('folder layers roll up actual files, inferred folders, types, and duplicates once',()=>{
 const {tree,nodes}=buildFolderModel('X:/repo',[
  row(1,'X:/repo','repo','folder'),row(2,'X:/repo','root.ts','ts','root.ts'),
  row(3,'X:/repo/src/nested','View.tsx','tsx','View.tsx'),row(4,'X:/repo/src','style.css','css','style.css'),
  row(5,'X:/repo/empty','empty','folder'),row(6,'x:/REPO/src/nested','View.tsx','tsx','View.tsx'),
  row(7,'X:/repository','outside.ts','ts','outside.ts'),
 ]);
 assert.equal(tree.file_count,3);assert.equal(tree.folder_count,3);assert.equal(tree.bytes,null);
 assert.deepEqual(tree.types,[{type:'css',count:1},{type:'ts',count:1},{type:'tsx',count:1}]);
 assert.equal(nodes.get(pathKey('X:/repo/src')).file_count,2);assert.equal(nodes.get(pathKey('X:/repo/src')).folder_count,1);
 assert.equal(nodes.get(pathKey('X:/repo/empty')).file_count,0);
 assert.deepEqual(tree.children.map(node=>node.name),['empty','src']);
});
test('path boundaries and platform case rules prevent adjacent-root leakage',()=>{
 assert.equal(isWithin('X:/repo','X:/repository/no.ts'),false);assert.equal(isWithin('X:/repo','x:/REPO/src'),true);
 assert.equal(isWithin('/repo','/Repo/file.ts'),false);assert.equal(isWithin('/','/repo/file.ts'),true);
 assert.equal(pathKey('\\\\Server\\Share\\Folder'),pathKey('//server/share/folder'));
 assert.equal(filePath({path:'/',name:'Root.ts'}),'/Root.ts');
});
