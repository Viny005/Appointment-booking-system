import { spawnSync } from "node:child_process";

type Audit = {
  vulnerabilities?: Record<string, {
    severity?: string;
    via?: Array<string | { source?: number; url?: string; name?: string }>;
  }>;
  metadata?: {
    vulnerabilities?: {
      info?: number;
      low?: number;
      moderate?: number;
      high?: number;
      critical?: number;
      total?: number;
    };
  };
};

const npmCli = (() => {
  const value = process.env.npm_execpath;
  if (!value) throw new Error("Run the security audit through npm run security:audit.");
  return value;
})();
const allowedAdvisory = {
  source: 1240992,
  url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
  packages: new Set([
    "braces",
    "micromatch",
    "fast-glob",
    "@next/eslint-plugin-next",
    "eslint-config-next",
  ]),
};

function audit(args: string[]): Audit {
  const result = spawnSync(process.execPath, [npmCli, "audit", ...args, "--json"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const stdout = result.stdout ?? "";
  if (!stdout.trim()) {
    throw new Error("npm audit produced no JSON output");
  }
  try {
    return JSON.parse(stdout) as Audit;
  } catch {
    throw new Error("npm audit produced invalid JSON");
  }
}

function total(report: Audit) {
  return report.metadata?.vulnerabilities?.total ?? 0;
}

const production = audit(["--omit=dev"]);
if (total(production) !== 0) {
  console.error("Production dependency audit failed.");
  console.error(JSON.stringify(production.metadata?.vulnerabilities ?? {}, null, 2));
  process.exit(1);
}

const full = audit([]);
if (total(full) === 0) {
  console.log("Security audit passed: production and development dependencies are clean.");
  process.exit(0);
}

const vulnerabilities = full.vulnerabilities ?? {};
const names = new Set(Object.keys(vulnerabilities));
const counts = full.metadata?.vulnerabilities ?? {};

const countShapeAllowed =
  (counts.critical ?? 0) === 0 &&
  (counts.moderate ?? 0) === 0 &&
  (counts.low ?? 0) === 0 &&
  (counts.info ?? 0) === 0 &&
  (counts.high ?? 0) === allowedAdvisory.packages.size &&
  (counts.total ?? 0) === allowedAdvisory.packages.size;

const packageShapeAllowed =
  names.size === allowedAdvisory.packages.size &&
  [...names].every(name => allowedAdvisory.packages.has(name));

const advisoryObjects = Object.values(vulnerabilities)
  .flatMap(item => item.via ?? [])
  .filter((item): item is { source?: number; url?: string; name?: string } => typeof item === "object");

const advisoryShapeAllowed =
  advisoryObjects.length > 0 &&
  advisoryObjects.every(item =>
    item.source === allowedAdvisory.source &&
    item.url === allowedAdvisory.url
  );

if (!countShapeAllowed || !packageShapeAllowed || !advisoryShapeAllowed) {
  console.error("Security audit failed: vulnerability set differs from the documented development-only exception.");
  console.error(JSON.stringify({
    counts,
    packages: [...names].sort(),
    advisoryObjects,
  }, null, 2));
  process.exit(1);
}

console.warn(
  "Security audit passed with one pinned development-only exception: " +
  "GHSA-vfj7-8cjw-p6xm via eslint-config-next. Production dependencies are clean. " +
  "Remove this exception when upstream publishes a patched dependency chain."
);
