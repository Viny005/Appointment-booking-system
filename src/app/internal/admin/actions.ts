"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import { internalAdminService } from "@/shared/web/internal-admin";
export async function updateUserAction(formData:FormData){
 const actor=await getInternalSession(await headers(),true); if(!actor||actor.role!=="ADMIN") redirect("/login");
 const id=String(formData.get("id")??""), operation=String(formData.get("operation")??"");
 const service=internalAdminService();
 const result=operation==="activate"?await service.update(actor.id,id,{active:true}):operation==="deactivate"?await service.update(actor.id,id,{active:false}):operation==="admin"?await service.update(actor.id,id,{role:"ADMIN"}):operation==="advisor"?await service.update(actor.id,id,{role:"ADVISOR"}):null;
 if(!result) throw new Error("Unbekannte Aktion."); if(!result.ok) redirect("/internal/admin?error="+encodeURIComponent(result.error.message));
 redirect("/internal/admin?updated=1");
}
