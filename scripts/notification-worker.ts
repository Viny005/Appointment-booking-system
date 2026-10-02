import "dotenv/config";
import { getDatabase } from "../src/shared/infrastructure/database";
import { NotificationWorker } from "../src/modules/notifications/application/worker";
import { prismaNotifications } from "../src/modules/notifications/infrastructure/prisma-notifications";
import { aesSecretBox } from "../src/modules/notifications/infrastructure/secret-box";
import { mailConfiguration } from "../src/modules/notifications/infrastructure/config";
import { smtpConfiguration, smtpTransport } from "../src/modules/notifications/infrastructure/smtp";
import { purgeCustomerReceipts } from "../src/modules/appointments/infrastructure/prisma-customer-management";
let database: ReturnType<typeof getDatabase> | undefined;
try {
  const config = mailConfiguration(), box = aesSecretBox(process.env.OUTBOX_ENCRYPTION_KEY ?? "");
  database = getDatabase();
  await purgeCustomerReceipts(database, Date.now());
  const worker = new NotificationWorker(prismaNotifications(database, box), smtpTransport(smtpConfiguration()), config, Date.now,
    { emit: event => console.log(JSON.stringify({ component: "notification-worker", ...event })) });
  console.log(JSON.stringify(await worker.run(10)));
} catch { console.error(JSON.stringify({ component: "notification-worker", code: "WORKER_UNAVAILABLE" })); process.exitCode = 1; }
finally { await database?.$disconnect(); }
