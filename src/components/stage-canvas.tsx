"use client";

import { useRef, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Copy, Package, Trash2 } from "lucide-react";
import { EquipmentArt } from "@/components/item-icon";
import { itemHeightPercent, itemWidthPercent, percentToSize } from "@/lib/geometry";
import { useStageStore } from "@/store/stage-store";
import type { EquipmentKind, StageItem } from "@/types/stage";

interface StageCanvasProps {
  zoom: number;
}

interface InteractionState {
  itemId: string;
  pointerId: number;
  mode: "move" | "resize";
  startClientX: number;
  startClientY: number;
  startItem: StageItem;
}

export const StageCanvas = ({ zoom }: StageCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const project = useStageStore((state) => state.project);
  const selectedItemId = useStageStore((state) => state.selectedItemId);
  const selectItem = useStageStore((state) => state.selectItem);
  const addItem = useStageStore((state) => state.addItem);
  const updateItem = useStageStore((state) => state.updateItem);
  const removeItem = useStageStore((state) => state.removeItem);
  const duplicateItem = useStageStore((state) => state.duplicateItem);
  const beginTransaction = useStageStore((state) => state.beginTransaction);
  const commitTransaction = useStageStore((state) => state.commitTransaction);
  const scaleLength = project.stage.width >= 20 ? 8 : 4;

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    item: StageItem,
    mode: InteractionState["mode"],
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectItem(item.id);
    beginTransaction();
    interactionRef.current = {
      itemId: item.id,
      pointerId: event.pointerId,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startItem: item,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    const canvas = canvasRef.current;
    if (!interaction || !canvas || interaction.pointerId !== event.pointerId) return;

    const rect = canvas.getBoundingClientRect();
    const deltaXPercent = ((event.clientX - interaction.startClientX) / rect.width) * 100;
    const deltaYPercent = ((event.clientY - interaction.startClientY) / rect.height) * 100;

    if (interaction.mode === "move") {
      updateItem(
        interaction.itemId,
        {
          x: interaction.startItem.x + deltaXPercent,
          y: interaction.startItem.y + deltaYPercent,
        },
        false,
      );
      return;
    }

    updateItem(
      interaction.itemId,
      {
        width: interaction.startItem.width + percentToSize(deltaXPercent, project.stage.width),
        height: interaction.startItem.height + percentToSize(deltaYPercent, project.stage.depth),
      },
      false,
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (interactionRef.current?.pointerId !== event.pointerId) return;
    interactionRef.current = null;
    commitTransaction();
  };

  const handleItemKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    item: StageItem,
  ) => {
    const step = event.shiftKey ? 2 : 0.5;
    const positionUpdates: Record<string, Partial<StageItem>> = {
      ArrowLeft: { x: item.x - step },
      ArrowRight: { x: item.x + step },
      ArrowUp: { y: item.y - step },
      ArrowDown: { y: item.y + step },
    };

    if (positionUpdates[event.key]) {
      event.preventDefault();
      updateItem(item.id, positionUpdates[event.key]);
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      removeItem(item.id);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData("application/stagecraft-item") as EquipmentKind;
    const canvas = canvasRef.current;
    if (!kind || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    addItem(kind, {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="stage-scroll flex min-h-0 flex-1 items-center justify-center overflow-auto p-5 sm:p-8">
      <div
        id="stage-export"
        className="stage-export relative shrink-0 transition-[width] duration-200"
        style={{ width: `${zoom}%`, minWidth: zoom > 100 ? 720 : undefined }}
      >
        <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
          <span>Stage right</span>
          <span>
            {project.stage.width} × {project.stage.depth} {project.stage.unit}
          </span>
          <span>Stage left</span>
        </div>

        <div
          ref={canvasRef}
          className="stage-grid relative overflow-hidden rounded-t-xl border border-[var(--stage-border)] bg-[var(--stage)] shadow-[0_28px_80px_rgba(0,0,0,0.24)]"
          style={{ aspectRatio: `${project.stage.width} / ${project.stage.depth}` }}
          onClick={() => selectItem(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          aria-label={`Stage canvas, ${project.stage.width} by ${project.stage.depth} ${project.stage.unit}`}
        >
          <div className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-[var(--stage-line)]" />
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-[var(--stage-line)] bg-[var(--stage-label)] px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-[var(--stage-text-muted)]">
            Upstage
          </div>
          <div
            className="pointer-events-none absolute bottom-4 left-3 h-0.5 bg-[var(--stage-text)]"
            style={{ width: `${(scaleLength / project.stage.width) * 100}%` }}
          />
          <div
            className="pointer-events-none absolute bottom-3 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--stage-text-muted)]"
            style={{ left: `calc(0.75rem + ${(scaleLength / project.stage.width) * 100}%)` }}
          >
            {scaleLength} {project.stage.unit}
          </div>

          {project.items
            .slice()
            .sort((a, b) => Number(b.kind === "riser") - Number(a.kind === "riser"))
            .map((item) => {
              const isSelected = selectedItemId === item.id;
              const widthPercent = itemWidthPercent(item, project.stage.width);
              const heightPercent = itemHeightPercent(item, project.stage.depth);

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.label}, ${item.width} by ${item.height} ${project.stage.unit}. Drag to move.`}
                  aria-pressed={isSelected}
                  className={`stage-item group absolute touch-none select-none outline-none ${
                    isSelected ? "z-20" : item.kind === "riser" ? "z-[5]" : "z-10"
                  }`}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                    transform: `rotate(${item.rotation}deg)`,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectItem(item.id);
                  }}
                  onPointerDown={(event) => handlePointerDown(event, item, "move")}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onKeyDown={(event) => handleItemKeyDown(event, item)}
                >
                  <div
                    className={`relative h-full w-full ${
                      isSelected
                        ? "rounded-sm ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--stage)]"
                        : ""
                    }`}
                  >
                    <EquipmentArt kind={item.kind} className="h-full w-full" />
                    <span className="pointer-events-none absolute left-1/2 top-[calc(100%+2px)] z-20 w-max max-w-28 -translate-x-1/2 text-center text-[clamp(8px,0.85vw,11px)] font-black leading-tight text-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)]">
                      {item.label}
                    </span>
                    {item.providedBy === "house" && (
                      <span className="absolute left-0 top-0 rounded bg-slate-700 px-1 text-[8px] font-black uppercase tracking-wide text-white">
                        House
                      </span>
                    )}
                    {item.channelLabel && (
                      <span className="absolute -right-1 -top-1 rounded bg-red-600 px-1 text-[8px] font-black leading-4 text-white shadow">
                        {item.channelLabel}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <>
                      <div className="export-ignore absolute -top-9 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-1 text-[var(--foreground)] shadow-xl">
                        <button
                          type="button"
                          className="rounded p-1 hover:bg-[var(--panel-strong)]"
                          aria-label={`Duplicate ${item.label}`}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            duplicateItem(item.id);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-red-500 hover:bg-red-500/10"
                          aria-label={`Delete ${item.label}`}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeItem(item.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div
                        className="export-ignore absolute -bottom-1 -right-1 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border-2 border-white bg-[var(--accent)] shadow"
                        role="button"
                        tabIndex={-1}
                        aria-label={`Resize ${item.label}`}
                        onPointerDown={(event) => handlePointerDown(event, item, "resize")}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                      />
                    </>
                  )}
                </div>
              );
            })}

          {!project.items.length && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-[var(--stage-text-muted)]">
              <Package className="mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm font-bold">Your stage is ready</p>
              <p className="mt-1 max-w-56 text-xs">
                Drag objects from the library or click one to place it.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-b-xl border-x border-b border-[var(--stage-border)] bg-[var(--stage-front)] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.35em] text-[var(--stage-text)]">
          Stage front · audience
        </div>
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-[var(--muted)]">
          Objects are drawn to scale in {project.stage.unit}. Stage left is the band&apos;s left when facing
          the audience.
        </p>
      </div>
    </div>
  );
};
