import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { creditTransactions, users } from "@/db/schema";

const SIGNUP_BONUS = 1;

export async function getOrCreateUser(clerkUserId: string, email: string) {
  const existing = await db()
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing[0]) return existing[0];

  const [row] = await db()
    .insert(users)
    .values({ clerkUserId, email, creditBalance: SIGNUP_BONUS })
    .onConflictDoNothing({ target: users.clerkUserId })
    .returning();

  if (row) {
    await db().insert(creditTransactions).values({
      userId: clerkUserId,
      delta: SIGNUP_BONUS,
      reason: "signup_bonus",
    });
    return row;
  }

  const [refetched] = await db()
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return refetched;
}

export async function getCreditBalance(clerkUserId: string): Promise<number> {
  const rows = await db()
    .select({ creditBalance: users.creditBalance })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0]?.creditBalance ?? 0;
}
