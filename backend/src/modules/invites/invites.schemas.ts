import { z } from "zod";

export const createInviteSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("contact") }),
  z.object({ type: z.literal("group"), groupAccountId: z.string().uuid() }),
]);

export const redeemInviteSchema = z.object({
  code: z.string().min(1),
});
