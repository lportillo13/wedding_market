import { z } from "zod";
import { MAX_QUOTE_AMOUNT_CENTS } from "@/shared/proposals/money";
export { MAX_QUOTE_AMOUNT_CENTS, parseQuoteAmountCents } from "@/shared/proposals/money";

export const quoteInputSchema = z.object({
  rfqId: z.string().uuid(),
  vendorId: z.string().uuid(),
  amountCents: z.number().int().positive().max(MAX_QUOTE_AMOUNT_CENTS),
  message: z.string().trim().max(2000).nullable().optional(),
});

export type QuoteInput = z.infer<typeof quoteInputSchema>;
