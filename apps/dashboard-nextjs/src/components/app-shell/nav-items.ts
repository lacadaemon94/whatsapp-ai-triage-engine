import { Inbox, Sparkles, UserCog, Activity, type IconComponent } from "@/components/ui/icon";

export type NavItem = {
  label: string;
  href: string;
  icon: IconComponent;
  matchPrefix: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Inbox", href: "/inbox", icon: Inbox, matchPrefix: "/inbox" },
  { label: "Leads", href: "/leads", icon: Sparkles, matchPrefix: "/leads" },
  { label: "Handoffs", href: "/handoffs", icon: UserCog, matchPrefix: "/handoffs" },
  { label: "Activity", href: "/activity", icon: Activity, matchPrefix: "/activity" }
];

export function isItemActive(pathname: string | null | undefined, item: NavItem) {
  if (!pathname) return false;
  if (item.matchPrefix === "/inbox" && (pathname === "/" || pathname.startsWith("/inbox"))) return true;
  return pathname.startsWith(item.matchPrefix);
}
