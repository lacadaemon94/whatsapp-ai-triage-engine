"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Check,
  Clock,
  HelpingHand,
  Inbox,
  MagicWand,
  MessageSquare,
  Send,
  Sparkles,
  UserCog,
  X,
  type IconComponent
} from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wa-onboarding-tour-complete";

type OnboardingStep = {
  eyebrow: string;
  title: string;
  summary: string;
  points: string[];
  icon: IconComponent;
  visual: "intake" | "triage" | "routing" | "control" | "impact";
};

const steps: OnboardingStep[] = [
  {
    eyebrow: "Manual intake",
    title: "Messages arrive faster than teams can sort them.",
    summary:
      "Many businesses still read every WhatsApp or messaging thread by hand, then decide urgency, owner, and next action from scratch.",
    points: ["Incoming questions", "Context scattered across threads", "Manual urgency checks"],
    icon: MessageSquare,
    visual: "intake"
  },
  {
    eyebrow: "AI-assisted triage",
    title: "The workflow can classify, summarize, and prioritize.",
    summary:
      "The demo shows how AI can suggest intent, urgency, sentiment, customer type, and a concise summary before a person reviews the work.",
    points: ["Intent tags", "Short summaries", "Suggested priority"],
    icon: MagicWand,
    visual: "triage"
  },
  {
    eyebrow: "Routing and next steps",
    title: "Work moves toward the right queue with a prepared action.",
    summary:
      "Messages can be grouped for Sales, Support, Urgent follow-up, or Human Review, with a drafted response or recommended next step ready to inspect.",
    points: ["Queue handoff", "Drafted replies", "Recommended actions"],
    icon: Send,
    visual: "routing"
  },
  {
    eyebrow: "Human control",
    title: "People stay in the loop before anything important happens.",
    summary:
      "Operators can approve, edit, override, or send a thread to human review. The AI suggestion supports the team; it does not replace judgment.",
    points: ["Review suggestions", "Edit or override", "Approve with context"],
    icon: UserCog,
    visual: "control"
  },
  {
    eyebrow: "Business impact",
    title: "The useful part is clearer work, not magic.",
    summary:
      "This sample workflow illustrates how AI assistance may reduce sorting effort, highlight time-sensitive threads, and make handoffs more consistent.",
    points: ["Faster response readiness", "Less manual sorting", "Clearer team handoff"],
    icon: Sparkles,
    visual: "impact"
  }
];

const tagVariants = {
  Urgent: "warning",
  Sales: "success",
  Support: "info",
  "Follow-up": "secondary",
  "Human Review": "destructive"
} as const;

