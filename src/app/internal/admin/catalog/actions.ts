"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
export async function createProfileAction(formData:FormData){
 const api=await internalCatalog(await headers()); if(!api||api.role!=="ADMIN") redirect("/login");
 const result=await api.commands.createProfile(api.actorId,{name:String(formData.get("name")??""),title:String(formData.get("title")??""),shortDescription:String(formData.get("description")??""),notificationEmail:String(formData.get("email")??""),imageKey:null});
 if(!result.ok) redirect("/internal/admin/catalog?error="+encodeURIComponent(result.error.message)); redirect("/internal/admin/catalog?created=1");
}
