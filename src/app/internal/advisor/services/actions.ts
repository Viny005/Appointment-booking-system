"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { internalCatalog } from "@/shared/web/profile-catalog";
import { availabilityManagementForActor } from "@/shared/web/availability";
import type { ServiceDetails } from "@/modules/profiles/domain/model";

const destination=(message?:string)=>"/internal/advisor/services"+(message?"?error="+encodeURIComponent(message):"?updated=1");

function selectedModes(formData:FormData){
  return (["IN_PERSON","PHONE","ONLINE"] as const).filter(mode=>formData.get("mode_"+mode)==="on");
}
function serviceDetails(formData:FormData):ServiceDetails{
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

export async function advisorServicesAction(formData:FormData){
  const api=await internalCatalog(await headers());
  if(!api)redirect("/login");
  if(api.role!=="ADVISOR")redirect("/internal/admin");
  if(!api.profileId)redirect(destination("Ihr Konto ist noch keinem Beraterprofil zugeordnet."));
  const profileId=api.profileId;
  const op=String(formData.get("operation")??""),version=Number(formData.get("version"));
  let message:string|undefined;

  try{
    if(op==="service-create"||op==="service-update"||op==="service-toggle"){
      if(!api.canManageOwnServices){
        message="Die Verwaltung eigener Leistungen ist für dieses Konto nicht freigegeben.";
      }else if(op==="service-create"){
        const result=await api.commands.createService(api.actorId,profileId,serviceDetails(formData),false);
        if(!result.ok)message=result.error.message;
      }else if(op==="service-update"){
        const result=await api.commands.updateService(api.actorId,profileId,String(formData.get("serviceId")??""),version,serviceDetails(formData));
        if(!result.ok)message=result.error.message;
      }else{
        const result=await api.commands.setServiceActive(api.actorId,profileId,String(formData.get("serviceId")??""),version,String(formData.get("active"))==="true");
        if(!result.ok)message=result.error.message;
      }
    }else{
      const availability=availabilityManagementForActor(api.actorId);
      if(op==="weekly-set"){
        const result=await availability.management.setWeeklyDay(availability.actorId,profileId,version,Number(formData.get("weekday")),parseRanges(String(formData.get("ranges")??"")));
        if(!result.ok)message=result.error.message;
        else if(result.value.status==="MERGE_REQUIRED")message="Überschneidung erkannt. Bitte die Zeitbereiche ohne Überlappung zusammenführen.";
      }else if(op==="exception-block"){
        const result=await availability.management.blockDateRange(availability.actorId,profileId,version,String(formData.get("from")??""),String(formData.get("to")??""));
        if(!result.ok)message=result.error.message;
      }else if(op==="exception-day"){
        const type=String(formData.get("type"))==="ADD_INTERVAL"?"ADD_INTERVAL":"REPLACE_DAY";
        const date=String(formData.get("date")??"");
        const result=await availability.management.saveException(availability.actorId,profileId,version,{type,startDate:date,endDate:date,active:true,ranges:parseRanges(String(formData.get("ranges")??""))});
        if(!result.ok)message=result.error.message;
        else if(result.value.status==="MERGE_REQUIRED")message="Die Ausnahme überschneidet sich mit bestehenden Zeiten. Bitte Zeitbereiche zuerst zusammenführen.";
      }else if(op==="exception-deactivate"){
        const result=await availability.management.deactivateException(availability.actorId,profileId,version,String(formData.get("exceptionId")??""));
        if(!result.ok)message=result.error.message;
      }else{
        message="Unbekannte Aktion.";
      }
    }
  }catch(error){
    message=error instanceof Error?error.message:"Eingabe konnte nicht verarbeitet werden.";
  }
  redirect(destination(message));
}
