import type { EquipmentDefinition } from "@/types/stage";

export const equipmentLibrary: EquipmentDefinition[] = [
  { kind: "vocalist", label: "Performer", category: "People", color: "#14b8a6", defaultWidth: 2.2, defaultHeight: 2.8 },
  { kind: "guitar", label: "Guitar", category: "Instruments", color: "#f59e0b", defaultWidth: 1.6, defaultHeight: 3.6 },
  { kind: "bass", label: "Bass", category: "Instruments", color: "#f97316", defaultWidth: 1.7, defaultHeight: 3.8 },
  { kind: "keyboard", label: "Keyboard", category: "Instruments", color: "#8b5cf6", defaultWidth: 5.2, defaultHeight: 2.2 },
  { kind: "drums", label: "Drum kit", category: "Instruments", color: "#ef4444", defaultWidth: 7, defaultHeight: 6 },
  { kind: "percussion", label: "Percussion", category: "Instruments", color: "#ec4899", defaultWidth: 4, defaultHeight: 3.4 },
  { kind: "chair", label: "Chair", category: "Stage", color: "#64748b", defaultWidth: 1.8, defaultHeight: 1.8 },
  { kind: "riser", label: "Riser", category: "Stage", color: "#475569", defaultWidth: 8, defaultHeight: 8 },
  { kind: "wedge", label: "Floor wedge", category: "Audio", color: "#22c55e", defaultWidth: 1.6, defaultHeight: 1.7 },
  { kind: "iem", label: "IEM position", category: "Audio", color: "#10b981", defaultWidth: 1.1, defaultHeight: 1.1 },
  { kind: "guitar-amp", label: "Guitar amp", category: "Audio", color: "#a855f7", defaultWidth: 2.3, defaultHeight: 1.9 },
  { kind: "bass-amp", label: "Bass amp", category: "Audio", color: "#7c3aed", defaultWidth: 2.8, defaultHeight: 2.2 },
  { kind: "mic-stand", label: "Mic stand", category: "Audio", color: "#0f766e", defaultWidth: 1.5, defaultHeight: 3.2 },
  { kind: "di-box", label: "DI box", category: "Audio", color: "#0891b2", defaultWidth: 0.8, defaultHeight: 0.55 },
  { kind: "power", label: "Power drop", category: "Production", color: "#eab308", defaultWidth: 0.9, defaultHeight: 0.9 },
  { kind: "speaker", label: "Speaker", category: "Audio", color: "#334155", defaultWidth: 2, defaultHeight: 2.4 },
  { kind: "snake", label: "Stage box", category: "Audio", color: "#2563eb", defaultWidth: 1.6, defaultHeight: 1.1 },
  { kind: "other", label: "Custom object", category: "Stage", color: "#78716c", defaultWidth: 2, defaultHeight: 2 },
];

export const equipmentCategories = [
  "People",
  "Instruments",
  "Audio",
  "Stage",
  "Production",
] as const;

export const getEquipmentDefinition = (kind: EquipmentDefinition["kind"]) =>
  equipmentLibrary.find((item) => item.kind === kind) ?? equipmentLibrary[equipmentLibrary.length - 1];
