"use client";

import { useMemo, useState } from "react";
import { LayoutTemplate, Search, Sparkles } from "lucide-react";
import { equipmentCategories, equipmentLibrary } from "@/data/equipment";
import { cloneTemplateProject, projectTemplates } from "@/data/templates";
import { ItemIcon } from "@/components/item-icon";
import { useStageStore } from "@/store/stage-store";

export const EquipmentLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const addItem = useStageStore((state) => state.addItem);
  const setProject = useStageStore((state) => state.setProject);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return equipmentLibrary.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        !normalizedQuery ||
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <aside className="panel-scroll flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--panel)] lg:w-[260px] lg:shrink-0">
      <div className="border-b border-[var(--border)] p-4">
        <button
          type="button"
          className="mb-3 flex w-full items-center justify-between rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-2.5 text-left text-sm font-bold text-[var(--accent-strong)] transition hover:border-[var(--accent)]"
          onClick={() => setIsTemplatesOpen((value) => !value)}
          aria-expanded={isTemplatesOpen}
        >
          <span className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Quick templates
          </span>
          <Sparkles className="h-3.5 w-3.5" />
        </button>

        {isTemplatesOpen && (
          <div className="mb-4 grid gap-2" aria-label="Stage plot templates">
            {projectTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5 text-left transition hover:border-[var(--accent)]"
                onClick={() => {
                  const shouldReplace =
                    useStageStore.getState().project.items.length === 0 ||
                    window.confirm(
                      `Replace the current project with the ${template.name} template?`,
                    );
                  if (!shouldReplace) return;
                  setProject(cloneTemplateProject(template));
                  setIsTemplatesOpen(false);
                }}
              >
                <span className="block text-xs font-bold">{template.name}</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--muted)]">
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        )}

        <label className="relative block">
          <span className="sr-only">Search equipment</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search objects"
            className="input h-9 w-full pl-9 text-xs"
          />
        </label>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2">
        {["All", ...equipmentCategories].map((category) => (
          <button
            key={category}
            type="button"
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
              activeCategory === category
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
          Click or drag to stage
        </p>
        <div className="grid grid-cols-2 gap-2">
          {filteredItems.map((item) => (
            <button
              key={item.kind}
              type="button"
              draggable
              className="group flex min-h-[5.5rem] flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] p-2 text-center transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-lg"
              onClick={() => addItem(item.kind)}
              onDragStart={(event) => {
                event.dataTransfer.setData("application/stagecraft-item", item.kind);
                event.dataTransfer.effectAllowed = "copy";
              }}
              aria-label={`Add ${item.label} to stage`}
            >
              <span className="mb-1.5 flex h-12 w-full items-center justify-center rounded-lg bg-slate-100 px-1">
                <ItemIcon kind={item.kind} className="h-10 w-10" />
              </span>
              <span className="text-[11px] font-bold leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        {!filteredItems.length && (
          <p className="px-3 py-10 text-center text-xs text-[var(--muted)]">
            No objects match that search.
          </p>
        )}
      </div>
    </aside>
  );
};
