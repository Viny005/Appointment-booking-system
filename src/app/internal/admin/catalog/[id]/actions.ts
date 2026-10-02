"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
const back=(id:string,msg?:string)=>redirect("/internal/admin/catalog/"+encodeURIComponent(id)+(msg?"?error="+encodeURIComponent(msg):"?updated=1"));
export async function catalogAction(id:string,formData:FormData){
 const api=await internalCatalog(await headers());if(!api)redirect("/login");const op=String(formData.get("operation")??""),v=Number(formData.get("version"));
 let r;
 if(op==="profile-status") r=await api.commands.setProfileStatus(api.actorId,id,v,String(formData.get("status"))==="ACTIVE"?"ACTIVE":"INACTIVE");
 else if(op==="service-toggle") r=await api.commands.setServiceActive(api.actorId,id,String(formData.get("serviceId")),v,String(formData.get("active"))==="true");
 else if(op==="service-create") r=await api.commands.createService(api.actorId,id,{name:String(formData.get("name")??""),description:String(formData.get("description")??""),durationMinutes:Number(formData.get("duration")),meetingModePolicy:"CLIENT_CHOICE",allowedMeetingModes:["IN_PERSON"],placeName:String(formData.get("placeName")??""),visitAddress:String(formData.get("address")??""),phoneDirection:"ADVISOR_CALLS_CLIENT",advisorPhone:null,onlineUrl:null,onlineProvider:null},false);
 else if(op==="relation-create") r=await api.commands.createRelation(api.actorId,id,String(formData.get("targetId")??""),{active:true,proposedToClient:true,defaultSelected:false,clientCanRemove:true});
 else return back(id,"Unbekannte Aktion.");
 if(!r.ok)return back(id,r.error.message);back(id);
}
