import { parseProjectFile } from "@/lib/project";
import type { StageProject } from "@/types/stage";

export const PLOT_LIBRARY_KEY = "stagecraft-plot-library-v1";
const LEGACY_WORKSPACE_KEY = "stagecraft-workspace-v1";

export interface LibraryPlot {
  id: string;
  name: string;
  actName: string;
  updatedAt: string;
  projectJson: string;
}

const isLibraryPlot = (value: unknown): value is LibraryPlot => {
  if (!value || typeof value !== "object") return false;
  const plot = value as LibraryPlot;
  return (
    typeof plot.id === "string" &&
    typeof plot.name === "string" &&
    typeof plot.actName === "string" &&
    typeof plot.updatedAt === "string" &&
    typeof plot.projectJson === "string"
  );
};

const sortPlots = (plots: LibraryPlot[]) =>
  [...plots].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

const persistPlots = (plots: LibraryPlot[]) => {
  if (typeof window === "undefined") return plots;
  window.localStorage.setItem(PLOT_LIBRARY_KEY, JSON.stringify(plots));
  return plots;
};

const migrateLegacyWorkspace = (): LibraryPlot[] => {
  if (typeof window === "undefined") return [];

  const storedValue = window.localStorage.getItem(LEGACY_WORKSPACE_KEY);
  if (!storedValue) return [];

  try {
    const workspace = JSON.parse(storedValue) as { plots?: unknown[] };
    const plots = Array.isArray(workspace.plots) ? workspace.plots : [];
    return plots.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const plot = entry as Partial<LibraryPlot>;
      if (typeof plot.id !== "string" || typeof plot.projectJson !== "string") return [];
      try {
        parseProjectFile(JSON.parse(plot.projectJson));
      } catch {
        return [];
      }
      return [
        {
          id: plot.id,
          name: plot.name || "Untitled plot",
          actName: plot.actName || "",
          updatedAt: plot.updatedAt || new Date().toISOString(),
          projectJson: plot.projectJson,
        },
      ];
    });
  } catch {
    return [];
  }
};

export const loadLibraryPlots = (): LibraryPlot[] => {
  if (typeof window === "undefined") return [];

  const storedValue = window.localStorage.getItem(PLOT_LIBRARY_KEY);
  if (storedValue) {
    try {
      const parsed = JSON.parse(storedValue) as unknown;
      if (Array.isArray(parsed)) return sortPlots(parsed.filter(isLibraryPlot));
    } catch {
      window.localStorage.removeItem(PLOT_LIBRARY_KEY);
    }
  }

  const migrated = migrateLegacyWorkspace();
  if (!migrated.length) return [];
  return persistPlots(sortPlots(migrated));
};

export const upsertLibraryPlot = (project: StageProject): LibraryPlot[] => {
  const plots = loadLibraryPlots();
  const record: LibraryPlot = {
    id: project.id,
    name: project.name,
    actName: project.actName,
    updatedAt: project.updatedAt,
    projectJson: JSON.stringify(project),
  };
  const nextPlots = plots.some((plot) => plot.id === project.id)
    ? plots.map((plot) => (plot.id === project.id ? record : plot))
    : [...plots, record];
  return persistPlots(sortPlots(nextPlots));
};

export const deleteLibraryPlot = (plotId: string): LibraryPlot[] =>
  persistPlots(loadLibraryPlots().filter((plot) => plot.id !== plotId));

export const readLibraryPlot = (plot: LibraryPlot): StageProject =>
  parseProjectFile(JSON.parse(plot.projectJson));
