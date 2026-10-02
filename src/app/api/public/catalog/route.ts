import { NextRequest } from "next/server";
import { publicCatalog } from "@/shared/web/profile-catalog";
const h={"Cache-Control":"public, max-age=60","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"};
export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams,profile=q.get("profile"),kind=q.get("kind");
 const api=publicCatalog();
 const r=!profile?await api.listBookableProfiles():kind==="participants"?await api.resolveParticipantOptions(profile):await api.listProfileServices(profile);
 return Response.json(r,{status:r.ok?200:r.error.code==="NOT_FOUND"?404:400,headers:h});
}
