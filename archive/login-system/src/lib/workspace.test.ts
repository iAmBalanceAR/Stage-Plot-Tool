import { beforeEach, describe, expect, it } from "vitest";
import { createBlankProject } from "@/data/templates";
import {
  authenticateProfile,
  canViewPlot,
  canViewSubmission,
  createOrganization,
  countUnreadSubmissions,
  listVisiblePlots,
  listVisibleSubmissions,
  markSubmissionRead,
  registerProfile,
  submitPlotToVenue,
  upsertPlotForUser,
} from "@/lib/workspace";
import type { Profile, WorkspaceData } from "@/types/account";

const empty = (): WorkspaceData => ({
  version: 1,
  profiles: [],
  sessionUserId: null,
  organizations: [],
  memberships: [],
  plots: [],
  submissions: [],
});

describe("workspace permissions", () => {
  let workspace: WorkspaceData;

  beforeEach(() => {
    workspace = empty();
  });

  it("keeps artist plots private from venue owners and other artists", async () => {
    const artistOne = await registerProfile(workspace, {
      email: "band@example.com",
      displayName: "Night Signals",
      password: "password12",
      accountType: "artist",
    });
    workspace = artistOne.workspace;
    const project = createBlankProject();
    project.actName = "Night Signals";
    workspace = upsertPlotForUser(workspace, artistOne.profile, project);

    const artistTwo = await registerProfile(workspace, {
      email: "duo@example.com",
      displayName: "Duo",
      password: "password12",
      accountType: "artist",
    });
    workspace = artistTwo.workspace;

    const venue = await registerProfile(workspace, {
      email: "taproom@example.com",
      displayName: "Kim",
      password: "password12",
      accountType: "venue_owner",
      venueName: "The Taproom",
    });
    workspace = venue.workspace;

    const plot = workspace.plots[0];
    expect(canViewPlot(artistOne.profile, plot)).toBe(true);
    expect(canViewPlot(artistTwo.profile, plot)).toBe(false);
    expect(canViewPlot(venue.profile, plot)).toBe(false);
    expect(listVisiblePlots(workspace, venue.profile)).toHaveLength(0);
    expect(listVisiblePlots(workspace, artistTwo.profile)).toHaveLength(0);
    expect(listVisiblePlots(workspace, artistOne.profile)).toHaveLength(1);
  });

  it("lets a venue see snapshots sent to its org and not another venue", async () => {
    const artist = await registerProfile(workspace, {
      email: "band@example.com",
      displayName: "Night Signals",
      password: "password12",
      accountType: "artist",
    });
    workspace = artist.workspace;
    const taproom = await registerProfile(workspace, {
      email: "taproom@example.com",
      displayName: "Kim",
      password: "password12",
      accountType: "venue_owner",
      venueName: "The Taproom",
    });
    workspace = taproom.workspace;
    const hideout = await registerProfile(workspace, {
      email: "hideout@example.com",
      displayName: "Lee",
      password: "password12",
      accountType: "venue_owner",
      venueName: "The Hideout",
    });
    workspace = hideout.workspace;

    const project = createBlankProject();
    project.actName = "Night Signals";
    project.readyToSubmit = true;
    const invite = workspace.organizations.find((org) => org.name === "The Taproom")!.inviteCode;
    const sent = submitPlotToVenue(workspace, artist.profile, project, invite, "2026-10-01");
    workspace = sent.workspace;

    expect(sent.submission.status).toBe("completed");

    expect(canViewSubmission(taproom.profile, sent.submission, workspace.memberships)).toBe(true);
    expect(canViewSubmission(hideout.profile, sent.submission, workspace.memberships)).toBe(false);
    expect(listVisibleSubmissions(workspace, taproom.profile)).toHaveLength(1);
    expect(listVisibleSubmissions(workspace, hideout.profile)).toHaveLength(0);
    expect(listVisibleSubmissions(workspace, artist.profile)).toHaveLength(1);
    expect(countUnreadSubmissions(workspace, taproom.profile)).toBe(1);
    expect(countUnreadSubmissions(workspace, hideout.profile)).toBe(0);

    workspace = markSubmissionRead(workspace, taproom.profile, sent.submission.id);
    expect(countUnreadSubmissions(workspace, taproom.profile)).toBe(0);
  });

  it("refuses a send until the band checks that they are ready to submit", async () => {
    const artist = await registerProfile(workspace, {
      email: "band@example.com",
      displayName: "Night Signals",
      password: "password12",
      accountType: "artist",
    });
    workspace = artist.workspace;
    const venue = await registerProfile(workspace, {
      email: "taproom@example.com",
      displayName: "Kim",
      password: "password12",
      accountType: "venue_owner",
      venueName: "The Taproom",
    });
    workspace = venue.workspace;
    const invite = workspace.organizations.find((org) => org.name === "The Taproom")!.inviteCode;
    const project = createBlankProject();

    expect(() => submitPlotToVenue(workspace, artist.profile, project, invite, "2026-10-01")).toThrow(
      "Are you ready to submit",
    );
  });

  it("lets a venue-created band submit without an invite code", async () => {
    const venue = await registerProfile(workspace, {
      email: "taproom@example.com",
      displayName: "Kim",
      password: "password12",
      accountType: "venue_owner",
      venueName: "The Taproom",
    });
    workspace = venue.workspace;
    const org = workspace.organizations[0];
    const band: Profile = {
      id: "band-slot-1",
      email: "band-slot-1@local",
      displayName: "Awesome Band",
      accountType: "artist",
      password: "",
      createdAt: new Date().toISOString(),
      bandSlotId: "band-slot-1",
      orgId: org.id,
      showDate: "2026-10-03",
    };
    workspace = { ...workspace, profiles: [...workspace.profiles, band] };
    const project = createBlankProject();
    project.actName = "Awesome Band";
    project.readyToSubmit = true;

    const sent = submitPlotToVenue(workspace, band, project, "", "2026-10-03");
    expect(sent.organization?.id).toBe(org.id);
    expect(sent.submission.status).toBe("completed");
    expect(listVisibleSubmissions(sent.workspace, venue.profile)).toHaveLength(1);
  });

  it("rejects venue creation by artists and checks passwords", async () => {
    const artist = await registerProfile(workspace, {
      email: "band@example.com",
      displayName: "Night Signals",
      password: "password12",
      accountType: "artist",
    });
    expect(() => createOrganization(artist.workspace, artist.profile, "Illegal Room")).toThrow(
      "Artist accounts cannot create venues.",
    );

    await expect(
      authenticateProfile(artist.workspace, "band@example.com", "wrong-pass"),
    ).rejects.toThrow("That password is incorrect.");
  });

  it("does not give venue owners guest drafts or a working plot library", async () => {
    const guest: Profile = {
      id: "local-guest",
      email: "guest@local",
      displayName: "Local drafts",
      accountType: "artist",
      password: "",
      createdAt: new Date().toISOString(),
    };
    workspace = {
      ...workspace,
      profiles: [guest],
      sessionUserId: "local-guest",
    };
    const draft = createBlankProject();
    draft.actName = "Guest draft";
    workspace = upsertPlotForUser(workspace, guest, draft);

    const venue = await registerProfile(workspace, {
      email: "taproom@example.com",
      displayName: "Kim",
      password: "password12",
      accountType: "venue_owner",
      venueName: "The Taproom",
    });
    workspace = venue.workspace;
    workspace = upsertPlotForUser(workspace, venue.profile, draft);

    expect(workspace.plots[0].ownerId).toBe("local-guest");
    expect(listVisiblePlots(workspace, venue.profile)).toHaveLength(0);
  });
});
