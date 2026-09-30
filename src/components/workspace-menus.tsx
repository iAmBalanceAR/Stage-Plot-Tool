"use client";

import { useState, type ReactNode } from "react";
import { FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteLibraryPlot,
  loadLibraryPlots,
  readLibraryPlot,
  type LibraryPlot,
} from "@/lib/plot-library";
import { useStageStore } from "@/store/stage-store";
import type { StageProject } from "@/types/stage";

interface WorkspaceMenusProps {
  project: StageProject;
}

const Modal = ({
  title,
  eyebrow,
  children,
  onClose,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
    role="presentation"
    onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-dialog-title"
      className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-strong)]">
        {eyebrow}
      </p>
      <div className="mb-4 mt-1 flex items-start justify-between gap-3">
        <h2 id="workspace-dialog-title" className="text-xl font-black">
          {title}
        </h2>
        <button type="button" className="button-secondary" onClick={onClose}>
          Close
        </button>
      </div>
      {children}
    </section>
  </div>
);

export const WorkspaceMenus = ({ project }: WorkspaceMenusProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [plots, setPlots] = useState<LibraryPlot[]>([]);
  const setProject = useStageStore((state) => state.setProject);

  const handleOpenLibrary = () => {
    setPlots(loadLibraryPlots());
    setIsLibraryOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className="button-icon"
        onClick={handleOpenLibrary}
        aria-label="Open saved plots"
        title="Plot library"
      >
        <FolderOpen className="h-4 w-4" />
      </button>

      {isLibraryOpen && (
        <Modal eyebrow="This browser" title="Plot library" onClose={() => setIsLibraryOpen(false)}>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Autosave keeps the current plot in this list. Plots live in this browser only.
          </p>
          <div className="grid gap-2">
            {plots.map((plot) => (
              <div
                key={plot.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setProject(readLibraryPlot(plot));
                    setIsLibraryOpen(false);
                    toast.success("Plot opened");
                  }}
                >
                  <span className="block truncate text-sm font-bold">
                    {plot.actName || plot.name}
                    {plot.id === project.id ? " · current" : ""}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {new Date(plot.updatedAt).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                  aria-label={`Delete ${plot.name}`}
                  onClick={() => {
                    setPlots(deleteLibraryPlot(plot.id));
                    toast.success("Plot removed from your library");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {!plots.length && (
              <p className="empty-state text-sm">No saved plots yet. Start one and it will appear here.</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
