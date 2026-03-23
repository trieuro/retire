import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculatorProfiles } from "@/lib/db/schema";
import { getDefaultUser } from "@/lib/db/default-user";
import { eq, and } from "drizzle-orm";

const PROFILE_NAME = "RothConversion";

/** GET /api/roth-conversion - get saved roth conversion inputs */
export async function GET() {
  try {
    const userId = await getDefaultUser();
    const rows = await db.select().from(calculatorProfiles)
      .where(and(eq(calculatorProfiles.userId, userId), eq(calculatorProfiles.name, PROFILE_NAME)));
    if (rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(rows[0].inputs);
  } catch (error) {
    console.error("GET /api/roth-conversion error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

/** PUT /api/roth-conversion - save roth conversion inputs */
export async function PUT(request: Request) {
  try {
    const userId = await getDefaultUser();
    const inputs = await request.json();
    const existing = await db.select().from(calculatorProfiles)
      .where(and(eq(calculatorProfiles.userId, userId), eq(calculatorProfiles.name, PROFILE_NAME)));

    if (existing.length > 0) {
      await db.update(calculatorProfiles)
        .set({ inputs, updatedAt: new Date() })
        .where(eq(calculatorProfiles.id, existing[0].id));
    } else {
      await db.insert(calculatorProfiles).values({
        userId,
        name: PROFILE_NAME,
        inputs,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/roth-conversion error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
