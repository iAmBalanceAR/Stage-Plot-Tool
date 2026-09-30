import { beforeEach, describe, expect, it } from "vitest";
import { createBlankProject } from "@/data/templates";
import {
  deleteLibraryPlot,
  loadLibraryPlots,
  PLOT_LIBRARY_KEY,
  readLibraryPlot,
  upsertLibraryPlot,
} from "@/lib/plot-library";

describe("local plot library", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves, opens, and removes plots in this browser", () => {
    const project = createBlankProject();
    project.name = "Saturday plot";
    project.actName = "Night Signals";

    upsertLibraryPlot(project);
    const plots = loadLibraryPlots();

    expect(plots).toHaveLength(1);
    expect(plots[0].actName).toBe("Night Signals");
    expect(readLibraryPlot(plots[0]).name).toBe("Saturday plot");

    deleteLibraryPlot(project.id);
    expect(loadLibraryPlots()).toHaveLength(0);
  });

  it("migrates plots saved under the old workspace key", () => {
    const project = createBlankProject();
    project.actName = "Legacy Band";
    window.localStorage.setItem(
      "stagecraft-workspace-v1",
      JSON.stringify({
        plots: [
          {
            id: project.id,
            name: project.name,
            actName: project.actName,
            updatedAt: project.updatedAt,
            projectJson: JSON.stringify(project),
          },
        ],
      }),
    );

    const plots = loadLibraryPlots();
    expect(plots).toHaveLength(1);
    expect(plots[0].actName).toBe("Legacy Band");
    expect(window.localStorage.getItem(PLOT_LIBRARY_KEY)).toBeTruthy();
  });
});
