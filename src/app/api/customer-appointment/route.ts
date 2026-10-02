import { customerManagement } from "@/shared/web/customer-management";
import { customerHttp } from "@/modules/appointments/infrastructure/customer-http";
import { secureRequest } from "@/shared/web/security-boundary";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return secureRequest(request, "customer", guarded => customerHttp(customerManagement(), process.env.BETTER_AUTH_URL ?? "")(guarded));
}
