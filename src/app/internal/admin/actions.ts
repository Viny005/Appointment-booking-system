"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInternalSession } from "@/shared/web/internal-session";
import { internalAdminService } from "@/shared/web/internal-admin";

async function adminActor(){
  const actor=await getInternalSession(await headers(),true);
  if(!actor||actor.role!=="ADMIN") redirect("/login");
  return actor;
}
export async function createUserAction(formData:FormData){
  const actor=await adminActor(), service=internalAdminService();
  const role=String(formData.get("role"))==="ADMIN"?"ADMIN":"ADVISOR";
  const result=await service.create(actor.id,{
    name:String(formData.get("name")??""),
    email:String(formData.get("email")??""),
    role,
    initialPassword:String(formData.get("initialPassword")??""),
  });
  if(!result.ok) redirect("/internal/admin?error="+encodeURIComponent(result.error.message));
  redirect("/internal/admin?updated=1");
}
export async function updateUserAction(formData:FormData){
  const actor=await adminActor();
  const id=String(formData.get("id")??""), operation=String(formData.get("operation")??"");
  const service=internalAdminService();
  const result=operation==="activate"?await service.update(actor.id,id,{active:true})
    :operation==="deactivate"?await service.update(actor.id,id,{active:false})
    :operation==="admin"?await service.update(actor.id,id,{role:"ADMIN"})
    :operation==="advisor"?await service.update(actor.id,id,{role:"ADVISOR"})
    :operation==="allow-services"?await service.update(actor.id,id,{canManageOwnServices:true})
    :operation==="deny-services"?await service.update(actor.id,id,{canManageOwnServices:false})
    :null;
  if(!result) throw new Error("Unbekannte Aktion.");
  if(!result.ok) redirect("/internal/admin?error="+encodeURIComponent(result.error.message));
  redirect("/internal/admin?updated=1");
}
