import tecriderIcons from "@/data/tecrider-icons.json";
import type { EquipmentDefinition } from "@/types/stage";

export const basicEquipmentLibrary: EquipmentDefinition[] = [
  { kind: "vocalist", label: "Performer", category: "People", group: "Basics", color: "#14b8a6", defaultWidth: 2.2, defaultHeight: 2.8 },
  { kind: "guitar", label: "Guitar", category: "Instruments", group: "Basics", color: "#f59e0b", defaultWidth: 1.6, defaultHeight: 3.6 },
  { kind: "bass", label: "Bass", category: "Instruments", group: "Basics", color: "#f97316", defaultWidth: 1.7, defaultHeight: 3.8 },
  { kind: "keyboard", label: "Keyboard", category: "Instruments", group: "Basics", color: "#8b5cf6", defaultWidth: 5.2, defaultHeight: 2.2 },
  { kind: "drums", label: "Drum kit", category: "Instruments", group: "Basics", color: "#ef4444", defaultWidth: 7, defaultHeight: 6 },
  { kind: "percussion", label: "Percussion", category: "Instruments", group: "Basics", color: "#ec4899", defaultWidth: 4, defaultHeight: 3.4 },
  { kind: "chair", label: "Chair", category: "Stage", group: "Basics", color: "#64748b", defaultWidth: 1.8, defaultHeight: 1.8 },
  { kind: "riser", label: "Riser", category: "Stage", group: "Basics", color: "#475569", defaultWidth: 8, defaultHeight: 8 },
  { kind: "wedge", label: "Floor wedge", category: "Audio", group: "Basics", color: "#22c55e", defaultWidth: 1.6, defaultHeight: 1.7 },
  { kind: "iem", label: "IEM position", category: "Audio", group: "Basics", color: "#10b981", defaultWidth: 1.1, defaultHeight: 1.1 },
  { kind: "guitar-amp", label: "Guitar amp", category: "Audio", group: "Basics", color: "#a855f7", defaultWidth: 2.3, defaultHeight: 1.9 },
  { kind: "bass-amp", label: "Bass amp", category: "Audio", group: "Basics", color: "#7c3aed", defaultWidth: 2.8, defaultHeight: 2.2 },
  { kind: "mic-stand", label: "Mic stand", category: "Audio", group: "Basics", color: "#0f766e", defaultWidth: 1.5, defaultHeight: 3.2 },
  { kind: "di-box", label: "DI box", category: "Audio", group: "Basics", color: "#0891b2", defaultWidth: 0.8, defaultHeight: 0.55 },
  { kind: "power", label: "Power drop", category: "Production", group: "Basics", color: "#eab308", defaultWidth: 0.9, defaultHeight: 0.9 },
  { kind: "speaker", label: "Speaker", category: "Audio", group: "Basics", color: "#334155", defaultWidth: 2, defaultHeight: 2.4 },
  { kind: "snake", label: "Stage box", category: "Audio", group: "Basics", color: "#2563eb", defaultWidth: 1.6, defaultHeight: 1.1 },
  { kind: "other", label: "Custom object", category: "Stage", group: "Basics", color: "#78716c", defaultWidth: 2, defaultHeight: 2 },
];

export const equipmentLibrary: EquipmentDefinition[] = [
  ...basicEquipmentLibrary,
  ...(tecriderIcons as EquipmentDefinition[]),
];

export const equipmentGroups = [
  "Basics",
  "Guitar & Bass",
  "Amps",
  "Pedals",
  "Drums & Percussion",
  "Keys",
  "Vocals",
  "PA & DJ",
  "Brass & Orchestra",
  "Stage Equipment",
] as const;

export const equipmentCategories = equipmentGroups;

export const getEquipmentDefinition = (kind: EquipmentDefinition["kind"]) =>
  equipmentLibrary.find((item) => item.kind === kind) ?? basicEquipmentLibrary[basicEquipmentLibrary.length - 1];
