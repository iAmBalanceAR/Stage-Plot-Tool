import type { BandSlot, Organization, Profile } from "@/types/account";

const TOKEN_CHARS = "23456789abcdefghjkmnpqrstuvwxyz";

export const toIsoDate = (value: Date = new Date()) => value.toISOString().slice(0, 10);

export const normalizeBandName = (value: string) => value.trim().replace(/\s+/g, " ");

export const normalizeLinkToken = (value: string) => value.trim().toLowerCase();

export const bandLinkPath = (token: string) => `/b/${normalizeLinkToken(token)}`;

export const createLinkToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((byte) => TOKEN_CHARS[byte % TOKEN_CHARS.length]).join("");
};

export const isBandAccessActive = (band: BandSlot, now: Date = new Date()) => {
  if (band.deactivatedAt) return false;
  return band.showDate >= toIsoDate(now);
};

export const bandProfileFromSlot = (band: BandSlot): Profile => ({
  id: band.id,
  email: `band-${band.id}@local`,
  displayName: band.bandName,
  accountType: "artist",
  password: "",
  createdAt: band.createdAt,
  bandSlotId: band.id,
  orgId: band.orgId,
  showDate: band.showDate,
});

export const findBandByToken = (bands: BandSlot[], token: string) => {
  const linkToken = normalizeLinkToken(token);
  return bands.find((band) => normalizeLinkToken(band.linkToken) === linkToken);
};

export const uniqueLinkToken = (bands: BandSlot[]) => {
  const existing = new Set(bands.map((band) => normalizeLinkToken(band.linkToken)));
  let token = createLinkToken();
  while (existing.has(token)) token = createLinkToken();
  return token;
};

export const createBandSlot = (input: {
  org: Organization;
  createdByUserId: string;
  bandName: string;
  showDate: string;
  existing: BandSlot[];
  now?: Date;
}): BandSlot => {
  const bandName = normalizeBandName(input.bandName);
  if (!bandName) throw new Error("Enter a band name.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.showDate)) {
    throw new Error("Pick the performance date.");
  }

  return {
    id: crypto.randomUUID(),
    orgId: input.org.id,
    createdByUserId: input.createdByUserId,
    bandName,
    linkToken: uniqueLinkToken(input.existing),
    showDate: input.showDate,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
};

export const authenticateBandSlot = (bands: BandSlot[], token: string, now: Date = new Date()) => {
  const band = findBandByToken(bands, token);
  if (!band) throw new Error("This band link is not valid.");
  if (!isBandAccessActive(band, now)) {
    throw new Error("This link expired after the show date.");
  }
  return band;
};

export const expireStaleBands = (bands: BandSlot[], now: Date = new Date()) => {
  const today = toIsoDate(now);
  const expiredAt = now.toISOString();
  return bands.map((band) => {
    if (band.deactivatedAt || band.showDate >= today) return band;
    return { ...band, deactivatedAt: expiredAt };
  });
};

export const deactivateBandSlot = (bands: BandSlot[], bandId: string, now: Date = new Date()) => {
  const band = bands.find((entry) => entry.id === bandId);
  if (!band) throw new Error("That band access was not found.");
  if (band.deactivatedAt) return bands;
  return bands.map((entry) =>
    entry.id === bandId ? { ...entry, deactivatedAt: now.toISOString() } : entry,
  );
};
