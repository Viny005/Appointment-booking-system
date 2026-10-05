"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
import type { ServiceDetails } from "@/modules/profiles/domain/model";

const destination=(message?:string)=>"/internal/admin/services"+(message?"?error="+encodeURIComponent(message):"?updated=1");

function selectedModes(formData:FormData){
  return (["IN_PERSON","PHONE","ONLINE"] as const).filter(mode=>formData.get("mode_"+mode)==="on");
}

function details(formData:FormData):ServiceDetails{
  return {
    name:String(formData.get("name")??""),
    description:String(formData.get("description")??""),
    durationMinutes:Number(formData.get("duration")),
    meetingModePolicy:String(formData.get("policy"))==="FIXED"?"FIXED":"CLIENT_CHOICE",
    allowedMeetingModes:selectedModes(formData),
    placeName:String(formData.get("placeName")??"")||null,
    visitAddress:String(formData.get("address")??"")||null,
    phoneDirection:String(formData.get("phoneDirection"))==="CLIENT_CALLS_ADVISOR"?"CLIENT_CALLS_ADVISOR":"ADVISOR_CALLS_CLIENT",
    advisorPhone:String(formData.get("advisorPhone")??"")||null,
    onlineUrl:String(formData.get("onlineUrl")??"")||null,
    onlineProvider:String(formData.get("onlineProvider")??"")||null,
  };
}

export async function serviceCatalogAction(formData:FormData){
  const api=await internalCatalog(await headers());
  if(!api)redirect("/login");
  if(api.role!=="ADMIN")redirect("/internal/advisor");

  const operation=String(formData.get("operation")??"");
  let message:string|undefined;

  try{
    if(operation==="template-create"){
      const result=await api.commands.createServiceTemplate(api.actorId,details(formData));
      if(!result.ok)message=result.error.message;
    }else if(operation==="template-update"){
      const result=await api.commands.updateServiceTemplate(
        api.actorId,
        String(formData.get("templateId")??""),
        Number(formData.get("templateVersion")),
        details(formData),
      );
      if(!result.ok)message=result.error.message;
    }else if(operation==="template-delete"){
      const result=await api.commands.deleteServiceTemplate(
        api.actorId,
        String(formData.get("templateId")??""),
        Number(formData.get("templateVersion")),
      );
      if(!result.ok)message=result.error.message;
    }else if(operation==="template-profile-toggle"){
      const rawServiceVersion=String(formData.get("serviceVersion")??"").trim();
      const result=await api.commands.setServiceTemplateForProfile(
        api.actorId,
        String(formData.get("templateId")??""),
        Number(formData.get("templateVersion")),
        String(formData.get("profileId")??""),
        rawServiceVersion===""?null:Number(rawServiceVersion),
        String(formData.get("active"))==="true",
      );
      if(!result.ok)message=result.error.message;
    }else{
      message="Unbekannte Aktion.";
    }
  }catch(error){
    message=error instanceof Error?error.message:"Leistungskatalog konnte nicht verarbeitet werden.";
  }

  redirect(destination(message));
}
