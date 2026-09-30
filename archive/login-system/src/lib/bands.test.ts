import { describe, expect, it } from "vitest";
import {
  authenticateBandSlot,
  bandLinkPath,
  createBandSlot,
  deactivateBandSlot,
  expireStaleBands,
  isBandAccessActive,
} from "@/lib/bands";
import type { BandSlot, Organization } from "@/types/account";

const org: Organization = {
  id: "org-1",
  name: "River House",
  inviteCode: "RIVER1",
  ownerId: "venue-1",
  createdAt: "2026-09-21T00:00:00.000Z",
};

const slot = (overrides: Partial<BandSlot> = {}): BandSlot => ({
  id: "band-1",
  orgId: org.id,
  createdByUserId: "venue-1",
  bandName: "Awesome Band",
  linkToken: "k3x9qm2p",
  showDate: "2026-10-03",
  createdAt: "2026-09-21T00:00:00.000Z",
  ...overrides,
});

describe("band access", () => {
  it("creates a named slot with a unique link token", () => {
    const band = createBandSlot({
      org,
      createdByUserId: "venue-1",
      bandName: "  Awesome   Band ",
      showDate: "2026-10-03",
      existing: [slot()],
    });

    expect(band.bandName).toBe("Awesome Band");
    expect(band.orgId).toBe("org-1");
    expect(band.linkToken).toHaveLength(8);
    expect(band.linkToken).not.toBe("k3x9qm2p");
    expect(bandLinkPath(band.linkToken)).toBe(`/b/${band.linkToken}`);
  });

  it("opens from the unique link through the show date", () => {
    const band = authenticateBandSlot([slot()], "K3X9QM2P", new Date("2026-10-03T18:00:00.000Z"));
    expect(band.id).toBe("band-1");
    expect(isBandAccessActive(band, new Date("2026-10-03T23:00:00.000Z"))).toBe(true);
  });

  it("turns the link off once the performance date has passed", () => {
    expect(() => authenticateBandSlot([slot()], "k3x9qm2p", new Date("2026-10-04T00:00:00.000Z"))).toThrow(
      "expired after the show date",
    );

    const expired = expireStaleBands([slot()], new Date("2026-10-04T08:00:00.000Z"));
    expect(expired[0].deactivatedAt).toBeTruthy();
    expect(isBandAccessActive(expired[0], new Date("2026-10-04T08:00:00.000Z"))).toBe(false);
  });

  it("rejects a bad link and lets a venue turn it off early", () => {
    expect(() => authenticateBandSlot([slot()], "not-a-link")).toThrow("This band link is not valid.");

    const closed = deactivateBandSlot([slot()], "band-1", new Date("2026-09-22T00:00:00.000Z"));
    expect(closed[0].deactivatedAt).toBe("2026-09-22T00:00:00.000Z");
    expect(() => authenticateBandSlot(closed, "k3x9qm2p")).toThrow("expired after the show date");
  });
});
