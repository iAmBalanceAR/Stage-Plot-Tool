"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspace-store";

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[var(--foreground)] text-[var(--background)] shadow-lg">
      <span className="absolute inset-x-1.5 bottom-2 h-0.5 rounded bg-[var(--accent)]" />
      <span className="absolute bottom-2 left-2 top-2 w-0.5 rounded bg-[var(--accent)]" />
      <span className="text-sm font-black tracking-tighter">SC</span>
    </span>
    <div>
      <p className="text-sm font-black leading-none tracking-tight">StageCraft</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--muted)]">
        Band advance
      </p>
    </div>
  </div>
);

export const LoginGate = () => {
  const signIn = useWorkspaceStore((state) => state.signIn);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (form: FormData) => {
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    setIsBusy(true);
    try {
      await signIn(email, password);
      toast.success("Signed in");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--workspace)] px-4 text-[var(--foreground)]">
      <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
        <Logo />
        <h1 className="mt-5 text-2xl font-black">Venue sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Bands do not sign in here. Open the unique link the venue sent you.
        </p>
        <form
          className="mt-5 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
        >
          <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
            Email
            <input
              name="email"
              type="email"
              className="input mt-1.5"
              autoComplete="username"
              required
              aria-label="Email"
            />
          </label>
          <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
            Password
            <input
              name="password"
              type="password"
              className="input mt-1.5"
              autoComplete="current-password"
              required
              aria-label="Password"
            />
          </label>
          <button type="submit" className="button-primary mt-1" disabled={isBusy}>
            {isBusy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
};

export const BandLinkStatus = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) => (
  <main className="grid min-h-screen place-items-center bg-[var(--workspace)] px-4 text-[var(--foreground)]">
    <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
      <Logo />
      <h1 className="mt-5 text-2xl font-black">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{message}</p>
    </section>
  </main>
);
