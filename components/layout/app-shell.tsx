"use client";

import Link from "next/link";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { Menu } from "lucide-react";
import Button from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  icon?: ReactNode;
};

type AppShellProps = {
  roleLabel: string;
  navItems: NavItem[];
  userName?: string | null;
  children: ReactNode;
};

export default function AppShell({
  roleLabel,
  navItems,
  userName,
  children,
}: AppShellProps) {
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSidebarOpen = isSidebarPinned || isSidebarHovered;

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsSidebarHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 250); // 250ms delay for a smoother hover experience
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-x-4 border-b border-border bg-surface px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-muted hover:text-foreground transition-colors"
          onClick={() => setIsSidebarPinned(!isSidebarPinned)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className="sr-only">Toggle sidebar</span>
          <Menu className={`h-5 w-5 ${isSidebarPinned ? "text-brand" : ""}`} aria-hidden="true" />
        </button>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand leading-none">
                MedDevice
              </span>
              <span className="text-sm font-semibold text-foreground leading-none mt-1">
                Management Suite
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hover Trigger Area */}
      {!isSidebarPinned && (
        <div
          className="fixed top-14 bottom-0 left-0 z-30 w-12 bg-transparent"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 w-56 transform border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex h-full flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* User Info */}
          <div className="px-3 py-4 border-b border-border">
            <div className="flex flex-col gap-2">
              <div className="rounded-lg border border-brand/20 bg-brand/5 px-2.5 py-1.5">
                <p className="text-[9px] font-medium uppercase tracking-wider text-brand">Active Role</p>
                <p className="text-xs font-semibold text-foreground">{roleLabel}</p>
              </div>
              {userName ? (
                <div className="rounded-lg border border-border bg-surface-muted/50 px-2.5 py-1.5">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted">Signed in as</p>
                  <p className="text-xs font-medium text-foreground truncate">{userName}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <span className="block text-foreground text-xs">{item.label}</span>
                {item.description ? (
                  <span className="text-[10px] font-normal text-muted group-hover:text-sidebar-accent-foreground/70 leading-tight">
                    {item.description}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="p-3 border-t border-border flex flex-col gap-2">
            <ThemeToggle />
            <form action={signOut}>
              <Button type="submit" variant="secondary" className="w-full h-8 text-xs">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "pl-56" : "pl-0"
        }`}
      >
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
