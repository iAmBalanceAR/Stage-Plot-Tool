import { NextResponse } from "next/server";
import { z } from "zod";
import { readAccountsFile, toDirectory, writeAccountsFile } from "@/lib/accounts-file";
import {
  authenticateProfile,
  createOrganization,
  joinOrganization,
  registerProfile,
} from "@/lib/workspace";
import { GUEST_USER_ID, type WorkspaceData } from "@/types/account";

const registerSchema = z.object({
  action: z.literal("register"),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  accountType: z.enum(["artist", "venue_owner"]),
  venueName: z.string().optional(),
});

const loginSchema = z.object({
  action: z.literal("login"),
  email: z.string().email(),
  password: z.string().min(1),
});

const createVenueSchema = z.object({
  action: z.literal("createVenue"),
  userId: z.string().min(1),
  name: z.string().min(1),
});

const joinVenueSchema = z.object({
  action: z.literal("joinVenue"),
  userId: z.string().min(1),
  inviteCode: z.string().min(1),
});

const toWorkspace = (accounts: Awaited<ReturnType<typeof readAccountsFile>>): WorkspaceData => ({
  version: 1,
  profiles: accounts.users,
  sessionUserId: null,
  organizations: accounts.organizations,
  memberships: accounts.memberships,
  plots: [],
  submissions: [],
});

const persistWorkspace = async (workspace: WorkspaceData) => {
  const accounts = {
    users: workspace.profiles.filter((profile) => profile.id !== GUEST_USER_ID),
    organizations: workspace.organizations,
    memberships: workspace.memberships,
  };
  await writeAccountsFile(accounts);
  return accounts;
};

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export const GET = async () => {
  const accounts = await readAccountsFile();
  return NextResponse.json(toDirectory(accounts));
};

export const POST = async (request: Request) => {
  const body = (await request.json()) as { action?: string };
  const accounts = await readAccountsFile();
  const workspace = toWorkspace(accounts);

  try {
    if (body.action === "register") {
      const input = registerSchema.parse(body);
      const result = await registerProfile(workspace, input);
      const saved = await persistWorkspace(result.workspace);
      return NextResponse.json({
        ...toDirectory(saved),
        sessionUserId: result.profile.id,
      });
    }

    if (body.action === "login") {
      const input = loginSchema.parse(body);
      const nextWorkspace = await authenticateProfile(workspace, input.email, input.password);
      return NextResponse.json({
        ...toDirectory(accounts),
        sessionUserId: nextWorkspace.sessionUserId,
      });
    }

    if (body.action === "createVenue") {
      const input = createVenueSchema.parse(body);
      const user = workspace.profiles.find((profile) => profile.id === input.userId);
      if (!user) return jsonError("Sign in before adding a venue.", 401);
      const saved = await persistWorkspace(createOrganization(workspace, user, input.name));
      return NextResponse.json({
        ...toDirectory(saved),
        sessionUserId: user.id,
      });
    }

    if (body.action === "joinVenue") {
      const input = joinVenueSchema.parse(body);
      const user = workspace.profiles.find((profile) => profile.id === input.userId);
      if (!user) return jsonError("Sign in before joining a venue.", 401);
      const saved = await persistWorkspace(joinOrganization(workspace, user, input.inviteCode));
      return NextResponse.json({
        ...toDirectory(saved),
        sessionUserId: user.id,
      });
    }

    return jsonError("That request was not valid.");
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError("That request was not valid.");
    return jsonError(error instanceof Error ? error.message : "Could not update accounts.");
  }
};
