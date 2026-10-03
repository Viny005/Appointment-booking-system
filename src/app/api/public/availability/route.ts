import { NextRequest } from "next/server";
import { publicAvailability } from "@/shared/web/availability";
const h={"Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"};
export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams,primary=q.get("primary")??"",service=q.get("service")??"",date=q.get("date")??"",participants=(q.get("participants")??"").split(",").filter(Boolean),kind=q.get("kind");
 const selection={primaryProfileId:primary,serviceId:service,participantIds:participants};
 const r=kind==="days"
  ? await publicAvailability().getBookableDays(selection,q.get("from")??"",q.get("to")??"")
  : await publicAvailability().getBookableSlots(selection,date);
 return Response.json(r,{status:r.ok?200:r.error.code==="NOT_FOUND"?404:400,headers:h});
}
