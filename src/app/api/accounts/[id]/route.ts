import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getDefaultUser } from "@/lib/db/default-user";
import { eq, and } from "drizzle-orm";

/** PATCH /api/accounts/[id] - update account balance */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = await getDefaultUser();
    const body = await request.json();
    const { balance, name, category, type } = body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (balance !== undefined) updates.balance = String(Math.abs(balance));
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (type !== undefined) updates.type = type;

    const result = await db.update(accounts)
      .set(updates)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const row = result[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      category: row.category,
      type: row.type,
      balance: Number(row.balance),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("PATCH /api/accounts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

/** DELETE /api/accounts/[id] - delete an account */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = await getDefaultUser();
    const result = await db.delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning({ id: accounts.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/accounts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
