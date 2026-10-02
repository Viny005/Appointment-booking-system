import sharp from "sharp";import type {ImageProcessor} from "../application/images";
export const sharpImageProcessor:ImageProcessor={async sanitize(input){
 const image=sharp(input,{limitInputPixels:16_777_216,animated:false,failOn:"warning"});const m=await image.metadata();
 if(!m.format||!["jpeg","png","webp"].includes(m.format))throw new Error("Nicht unterstütztes Bildformat.");
 if(!m.width||!m.height||m.width>4096||m.height>4096||m.width*m.height>16_777_216)throw new Error("Bildabmessungen überschreiten die zulässige Grenze.");
 if((m.pages??1)!==1)throw new Error("Animierte oder mehrseitige Bilder sind nicht erlaubt.");
 return image.rotate().webp({quality:85,effort:4}).toBuffer();
}};
