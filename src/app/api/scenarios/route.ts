import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scenarios } from "@/lib/db/schema";
import { getDefaultUser } from "@/lib/db/default-user";
import { eq } from "drizzle-orm";

/** GET /api/scenarios - list all scenarios */
export async function GET() {
  try {
    const userId = await getDefaultUser();
    const rows = await db.select().from(scenarios).where(eq(scenarios.userId, userId));
    const mapped = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      color: r.color,
      inputs: r.inputs,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/scenarios error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

/** POST /api/scenarios - create a scenario */
export async function POST(request: Request) {
  try {
    const userId = await getDefaultUser();
    const body = await request.json();
    const result = await db.insert(scenarios).values({
      userId,
      name: body.name,
      description: body.description,
      color: body.color,
      inputs: body.inputs,
    }).returning();
    const r = result[0];
    return NextResponse.json({
      id: r.id,
      name: r.name,
      description: r.description,
      color: r.color,
      inputs: r.inputs,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/scenarios error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

/** DELETE /api/scenarios - delete all scenarios */
export async function DELETE() {
  try {
    const userId = await getDefaultUser();
    await db.delete(scenarios).where(eq(scenarios.userId, userId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/scenarios error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
