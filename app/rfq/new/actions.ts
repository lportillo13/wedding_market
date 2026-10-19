"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRequestI18n } from "@/lib/i18n/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createInquiry } from "@/lib/inquiries";

export type CreateRfqState = { ok: boolean; message?: string };
export async function createRfqAndInvites(
  _: CreateRfqState,
  form: FormData,
): Promise<CreateRfqState> {
  const { dictionary, language } = await getRequestI18n();
  const labels = dictionary.rfq.newPage.errors;
  const client = await getSupabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, message: labels.loginRequired };
  const text = (key: string) => form.get(key)?.toString().trim() || "";
  let vendorIds: unknown;
  try {
    vendorIds = JSON.parse(text("vendor_ids_json"));
  } catch {
    return { ok: false, message: labels.invalidVendorList };
  }
  const { data: profile } = await client
    .from("profiles")
    .select("full_name,phone")
    .eq("id", user.id)
    .maybeSingle();
  const [first = "", ...last] = (profile?.full_name?.trim() || "").split(/\s+/);
  const result = await createInquiry(client, user.id, {
    request_id: text("request_id") || undefined,
    vendor_ids: vendorIds,
    first_name: first,
    last_name: last.join(" "),
    email: user.email || "",
    phone: profile?.phone || null,
    event_date: text("event_date") || null,
    flexible: form.get("flexible") === "on",
    guest_count: text("guest_count") ? Number(text("guest_count")) : null,
    budget: text("budget") ? Number(text("budget")) : null,
    city: text("city"),
    language: text("language") || language,
    theme: text("theme"),
    message: text("notes"),
  });
  if (!result.ok) {
    const names: Record<string,string> = language === "es" ? {vendor_ids:"proveedores",guest_count:"número de invitados",budget:"presupuesto",event_date:"fecha",message:"mensaje",email:"correo de contacto"} : {vendor_ids:"vendors",guest_count:"guest count",budget:"budget",event_date:"date",message:"message",email:"contact email"};
    const fields = "fields" in result && result.fields ? [...new Set(result.fields)].map(field=>names[field] || field).join(", ") : "";
    return {ok:false,message:fields ? `${language === "es" ? "Revisa" : "Check"}: ${fields}.` : language === "es" ? "No se pudo enviar la solicitud. Revisa los proveedores seleccionados e inténtalo de nuevo." : result.message};
  }
  revalidatePath("/account/inbox");
  revalidatePath("/vendor/inbox");
  redirect(`/rfq/sent?rfq=${result.rfq_id}&count=${result.vendor_count}`);
}
