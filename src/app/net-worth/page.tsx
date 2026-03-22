"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { computeNetWorth } from "@/lib/calc/net-worth";
import { formatCurrency } from "@/lib/utils";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Trash2, Loader2 } from "lucide-react";

const COLORS = ["#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const CATEGORY_LABELS: Record<string, string> = {
  tsp_traditional: "TSP (Traditional)",
  tsp_roth: "TSP (Roth)",
  ira: "IRA",
  roth_ira: "Roth IRA",
  brokerage: "Brokerage",
  real_estate: "Real Estate",
  cash: "Cash/Savings",
  crypto: "Crypto",
  other_asset: "Other Asset",
  mortgage: "Mortgage",
  student_loan: "Student Loan",
  auto_loan: "Auto Loan",
  credit_card: "Credit Card",
  other_liability: "Other Liability",
};

export default function NetWorthPage() {
  const { accounts, loading, error, addAccount: addAccountToDb, updateBalance: updateBalanceInDb, removeAccount: removeAccountFromDb } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("cash");
  const [newBalance, setNewBalance] = useState(0);
  const [saving, setSaving] = useState(false);

  const { totalAssets, totalLiabilities, netWorth } = computeNetWorth(accounts);

  const addAccount = async () => {
    if (!newName.trim()) return;
    const isLiability = ["mortgage", "student_loan", "auto_loan", "credit_card", "other_liability"].includes(newCategory);
    setSaving(true);
    await addAccountToDb({
      name: newName.trim(),
      category: newCategory,
      type: isLiability ? "liability" : "asset",
      balance: Math.abs(newBalance),
    });
    setNewName("");
    setNewBalance(0);
    setShowForm(false);
    setSaving(false);
  };

  const removeAccount = async (id: string) => {
    await removeAccountFromDb(id);
  };

  const updateBalance = async (id: string, balance: number) => {
    await updateBalanceInDb(id, balance);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        <p>Error loading accounts: {error}</p>
      </div>
    );
  }

  const assets = accounts.filter((a) => a.type === "asset");
  const liabilities = accounts.filter((a) => a.type === "liability");

  const pieData = assets.map((a) => ({
    name: a.name,
    value: a.balance,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Net Worth Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your assets and liabilities</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Account
        </Button>
      </div>

      {/* Add Account Form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., TSP" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Balance</Label>
                <Input type="number" value={newBalance} onChange={(e) => setNewBalance(+e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={addAccount} className="w-full">Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Total Assets</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAssets)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Total Liabilities</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Net Worth</div>
            <div className={`text-2xl font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netWorth)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Allocation Pie */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Asset Allocation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Account Lists */}
        <div className="space-y-4">
          {assets.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Assets</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-xs">{CATEGORY_LABELS[a.category]}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-28 h-7 text-sm"
                            value={a.balance}
                            onChange={(e) => updateBalance(a.id, +e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeAccount(a.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {liabilities.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Liabilities</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liabilities.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-xs">{CATEGORY_LABELS[a.category]}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-28 h-7 text-sm"
                            value={a.balance}
                            onChange={(e) => updateBalance(a.id, +e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeAccount(a.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
