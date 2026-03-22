import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculatorProfiles } from "@/lib/db/schema";
import { getDefaultUser } from "@/lib/db/default-user";
import { eq } from "drizzle-orm";

/** GET /api/calculator - get saved calculator inputs */
export async function GET() {
  try {
    const userId = await getDefaultUser();
    const rows = await db.select().from(calculatorProfiles).where(eq(calculatorProfiles.userId, userId));
    if (rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(rows[0].inputs);
  } catch (error) {
    console.error("GET /api/calculator error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

/** PUT /api/calculator - save calculator inputs */
export async function PUT(request: Request) {
  try {
    const userId = await getDefaultUser();
    const inputs = await request.json();
    const existing = await db.select().from(calculatorProfiles).where(eq(calculatorProfiles.userId, userId));

    if (existing.length > 0) {
      await db.update(calculatorProfiles)
        .set({ inputs, updatedAt: new Date() })
        .where(eq(calculatorProfiles.id, existing[0].id));
    } else {
      await db.insert(calculatorProfiles).values({
        userId,
        name: "Default",
        inputs,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/calculator error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
