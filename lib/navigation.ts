import type { NavItem } from "@/components/layout/app-shell";

export const adminNav: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
  },
  {
    href: "/admin/projects",
    label: "Projects",
  },
  {
    href: "/admin/regions",
    label: "Regions",
  },
  {
    href: "/admin/demo-management",
    label: "Demo Management",
  },
  {
    href: "/admin/hospitals",
    label: "Hospitals",
  },
  {
    href: "/admin/team",
    label: "Team",
  },
  {
    href: "/admin/devices",
    label: "Devices",
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
  },
];

export const engineerNav: NavItem[] = [
  {
    href: "/engineer/dashboard",
    label: "Dashboard",
  },
];
