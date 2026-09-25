import { checkoutRoute } from "@/lib/subscription-route";

export async function POST() {
  return checkoutRoute("annual");
}
