import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpPath =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor",
    "browser-logs",
    "cdp-response-Runtime.evaluate-2026-09-30T12-21-07-239Z.json",
  );

const outDir = path.join(process.cwd(), "public", "icons", "tecrider");
const catalogPath = path.join(process.cwd(), "src", "data", "tecrider-icons.json");

const categoryMap = {
  "Guitar & Bass": "Instruments",
  Amps: "Audio",
  Pedals: "Audio",
  "Drums & Percussion": "Instruments",
  Keys: "Instruments",
  Vocals: "Audio",
  "PA & DJ": "Audio",
  "Brass & Orchestra": "Instruments",
  "Stage Equipment": "Stage",
};

const sizesFor = (category, alt) => {
  const name = alt.toLowerCase();
  if (name.includes("drum kit") || name.includes("drum set") || name.includes("electronic drums")) {
    return { defaultWidth: 7, defaultHeight: 6 };
  }
  if (name.includes("grand piano")) return { defaultWidth: 7, defaultHeight: 3.4 };
  if (name.includes("upright")) return { defaultWidth: 3.2, defaultHeight: 2.4 };
  if (name.includes("keyboard") || name.includes("synth") || name.includes("midi") || name.includes("piano")) {
    return { defaultWidth: 5.2, defaultHeight: 2.2 };
  }
  if (name.includes("stack") || name.includes("line array") || name.includes("cabinet")) {
    return { defaultWidth: 2.6, defaultHeight: 3.4 };
  }
  if (name.includes("pedal")) return { defaultWidth: 1.1, defaultHeight: 1.5 };
  if (name.includes("guitar") || name.includes("bass") || name.includes("banjo") || name.includes("violin") || name.includes("cello")) {
    return { defaultWidth: 1.8, defaultHeight: 3.8 };
  }
  if (name.includes("amp") || name.includes("combo")) return { defaultWidth: 2.4, defaultHeight: 2.2 };
  if (name.includes("mic stand") || name.includes("tripod")) return { defaultWidth: 1.5, defaultHeight: 3.4 };
  if (name.includes("mic") || name.includes("headset")) return { defaultWidth: 1.2, defaultHeight: 2.6 };
  if (name.includes("truss") || name.includes("platform") || name.includes("scaffold")) {
    return { defaultWidth: 6, defaultHeight: 3 };
  }
  if (category === "Pedals") return { defaultWidth: 1.1, defaultHeight: 1.5 };
  if (category === "Amps") return { defaultWidth: 2.4, defaultHeight: 2.2 };
  if (category === "Vocals") return { defaultWidth: 1.4, defaultHeight: 2.8 };
  if (category === "PA & DJ") return { defaultWidth: 2.4, defaultHeight: 2.6 };
  if (category === "Stage Equipment") return { defaultWidth: 2.4, defaultHeight: 2.4 };
  if (category === "Drums & Percussion") return { defaultWidth: 3.2, defaultHeight: 3.2 };
  if (category === "Brass & Orchestra") return { defaultWidth: 2.2, defaultHeight: 3.6 };
  return { defaultWidth: 2.2, defaultHeight: 2.4 };
};

const colorFor = (category) =>
  ({
    "Guitar & Bass": "#f59e0b",
    Amps: "#a855f7",
    Pedals: "#22c55e",
    "Drums & Percussion": "#ef4444",
    Keys: "#8b5cf6",
    Vocals: "#0f766e",
    "PA & DJ": "#334155",
    "Brass & Orchestra": "#d97706",
    "Stage Equipment": "#64748b",
  })[category] || "#78716c";

const slugify = (file) =>
  file
    .replace(/\.png$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const raw = JSON.parse(await readFile(cdpPath, "utf8"));
const icons = JSON.parse(raw.result.value);
const unique = [];
const seen = new Set();

for (const icon of icons) {
  if (!icon.src?.startsWith("http") || icon.file === "amp-showcase-Bj4nO1OX.png") continue;
  if (seen.has(icon.file)) continue;
  seen.add(icon.file);
  unique.push(icon);
}

await mkdir(outDir, { recursive: true });

const catalog = [];
for (const icon of unique) {
  const kind = slugify(icon.file);
  const dest = path.join(outDir, icon.file);
  process.stdout.write(`Downloading ${icon.alt}\n`);
  const response = await fetch(icon.src);
  if (!response.ok) throw new Error(`Failed ${icon.src}: ${response.status}`);
  await writeFile(dest, Buffer.from(await response.arrayBuffer()));
  catalog.push({
    kind,
    label: icon.alt,
    group: icon.category,
    category: categoryMap[icon.category] || "Stage",
    color: colorFor(icon.category),
    iconSrc: `/icons/tecrider/${icon.file}`,
    ...sizesFor(icon.category, icon.alt),
  });
}

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Saved ${catalog.length} icons`);
