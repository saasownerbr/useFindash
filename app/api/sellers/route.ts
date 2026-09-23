import { NextRequest, NextResponse } from "next/server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sellerSchema } from "@/lib/validation/seller";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { storeId, ...fields } = body;
  const parsed = sellerSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  if (typeof storeId !== "string") {
    return NextResponse.json({ error: "Loja inválida" }, { status: 400 });
  }

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("store_users")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão para cadastrar vendedores" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email);
  if (inviteError || !invited.user) {
    return NextResponse.json({ error: "Não foi possível convidar este email" }, { status: 400 });
  }

  const { data: storeUser, error: insertError } = await admin
    .from("store_users")
    .insert({
      store_id: storeId,
      user_id: invited.user.id,
      role: parsed.data.role,
      commission_rate: parsed.data.commission_rate,
      name: parsed.data.name,
    })
    .select("id")
    .single();

  if (insertError || !storeUser) {
    return NextResponse.json({ error: "Convite enviado, mas falhou ao vincular o vendedor à loja" }, { status: 500 });
  }

  return NextResponse.json({ storeUserId: storeUser.id });
}
