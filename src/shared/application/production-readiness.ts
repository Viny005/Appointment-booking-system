export type Readiness={ok:true}|{ok:false;missing:string[]};
export function productionReadiness(env:NodeJS.ProcessEnv=process.env):Readiness{
 const missing:string[]=[];const required=["DATABASE_URL","BETTER_AUTH_SECRET","BETTER_AUTH_URL","OUTBOX_ENCRYPTION_KEY","MAIL_HOST","MAIL_FROM","PROFILE_IMAGE_DIR"];
 for(const key of required)if(!env[key]?.trim())missing.push(key);
 if(env.NODE_ENV==="production"){
  try{if(new URL(env.BETTER_AUTH_URL??"").protocol!=="https:")missing.push("BETTER_AUTH_URL_HTTPS")}catch{missing.push("BETTER_AUTH_URL_HTTPS")}
  if((env.BETTER_AUTH_SECRET??"").length<32)missing.push("BETTER_AUTH_SECRET_LENGTH");
  if(env.PRIVACY_INFORMATION_APPROVED!=="true")missing.push("PRIVACY_INFORMATION_APPROVED");
  if(env.RETENTION_POLICY_APPROVED!=="true")missing.push("RETENTION_POLICY_APPROVED");
  if(env.HSTS_ENABLED!=="true")missing.push("HSTS_ENABLED");
 }
 return missing.length?{ok:false,missing:[...new Set(missing)]}:{ok:true};
}
