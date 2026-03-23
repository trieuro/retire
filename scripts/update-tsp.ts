import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function update() {
  const profiles = await db.select().from(schema.calculatorProfiles);
  if (profiles.length === 0) { console.log("No profiles found"); return; }

  const profile = profiles[0];
  const inputs = profile.inputs as Record<string, unknown>;
  const tsp = inputs.tsp as Record<string, unknown>;
  const fers = inputs.fers as Record<string, unknown>;

  tsp.currentBalance = 1271914;
  tsp.annualSalary = 176100;
  tsp.catchUpEligible = true;
  fers.currentAge = 61;
  fers.high3Salary = 176100;

  await db.update(schema.calculatorProfiles)
    .set({ inputs, updatedAt: new Date() })
    .where(eq(schema.calculatorProfiles.id, profile.id));

  console.log("Updated: TSP=$916,950, salary=$176,100, age=61");
}

update().catch(console.error);
