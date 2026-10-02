import "server-only";
import { createHash } from "node:crypto";
import { CustomerManagement } from "@/modules/appointments/application/customer-management";
import { prismaCustomerManagement } from "@/modules/appointments/infrastructure/prisma-customer-management";
import { getDatabase } from "@/shared/infrastructure/database";
export function customerManagement() { return new CustomerManagement(prismaCustomerManagement(getDatabase()), Date.now, value => createHash("sha256").update(value).digest("hex")); }
