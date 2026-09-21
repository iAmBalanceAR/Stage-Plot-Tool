"use client";

import { create } from "zustand";
import {
  createVenueAccount,
  fetchAccountDirectory,
  joinVenueAccount,
  loginAccount,
  registerAccount,
} from "@/lib/accounts-api";
import {
  createBandAccess,
  deactivateBandAccess,
  fetchVenueBands,
  loginBandAccess,
  verifyBandAccess,
} from "@/lib/bands-api";
import { GUEST_USER_ID } from "@/types/account";
import {
  authenticateProfile,
  createOrganization,
  deletePlotForUser,
  getCurrentProfile,
  getOrganizationsForUser,
  importSubmission,
  joinOrganization,
  listVisiblePlots,
  listVisibleSubmissions,
  loadWorkspace,
  markSubmissionRead,
  mergeAccountDirectory,
  registerProfile,
  saveWorkspace,
  signOutWorkspace,
  submitPlotToVenue,
  upsertPlotForUser,
} from "@/lib/workspace";
import type {
  AccountType,
  BandSlot,
  Organization,
  PlotRecord,
  Profile,
  SubmissionRecord,
  WorkspaceData,
} from "@/types/account";
import type { StageProject } from "@/types/stage";

interface WorkspaceStore {
  workspace: WorkspaceData;
  profile: Profile;
  bands: BandSlot[];
  isReady: boolean;
  hydrateWorkspace: () => void;
  persist: (workspace: WorkspaceData) => void;
  applyDirectory: (
    directory: {
      users: Profile[];
      organizations: Organization[];
      memberships: WorkspaceData["memberships"];
      sessionUserId?: string | null;
    },
    sessionUserId?: string | null,
  ) => void;
  saveCurrentPlot: (project: StageProject) => void;
  signUp: (input: {
    email: string;
    displayName: string;
    password: string;
    accountType: AccountType;
    venueName?: string;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInBand: (token: string) => Promise<Profile>;
  signOut: () => void;
  createVenue: (name: string) => Promise<void>;
  joinVenue: (inviteCode: string) => Promise<void>;
  refreshBands: () => Promise<void>;
  createBand: (input: { bandName: string; showDate: string; orgId?: string }) => Promise<BandSlot>;
  deactivateBand: (bandId: string) => Promise<void>;
  submitPlot: (project: StageProject, inviteCode: string, showDate: string) => SubmissionRecord;
  receiveSubmission: (value: unknown) => void;
  markInboxRead: (submissionId: string) => void;
  removePlot: (plotId: string) => void;
  visiblePlots: () => PlotRecord[];
  visibleSubmissions: () => SubmissionRecord[];
  organizations: () => Organization[];
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspace: loadWorkspace(),
  profile: getCurrentProfile(loadWorkspace()),
  bands: [],
  isReady: false,
  hydrateWorkspace: () => {
    void (async () => {
      const local = loadWorkspace();
      try {
        const directory = await fetchAccountDirectory();
        let workspace = mergeAccountDirectory(local, directory);
        const profile = getCurrentProfile(workspace);
        if (profile.bandSlotId && !(await verifyBandAccess(profile.bandSlotId))) {
          workspace = signOutWorkspace(workspace);
        }
        saveWorkspace(workspace);
        set({
          workspace,
          profile: getCurrentProfile(workspace),
          isReady: true,
        });
        await get().refreshBands();
      } catch {
        set({
          workspace: local,
          profile: getCurrentProfile(local),
          isReady: true,
        });
      }
    })();
  },
  persist: (workspace) => {
    saveWorkspace(workspace);
    set({ workspace, profile: getCurrentProfile(workspace) });
  },
  applyDirectory: (directory, sessionUserId) => {
    const { workspace, persist } = get();
    persist({
      ...mergeAccountDirectory(workspace, directory),
      sessionUserId: sessionUserId ?? directory.sessionUserId ?? workspace.sessionUserId,
    });
  },
  saveCurrentPlot: (project) => {
    const { workspace, profile, persist } = get();
    if (profile.id === GUEST_USER_ID) return;
    persist(upsertPlotForUser(workspace, profile, project));
  },
  signUp: async (input) => {
    try {
      const directory = await registerAccount(input);
      get().applyDirectory(directory, directory.sessionUserId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) throw error;
      const result = await registerProfile(get().workspace, input);
      get().persist(result.workspace);
    }
  },
  signIn: async (email, password) => {
    try {
      const directory = await loginAccount(email, password);
      get().applyDirectory(directory, directory.sessionUserId);
      await get().refreshBands();
    } catch {
      const workspace = await authenticateProfile(get().workspace, email, password);
      get().persist(workspace);
      const profile = getCurrentProfile(workspace);
      if (profile.password || password) {
        try {
          const directory = await registerAccount({
            email: profile.email,
            displayName: profile.displayName,
            password,
            accountType: profile.accountType === "staff" ? "venue_owner" : profile.accountType,
          });
          get().applyDirectory(directory, directory.sessionUserId);
        } catch {
          /* local session still works if the file cannot be written */
        }
      }
    }
  },
  signInBand: async (token) => {
    const directory = await loginBandAccess(token);
    if (!directory.profile) throw new Error("This band link is not valid.");
    get().applyDirectory(
      {
        ...directory,
        users: [...directory.users, directory.profile],
      },
      directory.profile.id,
    );
    return directory.profile;
  },
  signOut: () => get().persist(signOutWorkspace(get().workspace)),
  createVenue: async (name) => {
    const { workspace, profile, persist, applyDirectory } = get();
    try {
      const directory = await createVenueAccount(profile.id, name);
      applyDirectory(directory, profile.id);
    } catch {
      persist(createOrganization(workspace, profile, name));
    }
  },
  joinVenue: async (inviteCode) => {
    const { workspace, profile, persist, applyDirectory } = get();
    try {
      const directory = await joinVenueAccount(profile.id, inviteCode);
      applyDirectory(directory, profile.id);
    } catch (error) {
      if (error instanceof Error && /invite|staff|Artist/i.test(error.message)) throw error;
      persist(joinOrganization(workspace, profile, inviteCode));
    }
  },
  refreshBands: async () => {
    const { profile } = get();
    if (profile.accountType === "artist" || profile.id === GUEST_USER_ID) {
      set({ bands: [] });
      return;
    }
    try {
      set({ bands: await fetchVenueBands(profile.id) });
    } catch {
      set({ bands: [] });
    }
  },
  createBand: async (input) => {
    const { profile } = get();
    const directory = await createBandAccess({
      userId: profile.id,
      orgId: input.orgId,
      bandName: input.bandName,
      showDate: input.showDate,
    });
    if (!directory.band) throw new Error("The band link could not be created.");
    set({ bands: directory.bands ?? [directory.band] });
    return directory.band;
  },
  deactivateBand: async (bandId) => {
    const { profile } = get();
    const directory = await deactivateBandAccess(profile.id, bandId);
    set({ bands: directory.bands ?? [] });
  },
  submitPlot: (project, inviteCode, showDate) => {
    const { workspace, profile, persist } = get();
    const result = submitPlotToVenue(workspace, profile, project, inviteCode, showDate);
    persist(result.workspace);
    return result.submission;
  },
  receiveSubmission: (value) => {
    const { workspace, profile, persist } = get();
    persist(importSubmission(workspace, profile, value));
  },
  markInboxRead: (submissionId) => {
    const { workspace, profile, persist } = get();
    persist(markSubmissionRead(workspace, profile, submissionId));
  },
  removePlot: (plotId) => {
    const { workspace, profile, persist } = get();
    persist(deletePlotForUser(workspace, profile, plotId));
  },
  visiblePlots: () => listVisiblePlots(get().workspace, get().profile),
  visibleSubmissions: () => listVisibleSubmissions(get().workspace, get().profile),
  organizations: () => getOrganizationsForUser(get().workspace, get().profile.id),
}));
