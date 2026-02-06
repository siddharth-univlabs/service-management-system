import type { BadgeTone } from "@/components/ui/badge";

export function deviceStatusTone(status: string): BadgeTone {
  switch (status) {
    case "DEPLOYED":
      return "success";
    case "UNDER_SERVICE":
      return "warning";
    case "SCRAPPED":
      return "critical";
    default:
      return "neutral";
  }
}

export function demoStatusTone(status?: string): BadgeTone {
  switch (status) {
    case "IN_USE":
      return "info";
    case "AVAILABLE":
      return "success";
    case "RETURNED":
      return "warning";
    default:
      return "neutral";
  }
}
