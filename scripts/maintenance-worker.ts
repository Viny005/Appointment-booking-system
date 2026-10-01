import "dotenv/config";
import { getDatabase } from "../src/shared/infrastructure/database";
import { runMaintenance } from "../src/modules/privacy/infrastructure/maintenance";
let database: ReturnType<typeof getDatabase> | undefined;
try {
  if (process.env.NODE_ENV === "production" && process.env.RETENTION_POLICY_APPROVED !== "true") throw new Error("Retention approval required");
  database = getDatabase();
  console.log(JSON.stringify({ component: "maintenance-worker", ...await runMaintenance(database) }));
} catch { console.error(JSON.stringify({ component: "maintenance-worker", code: "MAINTENANCE_UNAVAILABLE" })); process.exitCode = 1; }
finally { await database?.$disconnect(); }
