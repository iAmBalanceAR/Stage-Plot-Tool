import { beforeEach, describe, expect, it } from "vitest";
import { createBlankProject } from "@/data/templates";
import { useStageStore } from "@/store/stage-store";

describe("stage editor store", () => {
  beforeEach(() => {
    useStageStore.setState({
      project: createBlankProject(),
      selectedItemId: null,
      isHydrated: true,
      past: [],
      future: [],
      transactionStart: null,
    });
  });

  it("adds, updates, duplicates, and removes stage objects", () => {
    const store = useStageStore.getState();
    store.addItem("drums", { x: 25, y: 15 });

    const drumItem = useStageStore.getState().project.items[0];
    expect(drumItem.kind).toBe("drums");
    expect(drumItem.x).toBe(25);
    expect(drumItem.width).toBe(7);
    expect(drumItem.height).toBe(6);
    expect(drumItem.providedBy).toBe("band");
    expect(drumItem.channelLabel).toBe("");

    useStageStore.getState().updateItem(drumItem.id, { label: "House drum kit" });
    expect(useStageStore.getState().project.items[0].label).toBe("House drum kit");

    useStageStore.getState().duplicateItem(drumItem.id);
    expect(useStageStore.getState().project.items).toHaveLength(2);

    useStageStore.getState().removeItem(drumItem.id);
    expect(useStageStore.getState().project.items).toHaveLength(1);
  });

  it("supports undo and redo", () => {
    useStageStore.getState().addItem("wedge");
    expect(useStageStore.getState().project.items).toHaveLength(1);

    useStageStore.getState().undo();
    expect(useStageStore.getState().project.items).toHaveLength(0);

    useStageStore.getState().redo();
    expect(useStageStore.getState().project.items).toHaveLength(1);
  });

  it("keeps resized and moved objects inside the stage", () => {
    useStageStore.getState().addItem("guitar-amp");
    const item = useStageStore.getState().project.items[0];

    useStageStore.getState().updateItem(item.id, {
      x: 99,
      y: -10,
      width: 8,
      height: 6,
    });
    const updatedItem = useStageStore.getState().project.items[0];

    expect(updatedItem.x).toBe(75);
    expect(updatedItem.y).toBe(0);
    expect(updatedItem.width).toBe(8);
  });
});
