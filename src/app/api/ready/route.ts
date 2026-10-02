import {checkHealth} from "@/shared/application/check-health";import {productionReadiness} from "@/shared/application/production-readiness";import {getDatabase} from "@/shared/infrastructure/database";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){const config=productionReadiness(),db=await checkHealth({check:async()=>{await getDatabase().$queryRaw`SELECT 1`;}});const ok=config.ok&&db;return Response.json(ok?{status:"ready"}:{status:"unavailable"},{status:ok?200:503,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}})}
