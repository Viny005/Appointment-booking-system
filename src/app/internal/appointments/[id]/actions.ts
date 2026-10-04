"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { internalAppointmentApi } from "@/shared/web/internal-appointments";

const back=(id:string,error?:string):never=>redirect("/internal/appointments/"+encodeURIComponent(id)+(error?"?error="+encodeURIComponent(error):"?updated=1"));

export async function appointmentSlotsAction(id:string,date:string){
  try{
    const api=await internalAppointmentApi(await headers(),true);
    return {ok:true as const,value:await api.slots(id,date)};
  }catch(error){
    return {ok:false as const,error:error instanceof Error?error.message:"Freie Zeiten konnten nicht geladen werden."};
  }
}

export async function appointmentAction(id:string, formData:FormData){
  try{
    const api=await internalAppointmentApi(await headers(),true),version=Number(formData.get("version")),action=String(formData.get("action")??""),key=randomUUID().replaceAll("-","");
    if(!Number.isInteger(version))throw new Error("Ungültige Version.");
    if(action==="cancel")await api.change(id,key,{type:"cancel",version});
    else if(action==="complete"||action==="no-show")await api.change(id,key,{type:"outcome",version,status:action==="complete"?"COMPLETED":"NO_SHOW"});
    else if(action==="resend")await api.change(id,key,{type:"resend",version,recipients:["CUSTOMER"]});
    else if(action==="reschedule")await api.change(id,key,{type:"reschedule",version,startUtc:String(formData.get("startUtc")??""),meetingMode:String(formData.get("meetingMode")) as "IN_PERSON"|"PHONE"|"ONLINE"});
    else if(action==="guests")await api.change(id,key,{type:"guests",version,emails:String(formData.get("emails")??"").split(",").map(v=>v.trim()).filter(Boolean)});
    else if(action==="details")await api.change(id,key,{type:"details",version,patch:{remarks:String(formData.get("remarks")??"")}});
    else throw new Error("Unbekannte Aktion.");
  }catch(error){
    return back(id,error instanceof Error?error.message:"Aktion konnte nicht verarbeitet werden.");
  }
  return back(id);
}
