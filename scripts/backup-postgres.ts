import "dotenv/config";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { finished } from "node:stream/promises";
import { postgresTool, waitForExit } from "./postgres-tool";

const target=resolve(process.argv[2]??"backups/appointment.dump");
await mkdir(dirname(target),{recursive:true});
const pg=await postgresTool("pg_dump",["--format=custom","--no-owner","--no-privileges"]);
const output=createWriteStream(target);
const child=spawn(pg.command,pg.args,{stdio:["ignore","pipe","inherit"],env:pg.env,cwd:process.cwd()});
if(!child.stdout)throw new Error("Backup process has no stdout stream.");
child.stdout.pipe(output);
try{
  await Promise.all([waitForExit(child,"pg_dump"),finished(output)]);
}catch(error){
  output.destroy();
  await rm(target,{force:true}).catch(()=>{});
  throw error;
}
console.log("Backup created via "+pg.source+":",target);
