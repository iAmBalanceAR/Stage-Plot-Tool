"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  Building2,
  Copy,
  FolderOpen,
  Inbox,
  LogOut,
  Music,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { bandLinkPath, isBandAccessActive } from "@/lib/bands";
import { downloadBlob, getSafeFileName, parseProjectFile } from "@/lib/project";
import { createSubmissionFile, listVisiblePlots, listVisibleSubmissions, getOrganizationsForUser, readPlotProject, countUnreadSubmissions } from "@/lib/workspace";
import { useStageStore } from "@/store/stage-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { GUEST_USER_ID } from "@/types/account";
import type { StageProject } from "@/types/stage";

type DialogView = "none" | "account" | "library" | "inbox" | "submit" | "bands";

interface WorkspaceMenusProps {
  project: StageProject;
}

const Modal = ({
  title,
  eyebrow,
  children,
  onClose,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
    role="presentation"
    onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-dialog-title"
      className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-strong)]">
        {eyebrow}
      </p>
      <div className="mb-4 mt-1 flex items-start justify-between gap-3">
        <h2 id="workspace-dialog-title" className="text-xl font-black">
          {title}
        </h2>
        <button type="button" className="button-secondary" onClick={onClose}>
          Close
        </button>
      </div>
      {children}
    </section>
  </div>
);

