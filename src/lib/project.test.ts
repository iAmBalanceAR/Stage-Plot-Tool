import { describe, expect, it } from "vitest";
import { cloneTemplateProject, createBlankProject, projectTemplates } from "@/data/templates";
import {
  formatInputListCsv,
  formatInputListTsv,
  getProjectChecks,
  getReadinessScore,
  getSafeFileName,
  parseProjectFile,
} from "@/lib/project";

const legacyProject = {
  version: 1,
  id: "legacy-plot",
  name: "Legacy plot",
  actName: "Night Shift",
  eventName: "",
  venue: "",
  eventDate: "",
  contact: { name: "Alex", email: "alex@example.com", phone: "" },
  stage: { width: 32, depth: 24, unit: "ft" },
  items: [
    {
      id: "legacy-drums",
      kind: "drums",
      label: "Drums",
      x: 40,
      y: 10,
      width: 20,
      height: 22,
      rotation: 0,
      color: "#ef4444",
      notes: "",
    },
  ],
  inputs: [
    {
      id: "legacy-kick",
      channel: 1,
      source: "Kick",
      micDi: "Beta 52",
      stand: "",
      phantom: false,
      performer: "",
      destination: "FOH",
      notes: "",
    },
  ],
  monitorMixes: [],
  notes: { general: "", power: "", backline: "", schedule: "" },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("StageCraft project utilities", () => {
  it("creates a valid blank project", () => {
    const project = createBlankProject();

    expect(parseProjectFile(project)).toEqual(project);
    expect(project.version).toBe(2);
    expect(project.stage).toEqual({ width: 32, depth: 24, unit: "ft" });
    expect(project.items).toEqual([]);
    expect(project.contact.role).toBe("");
    expect(project.notes.wireless).toBe("");
  });

  it("rejects malformed imported projects", () => {
    expect(() => parseProjectFile({ version: 1, name: "Broken" })).toThrow(
      "Invalid StageCraft project",
    );
  });

  it("fills new fields when parsing older project files", () => {
    const project = parseProjectFile(legacyProject);

    expect(project.contact.role).toBe("");
    expect(project.notes.wireless).toBe("");
    expect(project.readyToSubmit).toBe(false);
    expect(project.items[0].providedBy).toBe("band");
    expect(project.items[0].channelLabel).toBe("");
    expect(project.version).toBe(2);
    expect(project.items[0].width).toBe(6.4);
  });

  it("clones templates with fresh identifiers and complete input lists", () => {
    const bandTemplate = projectTemplates.find((template) => template.id === "rock-band");
    expect(bandTemplate).toBeDefined();

    const firstClone = cloneTemplateProject(bandTemplate!);
    const secondClone = cloneTemplateProject(bandTemplate!);

    expect(firstClone.id).not.toBe(secondClone.id);
    expect(firstClone.items[0].id).not.toBe(secondClone.items[0].id);
    expect(firstClone.inputs).toHaveLength(11);
    expect(firstClone.inputs.every((input) => input.micDi.length > 0)).toBe(true);
    expect(firstClone.inputs.filter((input) => input.phantom)).toHaveLength(3);
    expect(firstClone.items.some((item) => item.channelLabel === "1–8")).toBe(true);
    expect(firstClone.items.find((item) => item.kind === "drums")?.width).toBe(7);
    expect(firstClone.items.find((item) => item.kind === "wedge")?.width).toBe(1.6);
  });

  it("includes a power-trio template with a compact patch list", () => {
    const trioTemplate = projectTemplates.find((template) => template.id === "power-trio");
    expect(trioTemplate).toBeDefined();

    const project = cloneTemplateProject(trioTemplate!);
    expect(project.inputs).toHaveLength(7);
    expect(project.monitorMixes).toHaveLength(3);
    expect(project.inputs.some((input) => input.source === "Bass vocal")).toBe(true);
  });

  it("flags missing advance details and calculates readiness", () => {
    const project = createBlankProject();
    const checks = getProjectChecks(project);

    expect(checks.some((check) => check.id === "inputs" && check.severity === "warning")).toBe(
      true,
    );
    expect(getReadinessScore(project)).toBe(0);
  });

  it("flags duplicate input channels", () => {
    const bandTemplate = projectTemplates.find((template) => template.id === "rock-band")!;
    const project = cloneTemplateProject(bandTemplate);
    project.inputs[1].channel = project.inputs[0].channel;

    const inputCheck = getProjectChecks(project).find((check) => check.id === "inputs");
    expect(inputCheck?.label).toBe("Resolve duplicate input channels");
  });

  it("creates safe export file names", () => {
    const project = createBlankProject();
    project.actName = "The Night Signals!";

    expect(getSafeFileName(project, "pdf")).toBe("the-night-signals.pdf");
  });

  it("formats input list data for spreadsheet export", () => {
    const bandTemplate = projectTemplates.find((template) => template.id === "rock-band")!;
    const project = cloneTemplateProject(bandTemplate);
    const tsv = formatInputListTsv(project);
    const csv = formatInputListCsv(project);

    expect(tsv.split("\n")[0]).toBe("Ch\tSource\tMic/DI\tStand\t48V\tPerformer\tDest\tNotes");
    expect(tsv).toContain("Kick");
    expect(tsv).toContain("Beta 52A / equivalent");
    expect(csv).toContain("\"Hi-hat\"");
    expect(csv.split("\n")).toHaveLength(12);
  });
});
