import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialSecurityProfiles } from "@/lib/db/schema";
import { getDefaultUser } from "@/lib/db/default-user";
import { eq } from "drizzle-orm";

/** GET /api/social-security - get saved SS inputs */
export async function GET() {
  try {
    const userId = await getDefaultUser();
    const rows = await db.select().from(socialSecurityProfiles).where(eq(socialSecurityProfiles.userId, userId));
    if (rows.length === 0) return NextResponse.json(null);
    const r = rows[0];
    return NextResponse.json({
      birthYear: r.birthYear,
      aime: Number(r.aime),
      spouseBirthYear: r.spouseBirthYear,
      spouseIsWorking: r.spouseIsWorking,
    });
  } catch (error) {
    console.error("GET /api/social-security error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

/** PUT /api/social-security - save SS inputs (stores full JSON) */
export async function PUT(request: Request) {
  try {
    const userId = await getDefaultUser();
    const body = await request.json();
    const existing = await db.select().from(socialSecurityProfiles).where(eq(socialSecurityProfiles.userId, userId));

    if (existing.length > 0) {
      await db.update(socialSecurityProfiles)
        .set({
          birthYear: body.birthYear,
          aime: String(body.monthlyBenefitAtFRA || 0),
          spouseBirthYear: body.spouseBirthYear,
          spouseIsWorking: body.spouseIsWorking ?? false,
          updatedAt: new Date(),
        })
        .where(eq(socialSecurityProfiles.id, existing[0].id));
    } else {
      await db.insert(socialSecurityProfiles).values({
        userId,
        birthYear: body.birthYear,
        aime: String(body.monthlyBenefitAtFRA || 0),
        spouseBirthYear: body.spouseBirthYear,
        spouseIsWorking: body.spouseIsWorking ?? false,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/social-security error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
