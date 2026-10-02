export function securityConfiguration(env: Record<string, string | undefined> = process.env) {
  const positive = (key: string, fallback: number) => {
    const raw = env[key] ?? String(fallback);
    if (!/^[1-9][0-9]*$/.test(raw) || Number(raw) > 100000) throw new Error("Invalid security configuration");
    return Number(raw);
  };
  const trustedIpHeader = env.TRUSTED_CLIENT_IP_HEADER?.toLowerCase() || null;
  if (trustedIpHeader && (!/^x-[a-z0-9-]{1,60}$/.test(trustedIpHeader) || env.TRUSTED_PROXY_ONLY !== "true")) throw new Error("Trusted proxy deployment required");
  return { authIdentity: positive("RATE_AUTH_ACCOUNT_PER_MINUTE", 5), authIp: positive("RATE_AUTH_IP_PER_MINUTE", 30),
    authGlobal: positive("RATE_AUTH_GLOBAL_PER_MINUTE", 300), publicIdentity: positive("RATE_PUBLIC_CAPABILITY_PER_MINUTE", 60),
    publicIp: positive("RATE_PUBLIC_IP_PER_MINUTE", 120), publicGlobal: positive("RATE_PUBLIC_GLOBAL_PER_MINUTE", 1200), trustedIpHeader };
}
