import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const DEFAULT_EMAIL = "roy@retireplan.local";

async function seed() {
  // Get or create user
  let userId: string;
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, DEFAULT_EMAIL));
  if (existing.length > 0) {
    userId = existing[0].id;
    console.log("User exists:", userId);
  } else {
    const result = await db.insert(schema.users).values({
      email: DEFAULT_EMAIL,
      name: "Roy",
    }).returning({ id: schema.users.id });
    userId = result[0].id;
    console.log("Created user:", userId);
  }

  // Seed calculator inputs (Roy's actual data)
  const calcInputs = {
    fers: {
      currentAge: 61,
      retirementAge: 62,
      yearsOfService: 20,
      high3Salary: 176100,
      survivorAnnuityElection: "full",
      fersSupplementEligible: true,
    },
    tsp: {
      currentBalance: 300000,
      annualSalary: 176100,
      employeeContribRate: 0.05,
      agencyMatchRate: 0.05,
      expectedReturnRate: 0.07,
      rothPercentage: 0,
      catchUpEligible: true,
    },
    ss: {
      birthYear: 1964,
      monthlyBenefitAt62: 2906,
      monthlyBenefitAtFRA: 4195,
      monthlyBenefitAt70: 5224,
      lifeExpectancy: 90,
    },
    spousal: {
      spouseBirthYear: 1966,
      isWorking: false,
    },
    ssClaimingAge: 67,
    otherIncome: [],
    expenses: {
      preRetirement: 80000,
      postRetirement: 65000,
      inflationRate: 0.03,
    },
    tax: {
      filingStatus: "married_joint",
      stateOfResidence: "DE",
    },
  };

  // Upsert calculator profile
  const existingCalc = await db.select().from(schema.calculatorProfiles).where(eq(schema.calculatorProfiles.userId, userId));
  if (existingCalc.length > 0) {
    await db.update(schema.calculatorProfiles).set({ inputs: calcInputs, updatedAt: new Date() }).where(eq(schema.calculatorProfiles.id, existingCalc[0].id));
    console.log("Updated calculator profile");
  } else {
    await db.insert(schema.calculatorProfiles).values({ userId, name: "Default", inputs: calcInputs });
    console.log("Created calculator profile");
  }

  // Seed SS profile
  const existingSS = await db.select().from(schema.socialSecurityProfiles).where(eq(schema.socialSecurityProfiles.userId, userId));
  if (existingSS.length > 0) {
    await db.update(schema.socialSecurityProfiles).set({
      birthYear: 1964,
      aime: "4195",
      spouseBirthYear: 1966,
      spouseIsWorking: false,
      updatedAt: new Date(),
    }).where(eq(schema.socialSecurityProfiles.id, existingSS[0].id));
    console.log("Updated SS profile");
  } else {
    await db.insert(schema.socialSecurityProfiles).values({
      userId,
      birthYear: 1964,
      aime: "4195",
      spouseBirthYear: 1966,
      spouseIsWorking: false,
    });
    console.log("Created SS profile");
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
