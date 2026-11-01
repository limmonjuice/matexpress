import "server-only";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { throttles } from "@/db/schema";

/** How many tries a key gets, and how many seconds until its count starts over. */
export type ThrottleRule = { max: number; window: number };

const DAY_MS = 86_400_000;

/**
 * Counts one try against a key and says whether it's allowed. All in one statement against the
 * database, so every copy of a hosted server shares the count and two tries at once can't both slip through.
 */
export async function consume(key: string, { max, window }: ThrottleRule) {
  const now = Date.now();
  const expired = now - window * 1000;
  const [row] = await db
    .insert(throttles)
    .values({ key, count: 1, windowStart: now })
    .onConflictDoUpdate({
      target: throttles.key,
      set: {
        count: sql`case when ${throttles.windowStart} <= ${expired} then 1 else ${throttles.count} + 1 end`,
        windowStart: sql`case when ${throttles.windowStart} <= ${expired} then ${now}::bigint else ${throttles.windowStart} end`,
      },
    })
    .returning({ count: throttles.count, windowStart: throttles.windowStart });

  // Now and then, so the table can't grow forever. No limit here runs longer than a day.
  if (Math.random() < 0.01) {
    await db
      .delete(throttles)
      .where(lt(throttles.windowStart, now - DAY_MS))
      .catch(() => {});
  }

  const allowed = row.count <= max;
  return { allowed, retryAfter: allowed ? null : Math.ceil((row.windowStart + window * 1000 - now) / 1000) };
}

export async function clearThrottle(key: string) {
  await db.delete(throttles).where(eq(throttles.key, key));
}
