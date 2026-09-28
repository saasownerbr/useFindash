import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/supabase/store";
import { isValidCpfCnpj, normalizeCnpj } from "@/lib/validation/cnpj";

export const dynamic = "force-dynamic";

/**
 * Whether another store already uses this CPF/CNPJ (one store — and one trial — per document). Store rows of other
 * tenants are invisible under RLS, so the lookup runs with the service role and only answers yes or no.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { document?: unknown } | null;
  const document = typeof body?.document === "string" ? normalizeCnpj(body.document) : "";
  if (!isValidCpfCnpj(document)) return NextResponse.json({ error: "CPF ou CNPJ inválido" }, { status: 400 });

  const ownStoreId = await getActiveStoreId(supabase, user.id);
  let query = createAdminClient().from("stores").select("id", { count: "exact", head: true }).eq("cnpj", document);
  if (ownStoreId) query = query.neq("id", ownStoreId);
  const { count, error } = await query;
  if (error) return NextResponse.json({ error: "Não foi possível verificar o documento" }, { status: 500 });

  return NextResponse.json({ inUse: (count ?? 0) > 0 });
}
