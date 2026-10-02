export interface ImageStorage{put(key:string,data:Buffer):Promise<void>;remove(key:string):Promise<void>;read(key:string):Promise<Buffer|null>}
export type ImageProcessor={sanitize(input:Buffer):Promise<Buffer>};
export class ProfileImages{
 constructor(private readonly storage:ImageStorage,private readonly processor:ImageProcessor,private readonly id:()=>string){}
 async prepare(file:{size:number;type:string;arrayBuffer():Promise<ArrayBuffer>}){if(file.size<=0||file.size>5*1024*1024)throw new Error("Bild muss zwischen 1 Byte und 5 MiB groß sein.");if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Nur JPEG, PNG oder WebP sind erlaubt.");const safe=await this.processor.sanitize(Buffer.from(await file.arrayBuffer()));const key=this.id()+".webp";await this.storage.put(key,safe);return key}
 async rollback(key:string){await this.storage.remove(key)}
 async retire(key:string|null){if(key)await this.storage.remove(key)}
}
