import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getDefaultUser } from "@/lib/db/default-user";
import { eq } from "drizzle-orm";

/** GET /api/accounts - list all accounts */
export async function GET() {
  try {
    const userId = await getDefaultUser();
    const rows = await db.select().from(accounts).where(eq(accounts.userId, userId));
    const mapped = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      type: r.type,
      balance: Number(r.balance),
      interestRate: r.interestRate ? Number(r.interestRate) : undefined,
      monthlyPayment: r.monthlyPayment ? Number(r.monthlyPayment) : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

/** POST /api/accounts - create a new account */
export async function POST(request: Request) {
  try {
    const userId = await getDefaultUser();
    const body = await request.json();
    const { name, category, type, balance, interestRate, monthlyPayment } = body;

    if (!name || !category || !type || balance === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await db.insert(accounts).values({
      userId,
      name,
      category,
      type,
      balance: String(Math.abs(balance)),
      interestRate: interestRate != null ? String(interestRate) : null,
      monthlyPayment: monthlyPayment != null ? String(monthlyPayment) : null,
    }).returning();

    const row = result[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      category: row.category,
      type: row.type,
      balance: Number(row.balance),
      interestRate: row.interestRate ? Number(row.interestRate) : undefined,
      monthlyPayment: row.monthlyPayment ? Number(row.monthlyPayment) : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
