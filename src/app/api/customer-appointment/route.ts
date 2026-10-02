import { customerManagement } from "@/shared/web/customer-management";
import { customerHttp } from "@/modules/appointments/infrastructure/customer-http";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return customerHttp(customerManagement(), process.env.BETTER_AUTH_URL ?? "")(request);
}
