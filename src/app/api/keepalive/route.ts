import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { status: "error", message: "Supabase belum dikonfigurasi." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.from("modules").select("id").limit(1);
  if (error) {
    return Response.json({ status: "error" }, { status: 500 });
  }
  return Response.json({ status: "ok" });
}
