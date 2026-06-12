/**
 * Single source of truth for icons used in the dashboard.
 * Wraps HugeIcons free as drop-in replacements for the Lucide names we had before,
 * so component imports only had to change file path (not symbol name).
 *
 * Default strokeWidth is 1.75 — leaner than Lucide's default 2, more in line with
 * modern dashboard UI (Linear, Vercel, Stripe).
 *
 * All icons accept the standard HTML/SVG attributes plus `className` for sizing/color.
 * Color resolves from CSS `currentColor`, so `text-*` Tailwind classes drive the color.
 */
import * as React from "react";
import { HugeiconsIcon, type HugeiconsProps } from "@hugeicons/react";
import {
  Activity03Icon,
  Alert02Icon,
  ArrowLeft02Icon,
  BubbleChatIcon,
  CalendarCheckIcon,
  Cancel01Icon,
  Clock01Icon,
  ComputerIcon,
  HandHelpingIcon,
  HelpCircleIcon,
  InboxIcon,
  MagicWand01Icon,
  Menu08Icon,
  MoreHorizontalIcon,
  Moon02Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightIcon,
  RefreshIcon,
  Search01Icon,
  SentIcon,
  Shield01Icon,
  SparklesIcon,
  Sun03Icon,
  Tick02Icon,
  TickDouble02Icon,
  UserSettings02Icon
} from "@hugeicons/core-free-icons";

type IconProps = Omit<HugeiconsProps, "icon">;

function makeIcon(icon: NonNullable<HugeiconsProps["icon"]>, displayName: string) {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
    { strokeWidth = 1.75, ...props },
    ref
  ) {
    return <HugeiconsIcon icon={icon} strokeWidth={strokeWidth} {...props} ref={ref} />;
  });
  Component.displayName = displayName;
  return Component;
}

/** Type matching what Lucide exports — `React.ComponentType<{ className?: string }>` works for our call sites. */
export type IconComponent = ReturnType<typeof makeIcon>;

// Section nav
export const Inbox = makeIcon(InboxIcon, "Inbox");
export const Sparkles = makeIcon(SparklesIcon, "Sparkles");
export const UserCog = makeIcon(UserSettings02Icon, "UserCog");
export const Activity = makeIcon(Activity03Icon, "Activity");

// Topbar / menu
export const Menu = makeIcon(Menu08Icon, "Menu");
export const Search = makeIcon(Search01Icon, "Search");
export const ChevronLeft = makeIcon(ArrowLeft02Icon, "ChevronLeft");

// Sidebar pin/expand
export const PanelLeftClose = makeIcon(PanelLeftCloseIcon, "PanelLeftClose");
export const PanelLeftOpen = makeIcon(PanelLeftOpenIcon, "PanelLeftOpen");
export const PanelRight = makeIcon(PanelRightIcon, "PanelRight");

// Theme toggle
export const Moon = makeIcon(Moon02Icon, "Moon");
export const Sun = makeIcon(Sun03Icon, "Sun");
export const Monitor = makeIcon(ComputerIcon, "Monitor");

// Messages / status
export const Check = makeIcon(Tick02Icon, "Check");
export const CheckCheck = makeIcon(TickDouble02Icon, "CheckCheck");
export const Clock = makeIcon(Clock01Icon, "Clock");
export const AlertTriangle = makeIcon(Alert02Icon, "AlertTriangle");
export const MoreHorizontal = makeIcon(MoreHorizontalIcon, "MoreHorizontal");
export const MessageSquare = makeIcon(BubbleChatIcon, "MessageSquare");
export const Send = makeIcon(SentIcon, "Send");

// Classification / actions
export const RefreshCw = makeIcon(RefreshIcon, "RefreshCw");

// Intent meta
export const HelpCircle = makeIcon(HelpCircleIcon, "HelpCircle");
export const CalendarCheck = makeIcon(CalendarCheckIcon, "CalendarCheck");
export const ShieldAlert = makeIcon(Shield01Icon, "ShieldAlert");
export const HelpingHand = makeIcon(HandHelpingIcon, "HelpingHand");
export const MagicWand = makeIcon(MagicWand01Icon, "MagicWand");

// Misc
export const X = makeIcon(Cancel01Icon, "X");
