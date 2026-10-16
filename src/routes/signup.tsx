import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "login" ? ("login" as const) : ("signup" as const),
  }),
  head: () => ({
    meta: [
      { title: "Intern Account — NxDigita AI Technologies" },
      {
        name: "description",
        content:
          "Create or access your NxDigita intern account to apply, view recommendations, and follow your progress.",
      },
      { property: "og:title", content: "Intern Account — NxDigita AI Technologies" },
      {
        property: "og:description",
        content:
          "Access your NxDigita internship application, recommended track, progress, and certificate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    if (mode === "signup") {
      const fullName = String(form.get("fullName") ?? "");
      const college = String(form.get("college") ?? "");
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, college } },
      });
      if (result.error) setError(result.error.message);
      else if (result.data.session) await navigate({ to: "/dashboard" });
      else setMessage("Check your email to confirm your account, then return here to sign in.");
    } else {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) setError(result.error.message);
      else await navigate({ to: "/dashboard" });
    }
    setBusy(false);
  }

  // async function googleSignIn() {
  //   setBusy(true); setError("");
  //   const result = await supabase.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  //   if (result.error) { setError(result.error.message); setBusy(false); return; }
  //   if (!result.redirected) await navigate({ to: "/dashboard" });
  // }

  async function googleSignIn() {
    
    console.info("google Login!")
    setBusy(true);
    setError("");

    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        // redirectTo: "http://localhost:8080",
      },
    });

    if (result.error) {
      setError(result.error.message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="dark-panel h-2" />
      <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>
        <div className="mt-8 rounded-lg border border-border bg-card p-6 sm:p-8">
          <p className="text-[10px] font-medium tracking-[0.22em] text-primary">
            NXDIGITA AI TECHNOLOGIES
          </p>
          <h1 className="mt-3 text-2xl font-bold text-foreground">
            {mode === "signup" ? "Create your intern account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Apply, get your recommended track, and follow your progress."
              : "Continue your Hire · Engage · Deploy journey."}
          </p>
          <div className="mt-6 grid grid-cols-2 rounded-md bg-muted p-1">
            {(["signup", "login"] as const).map((item) => (
              <Button
                key={item}
                type="button"
                variant={mode === item ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setMode(item);
                  setError("");
                  setMessage("");
                }}
              >
                {item === "signup" ? "Sign up" : "Sign in"}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            onClick={googleSignIn}
            disabled={busy}
          >
            <span className="font-bold">G</span> Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or use email</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" ? (
              <>
                <Field label="Full name">
                  <Input name="fullName" required minLength={2} autoComplete="name" />
                </Field>
                <Field label="College">
                  <Input name="college" required minLength={2} />
                </Field>
              </>
            ) : null}
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Password">
              <Input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </Field>
            {error ? (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            ) : null}
            {message ? (
              <p className="rounded-md bg-cyan/10 p-3 text-sm text-cyan-dark">{message}</p>
            ) : null}
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}
