import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  Check,
  Circle,
  Compass,
  Download,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getInternDashboard, submitInternApplication } from "@/lib/intern-dashboard.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  ApplicationWizard,
  mapWizardToApplication,
} from "@/components/dashboard/ApplicationWizard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Intern Dashboard — NxDigita AI Technologies" },
      {
        name: "description",
        content:
          "Apply for an NxDigita internship, review your recommended track, follow milestones, and unlock your certificate.",
      },
      { property: "og:title", content: "Intern Dashboard — NxDigita AI Technologies" },
      {
        property: "og:description",
        content:
          "Your private NxDigita internship application, recommendation, progress, and certificate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchDashboard = useServerFn(getInternDashboard);
  const submitApplication = useServerFn(submitInternApplication);
  const [mobileMenu, setMobileMenu] = useState(false);
  const dashboard = useQuery({ queryKey: ["intern-dashboard"], queryFn: () => fetchDashboard() });
  const applicationMutation = useMutation({
    mutationFn: (data: Parameters<typeof submitApplication>[0]) => submitApplication(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["intern-dashboard"] }),
  });
  const milestones = dashboard.data?.milestones ?? [];
  const completed = milestones.filter((item) => item.completed).length;
  const progress = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;
  const unlocked = milestones.length > 0 && completed === milestones.length;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/signup", search: { mode: "login" }, replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="dark-panel sticky top-0 z-40 border-b border-dark-foreground/10 lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            className="text-dark-foreground hover:bg-dark-foreground/10"
            onClick={() => setMobileMenu((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileMenu ? <X /> : <Menu />}
          </Button>
        </div>
      </header>
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[260px_1fr]">
        <aside
          className={`${mobileMenu ? "block" : "hidden"} dark-panel border-r border-dark-foreground/10 p-5 lg:block`}
        >
          <Brand />
          <nav className="mt-10 space-y-2">
            <span className="flex items-center gap-3 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground">
              <LayoutDashboard className="size-4" /> Overview
            </span>
            <a
              href="#application"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-dark-muted hover:bg-dark-foreground/5 hover:text-dark-foreground"
            >
              <BriefcaseBusiness className="size-4" /> Application
            </a>
            <a
              href="#recommendation"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-dark-muted hover:bg-dark-foreground/5 hover:text-dark-foreground"
            >
              <Compass className="size-4" /> My track
            </a>
            <a
              href="#progress"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-dark-muted hover:bg-dark-foreground/5 hover:text-dark-foreground"
            >
              <Target className="size-4" /> Progress
            </a>
            <a
              href="#certificate"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-dark-muted hover:bg-dark-foreground/5 hover:text-dark-foreground"
            >
              <Award className="size-4" /> Certificate
            </a>
          </nav>
          <Button
            variant="ghost"
            className="mt-10 w-full justify-start text-dark-muted hover:bg-dark-foreground/5 hover:text-dark-foreground"
            onClick={signOut}
          >
            <LogOut /> Sign out
          </Button>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">SAMPLE INTERN WORKSPACE</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                Welcome
                {dashboard.data?.profile?.full_name
                  ? `, ${dashboard.data.profile.full_name.split(" ")[0]}`
                  : ""}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Apply once, follow your recommended track, and build toward certification.
              </p>
            </div>
            <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>

          {dashboard.isLoading ? (
            <LoadingState />
          ) : dashboard.isError ? (
            <ErrorState message="We couldn't load your dashboard." />
          ) : (
            <div className="mt-8 space-y-8">
              <section className="grid gap-4 md:grid-cols-3">
                <Stat
                  label="Application"
                  value={dashboard.data?.application ? "Submitted" : "Not started"}
                />
                <Stat
                  label="Recommended track"
                  value={dashboard.data?.recommendation?.recommended_track ?? "Pending application"}
                />
                <Stat label="Overall progress" value={`${progress}%`} />
              </section>

              <section id="application" className="scroll-mt-24 border-t border-border pt-8">
                <SectionHeading
                  icon={<BriefcaseBusiness />}
                  title={
                    dashboard.data?.application ? "Your application" : "Apply for an internship"
                  }
                  copy={
                    dashboard.data?.application
                      ? "Your profile has been submitted. Update it while it remains under review."
                      : "Tell us where you are now and where you want your career to go."
                  }
                />
                <ApplicationWizard
                  userId={user.id}
                  email={user.email ?? ""}
                  initial={dashboard.data ?? null}
                  pending={applicationMutation.isPending}
                  error={applicationMutation.error}
                  onSubmit={(data) =>
                    applicationMutation.mutate({ data: mapWizardToApplication(data) })
                  }
                />
              </section>

              <section id="recommendation" className="scroll-mt-24 border-t border-border pt-8">
                <SectionHeading
                  icon={<Sparkles />}
                  title="Your recommended track"
                  copy="A focused path based on your current skills, goals, and availability."
                />
                {dashboard.data?.recommendation ? (
                  <Recommendation recommendation={dashboard.data.recommendation} />
                ) : (
                  <EmptyState text="Submit your application to generate your personalized recommendation." />
                )}
              </section>

              <section id="progress" className="scroll-mt-24 border-t border-border pt-8">
                <SectionHeading
                  icon={<Target />}
                  title="Internship progress"
                  copy="Milestones are verified by the NxDigita team as you complete live project work."
                />
                {milestones.length ? (
                  <MilestoneList milestones={milestones} progress={progress} />
                ) : (
                  <EmptyState text="Your milestone plan will appear after you submit your application." />
                )}
              </section>

              <section id="certificate" className="scroll-mt-24 border-t border-border pt-8 pb-10">
                <SectionHeading
                  icon={<Award />}
                  title="Certificate"
                  copy={
                    unlocked
                      ? "Every milestone is complete. Your personalized certificate is ready."
                      : "Complete every verified milestone to unlock your certificate."
                  }
                />
                <CertificatePanel
                  unlocked={unlocked}
                  name={dashboard.data?.profile?.full_name ?? "Intern"}
                  track={dashboard.data?.recommendation?.recommended_track ?? ""}
                />
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img
        src="/NXDIgita.jpeg"
        alt="NxDigita"
        className="size-9 shrink-0 rounded-md bg-white object-contain"
      />
      <span>
        <span className="block text-sm font-bold text-dark-foreground">NxDigita</span>
        <span className="block text-[9px] tracking-[0.16em] text-dark-muted">
          HIRE · ENGAGE · DEPLOY
        </span>
      </span>
    </Link>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 line-clamp-2 font-heading text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
function SectionHeading({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary [&>svg]:size-4">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}
function LoadingState() {
  return (
    <div className="mt-16 flex items-center gap-3 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" /> Loading your workspace…
    </div>
  );
}
function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-8 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

type DashboardData = Awaited<ReturnType<typeof getInternDashboard>>;
function asStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
function Recommendation({
  recommendation,
}: {
  recommendation: NonNullable<DashboardData["recommendation"]>;
}) {
  return (
    <div className="grid gap-5 rounded-lg border border-border bg-card p-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <p className="text-xs font-medium text-primary">PRIMARY TRACK</p>
        <h3 className="mt-2 text-2xl font-bold text-foreground">
          {recommendation.recommended_track}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{recommendation.fit_summary}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <BulletList title="Skill gaps" items={asStrings(recommendation.skill_gaps)} />
        <BulletList title="Next steps" items={asStrings(recommendation.next_steps)} />
      </div>
    </div>
  );
}
function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-muted-foreground">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
function MilestoneList({
  milestones,
  progress,
}: {
  milestones: NonNullable<DashboardData["milestones"]>;
  progress: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Verified completion</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {milestones.filter((item) => item.completed).length} of {milestones.length} milestones
          </p>
        </div>
        <p className="font-heading text-2xl font-bold text-primary">{progress}%</p>
      </div>
      <Progress value={progress} className="mt-4" />
      <ol className="mt-7 space-y-1">
        {milestones.map((item) => (
          <li key={item.id} className="flex gap-3 border-t border-border py-4 first:border-0">
            <span
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${item.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {item.completed ? <Check className="size-3.5" /> : <Circle className="size-3" />}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
function CertificatePanel({
  unlocked,
  name,
  track,
}: {
  unlocked: boolean;
  name: string;
  track: string;
}) {
  const [downloading, setDownloading] = useState(false);
  async function download() {
    if (!unlocked || downloading) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const width = pdf.internal.pageSize.getWidth();
      pdf.setDrawColor(255, 107, 0);
      pdf.setLineWidth(1.5);
      pdf.rect(10, 10, width - 20, 190);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("NxDigita AI Technologies", width / 2, 40, { align: "center" });
      pdf.setFontSize(30);
      pdf.text("Certificate of Completion", width / 2, 78, { align: "center" });
      pdf.setTextColor(255, 107, 0);
      pdf.text(name, width / 2, 110, { align: "center" });
      pdf.setTextColor(4, 11, 22);
      pdf.setFontSize(13);
      pdf.text(`for verified completion of the ${track} internship`, width / 2, 130, {
        align: "center",
      });
      pdf.text("HIRE · ENGAGE · DEPLOY", width / 2, 175, { align: "center" });
      pdf.save(`nxdigita-certificate-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
    } finally {
      setDownloading(false);
    }
  }
  return (
    <div className="dark-panel flex flex-col items-start justify-between gap-6 rounded-lg border border-slate-navy p-6 sm:flex-row sm:items-center">
      <div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${unlocked ? "bg-cyan/15 text-cyan" : "bg-dark-foreground/10 text-dark-muted"}`}
        >
          {unlocked ? "Unlocked" : "Locked"}
        </span>
        <p className="mt-3 font-heading text-xl font-bold text-dark-foreground">
          {unlocked ? `${name}'s certificate is ready` : "Complete all milestones to unlock"}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <img
            src="/NXDIgita.jpeg"
            alt="NxDigita"
            className="size-9 shrink-0 rounded-md bg-white object-contain"
          />
          <div>
            <p className="text-sm font-bold text-dark-foreground">NxDigita Internship</p>
            <p className="text-[9px] tracking-[0.16em] text-dark-muted">HIRE · ENGAGE · DEPLOY</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-dark-muted">{track}</p>
      </div>
      <Button onClick={download} disabled={!unlocked || downloading}>
        {downloading ? <Loader2 className="animate-spin" /> : <Download />}
        {downloading ? "Preparing…" : "Download certificate"}
      </Button>
    </div>
  );
}
