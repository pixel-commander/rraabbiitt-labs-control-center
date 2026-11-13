import {DatabaseSync} from "node:sqlite";
import {readFile,realpath} from "node:fs/promises";
import {resolve} from "node:path";
import {withinProject} from "../../scripts/world.mjs";
const failure=(code,error)=>({code,body:{return_type:"api-call",status:"error",settings:{},error}});

export async function favoriteOperation(world,action,settings={}) {
  if(!["get","set","delete"].includes(action)) return failure(404,"Unknown favorite action.");
  if(!settings || typeof settings!=="object" || Array.isArray(settings) || Object.keys(settings).some(key=>key!=="id"))
    return failure(400,"Supply only a numeric record id.");
  if((action!=="get" || settings.id!==undefined) && (!Number.isSafeInteger(settings.id) || settings.id<=0))
    return failure(400,"Supply a positive numeric record id.");
  let db;
  try {
    const project=JSON.parse((await readFile(resolve(world.path,"rab.world.json"),"utf8")).replace(/^\uFEFF/,""));
    const entries=project.paths.filter(row=>row.name==="database");
    if(entries.length!==1) throw Error("Register exactly one database.");
    const file=await realpath(resolve(world.path,entries[0].path,entries[0].file));
    if(!withinProject(world.path,file)) throw Error("Database escapes this world.");
    db=new DatabaseSync(file);db.exec("PRAGMA busy_timeout=1000");
    let response;
    if(action==="get") {
      const rows=settings.id===undefined?db.prepare("SELECT * FROM favorites ORDER BY id").all():db.prepare("SELECT * FROM favorites WHERE id=?").all(settings.id);
      response={paths:rows.map(row=>({...row,tags:row.tags===null?null:JSON.parse(row.tags),paths:row.paths===null?null:JSON.parse(row.paths)}))};
    } else if(action==="set") {
      const columns="id,name,title,type,description,tags,file,path,paths";
      const saved=db.prepare(`INSERT INTO favorites (${columns}) SELECT ${columns} FROM records WHERE id=?
        ON CONFLICT(id) DO UPDATE SET name=excluded.name,title=excluded.title,type=excluded.type,
        description=excluded.description,tags=excluded.tags,file=excluded.file,path=excluded.path,paths=excluded.paths`).run(settings.id);
      if(!saved.changes) return failure(404,"Indexed record not found.");
      response={id:settings.id,favorite:true};
    } else {
      db.prepare("DELETE FROM favorites WHERE id=?").run(settings.id);
      response={id:settings.id,favorite:false};
    }
    return {code:200,body:{return_type:"api-call",status:"complete",settings,response}};
  } catch(error) {return failure(503,error instanceof Error?error.message:String(error));}
  finally {db?.close();}
}

export async function handleFavorites(world,req,res,url) {
  const action=url.pathname.slice("/api/favorites/".length);
  const method={get:"GET",set:"POST",delete:"DELETE"}[action];
  const send=result=>{res.writeHead(result.code,{"Content-Type":"application/json"});res.end(JSON.stringify(result.body));};
  if(!method)return send(failure(404,"Unknown favorite action."));
  if(req.method!==method){res.setHeader("Allow",method);return send(failure(405,`Use ${method}.`));}
  let settings={};
  if(method==="POST") {
    if(!(req.headers["content-type"]??"").startsWith("application/json")) return send(failure(415,"Use application/json."));
    try {
      const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>4096)return send(failure(413,"Favorite request exceeds 4 KB."));chunks.push(chunk);}
      settings=JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {return send(failure(400,"Supply valid JSON."));}
  } else {
    const raw=url.searchParams.get("id");
    if([...url.searchParams.keys()].some(key=>key!=="id") || url.searchParams.getAll("id").length>1 || (raw!==null && !/^[1-9][0-9]*$/.test(raw)))
      return send(failure(400,"Supply one positive numeric id."));
    if(raw!==null)settings.id=Number(raw);
  }
  return send(await favoriteOperation(world,action,settings));
}

/** Tool entry for the master runner. Expects house keys + action + settings. */
export const run = async (props) => {
  const action = props.action ?? props.settings?.action;
  const settings = props.settings ?? props;
  const world = props.world ?? props;
  const result = await favoriteOperation(world, action, settings);
  return {
    return_type: "api-call",
    status: result.code >= 200 && result.code < 300 ? "complete" : "error",
    settings,
    response: result.body?.response,
    error: result.body?.error,
  };
};
