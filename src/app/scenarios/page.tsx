"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { compareScenarios } from "@/lib/calc/scenarios";
import { formatCurrency } from "@/lib/utils";
import { useScenariosDb } from "@/lib/hooks/use-scenarios-db";
import type { Scenario } from "@/lib/types/scenario";
import type { RetirementInputs } from "@/lib/types/calculator";
import { DEFAULT_INFLATION_RATE, DEFAULT_LIFE_EXPECTANCY } from "@/lib/constants";
// generateId no longer needed - DB generates IDs
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Plus, Trash2 } from "lucide-react";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#8b5cf6"];

const baseInputs: RetirementInputs = {
  fers: {
    currentAge: 45,
    retirementAge: 62,
    yearsOfService: 20,
    high3Salary: 120000,
    survivorAnnuityElection: "full",
    fersSupplementEligible: true,
  },
  tsp: {
    currentBalance: 300000,
    annualSalary: 120000,
    employeeContribRate: 0.05,
    agencyMatchRate: 0.05,
    expectedReturnRate: 0.07,
    rothPercentage: 0,
    catchUpEligible: false,
  },
  ss: { birthYear: 1964, monthlyBenefitAt62: 2906, monthlyBenefitAtFRA: 4195, monthlyBenefitAt70: 5224, lifeExpectancy: DEFAULT_LIFE_EXPECTANCY },
  spousal: { spouseBirthYear: 1966, isWorking: false },
  ssClaimingAge: 67,
  otherIncome: [],
  expenses: { preRetirement: 80000, postRetirement: 65000, inflationRate: DEFAULT_INFLATION_RATE },
  tax: { filingStatus: "married_joint", stateOfResidence: "DE" },
};

export default function ScenariosPage() {
  const { scenarios, loading, addScenario: addToDb, removeScenario: removeFromDb, clearAll } = useScenariosDb();

  const addScenario = async (name: string, retirementAge: number, ssAge: number) => {
    const inputs = JSON.parse(JSON.stringify(baseInputs)) as RetirementInputs;
    inputs.fers.retirementAge = retirementAge;
    inputs.fers.yearsOfService = retirementAge - inputs.fers.currentAge + (baseInputs.fers.yearsOfService - (baseInputs.fers.retirementAge - baseInputs.fers.currentAge));
    inputs.ssClaimingAge = ssAge;

    await addToDb({
      name,
      color: COLORS[scenarios.length % COLORS.length],
      inputs,
    });
  };

  const removeScenario = async (id: string) => {
    await removeFromDb(id);
  };

  const computed = useMemo(() => compareScenarios(scenarios), [scenarios]);

  // Build comparison chart data (TSP balance over time)
  const chartData = useMemo(() => {
    if (computed.length === 0) return [];
    const maxAge = DEFAULT_LIFE_EXPECTANCY;
    const minAge = Math.min(...computed.map((s) => s.inputs.fers.currentAge));
    const data: Record<string, number | string>[] = [];
    for (let age = minAge; age <= maxAge; age++) {
      const row: Record<string, number | string> = { age };
      for (const s of computed) {
        const p = s.result?.projections.find((p) => p.age === age);
        row[s.name] = p?.tspBalance ?? 0;
      }
      data.push(row);
    }
    return data;
  }, [computed]);

  const hasScenarios = scenarios.length > 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">What-If Scenarios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare different retirement plans side by side
        </p>
      </div>

      {/* Quick Add Presets */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Quick Scenarios</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addScenario("Retire at 57 (MRA)", 57, 62)}>
              Retire at MRA (57)
            </Button>
            <Button variant="outline" size="sm" onClick={() => addScenario("Retire at 60", 60, 62)}>
              Retire at 60
            </Button>
            <Button variant="outline" size="sm" onClick={() => addScenario("Retire at 62, SS at 62", 62, 62)}>
              Retire at 62, SS at 62
            </Button>
            <Button variant="outline" size="sm" onClick={() => addScenario("Retire at 62, SS at 67", 62, 67)}>
              Retire at 62, SS at 67
            </Button>
            <Button variant="outline" size="sm" onClick={() => addScenario("Retire at 65, SS at 70", 65, 70)}>
              Retire at 65, SS at 70
            </Button>
          </div>
          {hasScenarios && (
            <Button variant="ghost" size="sm" className="mt-2 text-red-500" onClick={() => clearAll()}>
              Clear All
            </Button>
          )}
        </CardContent>
      </Card>

      {hasScenarios && (
        <>
          {/* Comparison Chart */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">TSP Balance Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  {computed.map((s, i) => (
                    <Line key={s.id} type="monotone" dataKey={s.name} stroke={s.color || COLORS[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Scenario Comparison</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Retire Age</TableHead>
                    <TableHead>SS Age</TableHead>
                    <TableHead>Peak TSP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lifetime Income</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{s.inputs.fers.retirementAge}</TableCell>
                      <TableCell>{s.inputs.ssClaimingAge}</TableCell>
                      <TableCell>{formatCurrency(s.result?.peakTSPBalance ?? 0)}</TableCell>
                      <TableCell>
                        <span className={s.result?.retirementReady ? "text-green-600" : "text-red-600"}>
                          {s.result?.retirementReady ? "On Track" : `Shortfall at ${s.result?.shortfallAge}`}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(s.result?.totalLifetimeIncome ?? 0)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeScenario(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
