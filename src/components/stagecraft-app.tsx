"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  Download,
  FileDown,
  FileJson,
  FileSpreadsheet,
  ImageDown,
  Library,
  Moon,
  PanelRight,
  Plus,
  Redo2,
  Save,
  Sun,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { BandLinkStatus, LoginGate } from "@/components/login-gate";
import { WorkspaceMenus } from "@/components/workspace-menus";
import { EquipmentLibrary } from "@/components/equipment-library";
import { ProjectPanel } from "@/components/project-panel";
import { StageCanvas } from "@/components/stage-canvas";
import { createBlankProject } from "@/data/templates";
import { GUEST_USER_ID } from "@/types/account";
import { exportStageAsPng, exportTechnicalPacket } from "@/lib/export";
import {
  downloadInputListCsv,
  downloadProjectFile,
  getReadinessScore,
  parseProjectFile,
  saveStoredProject,
} from "@/lib/project";
import { useStageStore } from "@/store/stage-store";
import { useWorkspaceStore } from "@/store/workspace-store";

type MobileView = "library" | "stage" | "details";

interface StageCraftAppProps {
  bandToken?: string;
}

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[var(--foreground)] text-[var(--background)] shadow-lg">
      <span className="absolute inset-x-1.5 bottom-2 h-0.5 rounded bg-[var(--accent)]" />
      <span className="absolute bottom-2 left-2 top-2 w-0.5 rounded bg-[var(--accent)]" />
      <span className="text-sm font-black tracking-tighter">SC</span>
    </span>
    <div className="hidden sm:block">
      <p className="text-sm font-black leading-none tracking-tight">StageCraft</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.24em] text-[var(--muted)]">
        Band advance
      </p>
    </div>
  </div>
);

