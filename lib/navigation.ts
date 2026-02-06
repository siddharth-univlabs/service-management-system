import type { NavItem } from "@/components/layout/app-shell";

export const adminNav: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    description: "Fleet health + activity",
  },
  {
    href: "/admin/regions",
    label: "Regions",
    description: "Zones + coverage",
  },
  {
    href: "/admin/demo-management",
    label: "Demo Management",
    description: "Live demo fleet",
  },
  {
    href: "/admin/hospitals",
    label: "Hospitals",
    description: "Sites, zones, assignments",
  },
  {
    href: "/admin/team",
    label: "Team",
    description: "Managers + engineers",
  },
  {
    href: "/admin/devices",
    label: "Devices",
    description: "Physical assets",
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    description: "Model-level insights",
  },
];

export const engineerNav: NavItem[] = [
  {
    href: "/engineer/dashboard",
    label: "Dashboard",
    description: "Assigned workload",
  },
];
