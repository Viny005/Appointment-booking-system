"use server";
import {headers} from "next/headers";import {redirect} from "next/navigation";import {internalCatalog} from "@/shared/web/profile-catalog";import {profileImages} from "@/shared/web/profile-images";
export async function uploadProfileImage(id:string,formData:FormData){
 const api=await internalCatalog(await headers());if(!api)redirect("/login");if(api.role!=="ADMIN")redirect("/internal/advisor");const current=await api.queries.getProfile(id);if(!current.ok||!current.value.aggregate)redirect("/internal/admin/catalog?error=Profil+nicht+gefunden");
 const file=formData.get("image");if(!(file instanceof File))redirect("/internal/admin/catalog/"+id+"?error=Bild+fehlt");const images=profileImages();let key:string;
 try{key=await images.prepare(file)}catch(e){redirect("/internal/admin/catalog/"+id+"?error="+encodeURIComponent(e instanceof Error?e.message:"Bild ungültig."))}
 const p=current.value.aggregate.profile,result=await api.commands.updateProfile(api.actorId,id,p.version,{name:p.name,title:p.title,shortDescription:p.shortDescription,notificationEmail:p.notificationEmail,imageKey:key});
 if(!result.ok){await images.rollback(key);redirect("/internal/admin/catalog/"+id+"?error="+encodeURIComponent(result.error.message))}
 await images.retire(p.imageKey);redirect("/internal/admin/catalog/"+id+"?updated=1");
}
