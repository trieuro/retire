"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { planRothConversions } from "@/lib/calc/roth-conversion";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { DEFAULT_LIFE_EXPECTANCY } from "@/lib/constants";
import { useRothConversionDb } from "@/lib/hooks/use-roth-conversion-db";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const defaultInputs = {
  currentAge: 61,
  birthYear: 1964,
  retirementAge: 65,
  traditionalBalance: 1271914,
  rothBalance: 0,
  annualPension: 35000,
  annualSSBenefit: 50340,
  ssStartAge: 67,
  spousalSSBenefit: 25170,
  spousalSSStartAge: 67,
  otherAnnualIncome: 0,
  expectedReturnRate: 0.06,
  phase1BracketIndex: 2,  // 22% bracket (aggressive, pre-SS)
  phase2BracketIndex: 1,  // 12% bracket (conservative, post-SS)
  annualExpenses: 65000,
  inflationRate: 0.03,
  lifeExpectancy: DEFAULT_LIFE_EXPECTANCY,
};

export default function RothConversionPage() {
  const { inputs, update, loading } = useRothConversionDb(defaultInputs);

  const plan = useMemo(() => planRothConversions({
    ...inputs,
    filingStatus: "married_joint",
    state: "MD",
  }), [inputs]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading...</div></div>;
  }

  const bracketOptions = [
    { index: 0, label: "10% bracket (conservative)" },
    { index: 1, label: "12% bracket (recommended)" },
    { index: 2, label: "22% bracket (aggressive)" },
    { index: 3, label: "24% bracket (very aggressive)" },
  ];

  const balanceChartData = plan.years.map((y) => ({
    age: y.age,
    Traditional: y.traditionalBalance,
    Roth: y.rothBalance,
  }));

  const conversionChartData = plan.years.filter((y) => y.conversionAmount > 0).map((y) => ({
    age: y.age,
    Conversion: y.conversionAmount,
    Tax: y.taxOnConversion,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Roth Conversion Planner</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Convert traditional TSP/IRA to Roth during low-income years to reduce future RMD tax burden
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Account Balances</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Traditional TSP/IRA Balance</Label>
                <Input type="number" value={inputs.traditionalBalance} onChange={(e) => update("traditionalBalance", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Roth Balance</Label>
                <Input type="number" value={inputs.rothBalance} onChange={(e) => update("rothBalance", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Expected Return Rate</Label>
                <Input type="number" step="0.01" value={inputs.expectedReturnRate} onChange={(e) => update("expectedReturnRate", +e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Retirement Income</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Current Age</Label>
                <Input type="number" value={inputs.currentAge} onChange={(e) => update("currentAge", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Retirement Age</Label>
                <Input type="number" value={inputs.retirementAge} onChange={(e) => update("retirementAge", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Annual FERS Pension</Label>
                <Input type="number" value={inputs.annualPension} onChange={(e) => update("annualPension", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Your SS Benefit (annual)</Label>
                <Input type="number" value={inputs.annualSSBenefit} onChange={(e) => update("annualSSBenefit", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">SS Start Age</Label>
                <Input type="number" value={inputs.ssStartAge} onChange={(e) => update("ssStartAge", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Spousal SS Benefit (annual)</Label>
                <Input type="number" value={inputs.spousalSSBenefit} onChange={(e) => update("spousalSSBenefit", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Spousal SS Start Age</Label>
                <Input type="number" value={inputs.spousalSSStartAge} onChange={(e) => update("spousalSSStartAge", +e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Annual Expenses (post-retirement)</Label>
                <Input type="number" value={inputs.annualExpenses} onChange={(e) => update("annualExpenses", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Inflation Rate</Label>
                <Input type="number" step="0.01" value={inputs.inflationRate} onChange={(e) => update("inflationRate", +e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                If expenses exceed income, the gap is withdrawn from traditional TSP (taxable), reducing room for conversions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Two-Phase Strategy</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Phase 1: Pre-SS (aggressive)</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={inputs.phase1BracketIndex}
                  onChange={(e) => update("phase1BracketIndex", +e.target.value)}
                >
                  {bracketOptions.map((opt) => (
                    <option key={opt.index} value={opt.index}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Phase 2: Post-SS (conservative)</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={inputs.phase2BracketIndex}
                  onChange={(e) => update("phase2BracketIndex", +e.target.value)}
                >
                  {bracketOptions.map((opt) => (
                    <option key={opt.index} value={opt.index}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Phase 1 converts aggressively while income is low (before SS). Phase 2 scales back after SS starts.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Total Converted</div>
                <div className="text-lg font-bold">{formatCurrency(plan.totalConverted)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Total Tax Paid</div>
                <div className="text-lg font-bold text-red-600">{formatCurrency(plan.totalTaxPaid)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Avg Conversion Tax Rate</div>
                <div className="text-lg font-bold">{plan.averageTaxRate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground">Annual RMD Reduction</div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(plan.projectedRMDReduction)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Balance at RMD age */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Traditional at RMD Age</div>
                  <div className="text-xl font-bold">{formatCurrency(plan.traditionalBalanceAtRMD)}</div>
                  <div className="text-xs text-muted-foreground">Subject to RMDs</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Roth at RMD Age</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(plan.rothBalanceAtRMD)}</div>
                  <div className="text-xs text-muted-foreground">No RMDs, tax-free growth</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Traditional vs Roth Balance Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={balanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="Traditional" stroke="#dc2626" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Roth" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Amounts Chart */}
          {conversionChartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Annual Conversions & Tax Cost</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={conversionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                    <Bar dataKey="Conversion" fill="#3b82f6" />
                    <Bar dataKey="Tax" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Year-by-Year Table — full width */}
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Conversion Schedule</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto text-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>Convert</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Traditional</TableHead>
                  <TableHead>Roth</TableHead>
                  <TableHead>RMD Savings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.years.map((y) => (
                  <TableRow key={y.age}>
                    <TableCell className="font-medium">{y.age}</TableCell>
                    <TableCell>
                      <span className={y.phase === 1 ? "text-orange-600 font-medium" : "text-blue-600"}>
                        {y.phase === 1 ? `P1 ${y.targetBracket}` : `P2 ${y.targetBracket}`}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(y.otherIncome)}</TableCell>
                    <TableCell>{formatCurrency(y.expenses)}</TableCell>
                    <TableCell className={y.expenseGap > 0 ? "text-red-600 font-medium" : ""}>
                      {y.expenseGap > 0 ? formatCurrency(y.expenseGap) : "—"}
                    </TableCell>
                    <TableCell className="text-blue-600 font-medium">
                      {y.conversionAmount > 0 ? formatCurrency(y.conversionAmount) : "—"}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {y.taxOnConversion > 0 ? formatCurrency(y.taxOnConversion) : "—"}
                    </TableCell>
                    <TableCell>{y.effectiveTaxRate > 0 ? `${y.effectiveTaxRate}%` : "—"}</TableCell>
                    <TableCell>{formatCurrency(y.traditionalBalance)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(y.rothBalance)}</TableCell>
                    <TableCell className="text-green-600">
                      {y.rmdSavings > 0 ? formatCurrency(y.rmdSavings) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
