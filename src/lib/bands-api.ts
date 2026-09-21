import type { BandSlot, Organization, OrgMembership, Profile } from "@/types/account";

export interface BandDirectory {
  users: Profile[];
  organizations: Organization[];
  memberships: OrgMembership[];
  sessionUserId?: string | null;
  band?: BandSlot;
  profile?: Profile;
  organization?: Organization;
  bands?: BandSlot[];
  active?: boolean;
  bandName?: string;
}

const readError = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "Band access could not be updated.";
  } catch {
    return "Band access could not be updated.";
  }
};

const postBands = async (body: Record<string, unknown>): Promise<BandDirectory> => {
  const response = await fetch("/api/bands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as BandDirectory;
};

export const fetchVenueBands = async (userId: string): Promise<BandSlot[]> => {
  const response = await fetch(`/api/bands?userId=${encodeURIComponent(userId)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  const payload = (await response.json()) as BandDirectory;
  return payload.bands ?? [];
};

export const verifyBandAccess = async (bandId: string): Promise<boolean> => {
  const response = await fetch(`/api/bands?bandId=${encodeURIComponent(bandId)}`, {
    cache: "no-store",
  });
  if (!response.ok) return false;
  const payload = (await response.json()) as BandDirectory;
  return Boolean(payload.active);
};

export const createBandAccess = (input: {
  userId: string;
  orgId?: string;
  bandName: string;
  showDate: string;
}) => postBands({ action: "create", ...input });

export const loginBandAccess = (token: string) => postBands({ action: "login", token });

export const deactivateBandAccess = (userId: string, bandId: string) =>
  postBands({ action: "deactivate", userId, bandId });
