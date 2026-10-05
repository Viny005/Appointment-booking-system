import { spawn } from "node:child_process";

function runCapture(command:string,args:string[]){
  return new Promise<{ok:boolean;stdout:string}>((resolve)=>{
    let stdout="";
    const child=spawn(command,args,{stdio:["ignore","pipe","ignore"]});
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data",chunk=>stdout+=chunk);
    child.once("error",()=>resolve({ok:false,stdout:""}));
    child.once("close",code=>resolve({ok:code===0,stdout}));
  });
}
async function hasVersion(command:string,args:string[]){
  return (await runCapture(command,args)).ok;
}
async function localPostgresContainer(port:string){
  const docker=await runCapture("docker",["ps","--filter","publish="+port,"--format","{{.ID}}"]);
  if(!docker.ok)return null;
  const ids=docker.stdout.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  if(ids.length!==1)return null;
  const probe=await runCapture("docker",["exec",ids[0],"pg_isready","-h","127.0.0.1","-p","5432"]);
  return probe.ok?ids[0]:null;
}

export async function postgresTool(tool:"pg_dump"|"pg_restore",extraArgs:string[]){
  const raw=process.env.DATABASE_URL;
  if(!raw)throw new Error("DATABASE_URL is required");
  const url=new URL(raw);
  const password=decodeURIComponent(url.password);
  const username=decodeURIComponent(url.username);
  const databaseName=decodeURIComponent(url.pathname.replace(/^\//,""));
  if(!username||!databaseName)throw new Error("DATABASE_URL must include a database user and database name.");
  const env={...process.env,PGPASSWORD:password};

  const hostUrl=new URL(url.toString());
  hostUrl.password="";
  if(await hasVersion(tool,["--version"])){
    return {command:tool,args:[...extraArgs,"--dbname",hostUrl.toString()],env,source:"host" as const};
  }

  if(!(await hasVersion("docker",["version"]))){
    throw new Error(tool+" is not available and Docker fallback is unavailable.");
  }
  const localHosts=new Set(["localhost","127.0.0.1","[::1]"]);
  if(!localHosts.has(url.hostname)){
    throw new Error(tool+" is not installed locally; Docker fallback is supported only for a locally published PostgreSQL port.");
  }
  const publishedPort=url.port||"5432";
  const container=await localPostgresContainer(publishedPort);
  if(!container){
    throw new Error("Could not identify exactly one running PostgreSQL container publishing local port "+publishedPort+".");
  }
  return {
    command:"docker",
    args:["exec","-i","-e","PGPASSWORD",container,tool,...extraArgs,"--host","127.0.0.1","--port","5432","--username",username,"--dbname",databaseName],
    env,
    source:"docker:"+container.slice(0,12),
  };
}

export function waitForExit(child:ReturnType<typeof spawn>,label:string){
  return new Promise<void>((resolve,reject)=>{
    child.once("error",reject);
    child.once("close",code=>code===0?resolve():reject(new Error(label+" failed with exit code "+code)));
  });
}
