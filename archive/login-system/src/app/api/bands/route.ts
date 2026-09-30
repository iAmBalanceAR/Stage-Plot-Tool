import { NextResponse } from "next/server";
import { z } from "zod";
import { readAccountsFile, toDirectory } from "@/lib/accounts-file";
import {
  authenticateBandSlot,
  bandProfileFromSlot,
  createBandSlot,
  deactivateBandSlot,
  expireStaleBands,
  findBandByToken,
  isBandAccessActive,
} from "@/lib/bands";
import { readBandsFile, writeBandsFile } from "@/lib/bands-file";
import type { BandSlot, Profile } from "@/types/account";

const createSchema = z.object({
  action: z.literal("create"),
  userId: z.string().min(1),
  orgId: z.string().optional(),
  bandName: z.string().min(1),
  showDate: z.string().min(1),
});

const loginSchema = z.object({
  action: z.literal("login"),
  token: z.string().min(1),
});

const deactivateSchema = z.object({
  action: z.literal("deactivate"),
  userId: z.string().min(1),
  bandId: z.string().min(1),
});

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const persistExpired = async (bands: BandSlot[]) => {
  const next = expireStaleBands(bands);
  if (next.some((band, index) => band.deactivatedAt !== bands[index]?.deactivatedAt)) {
    await writeBandsFile({ bands: next });
  }
  return next;
};

const bandsForVenue = (bands: BandSlot[], user: Profile, orgIds: Set<string>) => {
  if (user.accountType === "artist") return [];
  return bands.filter((band) => orgIds.has(band.orgId));
};

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const bandId = url.searchParams.get("bandId");
  const token = url.searchParams.get("token");
  const accounts = await readAccountsFile();
  const stored = await persistExpired((await readBandsFile()).bands);

  if (token) {
    const band = findBandByToken(stored, token);
    return NextResponse.json({
      active: Boolean(band && isBandAccessActive(band)),
      bandName: band?.bandName,
    });
  }

  if (bandId) {
    const band = stored.find((entry) => entry.id === bandId);
    return NextResponse.json({
      active: Boolean(band && isBandAccessActive(band)),
    });
  }

  if (!userId) return jsonError("Sign in to see band access.");
  const user = accounts.users.find((profile) => profile.id === userId);
  if (!user) return jsonError("Sign in to see band access.", 401);
  const orgIds = new Set(
    accounts.memberships.filter((membership) => membership.userId === user.id).map((membership) => membership.orgId),
  );
  return NextResponse.json({ bands: bandsForVenue(stored, user, orgIds) });
};

export const POST = async (request: Request) => {
  const body = (await request.json()) as { action?: string };
  const accounts = await readAccountsFile();
  const stored = await persistExpired((await readBandsFile()).bands);

  try {
    if (body.action === "create") {
      const input = createSchema.parse(body);
      const user = accounts.users.find((profile) => profile.id === input.userId);
      if (!user) return jsonError("Sign in before creating a band.", 401);
      if (user.accountType === "artist") {
        return jsonError("Only venue accounts can create band access.");
      }

      const ownedOrgIds = accounts.memberships
        .filter((membership) => membership.userId === user.id)
        .map((membership) => membership.orgId);
      const org =
        accounts.organizations.find((organization) => organization.id === (input.orgId || ownedOrgIds[0])) ??
        null;
      if (!org || !ownedOrgIds.includes(org.id)) {
        return jsonError("Add a venue in accounts.json before creating bands.");
      }

      const band = createBandSlot({
        org,
        createdByUserId: user.id,
        bandName: input.bandName,
        showDate: input.showDate,
        existing: stored,
      });
      const bands = [...stored, band];
      await writeBandsFile({ bands });
      return NextResponse.json({ band, bands: bandsForVenue(bands, user, new Set(ownedOrgIds)) });
    }

    if (body.action === "login") {
      const input = loginSchema.parse(body);
      const matched = findBandByToken(stored, input.token);
      try {
        const band = authenticateBandSlot(stored, input.token);
        const organization = accounts.organizations.find((entry) => entry.id === band.orgId);
        if (!organization) return jsonError("That band is not tied to a venue.");
        return NextResponse.json({
          ...toDirectory(accounts),
          band,
          profile: bandProfileFromSlot(band),
          sessionUserId: band.id,
          organization,
        });
      } catch (error) {
        if (matched && !isBandAccessActive(matched) && !matched.deactivatedAt) {
          await writeBandsFile({
            bands: stored.map((entry) =>
              entry.id === matched.id ? { ...entry, deactivatedAt: new Date().toISOString() } : entry,
            ),
          });
        }
        throw error;
      }
    }

    if (body.action === "deactivate") {
      const input = deactivateSchema.parse(body);
      const user = accounts.users.find((profile) => profile.id === input.userId);
      if (!user) return jsonError("Sign in before changing band access.", 401);
      const orgIds = new Set(
        accounts.memberships.filter((membership) => membership.userId === user.id).map((membership) => membership.orgId),
      );
      const target = stored.find((entry) => entry.id === input.bandId);
      if (!target || !orgIds.has(target.orgId)) return jsonError("That band access was not found.");
      const bands = deactivateBandSlot(stored, input.bandId);
      await writeBandsFile({ bands });
      return NextResponse.json({ bands: bandsForVenue(bands, user, orgIds) });
    }

    return jsonError("That request was not valid.");
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("That request was not valid.");
    return jsonError(error instanceof Error ? error.message : "Could not update band access.");
  }
};
