import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { daysInStock } from "@/lib/customer-alerts";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, purchase_date")
    .eq("status", "available")
    .not("purchase_date", "is", null);

  let updated = 0;
  for (const product of products ?? []) {
    await admin.from("products").update({ days_in_stock: daysInStock(product.purchase_date!) }).eq("id", product.id);
    updated += 1;
  }

  return NextResponse.json({ ok: true, updated });
}
