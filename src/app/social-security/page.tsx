"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { analyzeClaimingOptions } from "@/lib/calc/social-security";
import { formatCurrency } from "@/lib/utils";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { DEFAULT_LIFE_EXPECTANCY } from "@/lib/constants";
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

interface SSPageInputs {
  birthYear: number;
  aime: number;
  lifeExpectancy: number;
  spouseBirthYear: number;
}

const defaultInputs: SSPageInputs = {
  birthYear: 1980,
  aime: 5000,
  lifeExpectancy: DEFAULT_LIFE_EXPECTANCY,
  spouseBirthYear: 1982,
};

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"];

export default function SocialSecurityPage() {
  const [inputs, setInputs] = useLocalStorage<SSPageInputs>("ss_inputs", defaultInputs);

  const analysis = useMemo(
    () =>
      analyzeClaimingOptions(
        { birthYear: inputs.birthYear, aime: inputs.aime, lifeExpectancy: inputs.lifeExpectancy },
        { spouseBirthYear: inputs.spouseBirthYear, isWorking: false },
      ),
    [inputs],
  );

  // Build cumulative benefit chart data
  const cumulativeData = useMemo(() => {
    const data: Record<string, number | string>[] = [];
    for (let age = 62; age <= inputs.lifeExpectancy; age++) {
      const row: Record<string, number | string> = { age };
      for (const opt of analysis.workerOptions) {
        const yearsReceiving = age >= opt.claimingAge ? age - opt.claimingAge : 0;
        row[`Age ${opt.claimingAge}`] = Math.round(opt.monthlyBenefit * 12 * yearsReceiving);
      }
      data.push(row);
    }
    return data;
  }, [analysis, inputs.lifeExpectancy]);

  const update = (key: keyof SSPageInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Social Security Optimizer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare claiming ages for worker and spousal benefits
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Your Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Birth Year</Label>
                <Input type="number" value={inputs.birthYear} onChange={(e) => update("birthYear", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">AIME (Avg Indexed Monthly Earnings)</Label>
                <Input type="number" value={inputs.aime} onChange={(e) => update("aime", +e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Life Expectancy</Label>
                <Input type="number" value={inputs.lifeExpectancy} onChange={(e) => update("lifeExpectancy", +e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Spouse</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Spouse Birth Year</Label>
                <Input type="number" value={inputs.spouseBirthYear} onChange={(e) => update("spouseBirthYear", +e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Non-working spouse receives up to 50% of your PIA as spousal benefit.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Best Claiming Age (Worker)</div>
              <div className="text-2xl font-bold text-green-600">{analysis.bestWorkerAge}</div>
              <div className="text-xs text-muted-foreground mt-2">Best Combined Age</div>
              <div className="text-2xl font-bold text-blue-600">{analysis.bestCombinedAge}</div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Worker Benefits Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Worker Benefit by Claiming Age</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Age</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Annual</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Lifetime Total</TableHead>
                    <TableHead>Break-even vs 62</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.workerOptions.map((opt) => (
                    <TableRow key={opt.claimingAge} className={opt.claimingAge === analysis.bestWorkerAge ? "bg-green-50" : ""}>
                      <TableCell className="font-medium">{opt.claimingAge}</TableCell>
                      <TableCell>{formatCurrency(opt.monthlyBenefit)}</TableCell>
                      <TableCell>{formatCurrency(opt.annualBenefit)}</TableCell>
                      <TableCell>{opt.reductionOrIncrease}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(opt.lifetimeTotal)}</TableCell>
                      <TableCell>{opt.breakevenVs62 ? `Age ${opt.breakevenVs62}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Combined Benefits Table */}
          {analysis.combinedOptions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Combined Worker + Spousal Benefits</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker Age</TableHead>
                      <TableHead>Worker/mo</TableHead>
                      <TableHead>Spousal/mo</TableHead>
                      <TableHead>Combined/mo</TableHead>
                      <TableHead>Combined/yr</TableHead>
                      <TableHead>Lifetime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.combinedOptions.map((opt) => (
                      <TableRow key={opt.workerClaimingAge} className={opt.workerClaimingAge === analysis.bestCombinedAge ? "bg-blue-50" : ""}>
                        <TableCell className="font-medium">{opt.workerClaimingAge}</TableCell>
                        <TableCell>{formatCurrency(opt.workerMonthly)}</TableCell>
                        <TableCell>{formatCurrency(opt.spousalMonthly)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(opt.combinedMonthly)}</TableCell>
                        <TableCell>{formatCurrency(opt.combinedAnnual)}</TableCell>
                        <TableCell>{formatCurrency(opt.combinedLifetime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Cumulative Benefits Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Cumulative Benefits by Claiming Age</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  {analysis.workerOptions.map((opt, i) => (
                    <Line
                      key={opt.claimingAge}
                      type="monotone"
                      dataKey={`Age ${opt.claimingAge}`}
                      stroke={COLORS[i]}
                      strokeWidth={opt.claimingAge === analysis.bestWorkerAge ? 3 : 1}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
