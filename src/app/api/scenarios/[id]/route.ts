import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scenarios } from "@/lib/db/schema";
import { getDefaultUser } from "@/lib/db/default-user";
import { eq, and } from "drizzle-orm";

/** DELETE /api/scenarios/[id] - delete a scenario */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = await getDefaultUser();
    await db.delete(scenarios).where(and(eq(scenarios.id, id), eq(scenarios.userId, userId)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/scenarios/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
