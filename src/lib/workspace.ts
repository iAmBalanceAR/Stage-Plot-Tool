import { parseProjectFile } from "@/lib/project";
import type { StageProject } from "@/types/stage";
import {
  GUEST_USER_ID,
  WORKSPACE_KEY,
  type AccountType,
  type Organization,
  type OrgMembership,
  type PlotRecord,
  type Profile,
  type SubmissionRecord,
  type WorkspaceData,
} from "@/types/account";

const emptyWorkspace = (): WorkspaceData => ({
  version: 1,
  profiles: [],
  sessionUserId: GUEST_USER_ID,
  organizations: [],
  memberships: [],
  plots: [],
  submissions: [],
});

export const mergeAccountDirectory = (
  workspace: WorkspaceData,
  directory: {
    users: Profile[];
    organizations: Organization[];
    memberships: OrgMembership[];
  },
): WorkspaceData => {
  const guest = workspace.profiles.find((profile) => profile.id === GUEST_USER_ID) ?? guestProfile();
  const users = directory.users.filter((profile) => profile.id !== GUEST_USER_ID);
  const knownIds = new Set(users.map((profile) => profile.id));
  const leftoverLocal = workspace.profiles.filter(
    (profile) => profile.id !== GUEST_USER_ID && !knownIds.has(profile.id),
  );

  return {
    ...workspace,
    profiles: [guest, ...users, ...leftoverLocal],
    organizations: directory.organizations,
    memberships: directory.memberships,
  };
};

const bytesToHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

