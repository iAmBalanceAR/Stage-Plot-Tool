import { stageProjectSchema, type ProjectCheck, type StageProject } from "@/types/stage";

export const STORAGE_KEY = "stagecraft-project-v1";

const migrateProject = (project: StageProject): StageProject => {
  if (project.version === 2) return project;

  return {
    ...project,
    version: 2,
    items: project.items.map((item) => ({
      ...item,
      width: Math.round((item.width / 100) * project.stage.width * 10) / 10,
      height: Math.round((item.height / 100) * project.stage.depth * 10) / 10,
    })),
  };
};

export const parseProjectFile = (value: unknown): StageProject => {
  const result = stageProjectSchema.safeParse(value);

  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`Invalid StageCraft project: ${issue.path.join(".")} ${issue.message}`);
  }

  return migrateProject(result.data);
};

export const loadStoredProject = (): StageProject | null => {
  if (typeof window === "undefined") return null;

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) return null;

  try {
    return parseProjectFile(JSON.parse(storedValue));
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveStoredProject = (project: StageProject) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
};

export const getProjectChecks = (project: StageProject): ProjectCheck[] => {
  const checks: ProjectCheck[] = [];
  const channelNumbers = project.inputs.map((input) => input.channel);
  const hasDuplicateChannels = new Set(channelNumbers).size !== channelNumbers.length;

  checks.push({
    id: "identity",
    severity: project.actName.trim() ? "ready" : "warning",
    label: project.actName.trim() ? "Band identified" : "Add a band or act name",
    detail: project.actName.trim()
      ? project.actName
      : "The receiving production team needs to know whose plot this is.",
  });
  checks.push({
    id: "contact",
    severity: project.contact.email.trim() || project.contact.phone.trim() ? "ready" : "warning",
    label:
      project.contact.email.trim() || project.contact.phone.trim()
        ? "Production contact included"
        : "Add a production contact",
    detail:
      project.contact.email.trim() || project.contact.phone.trim()
        ? [project.contact.email, project.contact.phone].filter(Boolean).join(" · ")
        : "Include an email or phone number for advance questions.",
  });
  checks.push({
    id: "stage",
    severity: project.items.length ? "ready" : "warning",
    label: project.items.length ? `${project.items.length} stage objects placed` : "Stage is empty",
    detail: project.items.length
      ? `${project.stage.width} × ${project.stage.depth} ${project.stage.unit}`
      : "Place performers, instruments, audio, or production objects.",
  });
  checks.push({
    id: "inputs",
    severity: project.inputs.length && !hasDuplicateChannels ? "ready" : "warning",
    label: hasDuplicateChannels
      ? "Resolve duplicate input channels"
      : project.inputs.length
        ? `${project.inputs.length} inputs documented`
        : "Add an input list",
    detail: hasDuplicateChannels
      ? "Every patch-list row must use a unique channel number."
      : project.inputs.length
        ? "Channel numbering is unique."
        : "Even a short source list helps the venue prepare.",
  });
  checks.push({
    id: "monitors",
    severity: project.monitorMixes.length ? "ready" : "warning",
    label: project.monitorMixes.length
      ? `${project.monitorMixes.length} monitor mixes specified`
      : "Document monitoring",
    detail: project.monitorMixes.length
      ? "Each mix has an owner and requirement field."
      : "Add wedge, IEM, sidefill, or other foldback requirements.",
  });
  checks.push({
    id: "power",
    severity: project.notes.power.trim() ? "ready" : "warning",
    label: project.notes.power.trim() ? "Power requirements included" : "Add power requirements",
    detail: project.notes.power.trim()
      ? project.notes.power
      : "State quantity, location, voltage, and circuit expectations where relevant.",
  });
  checks.push({
    id: "readyToSubmit",
    severity: project.readyToSubmit ? "ready" : "warning",
    label: project.readyToSubmit ? "Band marked this packet complete" : "Confirm you are ready to submit",
    detail: project.readyToSubmit
      ? "This plot is marked complete for the venue."
      : "Check “Are you ready to submit?” when the plot, input list, and notes are finished.",
  });

  return checks;
};

export const getReadinessScore = (project: StageProject) => {
  const checks = getProjectChecks(project);
  const readyCount = checks.filter((check) => check.severity === "ready").length;
  return Math.round((readyCount / checks.length) * 100);
};

export const getSafeFileName = (project: StageProject, extension: string) => {
  const baseName = (project.actName || project.name || "stage-plot")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${baseName || "stage-plot"}.${extension}`;
};

export const getInputListTable = (project: StageProject) => {
  const headers = ["Ch", "Source", "Mic/DI", "Stand", "48V", "Performer", "Dest", "Notes"];
  const rows = [...project.inputs]
    .sort((a, b) => a.channel - b.channel)
    .map((input) => [
      String(input.channel),
      input.source,
      input.micDi,
      input.stand,
      input.phantom ? "Yes" : "No",
      input.performer,
      input.destination,
      input.notes,
    ]);

  return { headers, rows };
};

export const formatInputListTsv = (project: StageProject) => {
  const { headers, rows } = getInputListTable(project);
  return [headers, ...rows].map((row) => row.join("\t")).join("\n");
};

export const formatInputListCsv = (project: StageProject) => {
  const { headers, rows } = getInputListTable(project);
  const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
};

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadProjectFile = (project: StageProject) => {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, getSafeFileName(project, "stagecraft.json"));
};

export const downloadInputListCsv = (project: StageProject) => {
  const blob = new Blob([formatInputListCsv(project)], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, getSafeFileName(project, "input-list.csv"));
};
