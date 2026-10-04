import "dotenv/config";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { finished } from "node:stream/promises";
import { postgresTool, waitForExit } from "./postgres-tool";

const file=process.argv[2];
if(!process.env.DATABASE_URL||!file)throw new Error("DATABASE_URL and backup file are required");
if(process.env.RESTORE_CONFIRMED!=="true")throw new Error("Set RESTORE_CONFIRMED=true only for the isolated restore target.");

const source=resolve(file);
const pg=await postgresTool("pg_restore",["--exit-on-error","--clean","--if-exists","--no-owner","--no-privileges"]);
const input=createReadStream(source);
const child=spawn(pg.command,pg.args,{stdio:["pipe","inherit","inherit"],env:pg.env,cwd:process.cwd()});
if(!child.stdin)throw new Error("Restore process has no stdin stream.");
input.pipe(child.stdin);
await Promise.all([waitForExit(child,"pg_restore"),finished(input)]);
console.log("Restore completed via "+pg.source+"; run prisma migrate deploy and smoke tests.");
