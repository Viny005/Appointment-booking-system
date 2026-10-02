import { NextRequest } from "next/server";
import { publicAvailability } from "@/shared/web/availability";
const h={"Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"};
export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams,primary=q.get("primary")??"",service=q.get("service")??"",date=q.get("date")??"",participants=(q.get("participants")??"").split(",").filter(Boolean);
 const r=await publicAvailability().getBookableSlots({primaryProfileId:primary,serviceId:service,participantIds:participants},date);
 return Response.json(r,{status:r.ok?200:r.error.code==="NOT_FOUND"?404:400,headers:h});
}
