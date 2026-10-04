"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
import { availabilityManagementForActor } from "@/shared/web/availability";
import type { ServiceDetails } from "@/modules/profiles/domain/model";

const destination=(id:string,message?:string)=>"/internal/admin/catalog/"+encodeURIComponent(id)+(message?"?error="+encodeURIComponent(message):"?updated=1");

function modes(formData:FormData){
  return (["IN_PERSON","PHONE","ONLINE"] as const).filter(mode=>formData.get("mode_"+mode)==="on");
}
function serviceDetails(formData:FormData):ServiceDetails{
  return {
    name:String(formData.get("name")??""),
    description:String(formData.get("description")??""),
    durationMinutes:Number(formData.get("duration")),
    meetingModePolicy:String(formData.get("policy"))==="FIXED"?"FIXED":"CLIENT_CHOICE",
    allowedMeetingModes:modes(formData),
    placeName:String(formData.get("placeName")??"")||null,
    visitAddress:String(formData.get("address")??"")||null,
    phoneDirection:String(formData.get("phoneDirection"))==="CLIENT_CALLS_ADVISOR"?"CLIENT_CALLS_ADVISOR":"ADVISOR_CALLS_CLIENT",
    advisorPhone:String(formData.get("advisorPhone")??"")||null,
    onlineUrl:String(formData.get("onlineUrl")??"")||null,
    onlineProvider:String(formData.get("onlineProvider")??"")||null,
  };
}
function parseRanges(raw:string){
  const text=raw.trim();
  if(!text)return [];
  return text.split(",").map(part=>{
    const match=part.trim().match(/^([01]\d|2[0-3]):([0-5]\d)\s*-\s*((?:[01]\d|2[0-3]):[0-5]\d|24:00)$/);
    if(!match)throw new Error("Zeitbereiche bitte als HH:mm-HH:mm eingeben, getrennt durch Kommas.");
    const start=Number(match[1])*60+Number(match[2]);
    const end=match[3]==="24:00"?1440:Number(match[3].slice(0,2))*60+Number(match[3].slice(3));
    if(start>=end)throw new Error("Bei jedem Zeitbereich muss der Beginn vor dem Ende liegen.");
    return {start,end};
  });
}

export async function catalogAction(id:string,formData:FormData){
  const api=await internalCatalog(await headers());
  if(!api)redirect("/login");
  if(api.role!=="ADMIN")redirect("/internal/advisor");
  const op=String(formData.get("operation")??""),version=Number(formData.get("version"));
  let message:string|undefined;

  try{
    if(op==="profile-status"){
      const result=await api.commands.setProfileStatus(api.actorId,id,version,String(formData.get("status"))==="ACTIVE"?"ACTIVE":"INACTIVE");
      if(!result.ok)message=result.error.message;
    }else if(op==="profile-update"){
      const result=await api.commands.updateProfile(api.actorId,id,version,{
        name:String(formData.get("name")??""),
        title:String(formData.get("title")??""),
        shortDescription:String(formData.get("description")??""),
        notificationEmail:String(formData.get("email")??""),
        imageKey:String(formData.get("imageKey")??"")||null,
      });
      if(!result.ok)message=result.error.message;
    }else if(op==="public-presence"){
      const result=await api.commands.updatePublicPresence(api.actorId,id,version,{
        publicSlug:String(formData.get("publicSlug")??"")||null,
        aboutText:String(formData.get("aboutText")??"")||null,
        publicEmail:String(formData.get("publicEmail")??"")||null,
        publicPhone:String(formData.get("publicPhone")??"")||null,
        publicWebsite:String(formData.get("publicWebsite")??"")||null,
        publicAddress:String(formData.get("publicAddress")??"")||null,
        accentColor:String(formData.get("accentColor")??"")||null,
        showDvagPartners:formData.get("showDvagPartners")==="on",
        digitalCardEnabled:formData.get("digitalCardEnabled")==="on",
      });
      if(!result.ok)message=result.error.message;
    }else if(op==="profile-user"){
      const result=await api.commands.assignUser(api.actorId,id,version,String(formData.get("userId")??"")||null);
      if(!result.ok)message=result.error.message;
    }else if(op==="service-toggle"){
      const result=await api.commands.setServiceActive(api.actorId,id,String(formData.get("serviceId")??""),version,String(formData.get("active"))==="true");
      if(!result.ok)message=result.error.message;
    }else if(op==="service-create"){
      const result=await api.commands.createService(api.actorId,id,serviceDetails(formData),false);
      if(!result.ok)message=result.error.message;
    }else if(op==="service-update"){
      const result=await api.commands.updateService(api.actorId,id,String(formData.get("serviceId")??""),version,serviceDetails(formData));
      if(!result.ok)message=result.error.message;
    }else if(op==="relation-create"){
      const result=await api.commands.createRelation(api.actorId,id,String(formData.get("targetId")??""),{
        active:true,
        proposedToClient:formData.get("proposed")==="on",
        defaultSelected:formData.get("defaultSelected")==="on",
        clientCanRemove:formData.get("removable")==="on",
      });
      if(!result.ok)message=result.error.message;
    }else if(op==="relation-update"){
      const result=await api.commands.updateRelation(api.actorId,id,String(formData.get("targetId")??""),version,{
        active:formData.get("active")==="on",
        proposedToClient:formData.get("proposed")==="on",
        defaultSelected:formData.get("defaultSelected")==="on",
        clientCanRemove:formData.get("removable")==="on",
      });
      if(!result.ok)message=result.error.message;
    }else{
      const availability=availabilityManagementForActor(api.actorId);
      if(op==="weekly-set"){
        const result=await availability.management.setWeeklyDay(availability.actorId,id,version,Number(formData.get("weekday")),parseRanges(String(formData.get("ranges")??"")));
        if(!result.ok)message=result.error.message;
        else if(result.value.status==="MERGE_REQUIRED")message="Überschneidung erkannt. Bitte die Zeitbereiche ohne Überlappung zusammenführen.";
      }else if(op==="exception-block"){
        const result=await availability.management.blockDateRange(availability.actorId,id,version,String(formData.get("from")??""),String(formData.get("to")??""));
        if(!result.ok)message=result.error.message;
      }else if(op==="exception-day"){
        const type=String(formData.get("type"))==="ADD_INTERVAL"?"ADD_INTERVAL":"REPLACE_DAY";
        const date=String(formData.get("date")??"");
        const result=await availability.management.saveException(availability.actorId,id,version,{type,startDate:date,endDate:date,active:true,ranges:parseRanges(String(formData.get("ranges")??""))});
        if(!result.ok)message=result.error.message;
        else if(result.value.status==="MERGE_REQUIRED")message="Die Ausnahme überschneidet sich mit bestehenden Zeiten. Bitte Zeitbereiche zuerst zusammenführen.";
      }else if(op==="exception-deactivate"){
        const result=await availability.management.deactivateException(availability.actorId,id,version,String(formData.get("exceptionId")??""));
        if(!result.ok)message=result.error.message;
      }else{
        message="Unbekannte Aktion.";
      }
    }
  }catch(error){
    message=error instanceof Error?error.message:"Eingabe konnte nicht verarbeitet werden.";
  }
  redirect(destination(id,message));
}