export const hashSecret = async (secret: string, salt: string) => {
  const encoded = new TextEncoder().encode(`${salt}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(digest);
};

const createInviteCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase().replaceAll("0", "X").replaceAll("1", "K");

const guestProfile = (): Profile => ({
  id: GUEST_USER_ID,
  email: "guest@local",
  displayName: "Local drafts",
  accountType: "artist",
  password: "",
  createdAt: new Date().toISOString(),
});

export const withoutPasswords = (workspace: WorkspaceData): WorkspaceData => ({
  ...workspace,
  profiles: workspace.profiles.map((profile) => ({ ...profile, password: "" })),
});

export const loadWorkspace = (): WorkspaceData => {
  if (typeof window === "undefined") return emptyWorkspace();

  const storedValue = window.localStorage.getItem(WORKSPACE_KEY);
  if (!storedValue) {
    const workspace = emptyWorkspace();
    workspace.profiles = [guestProfile()];
    return workspace;
  }

  try {
    const parsed = JSON.parse(storedValue) as WorkspaceData;
    if (!parsed.profiles.some((profile) => profile.id === GUEST_USER_ID)) {
      parsed.profiles.unshift(guestProfile());
    }
    parsed.profiles = parsed.profiles.map((profile) => ({
      ...profile,
      password: profile.password ?? "",
    }));
    return parsed;
  } catch {
    return emptyWorkspace();
  }
};

export const saveWorkspace = (workspace: WorkspaceData) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(withoutPasswords(workspace)));
};

export const getCurrentProfile = (workspace: WorkspaceData): Profile =>
  workspace.profiles.find((profile) => profile.id === workspace.sessionUserId) ??
  workspace.profiles.find((profile) => profile.id === GUEST_USER_ID) ??
  guestProfile();

export const getMembershipsForUser = (workspace: WorkspaceData, userId: string) =>
  workspace.memberships.filter((membership) => membership.userId === userId);

export const getOrganizationsForUser = (workspace: WorkspaceData, userId: string) => {
  const orgIds = new Set(getMembershipsForUser(workspace, userId).map((membership) => membership.orgId));
  return workspace.organizations.filter((organization) => orgIds.has(organization.id));
};

export const canViewPlot = (user: Profile, plot: PlotRecord) => plot.ownerId === user.id;

export const canViewSubmission = (
  user: Profile,
  submission: SubmissionRecord,
  memberships: OrgMembership[],
) =>
  submission.artistId === user.id ||
  memberships.some(
    (membership) => membership.orgId === submission.orgId && membership.userId === user.id,
  );

export const listVisiblePlots = (workspace: WorkspaceData, user: Profile) =>
  workspace.plots
    .filter((plot) => canViewPlot(user, plot))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const listVisibleSubmissions = (workspace: WorkspaceData, user: Profile) => {
  const memberships = getMembershipsForUser(workspace, user.id);
  return workspace.submissions
    .filter((submission) => canViewSubmission(user, submission, memberships))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
};

export const isUnreadSubmission = (submission: SubmissionRecord) => !submission.readAt;

export const countUnreadSubmissions = (workspace: WorkspaceData, user: Profile) =>
  listVisibleSubmissions(workspace, user).filter(isUnreadSubmission).length;

export const markSubmissionRead = (
  workspace: WorkspaceData,
  user: Profile,
  submissionId: string,
): WorkspaceData => {
  const memberships = getMembershipsForUser(workspace, user.id);
  const submission = workspace.submissions.find((entry) => entry.id === submissionId);
  if (!submission || !canViewSubmission(user, submission, memberships) || submission.readAt) {
    return workspace;
  }

  return {
    ...workspace,
    submissions: workspace.submissions.map((entry) =>
      entry.id === submissionId ? { ...entry, readAt: new Date().toISOString() } : entry,
    ),
  };
};

const keepsWorkingPlots = (user: Profile) => user.accountType === "artist";

export const upsertPlotForUser = (
  workspace: WorkspaceData,
  user: Profile,
  project: StageProject,
): WorkspaceData => {
  if (!keepsWorkingPlots(user)) return workspace;

  const existingIndex = workspace.plots.findIndex((plot) => plot.id === project.id);
  if (existingIndex !== -1 && workspace.plots[existingIndex].ownerId !== user.id) {
    return workspace;
  }

  const record: PlotRecord = {
    id: project.id,
    ownerId: user.id,
    name: project.name,
    actName: project.actName,
    updatedAt: project.updatedAt,
    projectJson: JSON.stringify(project),
  };
  const plots =
    existingIndex === -1
      ? [...workspace.plots, record]
      : workspace.plots.map((plot, index) => (index === existingIndex ? record : plot));

  return { ...workspace, plots };
};

export const deletePlotForUser = (workspace: WorkspaceData, user: Profile, plotId: string) => {
  const plot = workspace.plots.find((entry) => entry.id === plotId);
  if (!plot || !canViewPlot(user, plot)) return workspace;
  return { ...workspace, plots: workspace.plots.filter((entry) => entry.id !== plotId) };
};

export const readPlotProject = (plot: PlotRecord): StageProject =>
  parseProjectFile(JSON.parse(plot.projectJson));

export const registerProfile = async (
  workspace: WorkspaceData,
  input: {
    email: string;
    displayName: string;
    password: string;
    accountType: AccountType;
    venueName?: string;
  },
) => {
  const email = input.email.trim().toLowerCase();
  if (workspace.profiles.some((profile) => profile.email === email && profile.id !== GUEST_USER_ID)) {
    throw new Error("An account with that email already exists.");
  }

  const profile: Profile = {
    id: crypto.randomUUID(),
    email,
    displayName: input.displayName.trim() || email,
    accountType: input.accountType,
    password: input.password,
    createdAt: new Date().toISOString(),
  };

  let nextWorkspace: WorkspaceData = {
    ...workspace,
    profiles: [...workspace.profiles, profile],
    sessionUserId: profile.id,
    plots:
      input.accountType === "artist" && workspace.sessionUserId === GUEST_USER_ID
        ? workspace.plots.map((plot) =>
            plot.ownerId === GUEST_USER_ID ? { ...plot, ownerId: profile.id } : plot,
          )
        : workspace.plots,
  };

  if (input.accountType === "venue_owner") {
    nextWorkspace = createOrganization(nextWorkspace, profile, input.venueName || `${profile.displayName}'s venue`);
  }

  return { workspace: nextWorkspace, profile };
};

