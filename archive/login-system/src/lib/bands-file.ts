import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BandSlot } from "@/types/account";

export interface BandsFile {
  bands: BandSlot[];
}

const bandsPath = () =>
  process.env.STAGECRAFT_BANDS_FILE || path.join(process.cwd(), "data", "bands.json");

const emptyBands = (): BandsFile => ({ bands: [] });

export const readBandsFile = async (): Promise<BandsFile> => {
  try {
    const raw = await readFile(bandsPath(), "utf8");
    const parsed = JSON.parse(raw) as BandsFile;
    return { bands: parsed.bands ?? [] };
  } catch {
    return emptyBands();
  }
};

export const writeBandsFile = async (file: BandsFile) => {
  const filePath = bandsPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
};
