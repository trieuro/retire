"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calculator, Wallet, GitCompare, Shield, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calculator", label: "FERS Calculator", icon: Calculator },
  { href: "/social-security", label: "Social Security", icon: Shield },
  { href: "/roth-conversion", label: "Roth Conversion", icon: ArrowRightLeft },
  { href: "/net-worth", label: "Net Worth", icon: Wallet },
  { href: "/scenarios", label: "Scenarios", icon: GitCompare },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col w-64 border-r bg-background p-4 gap-1">
      <div className="mb-6 px-3">
        <h1 className="text-xl font-bold text-primary">RetirePlan</h1>
        <p className="text-xs text-muted-foreground">Federal Retirement Planner</p>
      </div>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
