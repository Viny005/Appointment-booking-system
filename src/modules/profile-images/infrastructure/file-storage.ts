import {mkdir,readFile,rename,rm,writeFile} from "node:fs/promises";import {join} from "node:path";import type {ImageStorage} from "../application/images";
const valid=(key:string)=>{if(!/^[a-f0-9-]{36}\.webp$/.test(key))throw new Error("Ungültiger Bildschlüssel.");return key};
export function fileImageStorage(root:string):ImageStorage{return{
 async put(key,data){valid(key);await mkdir(root,{recursive:true});const tmp=join(root,"."+key+".tmp"),dest=join(root,key);await writeFile(tmp,data,{flag:"wx"});try{await rename(tmp,dest)}catch(e){await rm(tmp,{force:true});throw e}},
 async remove(key){valid(key);await rm(join(root,key),{force:true})},
 async read(key){valid(key);try{return await readFile(join(root,key))}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return null;throw e}}
}}