export const WorkspaceMenus = ({ project }: WorkspaceMenusProps) => {
  const [view, setView] = useState<DialogView>("none");
  const [inviteCode, setInviteCode] = useState("");
  const [showDate, setShowDate] = useState(project.eventDate);
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = useWorkspaceStore((state) => state.profile);
  const workspace = useWorkspaceStore((state) => state.workspace);
  const bands = useWorkspaceStore((state) => state.bands);
  const signOut = useWorkspaceStore((state) => state.signOut);
  const createVenue = useWorkspaceStore((state) => state.createVenue);
  const joinVenue = useWorkspaceStore((state) => state.joinVenue);
  const createBand = useWorkspaceStore((state) => state.createBand);
  const deactivateBand = useWorkspaceStore((state) => state.deactivateBand);
  const refreshBands = useWorkspaceStore((state) => state.refreshBands);
  const submitPlot = useWorkspaceStore((state) => state.submitPlot);
  const receiveSubmission = useWorkspaceStore((state) => state.receiveSubmission);
  const markInboxRead = useWorkspaceStore((state) => state.markInboxRead);
  const removePlot = useWorkspaceStore((state) => state.removePlot);
  const setProject = useStageStore((state) => state.setProject);
  const updateProject = useStageStore((state) => state.updateProject);
  const plots = listVisiblePlots(workspace, profile);
  const submissions = listVisibleSubmissions(workspace, profile);
  const unreadCount = countUnreadSubmissions(workspace, profile);
  const organizations = getOrganizationsForUser(workspace, profile.id);
  const isGuest = profile.id === GUEST_USER_ID;
  const isVenue = profile.accountType === "venue_owner" || profile.accountType === "staff";
  const isBandSlot = Boolean(profile.bandSlotId);
  const venueForBand = workspace.organizations.find((organization) => organization.id === profile.orgId);

  const handleReadyToSubmit = () => {
    updateProject((current) => ({
      ...current,
      readyToSubmit: !current.readyToSubmit,
    }));
  };

  const handleCopyBandLink = async (token: string) => {
    const url = `${window.location.origin}${bandLinkPath(token)}`;
    await navigator.clipboard.writeText(url);
    toast.success("Band link copied");
  };

  const handleCreateBand = async (form: FormData) => {
    const bandName = String(form.get("bandName") || "");
    const date = String(form.get("showDate") || "");
    const orgId = String(form.get("orgId") || organizations[0]?.id || "");
    const band = await createBand({ bandName, showDate: date, orgId });
    toast.success(`Link ready for ${band.bandName}`);
  };

  const handleSubmit = () => {
    if (!project.readyToSubmit) {
      toast.error("Check “Are you ready to submit?” before sending.");
      return;
    }
    try {
      const code = isBandSlot ? "" : inviteCode;
      const date = isBandSlot ? profile.showDate || showDate || project.eventDate : showDate || project.eventDate;
      const submission = submitPlot(project, code, date);
      downloadBlob(
        new Blob([JSON.stringify(createSubmissionFile(submission), null, 2)], {
          type: "application/json",
        }),
        getSafeFileName(project, "submission.json"),
      );
      const sentToLocalInbox = Boolean(
        isBandSlot
          ? venueForBand
          : workspace.organizations.find((org) => org.inviteCode === inviteCode.trim().toUpperCase()),
      );
      toast.success(
        sentToLocalInbox
          ? "Submitted to the venue inbox and downloaded a copy"
          : "Submission file downloaded. The venue can import it into their inbox.",
      );
      setView("none");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The plot could not be sent.");
    }
  };

  return (
    <>
      <button
        type="button"
        className="button-icon"
        onClick={() => setView("library")}
        aria-label="Open saved plots"
        title="Plot library"
      >
        <FolderOpen className="h-4 w-4" />
      </button>
      {isVenue && (
        <button
          type="button"
          className="button-icon"
          onClick={() => {
            void refreshBands();
            setView("bands");
          }}
          aria-label="Create band links"
          title="Band links"
        >
          <Music className="h-4 w-4" />
        </button>
      )}
      {isVenue && (
        <button
          type="button"
          className="button-icon relative hidden sm:grid"
          onClick={() => setView("inbox")}
          aria-label={
            unreadCount
              ? `Venue inbox, ${unreadCount} unread submission${unreadCount === 1 ? "" : "s"}`
              : "Venue inbox"
          }
          title="Inbox"
        >
          <Inbox className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 rounded bg-red-600 px-1 text-[8px] font-black leading-4 text-white shadow">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
      {!isVenue && (
        <button
          type="button"
          className="button-icon hidden sm:grid"
          onClick={() => setView("submit")}
          aria-label="Send plot to a venue"
          title="Send to venue"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        className="button-secondary"
        onClick={() => setView("account")}
      >
        <UserRound className="h-4 w-4" />
        <span className="max-w-28 truncate">{isGuest ? "Sign in" : profile.displayName}</span>
      </button>

      {view === "account" && (
        <Modal eyebrow="Access" title={profile.displayName} onClose={() => setView("none")}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              {isBandSlot
                ? `Band link for ${profile.displayName}${venueForBand ? ` · ${venueForBand.name}` : ""}`
                : `Signed in as ${profile.email} · ${profile.accountType.replace("_", " ")}`}
            </p>
            {isVenue && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  Venue rooms
                </p>
                {organizations.map((organization) => (
                  <p key={organization.id} className="mt-2 text-sm font-bold">
                    {organization.name}
                  </p>
                ))}
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const name = String(new FormData(event.currentTarget).get("name") || "");
                    if (!name) return;
                    void (async () => {
                      try {
                        await createVenue(name);
                        event.currentTarget.reset();
                        toast.success("Venue added");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Could not add that venue.");
                      }
                    })();
                  }}
                >
                  <input name="name" className="input" placeholder="Add another room or brand" />
                  <button type="submit" className="button-secondary" aria-label="Add venue">
                    <Building2 className="h-4 w-4" />
                  </button>
                </form>
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const code = String(new FormData(event.currentTarget).get("staffCode") || "");
                    if (!code) return;
                    void (async () => {
                      try {
                        await joinVenue(code);
                        event.currentTarget.reset();
                        toast.success("Joined venue as staff");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Could not join that venue.");
                      }
                    })();
                  }}
                >
                  <input
                    name="staffCode"
                    className="input uppercase"
                    placeholder="Join as staff with invite code"
                    aria-label="Staff invite code"
                  />
                  <button type="submit" className="button-secondary">
                    Join
                  </button>
                </form>
              </div>
            )}
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                signOut();
                toast.success("Signed out");
                window.location.assign("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </Modal>
      )}

      {view === "library" && (
        <Modal eyebrow="Your plots" title="Plot library" onClose={() => setView("none")}>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Only plots you own appear here. Autosave keeps the current plot in this list.
          </p>
          <div className="grid gap-2">
            {plots.map((plot) => (
              <div
                key={plot.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setProject(readPlotProject(plot));
                    setView("none");
                    toast.success("Plot opened");
                  }}
                >
                  <span className="block truncate text-sm font-bold">{plot.actName || plot.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {new Date(plot.updatedAt).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                  aria-label={`Delete ${plot.name}`}
                  onClick={() => {
                    removePlot(plot.id);
                    toast.success("Plot removed from your library");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {!plots.length && <p className="empty-state text-sm">No saved plots yet. Start one and it will appear here.</p>}
          </div>
        </Modal>
      )}

      {view === "inbox" && (
        <Modal eyebrow="Venue" title="Submission inbox" onClose={() => setView("none")}>
          <p className="mb-3 text-xs text-[var(--muted)]">
            These are frozen copies sent to your venue. Bands keep their own working plots.
          </p>
          <button type="button" className="button-secondary mb-3" onClick={() => fileRef.current?.click()}>
            Import submission file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                receiveSubmission(JSON.parse(await file.text()));
                toast.success("Submission imported");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Import failed.");
              } finally {
                event.target.value = "";
              }
            }}
          />
          <div className="grid gap-2">
            {submissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                className="relative rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 pr-12 text-left"
                onClick={() => {
                  markInboxRead(submission.id);
                  setProject(parseProjectFile(JSON.parse(submission.snapshotJson)));
                  setView("none");
                  toast.success("Opened submitted snapshot");
                }}
              >
                <span className="block text-sm font-bold">{submission.actName}</span>
                <span className="text-[10px] text-[var(--muted)]">
                  {submission.artistName}
                  {submission.showDate ? ` · ${submission.showDate}` : ""} ·{" "}
                  {submission.status === "completed" ? "completed" : submission.status}
                </span>
                {!submission.readAt && (
                  <span className="absolute right-3 top-3 rounded bg-red-600 px-1 text-[8px] font-black leading-4 text-white shadow">
                    New
                  </span>
                )}
              </button>
            ))}
            {!submissions.length && <p className="text-sm text-[var(--muted)]">No submissions yet.</p>}
          </div>
        </Modal>
      )}

      {view === "bands" && (
        <Modal eyebrow="Venue" title="Band links" onClose={() => setView("none")}>
          <p className="mb-3 text-xs leading-relaxed text-[var(--muted)]">
            Create a band, copy the link, and text it. They open the link and build the plot. The
            link stops working the day after the show.
          </p>
          <form
            className="mb-4 grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              void (async () => {
                try {
                  await handleCreateBand(new FormData(form));
                  form.reset();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not create that band.");
                }
              })();
            }}
          >
            <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Band name
              <input name="bandName" className="input mt-1.5" placeholder="Awesome Band" required aria-label="Band name" />
            </label>
            <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Show date
              <input name="showDate" type="date" className="input mt-1.5" required aria-label="Show date" />
            </label>
            {organizations.length > 1 && (
              <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                Venue
                <select name="orgId" className="input mt-1.5" defaultValue={organizations[0]?.id} aria-label="Venue">
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button type="submit" className="button-primary">
              <Music className="h-4 w-4" />
              Create band link
            </button>
          </form>
          <div className="grid gap-2">
            {bands.map((band) => {
              const isActive = isBandAccessActive(band);
              return (
                <div
                  key={band.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{band.bandName}</p>
                      <p className="text-[10px] text-[var(--muted)]">
                        {band.showDate} · {isActive ? "active" : "expired"}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[var(--accent-strong)]">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}${bandLinkPath(band.linkToken)}`
                          : bandLinkPath(band.linkToken)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="button-icon"
                        aria-label={`Copy link for ${band.bandName}`}
                        onClick={() => void handleCopyBandLink(band.linkToken)}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {isActive && (
                        <button
                          type="button"
                          className="rounded-lg p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                          aria-label={`Turn off link for ${band.bandName}`}
                          onClick={() => {
                            void (async () => {
                              try {
                                await deactivateBand(band.id);
                                toast.success("Band link turned off");
                              } catch (error) {
                                toast.error(
                                  error instanceof Error ? error.message : "Could not turn that link off.",
                                );
                              }
                            })();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!bands.length && <p className="text-sm text-[var(--muted)]">No band links yet.</p>}
          </div>
        </Modal>
      )}

      {view === "submit" && (
        <Modal eyebrow="Advance" title="Send to venue" onClose={() => setView("none")}>
          <p className="mb-3 text-xs leading-relaxed text-[var(--muted)]">
            {isBandSlot
              ? `This plot goes to ${venueForBand?.name || "your venue"}. Check the box when the packet is done.`
              : "Enter the venue’s invite code. A snapshot is saved to their inbox, and a submission file is downloaded."}
          </p>
          {!isBandSlot && (
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Invite code
              <input
                className="input mt-1.5 uppercase"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                placeholder="AB12KX"
                aria-label="Venue invite code"
              />
            </label>
          )}
          <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
            Show date
            <input
              type="date"
              className="input mt-1.5"
              value={isBandSlot ? profile.showDate || showDate : showDate}
              onChange={(event) => setShowDate(event.target.value)}
              readOnly={isBandSlot}
              aria-label="Show date"
            />
          </label>
          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
              checked={project.readyToSubmit}
              onChange={handleReadyToSubmit}
              aria-label="Are you ready to submit"
            />
            <span>
              <span className="block text-sm font-black text-[var(--foreground)]">
                Are you ready to submit?
              </span>
              <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-[var(--muted)]">
                This is what marks the packet completed for the venue.
              </span>
            </span>
          </label>
          <button
            type="button"
            className="button-primary w-full"
            onClick={handleSubmit}
            disabled={(!isBandSlot && !inviteCode.trim()) || !project.readyToSubmit}
          >
            <Send className="h-4 w-4" />
            Send snapshot
          </button>
        </Modal>
      )}
    </>
  );
};
