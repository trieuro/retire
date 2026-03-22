"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calculator, Wallet, GitCompare, Shield } from "lucide-react";

const summaryCards = [
  {
    title: "FERS Pension",
    value: "Set up your profile",
    description: "Calculate your federal pension",
    href: "/calculator",
    icon: Calculator,
  },
  {
    title: "TSP Balance",
    value: "Track your TSP",
    description: "Project your TSP growth",
    href: "/calculator",
    icon: Wallet,
  },
  {
    title: "Social Security",
    value: "Optimize benefits",
    description: "Worker + spousal benefits",
    href: "/social-security",
    icon: Shield,
  },
  {
    title: "Net Worth",
    value: "Track assets & debts",
    description: "Complete financial picture",
    href: "/net-worth",
    icon: Wallet,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">RetirePlan</h1>
        <p className="text-muted-foreground mt-1">
          Your federal retirement planning dashboard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Start with the FERS Calculator to enter your pension details and TSP information.</p>
            <p>2. Use the Social Security page to optimize your claiming strategy with spousal benefits.</p>
            <p>3. Track your full financial picture in Net Worth.</p>
            <p>4. Compare different retirement plans in Scenarios.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