export const authenticateProfile = async (
  workspace: WorkspaceData,
  email: string,
  password: string,
) => {
  const profile = workspace.profiles.find(
    (entry) => entry.email === email.trim().toLowerCase() && entry.id !== GUEST_USER_ID,
  );
  if (!profile) throw new Error("No account found for that email.");
  const passwordMatches =
    profile.password === password ||
    (Boolean(profile.passwordHash) &&
      (await hashSecret(password, profile.passwordSalt || "")) === profile.passwordHash);
  if (!passwordMatches) throw new Error("That password is incorrect.");
  return {
    ...workspace,
    sessionUserId: profile.id,
    profiles: workspace.profiles.map((entry) =>
      entry.id === profile.id ? { ...entry, password } : entry,
    ),
  };
};

export const signOutWorkspace = (workspace: WorkspaceData): WorkspaceData => ({
  ...workspace,
  sessionUserId: GUEST_USER_ID,
});

export const createOrganization = (
  workspace: WorkspaceData,
  user: Profile,
  name: string,
): WorkspaceData => {
  if (user.accountType === "artist") {
    throw new Error("Artist accounts cannot create venues.");
  }

  const organization: Organization = {
    id: crypto.randomUUID(),
    name: name.trim(),
    inviteCode: createInviteCode(),
    ownerId: user.id,
    createdAt: new Date().toISOString(),
  };

  return {
    ...workspace,
    organizations: [...workspace.organizations, organization],
    memberships: [
      ...workspace.memberships,
      { orgId: organization.id, userId: user.id, role: "owner" as const },
    ],
  };
};

export const joinOrganization = (
  workspace: WorkspaceData,
  user: Profile,
  inviteCode: string,
) => {
  const organization = workspace.organizations.find(
    (entry) => entry.inviteCode === inviteCode.trim().toUpperCase(),
  );
  if (!organization) throw new Error("No venue found for that invite code.");
  if (workspace.memberships.some((membership) => membership.orgId === organization.id && membership.userId === user.id)) {
    return workspace;
  }
  if (user.accountType === "artist") {
    throw new Error("Use Send to venue to deliver a plot. Staff join with a venue account.");
  }

  return {
    ...workspace,
    memberships: [...workspace.memberships, { orgId: organization.id, userId: user.id, role: "staff" as const }],
  };
};

export const submitPlotToVenue = (
  workspace: WorkspaceData,
  user: Profile,
  project: StageProject,
  inviteCode: string,
  showDate: string,
) => {
  if (user.accountType === "venue_owner") {
    throw new Error("Venue accounts receive plots. Sign in as an artist to send one.");
  }

  if (!project.readyToSubmit) {
    throw new Error("Check “Are you ready to submit?” before sending this plot.");
  }

  if (!inviteCode.trim() && !user.orgId) {
    throw new Error("This band is not tied to a venue.");
  }

  const organization = inviteCode.trim()
    ? workspace.organizations.find((entry) => entry.inviteCode === inviteCode.trim().toUpperCase())
    : workspace.organizations.find((entry) => entry.id === user.orgId);
  const submission: SubmissionRecord = {
    id: crypto.randomUUID(),
    orgId: organization?.id ?? `remote-${inviteCode.trim().toUpperCase()}`,
    artistId: user.id,
    artistName: user.displayName,
    actName: project.actName || project.name,
    eventName: project.eventName,
    showDate,
    submittedAt: new Date().toISOString(),
    status: "completed",
    snapshotJson: JSON.stringify(project),
  };

  return {
    workspace: organization
      ? { ...workspace, submissions: [...workspace.submissions, submission] }
      : workspace,
    submission,
    organization,
  };
};

export const importSubmission = (
  workspace: WorkspaceData,
  user: Profile,
  value: unknown,
) => {
  const orgs = getOrganizationsForUser(workspace, user.id);
  if (!orgs.length) throw new Error("Only venue staff can import submissions.");

  const payload = value as { kind?: string; submission?: SubmissionRecord };
  if (payload.kind !== "stagecraft-submission" || !payload.submission) {
    throw new Error("That file is not a StageCraft submission.");
  }

  const submission: SubmissionRecord = {
    ...payload.submission,
    id: crypto.randomUUID(),
    orgId: orgs[0].id,
    submittedAt: new Date().toISOString(),
    status: "submitted",
  };

  return { ...workspace, submissions: [...workspace.submissions, submission] };
};

export const createSubmissionFile = (submission: SubmissionRecord) => ({
  kind: "stagecraft-submission" as const,
  version: 1,
  submission,
});