export function OnboardingTour() {
  const [ready, setReady] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const complete = window.localStorage.getItem(STORAGE_KEY) === "true";
      setOpen(!complete);
      setReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const completeTour = React.useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        completeTour();
        return;
      }
      setOpen(true);
    },
    [completeTour]
  );

  const isLastStep = activeStep === steps.length - 1;
  const step = steps[activeStep];
  const StepIcon = step.icon;

  if (!ready) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden border-0 bg-surface shadow-2xl outline-none",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[calc(100svh-1.5rem)] sm:w-[calc(100vw-1.5rem)] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-border",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:overflow-hidden">
            <div className="shrink-0 border-b border-border bg-surface-2 p-3 sm:p-5 lg:min-h-[36rem] lg:border-b-0 lg:border-r">
              <div className="flex h-full min-h-0 flex-col">
                <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                      <StepIcon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    Workflow preview
                  </div>
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close tour">
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogPrimitive.Close>
                </div>
                <div className="flex min-h-0 items-center lg:flex-1">
                  <StepVisual type={step.visual} />
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col p-4 pb-0 sm:p-6 sm:pb-0 lg:max-h-[calc(100svh-1.5rem)] lg:overflow-y-auto lg:p-7">
              <div className="mb-4 flex items-center gap-2 sm:mb-5">
                <Badge variant="default">{step.eyebrow}</Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {activeStep + 1} / {steps.length}
                </span>
              </div>

              <DialogPrimitive.Title className="text-balance text-[1.45rem] font-semibold leading-tight sm:text-3xl">
                {step.title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-3 text-sm leading-6 text-muted-foreground sm:text-[15px]">
                {step.summary}
              </DialogPrimitive.Description>

              <ul className="mt-4 grid gap-2 sm:mt-5" aria-label="Step highlights">
                {step.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm leading-5"
                  >
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="sticky bottom-0 -mx-4 mt-5 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:mt-auto lg:border-t-0 lg:bg-transparent lg:p-0 lg:pt-6">
                <div className="mb-3 flex items-center justify-center gap-1.5 sm:mb-4 sm:justify-start" aria-label="Tour progress">
                  {steps.map((progressStep, index) => (
                    <button
                      key={progressStep.eyebrow}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      aria-label={`Go to step ${index + 1}: ${progressStep.eyebrow}`}
                      aria-current={index === activeStep ? "step" : undefined}
                      className={cn(
                        "h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:h-2",
                        index === activeStep ? "w-9 bg-primary sm:w-8" : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50 sm:w-2"
                      )}
                    />
                  ))}
                </div>

                <div className="flex flex-col-reverse gap-2 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
                  <Button variant="ghost" className="w-full min-[430px]:w-auto" onClick={completeTour}>
                    Skip
                  </Button>
                  <div className="grid grid-cols-2 gap-2 min-[430px]:flex min-[430px]:items-center">
                    {activeStep > 0 ? (
                      <Button className="w-full min-[430px]:w-auto" variant="outline" onClick={() => setActiveStep((current) => current - 1)}>
                        Back
                      </Button>
                    ) : (
                      <span aria-hidden className="hidden min-[430px]:block" />
                    )}
                    <Button
                      className={cn("w-full", activeStep === 0 && "col-span-2 min-[430px]:col-span-1 min-[430px]:w-auto")}
                      onClick={() => {
                        if (isLastStep) {
                          completeTour();
                          return;
                        }
                        setActiveStep((current) => current + 1);
                      }}
                    >
                      {isLastStep ? "View dashboard" : "Next"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function StepVisual({ type }: { type: OnboardingStep["visual"] }) {
  switch (type) {
    case "intake":
      return <ManualIntakeVisual />;
    case "triage":
      return <AiTriageVisual />;
    case "routing":
      return <RoutingVisual />;
    case "control":
      return <HumanControlVisual />;
    case "impact":
      return <ImpactVisual />;
  }
}

function ManualIntakeVisual() {
  return (
    <div className="onboarding-visual-shell">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Inbound channels</p>
          <h3 className="mt-1 text-base font-semibold">Manual message queue</h3>
        </div>
        <Badge variant="secondary">Example</Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {[
          ["I need pricing for 40 seats this week.", "WhatsApp", "Sales"],
          ["My order is stuck and the client is waiting.", "Messenger", "Support"],
          ["Can someone call me before 3 PM?", "WhatsApp", "Urgent"]
        ].map(([message, channel, label], index) => (
          <div
            key={message}
            className="onboarding-message-bubble"
            style={{ "--delay": `${index * 140}ms` } as React.CSSProperties}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              <MessageSquare className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{channel}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
              <p className="mt-1 text-sm leading-5">{message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiTriageVisual() {
  return (
    <div className="onboarding-visual-shell">
      <div className="onboarding-processing-card">
        <div className="flex items-start gap-3">
          <span className="onboarding-ai-pulse grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <MagicWand className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">AI-assisted triage</p>
            <p className="mt-2 text-sm leading-5">
              Customer is asking for pricing and needs a response soon. Likely sales opportunity with a deadline.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(tagVariants).map(([label, variant], index) => (
            <Badge
              key={label}
              variant={variant}
              className="onboarding-tag-reveal"
              style={{ "--delay": `${index * 100 + 120}ms` } as React.CSSProperties}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          Suggested summary
        </div>
        <p className="text-sm leading-5">
          Prospect needs seat pricing this week. Prepare quote details and route to Sales for follow-up.
        </p>
      </div>
    </div>
  );
}

function RoutingVisual() {
  const lanes = [
    { label: "Sales", tone: "success" as const, icon: Sparkles },
    { label: "Support", tone: "info" as const, icon: HelpingHand },
    { label: "Urgent", tone: "warning" as const, icon: AlertTriangle },
    { label: "Review", tone: "destructive" as const, icon: UserCog }
  ];

  return (
    <div className="onboarding-visual-shell">
      <div className="grid grid-cols-2 gap-2">
        {lanes.map((lane, index) => {
          const LaneIcon = lane.icon;
          return (
            <div key={lane.label} className="min-h-24 rounded-lg border border-border bg-surface p-2 sm:min-h-28">
              <div className="mb-2 flex items-center gap-1.5">
                <LaneIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span className="text-xs font-medium">{lane.label}</span>
              </div>
              {index < 3 ? (
                <div
                  className="onboarding-queue-card rounded-md border border-border bg-surface-2 p-2 text-xs leading-4"
                  style={{ "--delay": `${index * 160}ms` } as React.CSSProperties}
                >
                  <Badge variant={lane.tone} size="sm" className="mb-2">
                    Routed
                  </Badge>
                  <p>{index === 0 ? "Prepare pricing reply" : index === 1 ? "Check order status" : "Call before 3 PM"}</p>
                </div>
              ) : (
                <div className="grid h-16 place-items-center rounded-md border border-dashed border-border text-[11px] text-muted-foreground">
                  Needs approval
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HumanControlVisual() {
  return (
    <div className="onboarding-visual-shell">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Review before send</p>
            <h3 className="mt-1 text-base font-semibold">Drafted response</h3>
          </div>
          <Badge variant="warning">Human review</Badge>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3 text-sm leading-5">
          Thanks for reaching out. I can help with pricing for 40 seats. Could you confirm your preferred start date?
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3">
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button size="sm" variant="secondary">
            Override
          </Button>
          <Button size="sm">
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImpactVisual() {
  const benefits = [
    ["Faster response readiness", Clock, "Queue context is prepared sooner"],
    ["Less manual sorting", Inbox, "Threads are easier to scan"],
    ["Clearer team handoff", UserCog, "Owners see suggested next steps"],
    ["Fewer missed opportunities", Sparkles, "Important leads stand out"]
  ] as const;

  return (
    <div className="onboarding-visual-shell">
      <div className="grid gap-3 sm:grid-cols-2">
        {benefits.map(([label, Icon, description], index) => (
          <div
            key={label}
            className="onboarding-impact-card rounded-lg border border-border bg-surface p-3"
            style={{ "--delay": `${index * 120}ms` } as React.CSSProperties}
          >
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
