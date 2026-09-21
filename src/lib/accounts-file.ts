import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Organization, OrgMembership, Profile } from "@/types/account";

export interface AccountsFile {
  users: Profile[];
  organizations: Organization[];
  memberships: OrgMembership[];
}

const accountsPath = () =>
  process.env.STAGECRAFT_ACCOUNTS_FILE || path.join(process.cwd(), "data", "accounts.json");

const emptyAccounts = (): AccountsFile => ({
  users: [],
  organizations: [],
  memberships: [],
});

export const publicUser = (profile: Profile): Profile => ({
  ...profile,
  password: "",
  passwordSalt: undefined,
  passwordHash: undefined,
});

export const readAccountsFile = async (): Promise<AccountsFile> => {
  try {
    const raw = await readFile(accountsPath(), "utf8");
    const parsed = JSON.parse(raw) as AccountsFile;
    return {
      users: parsed.users ?? [],
      organizations: parsed.organizations ?? [],
      memberships: parsed.memberships ?? [],
    };
  } catch {
    return emptyAccounts();
  }
};

export const writeAccountsFile = async (accounts: AccountsFile) => {
  const filePath = accountsPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(accounts, null, 2)}\n`, "utf8");
};

export const toDirectory = (accounts: AccountsFile) => ({
  users: accounts.users.map(publicUser),
  organizations: accounts.organizations,
  memberships: accounts.memberships,
});