export const StageCraftApp = ({ bandToken }: StageCraftAppProps = {}) => {
  const [zoom, setZoom] = useState(88);
  const [mobileView, setMobileView] = useState<MobileView>("stage");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [bandLinkError, setBandLinkError] = useState<string | null>(null);
  const [isBandLinkPending, setIsBandLinkPending] = useState(Boolean(bandToken));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const project = useStageStore((state) => state.project);
  const isHydrated = useStageStore((state) => state.isHydrated);
  const past = useStageStore((state) => state.past);
  const future = useStageStore((state) => state.future);
  const hydrate = useStageStore((state) => state.hydrate);
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrateWorkspace);
  const saveCurrentPlot = useWorkspaceStore((state) => state.saveCurrentPlot);
  const signInBand = useWorkspaceStore((state) => state.signInBand);
  const profile = useWorkspaceStore((state) => state.profile);
  const workspaceReady = useWorkspaceStore((state) => state.isReady);
  const setProject = useStageStore((state) => state.setProject);
  const updateProject = useStageStore((state) => state.updateProject);
  const undo = useStageStore((state) => state.undo);
  const redo = useStageStore((state) => state.redo);
  const readinessScore = getReadinessScore(project);

  useEffect(() => {
    hydrate();
    hydrateWorkspace();
    const storedTheme = window.localStorage.getItem("stagecraft-theme");
    const shouldUseDark =
      storedTheme === "dark" ||
      (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(shouldUseDark);
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
    if (!bandToken && !window.localStorage.getItem("stagecraft-help-dismissed")) {
      setIsHelpOpen(true);
    }
  }, [bandToken, hydrate, hydrateWorkspace]);

  useEffect(() => {
    if (!bandToken || !workspaceReady) return;

    void (async () => {
      try {
        const band = await signInBand(bandToken);
        useStageStore.getState().updateProject((current) => ({
          ...current,
          actName: current.actName || band.displayName,
          eventDate: current.eventDate || band.showDate || current.eventDate,
        }));
        setBandLinkError(null);
      } catch (error) {
        setBandLinkError(error instanceof Error ? error.message : "This band link is not valid.");
      } finally {
        setIsBandLinkPending(false);
      }
    })();
  }, [bandToken, workspaceReady, signInBand]);

  useEffect(() => {
    if (!isHydrated || !workspaceReady || profile.id === GUEST_USER_ID) return;
    saveStoredProject(project);
    saveCurrentPlot(project);
  }, [isHydrated, workspaceReady, profile.id, project, saveCurrentPlot]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.ctrlKey || event.metaKey;
      if (!isModifierPressed) return;

      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }

      if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        downloadProjectFile(project);
        toast.success("Project file downloaded");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, redo, undo]);

  const handleThemeToggle = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
    window.localStorage.setItem("stagecraft-theme", nextIsDark ? "dark" : "light");
  };

  const handleNewProject = () => {
    if (
      project.items.length &&
      !window.confirm("Start a new stage plot? Your current project is autosaved.")
    ) {
      return;
    }
    setProject(createBlankProject());
    toast.success("New stage plot created");
  };

  const handleDismissHelp = () => {
    setIsHelpOpen(false);
    window.localStorage.setItem("stagecraft-help-dismissed", "1");
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;

    try {
      const importedProject = parseProjectFile(JSON.parse(await file.text()));
      setProject(importedProject);
      toast.success("StageCraft project imported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The project could not be imported.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePdfExport = async () => {
    setIsExportOpen(false);
    setMobileView("stage");
    const toastId = toast.loading("Building technical packet…");
    try {
      useStageStore.getState().selectItem(null);
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      await exportTechnicalPacket(project);
      toast.success("PDF technical packet downloaded", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF export failed.", {
        id: toastId,
      });
    }
  };

  const handlePngExport = async () => {
    setIsExportOpen(false);
    setMobileView("stage");
    const toastId = toast.loading("Rendering stage plot…");
    try {
      useStageStore.getState().selectItem(null);
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      await exportStageAsPng(project);
      toast.success("PNG stage plot downloaded", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PNG export failed.", {
        id: toastId,
      });
    }
  };

  if (!isHydrated || !workspaceReady || isBandLinkPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-xl bg-[var(--accent)]" />
          <p className="text-sm font-black">Opening StageCraft…</p>
        </div>
      </main>
    );
  }

  if (bandLinkError) {
    return <BandLinkStatus title="Link unavailable" message={bandLinkError} />;
  }

  if (profile.id === GUEST_USER_ID) {
    return <LoginGate />;
  }

  return (
    <main className="flex h-dvh min-h-[640px] flex-col overflow-hidden bg-[var(--workspace)] text-[var(--foreground)]">
      <header className="z-40 flex h-16 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-3 sm:px-4">
        <Logo />
        <div className="mx-1 h-7 w-px bg-[var(--border)] sm:mx-3" />
        <input
          value={project.name}
          onChange={(event) =>
            updateProject((current) => ({ ...current, name: event.target.value }))
          }
          className="min-w-0 max-w-56 flex-1 border-0 bg-transparent text-sm font-bold outline-none placeholder:text-[var(--muted)]"
          aria-label="Project title"
        />
        <span className="hidden items-center gap-1.5 text-[10px] font-bold text-[var(--muted)] md:flex">
          <Save className="h-3 w-3 text-emerald-500" />
          Autosaved
        </span>

        <div className="ml-auto flex items-center gap-1">
          <WorkspaceMenus project={project} />
          <button
            type="button"
            className="button-icon hidden sm:grid"
            onClick={undo}
            disabled={!past.length}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="button-icon hidden sm:grid"
            onClick={redo}
            disabled={!future.length}
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="button-icon"
            onClick={() => setIsHelpOpen(true)}
            aria-label="How StageCraft works"
            title="Help"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="button-icon hidden md:grid"
            onClick={handleThemeToggle}
            aria-label={isDark ? "Use light theme" : "Use dark theme"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="button-icon hidden md:grid"
            onClick={handleNewProject}
            aria-label="Create new stage plot"
            title="New project"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="button-secondary hidden md:flex"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileJson className="h-4 w-4" />
            Import
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={() => setIsExportOpen(true)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="hidden h-3 w-3 sm:block" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.stagecraft.json,application/json"
            className="hidden"
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <div
          className={`${mobileView === "library" ? "flex" : "hidden"} absolute inset-0 z-30 lg:static lg:flex`}
        >
          <EquipmentLibrary />
        </div>

        <section
          className={`${mobileView === "stage" ? "flex" : "hidden"} relative min-w-0 flex-1 flex-col lg:flex`}
          aria-label="Stage editor"
        >
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                {project.items.length} objects
              </span>
              <span className="hidden text-[10px] font-bold text-[var(--muted)] sm:block">
                Drag to move · arrows to nudge · Delete to remove
              </span>
            </div>
            <div
              className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1"
              aria-label="Canvas zoom controls"
            >
              <button
                type="button"
                className="rounded p-1 hover:bg-[var(--panel-strong)]"
                onClick={() => setZoom((value) => Math.max(50, value - 10))}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-[10px] font-black">{zoom}%</span>
              <button
                type="button"
                className="rounded p-1 hover:bg-[var(--panel-strong)]"
                onClick={() => setZoom((value) => Math.min(150, value + 10))}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <StageCanvas zoom={zoom} />
        </section>

        <div
          className={`${mobileView === "details" ? "flex" : "hidden"} absolute inset-0 z-30 lg:static lg:flex`}
        >
          <ProjectPanel />
        </div>
      </div>

      <nav className="z-40 grid h-16 shrink-0 grid-cols-3 border-t border-[var(--border)] bg-[var(--panel)] lg:hidden">
        {[
          { id: "library" as const, label: "Objects", icon: Library },
          { id: "stage" as const, label: "Stage", icon: Save },
          { id: "details" as const, label: "Details", icon: PanelRight },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wide ${
                mobileView === item.id ? "text-[var(--accent-strong)]" : "text-[var(--muted)]"
              }`}
              onClick={() => setMobileView(item.id)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {isExportOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsExportOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  Ready to advance
                </p>
                <h2 id="export-title" className="mt-1 text-xl font-black">
                  Export stage plot
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Readiness score: {readinessScore}%
                </p>
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setIsExportOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className="export-option" onClick={() => void handlePdfExport()}>
                <span className="export-option-icon bg-red-500/10 text-red-500">
                  <FileDown className="h-5 w-5" />
                </span>
                <span>
                  <strong>Technical packet PDF</strong>
                  <small>Plot, input list, monitor mixes, and production notes</small>
                </span>
              </button>
              <button type="button" className="export-option" onClick={() => void handlePngExport()}>
                <span className="export-option-icon bg-violet-500/10 text-violet-500">
                  <ImageDown className="h-5 w-5" />
                </span>
                <span>
                  <strong>Stage plot PNG</strong>
                  <small>High-resolution image for email and messaging</small>
                </span>
              </button>
              <button
                type="button"
                className="export-option"
                onClick={() => {
                  downloadProjectFile(project);
                  setIsExportOpen(false);
                  toast.success("Editable project downloaded");
                }}
              >
                <span className="export-option-icon bg-sky-500/10 text-sky-500">
                  <FileJson className="h-5 w-5" />
                </span>
                <span>
                  <strong>Editable project</strong>
                  <small>StageCraft JSON backup for future revisions</small>
                </span>
              </button>
              <button
                type="button"
                className="export-option"
                onClick={() => {
                  downloadInputListCsv(project);
                  setIsExportOpen(false);
                  toast.success("Input list CSV downloaded");
                }}
              >
                <span className="export-option-icon bg-amber-500/10 text-amber-500">
                  <FileSpreadsheet className="h-5 w-5" />
                </span>
                <span>
                  <strong>Input list CSV</strong>
                  <small>Patch list for house consoles and spreadsheets</small>
                </span>
              </button>
              <button
                type="button"
                className="export-option"
                onClick={() => {
                  setIsExportOpen(false);
                  window.print();
                }}
              >
                <span className="export-option-icon bg-emerald-500/10 text-emerald-500">
                  <Download className="h-5 w-5" />
                </span>
                <span>
                  <strong>Print plot</strong>
                  <small>Use the browser print dialog for a paper copy</small>
                </span>
              </button>
            </div>
          </section>
        </div>
      )}

      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) handleDismissHelp();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              First look
            </p>
            <h2 id="help-title" className="mt-1 text-xl font-black">
              Build a venue-ready packet
            </h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
              <li>
                <strong className="text-[var(--foreground)]">1. Place the plot.</strong> Audience is at
                the bottom. Stage left is the band&apos;s left. Mark house gear and channel numbers on
                objects.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">2. Fill the input list.</strong> Every
                source needs a mic or DI, stand type, 48 V, and performer so FOH can patch quickly.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">3. Add mixes and notes.</strong> Wedges,
                IEMs, power, and wireless details keep the advance from bouncing back.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">4. Export and send.</strong> Download the
                PDF packet, then send a frozen snapshot to the venue inbox.
              </li>
            </ol>
            <button type="button" className="button-primary mt-5 w-full" onClick={handleDismissHelp}>
              Start plotting
            </button>
          </section>
        </div>
      )}
    </main>
  );
};
