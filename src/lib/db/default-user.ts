import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const DEFAULT_EMAIL = "roy@retireplan.local";

/** Get or create the default user for single-user mode */
export async function getDefaultUser(): Promise<string> {
  const existing = await db.select().from(users).where(eq(users.email, DEFAULT_EMAIL));
  if (existing.length > 0) {
    return existing[0].id;
  }
  const result = await db.insert(users).values({
    email: DEFAULT_EMAIL,
    name: "Roy",
  }).returning({ id: users.id });
  return result[0].id;
}
