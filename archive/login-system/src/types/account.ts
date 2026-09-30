export type AccountType = "artist" | "venue_owner" | "staff";
export type OrgRole = "owner" | "staff";
export type SubmissionStatus = "submitted" | "completed" | "accepted";

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  accountType: AccountType;
  password: string;
  createdAt: string;
  passwordSalt?: string;
  passwordHash?: string;
  bandSlotId?: string;
  orgId?: string;
  showDate?: string;
}

export interface BandSlot {
  id: string;
  orgId: string;
  createdByUserId: string;
  bandName: string;
  linkToken: string;
  showDate: string;
  createdAt: string;
  deactivatedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
}

export interface OrgMembership {
  orgId: string;
  userId: string;
  role: OrgRole;
}

export interface PlotRecord {
  id: string;
  ownerId: string;
  name: string;
  actName: string;
  updatedAt: string;
  projectJson: string;
}

export interface SubmissionRecord {
  id: string;
  orgId: string;
  artistId: string;
  artistName: string;
  actName: string;
  eventName: string;
  showDate: string;
  submittedAt: string;
  status: SubmissionStatus;
  snapshotJson: string;
  readAt?: string;
}

export interface WorkspaceData {
  version: 1;
  profiles: Profile[];
  sessionUserId: string | null;
  organizations: Organization[];
  memberships: OrgMembership[];
  plots: PlotRecord[];
  submissions: SubmissionRecord[];
}

export const GUEST_USER_ID = "local-guest";
export const WORKSPACE_KEY = "stagecraft-workspace-v1";
