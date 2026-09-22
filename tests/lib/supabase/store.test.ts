import { describe, expect, it, vi } from "vitest";

import { getActiveStoreId } from "@/lib/supabase/store";

function createSupabaseStub(result: { data: { store_id: string } | null; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const limit = vi.fn().mockReturnValue({ maybeSingle });
  const eq = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as Parameters<typeof getActiveStoreId>[0];
}

describe("getActiveStoreId", () => {
  it("returns the store id for the given user", async () => {
    const supabase = createSupabaseStub({ data: { store_id: "store-1" }, error: null });
    await expect(getActiveStoreId(supabase, "user-1")).resolves.toBe("store-1");
  });

  it("returns null when the user has no store", async () => {
    const supabase = createSupabaseStub({ data: null, error: null });
    await expect(getActiveStoreId(supabase, "user-1")).resolves.toBeNull();
  });

  it("returns null on error", async () => {
    const supabase = createSupabaseStub({ data: null, error: new Error("boom") });
    await expect(getActiveStoreId(supabase, "user-1")).resolves.toBeNull();
  });
});
