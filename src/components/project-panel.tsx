"use client";

import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  CircleAlert,
  ClipboardList,
  Copy,
  FileText,
  Headphones,
  Plus,
  Settings2,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { ItemIcon } from "@/components/item-icon";
import { convertLength, MIN_ITEM_SIZE } from "@/lib/geometry";
import { formatInputListTsv, getProjectChecks, getReadinessScore } from "@/lib/project";
import { useStageStore } from "@/store/stage-store";
import type { StageProject } from "@/types/stage";

type PanelTab = "details" | "inputs" | "monitors" | "notes" | "check";

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

const Field = ({ label, children, className = "" }: FieldProps) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
      {label}
    </span>
    {children}
  </label>
);

const ProjectDetails = () => {
  const project = useStageStore((state) => state.project);
  const updateProject = useStageStore((state) => state.updateProject);

  const updateRootField = <Key extends keyof StageProject>(
    key: Key,
    value: StageProject[Key],
  ) => updateProject((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-5 p-4">
      <section>
        <h3 className="section-heading">Project identity</h3>
        <div className="grid gap-3">
          <Field label="Document title">
            <input
              className="input"
              value={project.name}
              onChange={(event) => updateRootField("name", event.target.value)}
            />
          </Field>
          <Field label="Act / entity">
            <input
              className="input"
              value={project.actName}
              placeholder="Artist, company, production…"
              onChange={(event) => updateRootField("actName", event.target.value)}
            />
          </Field>
          <Field label="Event">
            <input
              className="input"
              value={project.eventName}
              placeholder="Event or tour name"
              onChange={(event) => updateRootField("eventName", event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Venue">
              <input
                className="input"
                value={project.venue}
                placeholder="Venue"
                onChange={(event) => updateRootField("venue", event.target.value)}
              />
            </Field>
            <Field label="Event date">
              <input
                type="date"
                className="input"
                value={project.eventDate}
                onChange={(event) => updateRootField("eventDate", event.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <section>
        <h3 className="section-heading">Stage dimensions</h3>
        <div className="grid grid-cols-[1fr_1fr_74px] gap-2">
          <Field label="Width">
            <input
              type="number"
              min={4}
              max={500}
              className="input"
              value={project.stage.width}
              onChange={(event) =>
                updateProject((current) => ({
                  ...current,
                  stage: { ...current.stage, width: Number(event.target.value) || 4 },
                }))
              }
            />
          </Field>
          <Field label="Depth">
            <input
              type="number"
              min={4}
              max={500}
              className="input"
              value={project.stage.depth}
              onChange={(event) =>
                updateProject((current) => ({
                  ...current,
                  stage: { ...current.stage, depth: Number(event.target.value) || 4 },
                }))
              }
            />
          </Field>
          <Field label="Unit">
            <select
              className="input"
              value={project.stage.unit}
              onChange={(event) => {
                const nextUnit = event.target.value as "ft" | "m";
                updateProject((current) => ({
                  ...current,
                  stage: {
                    width: convertLength(current.stage.width, current.stage.unit, nextUnit),
                    depth: convertLength(current.stage.depth, current.stage.unit, nextUnit),
                    unit: nextUnit,
                  },
                  items: current.items.map((item) => ({
                    ...item,
                    width: convertLength(item.width, current.stage.unit, nextUnit),
                    height: convertLength(item.height, current.stage.unit, nextUnit),
                  })),
                }));
              }}
            >
              <option value="ft">feet</option>
              <option value="m">metres</option>
            </select>
          </Field>
        </div>
      </section>

      <section>
        <h3 className="section-heading">Production contact</h3>
        <div className="grid gap-3">
          <Field label="Name">
            <input
              className="input"
              value={project.contact.name}
              onChange={(event) =>
                updateProject((current) => ({
                  ...current,
                  contact: { ...current.contact, name: event.target.value },
                }))
              }
            />
          </Field>
          <Field label="Role">
            <input
              className="input"
              value={project.contact.role}
              placeholder="Tour manager, FOH, band tech…"
              onChange={(event) =>
                updateProject((current) => ({
                  ...current,
                  contact: { ...current.contact, role: event.target.value },
                }))
              }
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className="input"
              value={project.contact.email}
              onChange={(event) =>
                updateProject((current) => ({
                  ...current,
                  contact: { ...current.contact, email: event.target.value },
                }))
              }
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              className="input"
              value={project.contact.phone}
              onChange={(event) =>
                updateProject((current) => ({
                  ...current,
                  contact: { ...current.contact, phone: event.target.value },
                }))
              }
            />
          </Field>
        </div>
      </section>
    </div>
  );
};

const ItemProperties = ({ itemId }: { itemId: string }) => {
  const item = useStageStore((state) =>
    state.project.items.find((stageItem) => stageItem.id === itemId),
  );
  const stage = useStageStore((state) => state.project.stage);
  const updateItem = useStageStore((state) => state.updateItem);
  const duplicateItem = useStageStore((state) => state.duplicateItem);
  const removeItem = useStageStore((state) => state.removeItem);

  if (!item) return null;

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-slate-100 p-1">
          <ItemIcon kind={item.kind} className="h-12 w-12" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{item.label}</p>
          <p className="text-xs capitalize text-[var(--muted)]">
            {item.kind.replace("-", " ")} · {item.width} × {item.height} {stage.unit}
          </p>
        </div>
      </div>

      <Field label="Label">
        <input
          className="input"
          value={item.label}
          onChange={(event) => updateItem(item.id, { label: event.target.value })}
        />
      </Field>

      <Field label="Provided by">
        <select
          className="input"
          value={item.providedBy}
          onChange={(event) =>
            updateItem(item.id, { providedBy: event.target.value as typeof item.providedBy })
          }
        >
          <option value="band">Band carries this</option>
          <option value="house">Request from venue</option>
        </select>
      </Field>

      <Field label="Input channels">
        <input
          className="input"
          value={item.channelLabel}
          placeholder="e.g. 1–8 or 11"
          onChange={(event) => updateItem(item.id, { channelLabel: event.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="From stage right %">
          <input
            type="number"
            className="input"
            min={0}
            max={100}
            step={0.5}
            value={Math.round(item.x * 10) / 10}
            onChange={(event) => updateItem(item.id, { x: Number(event.target.value) })}
          />
        </Field>
        <Field label="From upstage %">
          <input
            type="number"
            className="input"
            min={0}
            max={100}
            step={0.5}
            value={Math.round(item.y * 10) / 10}
            onChange={(event) => updateItem(item.id, { y: Number(event.target.value) })}
          />
        </Field>
        <Field label={`Width (${stage.unit})`}>
          <input
            type="number"
            className="input"
            min={MIN_ITEM_SIZE}
            max={stage.width}
            step={0.1}
            value={Math.round(item.width * 10) / 10}
            onChange={(event) => updateItem(item.id, { width: Number(event.target.value) })}
          />
        </Field>
        <Field label={`Depth (${stage.unit})`}>
          <input
            type="number"
            className="input"
            min={MIN_ITEM_SIZE}
            max={stage.depth}
            step={0.1}
            value={Math.round(item.height * 10) / 10}
            onChange={(event) => updateItem(item.id, { height: Number(event.target.value) })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-[1fr_64px] gap-3">
        <Field label="Rotation">
          <input
            type="range"
            min={-180}
            max={180}
            step={5}
            value={item.rotation}
            className="mt-2 w-full accent-[var(--accent)]"
            onChange={(event) => updateItem(item.id, { rotation: Number(event.target.value) })}
          />
        </Field>
        <Field label="Degrees">
          <input
            type="number"
            className="input"
            min={-180}
            max={180}
            value={item.rotation}
            onChange={(event) => updateItem(item.id, { rotation: Number(event.target.value) })}
          />
        </Field>
      </div>

      <Field label="Color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={item.color}
            className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent p-1"
            onChange={(event) => updateItem(item.id, { color: event.target.value })}
            aria-label="Object color"
          />
          <input
            className="input font-mono uppercase"
            value={item.color}
            pattern="^#[0-9a-fA-F]{6}$"
            onChange={(event) => {
              if (/^#[0-9a-fA-F]{6}$/.test(event.target.value)) {
                updateItem(item.id, { color: event.target.value });
              }
            }}
          />
        </div>
      </Field>

      <Field label="Object notes">
        <textarea
          className="input min-h-24 resize-y py-2"
          value={item.notes}
          placeholder="Patch, placement, or substitution detail…"
          onChange={(event) => updateItem(item.id, { notes: event.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="button-secondary"
          onClick={() => duplicateItem(item.id)}
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </button>
        <button
          type="button"
          className="button-danger"
          onClick={() => removeItem(item.id)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

const InputList = () => {
  const inputs = useStageStore((state) => state.project.inputs);
  const addInput = useStageStore((state) => state.addInput);
  const updateInput = useStageStore((state) => state.updateInput);
  const removeInput = useStageStore((state) => state.removeInput);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black">Input / patch list</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            Document every source in preferred patch order, including mic or DI, stand type, and 48 V.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="button-icon"
            onClick={async () => {
              if (!inputs.length) {
                toast.error("Add at least one input first.");
                return;
              }
              try {
                await navigator.clipboard.writeText(formatInputListTsv(useStageStore.getState().project));
                toast.success("Input list copied");
              } catch {
                toast.error("The input list could not be copied.");
              }
            }}
            aria-label="Copy input list"
            title="Copy input list"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" className="button-icon" onClick={addInput} aria-label="Add input">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {inputs.map((input) => (
          <article
            key={input.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                className="input h-8 w-14 text-center font-black"
                value={input.channel}
                aria-label={`Channel number for ${input.source}`}
                onChange={(event) =>
                  updateInput(input.id, { channel: Number(event.target.value) || 1 })
                }
              />
              <input
                className="input h-8 flex-1 font-bold"
                value={input.source}
                aria-label={`Source for channel ${input.channel}`}
                placeholder="Source"
                onChange={(event) => updateInput(input.id, { source: event.target.value })}
              />
              <button
                type="button"
                className="rounded-lg p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                onClick={() => removeInput(input.id)}
                aria-label={`Remove channel ${input.channel}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input h-8 text-xs"
                value={input.micDi}
                placeholder="Mic / DI"
                aria-label={`Microphone or DI for channel ${input.channel}`}
                onChange={(event) => updateInput(input.id, { micDi: event.target.value })}
              />
              <input
                className="input h-8 text-xs"
                value={input.stand}
                placeholder="Stand / mount"
                list="stand-types"
                aria-label={`Stand for channel ${input.channel}`}
                onChange={(event) => updateInput(input.id, { stand: event.target.value })}
              />
              <input
                className="input h-8 text-xs"
                value={input.performer}
                placeholder="Performer"
                aria-label={`Performer for channel ${input.channel}`}
                onChange={(event) => updateInput(input.id, { performer: event.target.value })}
              />
              <input
                className="input h-8 text-xs"
                value={input.destination}
                placeholder="Destination"
                aria-label={`Destination for channel ${input.channel}`}
                onChange={(event) =>
                  updateInput(input.id, { destination: event.target.value })
                }
              />
            </div>
            <input
              className="input mt-2 h-8 text-xs"
              value={input.notes}
              placeholder="Notes"
              aria-label={`Notes for channel ${input.channel}`}
              onChange={(event) => updateInput(input.id, { notes: event.target.value })}
            />
            <label className="mt-2 flex items-center gap-2 text-[10px] font-bold text-[var(--muted)]">
              <input
                type="checkbox"
                checked={input.phantom}
                className="accent-[var(--accent)]"
                onChange={(event) => updateInput(input.id, { phantom: event.target.checked })}
              />
              48 V phantom power
            </label>
          </article>
        ))}

        {!inputs.length && (
          <div className="empty-state">
            <ClipboardList className="h-7 w-7" />
            <p className="font-bold">No inputs yet</p>
            <button type="button" className="button-secondary mt-2" onClick={addInput}>
              <Plus className="h-4 w-4" />
              Add first input
            </button>
          </div>
        )}
      </div>
      <datalist id="stand-types">
        <option value="Boom" />
        <option value="Short boom" />
        <option value="Tall boom" />
        <option value="Straight" />
        <option value="Round base" />
        <option value="Clip" />
        <option value="None" />
      </datalist>
    </div>
  );
};

const MonitorList = () => {
  const monitorMixes = useStageStore((state) => state.project.monitorMixes);
  const addMonitorMix = useStageStore((state) => state.addMonitorMix);
  const updateMonitorMix = useStageStore((state) => state.updateMonitorMix);
  const removeMonitorMix = useStageStore((state) => state.removeMonitorMix);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black">Monitor mixes</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            Identify each mix, user, hardware, and priority sources.
          </p>
        </div>
        <button
          type="button"
          className="button-icon"
          onClick={addMonitorMix}
          aria-label="Add monitor mix"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {monitorMixes.map((mix) => (
          <article
            key={mix.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
          >
            <div className="mb-2 flex gap-2">
              <input
                className="input h-8 flex-1 font-bold"
                value={mix.name}
                aria-label="Monitor mix name"
                onChange={(event) => updateMonitorMix(mix.id, { name: event.target.value })}
              />
              <select
                className="input h-8 w-24 text-xs"
                value={mix.type}
                aria-label={`Type for ${mix.name}`}
                onChange={(event) =>
                  updateMonitorMix(mix.id, {
                    type: event.target.value as typeof mix.type,
                  })
                }
              >
                <option value="wedge">Wedge</option>
                <option value="iem">IEM</option>
                <option value="sidefill">Sidefill</option>
                <option value="other">Other</option>
              </select>
              <button
                type="button"
                className="rounded-lg p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                onClick={() => removeMonitorMix(mix.id)}
                aria-label={`Remove ${mix.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <input
              className="input mb-2 h-8 text-xs"
              value={mix.owner}
              placeholder="Performer / position"
              aria-label={`Owner of ${mix.name}`}
              onChange={(event) => updateMonitorMix(mix.id, { owner: event.target.value })}
            />
            <textarea
              className="input min-h-20 resize-y py-2 text-xs"
              value={mix.requirements}
              placeholder="Priority sources, supplied gear, special routing…"
              aria-label={`Requirements for ${mix.name}`}
              onChange={(event) =>
                updateMonitorMix(mix.id, { requirements: event.target.value })
              }
            />
          </article>
        ))}

        {!monitorMixes.length && (
          <div className="empty-state">
            <Headphones className="h-7 w-7" />
            <p className="font-bold">No monitor mixes yet</p>
            <button type="button" className="button-secondary mt-2" onClick={addMonitorMix}>
              <Plus className="h-4 w-4" />
              Add first mix
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductionNotes = () => {
  const notes = useStageStore((state) => state.project.notes);
  const updateProject = useStageStore((state) => state.updateProject);

  const noteFields: Array<{
    key: keyof typeof notes;
    label: string;
    placeholder: string;
  }> = [
    {
      key: "general",
      label: "General production notes",
      placeholder: "Orientation, substitutions, soundcheck, changeover…",
    },
    {
      key: "power",
      label: "Power",
      placeholder: "Voltage, circuits, quantity, and exact locations…",
    },
    {
      key: "backline",
      label: "Backline & staging",
      placeholder: "Supplied/requested equipment, risers, hardware…",
    },
    {
      key: "schedule",
      label: "Schedule",
      placeholder: "Load-in, setup, line check, soundcheck, doors, set length…",
    },
    {
      key: "wireless",
      label: "Wireless",
      placeholder: "Handhelds, IEMs, beltpacks, and any frequency notes…",
    },
  ];

  return (
    <div className="space-y-4 p-4">
      {noteFields.map((field) => (
        <Field key={field.key} label={field.label}>
          <textarea
            className="input min-h-28 resize-y py-2"
            value={notes[field.key]}
            placeholder={field.placeholder}
            onChange={(event) =>
              updateProject((project) => ({
                ...project,
                notes: { ...project.notes, [field.key]: event.target.value },
              }))
            }
          />
        </Field>
      ))}
    </div>
  );
};

const ReadinessCheck = () => {
  const project = useStageStore((state) => state.project);
  const updateProject = useStageStore((state) => state.updateProject);
  const checks = getProjectChecks(project);
  const score = getReadinessScore(project);

  const handleReadyToSubmit = () => {
    updateProject((current) => ({
      ...current,
      readyToSubmit: !current.readyToSubmit,
    }));
  };

  return (
    <div className="p-4">
      <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
              Advance readiness
            </p>
            <p className="mt-1 text-3xl font-black">{score}%</p>
          </div>
          <BadgeCheck
            className={`h-9 w-9 ${score === 100 ? "text-emerald-500" : "text-[var(--accent)]"}`}
          />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--panel-strong)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width]"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--accent)]"
          checked={project.readyToSubmit}
          onChange={handleReadyToSubmit}
          aria-label="Are you ready to submit"
        />
        <span>
          <span className="block text-sm font-black">Are you ready to submit?</span>
          <span className="mt-1 block text-[11px] leading-relaxed text-[var(--muted)]">
            Check this when the plot, input list, mixes, and notes are finished. The venue treats
            that as completed.
          </span>
        </span>
      </label>

      <div className="space-y-2">
        {checks.map((check) => (
          <article
            key={check.id}
            className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
          >
            {check.severity === "ready" ? (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            )}
            <div>
              <p className="text-xs font-black">{check.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
                {check.detail}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const tabs: Array<{ id: PanelTab; label: string; icon: typeof UserRound }> = [
  { id: "details", label: "Details", icon: UserRound },
  { id: "inputs", label: "Inputs", icon: ClipboardList },
  { id: "monitors", label: "Mixes", icon: Headphones },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "check", label: "Check", icon: BadgeCheck },
];

export const ProjectPanel = () => {
  const [activeTab, setActiveTab] = useState<PanelTab>("details");
  const selectedItemId = useStageStore((state) => state.selectedItemId);
  const selectItem = useStageStore((state) => state.selectItem);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--panel)] lg:w-[350px] lg:shrink-0">
      {selectedItemId ? (
        <>
          <div className="flex h-12 items-center justify-between border-b border-[var(--border)] px-4">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
              <Settings2 className="h-4 w-4 text-[var(--accent)]" />
              Object inspector
            </span>
            <button
              type="button"
              className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={() => selectItem(null)}
            >
              Done
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ItemProperties itemId={selectedItemId} />
          </div>
        </>
      ) : (
        <>
          <div
            className="grid grid-cols-5 border-b border-[var(--border)]"
            role="tablist"
            aria-label="Project tools"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`flex h-14 flex-col items-center justify-center gap-1 border-b-2 text-[9px] font-black uppercase tracking-wide transition ${
                    activeTab === tab.id
                      ? "border-[var(--accent)] text-[var(--accent-strong)]"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === "details" && <ProjectDetails />}
            {activeTab === "inputs" && <InputList />}
            {activeTab === "monitors" && <MonitorList />}
            {activeTab === "notes" && <ProductionNotes />}
            {activeTab === "check" && <ReadinessCheck />}
          </div>
        </>
      )}
    </aside>
  );
};
