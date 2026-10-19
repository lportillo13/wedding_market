"use server";
// Preserve the historical entry point without a second request workflow.
import { createRfqAndInvites as createInquiry } from "@/app/rfq/new/actions";
export type CreateRfqState = { ok: boolean; message?: string; rfq_id?: string };
export async function createRfqAndInvites(
  state: CreateRfqState,
  form: FormData,
): Promise<CreateRfqState> {
  return createInquiry(state, form);
}
