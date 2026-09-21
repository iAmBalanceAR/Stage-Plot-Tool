import type { StageItem } from "@/types/stage";

export const MIN_ITEM_SIZE = 0.5;
export const MAX_ITEM_SIZE = 80;

export const roundSize = (value: number) => Math.round(value * 10) / 10;

export const sizeToPercent = (size: number, stageLength: number) =>
  (size / Math.max(stageLength, 0.1)) * 100;

export const percentToSize = (percent: number, stageLength: number) =>
  (percent / 100) * stageLength;

export const itemWidthPercent = (item: Pick<StageItem, "width">, stageWidth: number) =>
  sizeToPercent(item.width, stageWidth);

export const itemHeightPercent = (item: Pick<StageItem, "height">, stageDepth: number) =>
  sizeToPercent(item.height, stageDepth);

export const feetToStageUnit = (feet: number, unit: "ft" | "m") =>
  roundSize(unit === "m" ? feet * 0.3048 : feet);

export const convertLength = (value: number, from: "ft" | "m", to: "ft" | "m") => {
  if (from === to) return roundSize(value);
  return roundSize(from === "ft" ? value * 0.3048 : value / 0.3048);
};

export const clampItemOnStage = (
  item: Pick<StageItem, "x" | "y" | "width" | "height">,
  stage: { width: number; depth: number },
) => {
  const width = Math.min(Math.max(item.width, MIN_ITEM_SIZE), Math.min(MAX_ITEM_SIZE, stage.width));
  const height = Math.min(
    Math.max(item.height, MIN_ITEM_SIZE),
    Math.min(MAX_ITEM_SIZE, stage.depth),
  );
  const widthPercent = sizeToPercent(width, stage.width);
  const heightPercent = sizeToPercent(height, stage.depth);

  return {
    width: roundSize(width),
    height: roundSize(height),
    x: Math.min(Math.max(item.x, 0), Math.max(0, 100 - widthPercent)),
    y: Math.min(Math.max(item.y, 0), Math.max(0, 100 - heightPercent)),
  };
};
