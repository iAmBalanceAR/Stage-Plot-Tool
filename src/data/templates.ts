import type {
  EquipmentKind,
  InputChannel,
  MonitorMix,
  ProjectTemplate,
  StageItem,
  StageProject,
} from "@/types/stage";
import { getEquipmentDefinition } from "@/data/equipment";

interface ItemSeed {
  kind: EquipmentKind;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  providedBy?: StageItem["providedBy"];
  channelLabel?: string;
}

interface InputSeed {
  channel: number;
  source: string;
  micDi: string;
  stand?: string;
  phantom?: boolean;
  performer?: string;
  destination?: string;
  notes?: string;
}

const createItem = (id: string, seed: ItemSeed): StageItem => {
  const definition = getEquipmentDefinition(seed.kind);

  return {
    id,
    kind: seed.kind,
    label: seed.label,
    x: seed.x,
    y: seed.y,
    width: seed.width ?? definition.defaultWidth,
    height: seed.height ?? definition.defaultHeight,
    rotation: seed.rotation ?? 0,
    color: definition.color,
    notes: "",
    providedBy: seed.providedBy ?? "band",
    channelLabel: seed.channelLabel ?? "",
  };
};

const createInput = (seed: InputSeed): InputChannel => ({
  id: `input-${seed.channel}`,
  channel: seed.channel,
  source: seed.source,
  micDi: seed.micDi,
  stand: seed.stand ?? "",
  phantom: seed.phantom ?? false,
  performer: seed.performer ?? "",
  destination: seed.destination ?? "FOH",
  notes: seed.notes ?? "",
});

const createMix = (
  id: string,
  name: string,
  owner: string,
  requirements: string,
  type: MonitorMix["type"] = "wedge",
): MonitorMix => ({ id, name, type, owner, requirements });

