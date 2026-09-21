import { z } from "zod";

export const equipmentKinds = [
  "vocalist",
  "guitar",
  "bass",
  "keyboard",
  "drums",
  "percussion",
  "chair",
  "riser",
  "wedge",
  "iem",
  "guitar-amp",
  "bass-amp",
  "mic-stand",
  "di-box",
  "power",
  "speaker",
  "snake",
  "other",
] as const;

export const equipmentKindSchema = z.enum(equipmentKinds);
export type EquipmentKind = z.infer<typeof equipmentKindSchema>;

export const stageItemSchema = z.object({
  id: z.string().min(1),
  kind: equipmentKindSchema,
  label: z.string().min(1).max(80),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0.4).max(80),
  height: z.number().min(0.4).max(80),
  rotation: z.number().min(-180).max(180),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  notes: z.string().max(500),
  providedBy: z.enum(["band", "house"]).default("band"),
  channelLabel: z.string().max(20).default(""),
});

export type StageItem = z.infer<typeof stageItemSchema>;

export const inputChannelSchema = z.object({
  id: z.string().min(1),
  channel: z.number().int().positive(),
  source: z.string().min(1).max(80),
  micDi: z.string().max(80),
  stand: z.string().max(80),
  phantom: z.boolean(),
  performer: z.string().max(80),
  destination: z.string().max(80),
  notes: z.string().max(300),
});

export type InputChannel = z.infer<typeof inputChannelSchema>;

export const monitorMixSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  type: z.enum(["wedge", "iem", "sidefill", "other"]),
  owner: z.string().max(80),
  requirements: z.string().max(500),
});

export type MonitorMix = z.infer<typeof monitorMixSchema>;

export const stageProjectSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  actName: z.string().max(100),
  eventName: z.string().max(100),
  venue: z.string().max(100),
  eventDate: z.string(),
  contact: z.object({
    name: z.string().max(100),
    role: z.string().max(80).default(""),
    email: z.string().max(150),
    phone: z.string().max(40),
  }),
  stage: z.object({
    width: z.number().min(4).max(500),
    depth: z.number().min(4).max(500),
    unit: z.enum(["ft", "m"]),
  }),
  items: z.array(stageItemSchema).max(250),
  inputs: z.array(inputChannelSchema).max(256),
  monitorMixes: z.array(monitorMixSchema).max(64),
  notes: z.object({
    general: z.string().max(4000),
    power: z.string().max(2000),
    backline: z.string().max(2000),
    schedule: z.string().max(2000),
    wireless: z.string().max(2000).default(""),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  readyToSubmit: z.boolean().default(false),
});

export type StageProject = z.infer<typeof stageProjectSchema>;

export interface ProjectCheck {
  id: string;
  severity: "ready" | "warning";
  label: string;
  detail: string;
}

export interface EquipmentDefinition {
  kind: EquipmentKind;
  label: string;
  category: "People" | "Instruments" | "Audio" | "Stage" | "Production";
  color: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  project: StageProject;
}
