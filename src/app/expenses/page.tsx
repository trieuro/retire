"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface ExpenseRow {
  id: string;
  name: string;
  monthly: number;
  category: "essential" | "non-essential";
}

interface ExpenseData {
  preRetirement: ExpenseRow[];
  postRetirement: ExpenseRow[];
}

// Based on 2025 actual credit card spending (Replit excluded)
const DEFAULT_EXPENSES: ExpenseData = {
  preRetirement: [
    // Essential
    { id: "pre-0", name: "Mortgage", monthly: 1500, category: "essential" },
    { id: "pre-1", name: "Groceries (Costco/ShopRite/Hung Vuong)", monthly: 1114, category: "essential" },
    { id: "pre-2", name: "Gas & Vehicle Fuel", monthly: 200, category: "essential" },
    { id: "pre-3", name: "Auto Insurance (GEICO, 6-mo policy)", monthly: 430, category: "essential" },
    { id: "pre-4", name: "Auto Maintenance & Repairs", monthly: 114, category: "essential" },
    { id: "pre-1b", name: "Utilities (electric/water/gas)", monthly: 200, category: "essential" },
    { id: "pre-1c", name: "Internet", monthly: 100, category: "essential" },
    { id: "pre-4b", name: "Property Tax (New Castle County)", monthly: 494, category: "essential" },
    { id: "pre-5", name: "Home Insurance", monthly: 216, category: "essential" },
    { id: "pre-6", name: "Home Security (Alert 360)", monthly: 47, category: "essential" },
    { id: "pre-7", name: "Trash/Waste (Casella)", monthly: 26, category: "essential" },
    { id: "pre-8", name: "Health Care & Dental", monthly: 61, category: "essential" },
    { id: "pre-9", name: "Union Dues (NFFE)", monthly: 70, category: "essential" },
    { id: "pre-10", name: "Tolls (EZPass/DriveEZ)", monthly: 30, category: "essential" },
    // Non-Essential
    { id: "pre-11", name: "Dining Out & Restaurants", monthly: 243, category: "non-essential" },
    { id: "pre-12", name: "Travel & Lodging", monthly: 248, category: "non-essential" },
    { id: "pre-13", name: "Clothing & Shoes", monthly: 106, category: "non-essential" },
    { id: "pre-14", name: "Home Improvement (Lowes/HD)", monthly: 106, category: "non-essential" },
    { id: "pre-15", name: "Amazon Shopping", monthly: 721, category: "non-essential" },
    { id: "pre-15b", name: "Temu & Other Online Shopping", monthly: 130, category: "non-essential" },
    { id: "pre-16", name: "Tech/Software/AI (OpenAI, etc)", monthly: 139, category: "non-essential" },
    { id: "pre-17", name: "Streaming (Netflix/YouTube/Crunchyroll/Audible)", monthly: 56, category: "non-essential" },
    { id: "pre-18", name: "Learning Apps (Duolingo, etc)", monthly: 97, category: "non-essential" },
    { id: "pre-19", name: "Lawn Care (Sunday)", monthly: 18, category: "non-essential" },
    { id: "pre-20", name: "Memberships (AAA/AARP/Costco)", monthly: 33, category: "non-essential" },
    { id: "pre-21", name: "Entertainment & Golf", monthly: 17, category: "non-essential" },
    { id: "pre-22", name: "Sports & Hobbies", monthly: 23, category: "non-essential" },
    { id: "pre-23", name: "Security/VPN (NordVPN/Dashlane/Ring/Aura)", monthly: 29, category: "non-essential" },
    { id: "pre-24", name: "Software Dev (GitHub)", monthly: 17, category: "non-essential" },
  ],
  postRetirement: [
    // Essential
    { id: "post-0", name: "Mortgage", monthly: 1500, category: "essential" },
    { id: "post-1", name: "Groceries", monthly: 1114, category: "essential" },
    { id: "post-2", name: "Gas & Vehicle Fuel", monthly: 150, category: "essential" },
    { id: "post-3", name: "Auto Insurance (GEICO, 6-mo policy)", monthly: 430, category: "essential" },
    { id: "post-4", name: "Auto Maintenance & Repairs", monthly: 100, category: "essential" },
    { id: "post-1b", name: "Utilities (electric/water/gas)", monthly: 200, category: "essential" },
    { id: "post-1c", name: "Internet", monthly: 100, category: "essential" },
    { id: "post-4b", name: "Property Tax (New Castle County)", monthly: 494, category: "essential" },
    { id: "post-5", name: "Home Insurance", monthly: 216, category: "essential" },
    { id: "post-6", name: "Home Security (Alert 360)", monthly: 47, category: "essential" },
    { id: "post-7", name: "Trash/Waste (Casella)", monthly: 26, category: "essential" },
    { id: "post-8", name: "Health Insurance (FEHB)", monthly: 600, category: "essential" },
    { id: "post-9", name: "Health Care & Dental", monthly: 100, category: "essential" },
    { id: "post-10", name: "Tolls (EZPass)", monthly: 15, category: "essential" },
    // Non-Essential
    { id: "post-11", name: "Dining Out & Restaurants", monthly: 250, category: "non-essential" },
    { id: "post-12", name: "Travel & Lodging", monthly: 400, category: "non-essential" },
    { id: "post-13", name: "Clothing & Shoes", monthly: 80, category: "non-essential" },
    { id: "post-14", name: "Home Improvement", monthly: 80, category: "non-essential" },
    { id: "post-15", name: "Amazon Shopping", monthly: 500, category: "non-essential" },
    { id: "post-15b", name: "Other Online Shopping", monthly: 100, category: "non-essential" },
    { id: "post-16", name: "Streaming & Subscriptions", monthly: 50, category: "non-essential" },
    { id: "post-17", name: "Entertainment & Golf", monthly: 50, category: "non-essential" },
    { id: "post-18", name: "Lawn Care", monthly: 18, category: "non-essential" },
    { id: "post-19", name: "Memberships (AAA/AARP/Costco)", monthly: 33, category: "non-essential" },
    { id: "post-20", name: "Hobbies & Learning", monthly: 50, category: "non-essential" },
  ],
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function ExpensesPage() {
  const [data, setData] = useState<ExpenseData>(DEFAULT_EXPENSES);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from DB
  useEffect(() => {
    fetch("/api/expenses")
      .then((res) => res.json())
      .then((saved) => {
        if (saved && !saved.error && saved.preRetirement) {
          setData(saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-save with debounce
  const save = useCallback((newData: ExpenseData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      }).catch(() => {});
    }, 1000);
  }, []);

  const updateRow = useCallback((phase: "preRetirement" | "postRetirement", id: string, field: string, value: string | number) => {
    setData((prev) => {
      const next = { ...prev, [phase]: prev[phase].map((row) => row.id === id ? { ...row, [field]: value } : row) };
      save(next);
      return next;
    });
  }, [save]);

  const addRow = useCallback((phase: "preRetirement" | "postRetirement") => {
    setData((prev) => {
      const next = {
        ...prev,
        [phase]: [...prev[phase], { id: generateId(), name: "", monthly: 0, category: "non-essential" as const }],
      };
      save(next);
      return next;
    });
  }, [save]);

  const removeRow = useCallback((phase: "preRetirement" | "postRetirement", id: string) => {
    setData((prev) => {
      const next = { ...prev, [phase]: prev[phase].filter((row) => row.id !== id) };
      save(next);
      return next;
    });
  }, [save]);

  const totals = useMemo(() => {
    const calc = (rows: ExpenseRow[]) => {
      const essential = rows.filter((r) => r.category === "essential").reduce((s, r) => s + r.monthly, 0);
      const nonEssential = rows.filter((r) => r.category === "non-essential").reduce((s, r) => s + r.monthly, 0);
      return { essential, nonEssential, total: essential + nonEssential };
    };
    return { pre: calc(data.preRetirement), post: calc(data.postRetirement) };
  }, [data]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Expense Planner</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Break down your expenses by essential vs non-essential, before and after retirement
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Pre-Retirement (Monthly)</div>
            <div className="text-lg font-bold">{formatCurrency(totals.pre.total)}</div>
            <div className="text-xs text-muted-foreground mt-1">Annual: {formatCurrency(totals.pre.total * 12)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Post-Retirement (Monthly)</div>
            <div className="text-lg font-bold">{formatCurrency(totals.post.total)}</div>
            <div className="text-xs text-muted-foreground mt-1">Annual: {formatCurrency(totals.post.total * 12)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Reduction at Retirement</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency((totals.pre.total - totals.post.total) * 12)}/yr
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Post-Retirement Essential Only</div>
            <div className="text-lg font-bold">{formatCurrency(totals.post.essential * 12)}/yr</div>
            <div className="text-xs text-muted-foreground mt-1">Bare minimum needed</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pre-Retirement */}
        <ExpenseTable
          title="Pre-Retirement Expenses"
          rows={data.preRetirement}
          totals={totals.pre}
          onUpdate={(id, field, value) => updateRow("preRetirement", id, field, value)}
          onAdd={() => addRow("preRetirement")}
          onRemove={(id) => removeRow("preRetirement", id)}
        />

        {/* Post-Retirement */}
        <ExpenseTable
          title="Post-Retirement Expenses"
          rows={data.postRetirement}
          totals={totals.post}
          onUpdate={(id, field, value) => updateRow("postRetirement", id, field, value)}
          onAdd={() => addRow("postRetirement")}
          onRemove={(id) => removeRow("postRetirement", id)}
        />
      </div>
    </div>
  );
}

function ExpenseTable({ title, rows, totals, onUpdate, onAdd, onRemove }: {
  title: string;
  rows: ExpenseRow[];
  totals: { essential: number; nonEssential: number; total: number };
  onUpdate: (id: string, field: string, value: string | number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto text-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Expense</TableHead>
                <TableHead className="w-[100px]">Monthly</TableHead>
                <TableHead className="w-[100px]">Annual</TableHead>
                <TableHead className="w-[130px]">Category</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Input
                      className="h-8 text-sm"
                      value={row.name}
                      onChange={(e) => onUpdate(row.id, "name", e.target.value)}
                      placeholder="Expense name"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-sm w-24"
                      type="number"
                      value={row.monthly || ""}
                      onChange={(e) => onUpdate(row.id, "monthly", +e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(row.monthly * 12)}
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                      value={row.category}
                      onChange={(e) => onUpdate(row.id, "category", e.target.value)}
                    >
                      <option value="essential">Essential</option>
                      <option value="non-essential">Non-Essential</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600" onClick={() => onRemove(row.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-green-50">
                <TableCell className="font-medium">Essential</TableCell>
                <TableCell className="font-medium">{formatCurrency(totals.essential)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(totals.essential * 12)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
              <TableRow className="bg-amber-50">
                <TableCell className="font-medium">Non-Essential</TableCell>
                <TableCell className="font-medium">{formatCurrency(totals.nonEssential)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(totals.nonEssential * 12)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
              <TableRow className="bg-muted">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="font-bold">{formatCurrency(totals.total)}</TableCell>
                <TableCell className="font-bold">{formatCurrency(totals.total * 12)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