export const createBlankProject = (): StageProject => {
  const timestamp = new Date().toISOString();

  return {
    version: 2,
    id: crypto.randomUUID(),
    name: "Untitled stage plot",
    actName: "",
    eventName: "",
    venue: "",
    eventDate: "",
    contact: { name: "", role: "", email: "", phone: "" },
    stage: { width: 32, depth: 24, unit: "ft" },
    items: [],
    inputs: [],
    monitorMixes: [],
    notes: {
      general: "",
      power: "",
      backline: "",
      schedule: "",
      wireless: "",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    readyToSubmit: false,
  };
};

const createRockBandProject = (): StageProject => {
  const project = createBlankProject();

  return {
    ...project,
    name: "Full band stage plot",
    actName: "The Night Signals",
    eventName: "Club advance packet",
    contact: {
      name: "Jordan Hale",
      role: "Tour manager",
      email: "advance@nightsignals.example",
      phone: "+1 555 010 4820",
    },
    items: [
      createItem("rock-riser", {
        kind: "riser",
        label: "8′ × 8′ riser",
        x: 38,
        y: 5,
        width: 8,
        height: 8,
        providedBy: "house",
      }),
      createItem("rock-drums", {
        kind: "drums",
        label: "Drums · Alex",
        x: 40,
        y: 8,
        channelLabel: "1–8",
      }),
      createItem("rock-bass", { kind: "bass", label: "Bass · Morgan", x: 16, y: 38, channelLabel: "9" }),
      createItem("rock-guitar", { kind: "guitar", label: "Guitar · Riley", x: 66, y: 38 }),
      createItem("rock-vocal", {
        kind: "vocalist",
        label: "Lead vocal · Jordan",
        x: 45,
        y: 58,
        channelLabel: "11",
      }),
      createItem("rock-bass-amp", { kind: "bass-amp", label: "Bass amp", x: 8, y: 12 }),
      createItem("rock-guitar-amp", {
        kind: "guitar-amp",
        label: "Guitar amp",
        x: 78,
        y: 12,
        channelLabel: "10",
      }),
      createItem("rock-wedge-1", { kind: "wedge", label: "Mix 1", x: 44, y: 82 }),
      createItem("rock-wedge-2", { kind: "wedge", label: "Mix 2", x: 14, y: 68 }),
      createItem("rock-wedge-3", { kind: "wedge", label: "Mix 3", x: 72, y: 68 }),
      createItem("rock-power-1", { kind: "power", label: "Power", x: 8, y: 52 }),
      createItem("rock-power-2", { kind: "power", label: "Power", x: 84, y: 52 }),
      createItem("rock-snake", { kind: "snake", label: "Stage box", x: 46, y: 44 }),
    ],
    inputs: [
      createInput({
        channel: 1,
        source: "Kick",
        micDi: "Beta 52A / equivalent",
        stand: "Short boom",
        performer: "Alex",
      }),
      createInput({
        channel: 2,
        source: "Snare top",
        micDi: "SM57 / equivalent",
        stand: "Short boom",
        performer: "Alex",
      }),
      createInput({
        channel: 3,
        source: "Snare bottom",
        micDi: "SM57 / equivalent",
        stand: "Clip",
        performer: "Alex",
        notes: "Optional if channel count is tight",
      }),
      createInput({
        channel: 4,
        source: "Hi-hat",
        micDi: "Small diaphragm condenser",
        stand: "Boom",
        phantom: true,
        performer: "Alex",
      }),
      createInput({
        channel: 5,
        source: "Rack tom",
        micDi: "Clip-on dynamic",
        stand: "Clip",
        performer: "Alex",
      }),
      createInput({
        channel: 6,
        source: "Floor tom",
        micDi: "Clip-on dynamic",
        stand: "Clip",
        performer: "Alex",
      }),
      createInput({
        channel: 7,
        source: "Overhead L",
        micDi: "Small diaphragm condenser",
        stand: "Tall boom",
        phantom: true,
        performer: "Alex",
      }),
      createInput({
        channel: 8,
        source: "Overhead R",
        micDi: "Small diaphragm condenser",
        stand: "Tall boom",
        phantom: true,
        performer: "Alex",
      }),
      createInput({
        channel: 9,
        source: "Bass DI",
        micDi: "Active DI",
        stand: "None",
        performer: "Morgan",
        notes: "Post-pedalboard",
      }),
      createInput({
        channel: 10,
        source: "Guitar amp",
        micDi: "SM57 / equivalent",
        stand: "Short boom",
        performer: "Riley",
        notes: "On-axis at the grill",
      }),
      createInput({
        channel: 11,
        source: "Lead vocal",
        micDi: "Beta 58A / equivalent",
        stand: "Boom",
        performer: "Jordan",
      }),
    ],
    monitorMixes: [
      createMix("mix-1", "Mix 1", "Jordan", "Lead vocal, guitar, kick"),
      createMix("mix-2", "Mix 2", "Morgan", "Bass, lead vocal, kick"),
      createMix("mix-3", "Mix 3", "Riley", "Guitar, lead vocal, snare"),
      createMix("mix-4", "Mix 4", "Alex", "Bass, guitar, lead vocal", "iem"),
    ],
    notes: {
      ...project.notes,
      power: "Two grounded 120 V / 15 A drops downstage left and right. Audio power only.",
      backline: "Drum riser preferred at 8′ × 8′ × 16″. Please confirm house drum shell availability.",
      general:
        "Audience is at the bottom of the plot. Stage left is the band's left when facing the audience. Mic and stand substitutions are welcome.",
      schedule: "Soundcheck 45 minutes. Set length 50 minutes.",
      wireless: "No wireless systems. All vocals and instruments are hardwired.",
    },
  };
};

const createAcousticProject = (): StageProject => {
  const project = createBlankProject();

  return {
    ...project,
    name: "Acoustic duo",
    actName: "Acoustic Duo",
    contact: {
      name: "Sam Ortiz",
      role: "Band contact",
      email: "advance@acousticduo.example",
      phone: "+1 555 010 1934",
    },
    stage: { width: 20, depth: 14, unit: "ft" },
    items: [
      createItem("duo-vocal-1", {
        kind: "vocalist",
        label: "Vocal · 1",
        x: 26,
        y: 38,
        channelLabel: "1",
      }),
      createItem("duo-guitar", {
        kind: "guitar",
        label: "Acoustic guitar",
        x: 20,
        y: 44,
        channelLabel: "2",
      }),
      createItem("duo-vocal-2", {
        kind: "vocalist",
        label: "Vocal · 2",
        x: 64,
        y: 38,
        channelLabel: "3",
      }),
      createItem("duo-keyboard", {
        kind: "keyboard",
        label: "Keys",
        x: 58,
        y: 52,
        channelLabel: "4–5",
      }),
      createItem("duo-wedge-1", { kind: "wedge", label: "Mix 1", x: 24, y: 76 }),
      createItem("duo-wedge-2", { kind: "wedge", label: "Mix 2", x: 64, y: 76 }),
      createItem("duo-power", { kind: "power", label: "Power", x: 78, y: 58 }),
    ],
    inputs: [
      createInput({
        channel: 1,
        source: "Vocal 1",
        micDi: "SM58 / equivalent",
        stand: "Boom",
        performer: "Performer 1",
      }),
      createInput({
        channel: 2,
        source: "Acoustic guitar",
        micDi: "Active DI",
        stand: "None",
        performer: "Performer 1",
        notes: "Post-preamp / pickup blend",
      }),
      createInput({
        channel: 3,
        source: "Vocal 2",
        micDi: "SM58 / equivalent",
        stand: "Boom",
        performer: "Performer 2",
      }),
      createInput({
        channel: 4,
        source: "Keyboard L",
        micDi: "DI",
        stand: "None",
        performer: "Performer 2",
      }),
      createInput({
        channel: 5,
        source: "Keyboard R",
        micDi: "DI",
        stand: "None",
        performer: "Performer 2",
      }),
    ],
    monitorMixes: [
      createMix("duo-mix-1", "Mix 1", "Performer 1", "Vocal 1, guitar, vocal 2"),
      createMix("duo-mix-2", "Mix 2", "Performer 2", "Vocal 2, keys, vocal 1"),
    ],
    notes: {
      ...project.notes,
      power: "One grounded power drop at keyboard position.",
      wireless: "No wireless. Both vocals are hardwired.",
      general: "Audience is at the bottom of the plot. Compact two-person setup.",
    },
  };
};

const createTrioProject = (): StageProject => {
  const project = createBlankProject();

  return {
    ...project,
    name: "Power trio",
    actName: "Power trio",
    contact: {
      name: "Chris Vale",
      role: "Band tech",
      email: "advance@powertrio.example",
      phone: "+1 555 010 7741",
    },
    stage: { width: 24, depth: 16, unit: "ft" },
    items: [
      createItem("trio-drums", { kind: "drums", label: "Drums", x: 40, y: 8, channelLabel: "1–3" }),
      createItem("trio-bass", { kind: "bass", label: "Bass / vocal", x: 16, y: 42, channelLabel: "4" }),
      createItem("trio-guitar", { kind: "guitar", label: "Guitar / vocal", x: 66, y: 42 }),
      createItem("trio-bass-amp", { kind: "bass-amp", label: "Bass amp", x: 8, y: 12 }),
      createItem("trio-guitar-amp", {
        kind: "guitar-amp",
        label: "Guitar amp",
        x: 78,
        y: 12,
        channelLabel: "5",
      }),
      createItem("trio-mic-1", {
        kind: "mic-stand",
        label: "Vocal · bass",
        x: 20,
        y: 58,
        channelLabel: "6",
      }),
      createItem("trio-mic-2", {
        kind: "mic-stand",
        label: "Vocal · guitar",
        x: 70,
        y: 58,
        channelLabel: "7",
      }),
      createItem("trio-wedge-1", { kind: "wedge", label: "Mix 1", x: 18, y: 78 }),
      createItem("trio-wedge-2", { kind: "wedge", label: "Mix 2", x: 44, y: 82 }),
      createItem("trio-wedge-3", { kind: "wedge", label: "Mix 3", x: 70, y: 78 }),
      createItem("trio-power-1", { kind: "power", label: "Power", x: 8, y: 52 }),
      createItem("trio-power-2", { kind: "power", label: "Power", x: 84, y: 52 }),
    ],
    inputs: [
      createInput({
        channel: 1,
        source: "Kick",
        micDi: "Dynamic kick mic",
        stand: "Short boom",
        performer: "Drums",
      }),
      createInput({
        channel: 2,
        source: "Snare",
        micDi: "SM57 / equivalent",
        stand: "Short boom",
        performer: "Drums",
      }),
      createInput({
        channel: 3,
        source: "Overhead",
        micDi: "Condenser",
        stand: "Boom",
        phantom: true,
        performer: "Drums",
        notes: "Single overhead is acceptable",
      }),
      createInput({
        channel: 4,
        source: "Bass DI",
        micDi: "Active DI",
        stand: "None",
        performer: "Bass",
        notes: "Post-pedalboard",
      }),
      createInput({
        channel: 5,
        source: "Guitar amp",
        micDi: "SM57 / equivalent",
        stand: "Short boom",
        performer: "Guitar",
      }),
      createInput({
        channel: 6,
        source: "Bass vocal",
        micDi: "SM58 / equivalent",
        stand: "Boom",
        performer: "Bass",
      }),
      createInput({
        channel: 7,
        source: "Guitar vocal",
        micDi: "SM58 / equivalent",
        stand: "Boom",
        performer: "Guitar",
      }),
    ],
    monitorMixes: [
      createMix("trio-mix-1", "Mix 1", "Bass", "Bass vocal, kick, guitar"),
      createMix("trio-mix-2", "Mix 2", "Drums", "Both vocals, guitar, bass"),
      createMix("trio-mix-3", "Mix 3", "Guitar", "Guitar vocal, snare, bass"),
    ],
    notes: {
      ...project.notes,
      power: "One grounded drop at each amp.",
      backline: "Band carries drums, bass amp, and guitar amp unless noted otherwise.",
      general: "Audience is at the bottom of the plot. Compact three-piece setup.",
      wireless: "No wireless. Both vocals are hardwired.",
    },
  };
};

export const projectTemplates: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Blank canvas",
    description: "Start with an empty 32′ × 24′ stage.",
    project: createBlankProject(),
  },
  {
    id: "rock-band",
    name: "Full band",
    description: "Drums, backline, four monitor mixes, and an 11-channel input list.",
    project: createRockBandProject(),
  },
  {
    id: "acoustic-duo",
    name: "Acoustic duo",
    description: "Two performers with guitar, keys, vocals, and a five-channel patch list.",
    project: createAcousticProject(),
  },
  {
    id: "power-trio",
    name: "Power trio",
    description: "Drums, bass, guitar, two vocals, three wedges, and a seven-channel input list.",
    project: createTrioProject(),
  },
];

export const cloneTemplateProject = (template: ProjectTemplate): StageProject => {
  const timestamp = new Date().toISOString();
  const clonedProject = structuredClone(template.project);

  return {
    ...clonedProject,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    items: clonedProject.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    inputs: clonedProject.inputs.map((input) => ({ ...input, id: crypto.randomUUID() })),
    monitorMixes: clonedProject.monitorMixes.map((mix) => ({ ...mix, id: crypto.randomUUID() })),
  };
};
