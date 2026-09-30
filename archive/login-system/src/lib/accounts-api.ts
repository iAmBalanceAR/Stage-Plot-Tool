import type { AccountType, Organization, OrgMembership, Profile } from "@/types/account";

export interface AccountDirectory {
  users: Profile[];
  organizations: Organization[];
  memberships: OrgMembership[];
  sessionUserId?: string | null;
}

const readError = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "The accounts file could not be updated.";
  } catch {
    return "The accounts file could not be updated.";
  }
};

const postAccounts = async (body: Record<string, unknown>): Promise<AccountDirectory> => {
  const response = await fetch("/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as AccountDirectory;
};

export const fetchAccountDirectory = async (): Promise<AccountDirectory> => {
  const response = await fetch("/api/accounts", { cache: "no-store" });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as AccountDirectory;
};

export const registerAccount = (input: {
  email: string;
  displayName: string;
  password: string;
  accountType: AccountType;
  venueName?: string;
}) => postAccounts({ action: "register", ...input });

export const loginAccount = (email: string, password: string) =>
  postAccounts({ action: "login", email, password });

export const createVenueAccount = (userId: string, name: string) =>
  postAccounts({ action: "createVenue", userId, name });

export const joinVenueAccount = (userId: string, inviteCode: string) =>
  postAccounts({ action: "joinVenue", userId, inviteCode });
