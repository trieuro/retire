"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { projectRetirement } from "@/lib/calc/retirement";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useCalculatorDb } from "@/lib/hooks/use-calculator-db";
import type { RetirementInputs } from "@/lib/types/calculator";
import { DEFAULT_INFLATION_RATE, DEFAULT_LIFE_EXPECTANCY } from "@/lib/constants";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const defaultInputs: RetirementInputs = {
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
  ss: {
    birthYear: 1964,
    monthlyBenefitAt62: 2906,
    monthlyBenefitAtFRA: 4195,
    monthlyBenefitAt70: 5224,
    lifeExpectancy: DEFAULT_LIFE_EXPECTANCY,
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
    inflationRate: DEFAULT_INFLATION_RATE,
  },
  tax: {
    filingStatus: "married_joint",
    stateOfResidence: "DE",
  },
};

export default function CalculatorPage() {
  const { inputs, update, loading } = useCalculatorDb(defaultInputs);
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(() => projectRetirement(inputs), [inputs]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading...</div></div>;
  }

  const retiredProjections = result.projections.filter((p) => p.isRetired);

  const chartData = retiredProjections.map((p) => ({
    age: p.age,
    "FERS Pension": p.fersPension,
    "FERS Supplement": p.fersSupplementIncome,
    "TSP Withdrawal": p.tspWithdrawal,
    "SS Worker": p.ssWorkerBenefit,
    "SS Spousal": p.ssSpousalBenefit,
    "Other Income": p.otherIncome,
    Expenses: p.expenses,
  }));

  const tspChartData = result.projections.map((p) => ({
    age: p.age,
    balance: p.tspBalance,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">FERS Retirement Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Project your federal retirement income from FERS pension, TSP, and Social Security
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">FERS Pension</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Current Age</Label>
                <Input type="number" value={inputs.fers.currentAge} onChange={(e) => update("fers.currentAge", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Retirement Age</Label>
                <Input type="number" value={inputs.fers.retirementAge} onChange={(e) => update("fers.retirementAge", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Years of Service at Retirement</Label>
                <Input type="number" value={inputs.fers.yearsOfService} onChange={(e) => update("fers.yearsOfService", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">High-3 Average Salary</Label>
                <Input type="number" value={inputs.fers.high3Salary} onChange={(e) => update("fers.high3Salary", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Survivor Annuity</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={inputs.fers.survivorAnnuityElection}
                  onChange={(e) => update("fers.survivorAnnuityElection", e.target.value)}
                >
                  <option value="full">Full (50% to spouse, -10%)</option>
                  <option value="partial">Partial (25% to spouse, -5%)</option>
                  <option value="none">None</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">TSP</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Current TSP Balance</Label>
                <Input type="number" value={inputs.tsp.currentBalance} onChange={(e) => update("tsp.currentBalance", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Employee Contribution Rate</Label>
                <Input type="number" step="0.01" value={inputs.tsp.employeeContribRate} onChange={(e) => update("tsp.employeeContribRate", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Expected Return Rate</Label>
                <Input type="number" step="0.01" value={inputs.tsp.expectedReturnRate} onChange={(e) => update("tsp.expectedReturnRate", +e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Social Security (from SSA Statement)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Birth Year</Label>
                <Input type="number" value={inputs.ss.birthYear} onChange={(e) => update("ss.birthYear", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Monthly Benefit at 62</Label>
                <Input type="number" value={inputs.ss.monthlyBenefitAt62} onChange={(e) => update("ss.monthlyBenefitAt62", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Monthly Benefit at FRA (67)</Label>
                <Input type="number" value={inputs.ss.monthlyBenefitAtFRA} onChange={(e) => update("ss.monthlyBenefitAtFRA", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Monthly Benefit at 70</Label>
                <Input type="number" value={inputs.ss.monthlyBenefitAt70} onChange={(e) => update("ss.monthlyBenefitAt70", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">SS Claiming Age</Label>
                <Input type="number" min={62} max={70} value={inputs.ssClaimingAge} onChange={(e) => update("ssClaimingAge", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Spouse Birth Year</Label>
                <Input type="number" value={inputs.spousal.spouseBirthYear} onChange={(e) => update("spousal.spouseBirthYear", +e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Pre-Retirement Annual Expenses</Label>
                <Input type="number" value={inputs.expenses.preRetirement} onChange={(e) => update("expenses.preRetirement", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Post-Retirement Annual Expenses</Label>
                <Input type="number" value={inputs.expenses.postRetirement} onChange={(e) => update("expenses.postRetirement", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Inflation Rate</Label>
                <Input type="number" step="0.01" value={inputs.expenses.inflationRate} onChange={(e) => update("expenses.inflationRate", +e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Retirement Status</div>
                <div className={`text-lg font-bold ${result.retirementReady ? "text-green-600" : "text-red-600"}`}>
                  {result.retirementReady ? "On Track" : `Shortfall at ${result.shortfallAge}`}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Peak TSP Balance</div>
                <div className="text-lg font-bold">{formatCurrency(result.peakTSPBalance)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Safe TSP Withdrawal</div>
                <div className="text-lg font-bold">{formatCurrency(result.safeWithdrawalFromTSP)}/yr</div>
              </CardContent>
            </Card>
          </div>

          {/* TSP Growth Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">TSP Balance Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={tspChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <ReferenceLine x={inputs.fers.retirementAge} stroke="#ef4444" strokeDasharray="5 5" label="Retire" />
                  <Area type="monotone" dataKey="balance" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Income Breakdown Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Retirement Income Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="FERS Pension" stackId="income" fill="#2563eb" />
                  <Bar dataKey="FERS Supplement" stackId="income" fill="#60a5fa" />
                  <Bar dataKey="TSP Withdrawal" stackId="income" fill="#16a34a" />
                  <Bar dataKey="SS Worker" stackId="income" fill="#ca8a04" />
                  <Bar dataKey="SS Spousal" stackId="income" fill="#eab308" />
                  <Bar dataKey="Other Income" stackId="income" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Projection Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Year-by-Year Projection</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowTable(!showTable)}>
                {showTable ? "Hide Table" : "Show Table"}
              </Button>
            </CardHeader>
            {showTable && (
              <CardContent>
                <div className="overflow-x-auto text-xs">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Age</TableHead>
                        <TableHead>FERS</TableHead>
                        <TableHead>Supplement</TableHead>
                        <TableHead>TSP</TableHead>
                        <TableHead>SS Worker</TableHead>
                        <TableHead>SS Spouse</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Taxes</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Surplus</TableHead>
                        <TableHead>TSP Bal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retiredProjections.map((p) => (
                        <TableRow key={p.age} className={p.surplus < 0 ? "bg-red-50" : ""}>
                          <TableCell className="font-medium">{p.age}</TableCell>
                          <TableCell>{formatCurrency(p.fersPension)}</TableCell>
                          <TableCell>{formatCurrency(p.fersSupplementIncome)}</TableCell>
                          <TableCell>{formatCurrency(p.tspWithdrawal)}</TableCell>
                          <TableCell>{formatCurrency(p.ssWorkerBenefit)}</TableCell>
                          <TableCell>{formatCurrency(p.ssSpousalBenefit)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(p.totalGrossIncome)}</TableCell>
                          <TableCell>{formatCurrency(p.estimatedTaxes)}</TableCell>
                          <TableCell>{formatCurrency(p.expenses)}</TableCell>
                          <TableCell className={p.surplus < 0 ? "text-red-600" : "text-green-600"}>
                            {formatCurrency(p.surplus)}
                          </TableCell>
                          <TableCell>{formatCurrency(p.tspBalance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
