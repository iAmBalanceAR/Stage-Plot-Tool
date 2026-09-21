"use client";

import { create } from "zustand";
import { getEquipmentDefinition } from "@/data/equipment";
import { createBlankProject } from "@/data/templates";
import { clampItemOnStage, feetToStageUnit } from "@/lib/geometry";
import { loadStoredProject } from "@/lib/project";
import type {
  EquipmentKind,
  InputChannel,
  MonitorMix,
  StageItem,
  StageProject,
} from "@/types/stage";

interface StageStore {
  project: StageProject;
  selectedItemId: string | null;
  isHydrated: boolean;
  past: StageProject[];
  future: StageProject[];
  transactionStart: StageProject | null;
  hydrate: () => void;
  setProject: (project: StageProject) => void;
  updateProject: (updater: (project: StageProject) => StageProject) => void;
  selectItem: (itemId: string | null) => void;
  addItem: (kind: EquipmentKind, position?: { x: number; y: number }) => void;
  updateItem: (itemId: string, patch: Partial<StageItem>, shouldRecord?: boolean) => void;
  duplicateItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  beginTransaction: () => void;
  commitTransaction: () => void;
  addInput: () => void;
  updateInput: (inputId: string, patch: Partial<InputChannel>) => void;
  removeInput: (inputId: string) => void;
  addMonitorMix: () => void;
  updateMonitorMix: (mixId: string, patch: Partial<MonitorMix>) => void;
  removeMonitorMix: (mixId: string) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY_LENGTH = 50;

const cloneProject = (project: StageProject) => structuredClone(project);

const withUpdatedTimestamp = (project: StageProject): StageProject => ({
  ...project,
  updatedAt: new Date().toISOString(),
});

export const useStageStore = create<StageStore>((set, get) => {
  const commitProject = (
    updater: (project: StageProject) => StageProject,
    shouldRecord = true,
  ) => {
    set((state) => {
      const nextProject = withUpdatedTimestamp(updater(cloneProject(state.project)));
      if (!shouldRecord) return { project: nextProject };

      return {
        project: nextProject,
        past: [...state.past, cloneProject(state.project)].slice(-MAX_HISTORY_LENGTH),
        future: [],
      };
    });
  };

  return {
    project: createBlankProject(),
    selectedItemId: null,
    isHydrated: false,
    past: [],
    future: [],
    transactionStart: null,
    hydrate: () => {
      const storedProject = loadStoredProject();
      set({
        project: storedProject ?? createBlankProject(),
        isHydrated: true,
        past: [],
        future: [],
      });
    },
    setProject: (project) =>
      set((state) => ({
        project: withUpdatedTimestamp(cloneProject(project)),
        selectedItemId: null,
        past: [...state.past, cloneProject(state.project)].slice(-MAX_HISTORY_LENGTH),
        future: [],
      })),
    updateProject: (updater) => commitProject(updater),
    selectItem: (selectedItemId) => set({ selectedItemId }),
    addItem: (kind, position) => {
      const definition = getEquipmentDefinition(kind);
      const stage = get().project.stage;
      const width = feetToStageUnit(definition.defaultWidth, stage.unit);
      const height = feetToStageUnit(definition.defaultHeight, stage.unit);
      const placed = clampItemOnStage(
        {
          x: position?.x ?? 46,
          y: position?.y ?? 44,
          width,
          height,
        },
        stage,
      );
      const item: StageItem = {
        id: crypto.randomUUID(),
        kind,
        label: definition.label,
        x: placed.x,
        y: placed.y,
        width: placed.width,
        height: placed.height,
        rotation: 0,
        color: definition.color,
        notes: "",
        providedBy: "band",
        channelLabel: "",
      };
      commitProject((project) => ({ ...project, items: [...project.items, item] }));
      set({ selectedItemId: item.id });
    },
    updateItem: (itemId, patch, shouldRecord = true) =>
      commitProject(
        (project) => ({
          ...project,
          items: project.items.map((item) => {
            if (item.id !== itemId) return item;
            const nextItem = { ...item, ...patch };
            return { ...nextItem, ...clampItemOnStage(nextItem, project.stage) };
          }),
        }),
        shouldRecord,
      ),
    duplicateItem: (itemId) => {
      const sourceItem = get().project.items.find((item) => item.id === itemId);
      if (!sourceItem) return;

      const placed = clampItemOnStage(
        {
          ...sourceItem,
          x: sourceItem.x + 3,
          y: sourceItem.y + 3,
        },
        get().project.stage,
      );
      const duplicatedItem = {
        ...sourceItem,
        ...placed,
        id: crypto.randomUUID(),
        label: `${sourceItem.label} copy`,
      };
      commitProject((project) => ({
        ...project,
        items: [...project.items, duplicatedItem],
      }));
      set({ selectedItemId: duplicatedItem.id });
    },
    removeItem: (itemId) => {
      commitProject((project) => ({
        ...project,
        items: project.items.filter((item) => item.id !== itemId),
      }));
      set((state) => ({
        selectedItemId: state.selectedItemId === itemId ? null : state.selectedItemId,
      }));
    },
    beginTransaction: () => {
      if (get().transactionStart) return;
      set({ transactionStart: cloneProject(get().project) });
    },
    commitTransaction: () => {
      const transactionStart = get().transactionStart;
      if (!transactionStart) return;
      set((state) => ({
        project: withUpdatedTimestamp(state.project),
        past: [...state.past, transactionStart].slice(-MAX_HISTORY_LENGTH),
        future: [],
        transactionStart: null,
      }));
    },
    addInput: () => {
      const channels = get().project.inputs.map((input) => input.channel);
      const nextChannel = channels.length ? Math.max(...channels) + 1 : 1;
      const input: InputChannel = {
        id: crypto.randomUUID(),
        channel: nextChannel,
        source: `Input ${nextChannel}`,
        micDi: "",
        stand: "",
        phantom: false,
        performer: "",
        destination: "FOH",
        notes: "",
      };
      commitProject((project) => ({ ...project, inputs: [...project.inputs, input] }));
    },
    updateInput: (inputId, patch) =>
      commitProject((project) => ({
        ...project,
        inputs: project.inputs.map((input) =>
          input.id === inputId ? { ...input, ...patch } : input,
        ),
      })),
    removeInput: (inputId) =>
      commitProject((project) => ({
        ...project,
        inputs: project.inputs.filter((input) => input.id !== inputId),
      })),
    addMonitorMix: () => {
      const mixNumber = get().project.monitorMixes.length + 1;
      const mix: MonitorMix = {
        id: crypto.randomUUID(),
        name: `Mix ${mixNumber}`,
        type: "wedge",
        owner: "",
        requirements: "",
      };
      commitProject((project) => ({
        ...project,
        monitorMixes: [...project.monitorMixes, mix],
      }));
    },
    updateMonitorMix: (mixId, patch) =>
      commitProject((project) => ({
        ...project,
        monitorMixes: project.monitorMixes.map((mix) =>
          mix.id === mixId ? { ...mix, ...patch } : mix,
        ),
      })),
    removeMonitorMix: (mixId) =>
      commitProject((project) => ({
        ...project,
        monitorMixes: project.monitorMixes.filter((mix) => mix.id !== mixId),
      })),
    undo: () => {
      const { past, project } = get();
      const previousProject = past.at(-1);
      if (!previousProject) return;
      set({
        project: cloneProject(previousProject),
        past: past.slice(0, -1),
        future: [cloneProject(project), ...get().future].slice(0, MAX_HISTORY_LENGTH),
        selectedItemId: null,
        transactionStart: null,
      });
    },
    redo: () => {
      const { future, project } = get();
      const nextProject = future[0];
      if (!nextProject) return;
      set({
        project: cloneProject(nextProject),
        past: [...get().past, cloneProject(project)].slice(-MAX_HISTORY_LENGTH),
        future: future.slice(1),
        selectedItemId: null,
        transactionStart: null,
      });
    },
  };
});
