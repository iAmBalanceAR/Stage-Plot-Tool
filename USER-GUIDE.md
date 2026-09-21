# StageCraft user guide

StageCraft is a stage-plot tool for live bands. It makes a picture of who stands where, what they play through, and a channel list the house engineer can patch from.

There are two kinds of people:

- **Venue** — the club, room, or promoter. They sign in with an email and password.
- **Band** — the act playing that night. They never make an account. They tap a link the venue sent them.

If you were asked to “go to the website and log in,” you are the venue. If you got a text that just says “build your plot here,” you are the band.

---

## For the venue

### Sign in

1. Open the StageCraft website (not a `/b/…` link).
2. Enter the email and password you were given.
3. You should land on the empty stage.

Bands cannot use this sign-in screen. If a musician is stuck here, they opened the wrong page. Send them their unique link again.

### Create a link for a band

1. Click the **music-note** button in the top bar (Band links).
2. Type the act name exactly as you want it to appear.
3. Pick the **show date**.
4. Click **Create band link**.
5. Click the copy button next to their name.

Text or email that full web address. That is the whole login. Do not add a password. Do not ask them to type a code.

Example of what you send:

> Hi — here’s your stage plot link for Saturday. Open it, build the plot, check “ready to submit,” and send.  
> https://your-site.example/b/s4zbgknz

You can make as many links as you have acts. Each one is tied to your room.

### When the link stops working

The link works **through the show date**. The next day it is dead. That is on purpose, so old links cannot be reused.

You can also turn a link off early from the same Band links list (trash icon).

If someone says “link unavailable”:

- The show date already passed, or
- You turned the link off, or
- They mistyped the address (send the copied URL again)

### Inbox (the red number)

When a band submits, a **red number** appears on the inbox icon — same look as the red channel numbers on the plot. That is how many new packets you have not opened yet.

1. Click **Inbox**.
2. Unread rows say **New** in red.
3. Click a row to open that frozen copy.
4. The red count drops after you open it.

This is a snapshot. The band can still mess with their own working plot. What you opened is what they sent.

If the band is on a different phone or computer than you, they also get a downloaded submission file. Use **Import submission file** in Inbox and pick that file.

### Looking at a plot

Once a snapshot is open you can:

- Zoom the stage
- Read the **Details**, **Inputs**, **Mixes**, **Notes**, and **Check** tabs
- Click **Export** for a PDF packet, a PNG picture, a spreadsheet of channels, or a printable plot

You are looking at what they sent. You do not need to rebuild it.

### Extra rooms or staff

In your name menu you can add another room, or join someone else’s room with an invite code if you were given one. Day-to-day, most venues only need Band links and Inbox.

---

## For the band

You should have a web link from the venue. Open it on your phone or laptop. You should see the stage with your band name already filled in. No password.

If the page says the link is unavailable, ask the venue for a new one. Do not try to “sign in” on the front page.

### Build the plot

The **audience is at the bottom**. Stage left is *your* left when you face the crowd.

1. Optionally pick a **template** (full band, trio, duo, or blank) from the left side.
2. Click or drag objects onto the stage: people, drums, amps, wedges, stands, power, and so on.
3. Drag to move. Use the arrow keys for small nudges. Delete removes the selected object.
4. Click an object to rename it, mark it as house gear, or put a **channel number** on it. Those red numbers on the corners are what the engineer sees.

House gear = the venue already has it. Everything else is assumed to be yours unless you say so.

### Fill the packet

Use the tabs on the right (or **Details** on a phone):

- **Details** — act name, event, venue, stage size, who to call
- **Inputs** — one row per channel: source, mic or DI, stand, 48V, who plays it, where it goes
- **Mixes** — wedges and IEMs
- **Notes** — power, wireless, anything that would otherwise turn into a 2 a.m. text
- **Check** — a punch list, including **Are you ready to submit?**

The plot and the input list should agree. If the kick is channel 1 on the list, put `1` on the kick on the plot.

### Save, export, send

Your work autosaves **in this browser**. If you switch from your phone to a laptop, export an **editable project** from the Export menu and import it on the other device.

When the plot is actually done:

1. Check **Are you ready to submit?** (Check tab or the Send window).
2. Click **Send** (paper-plane icon).
3. Confirm. That marks the packet complete for the venue and downloads a copy for you.

You can still export for yourself at any time:

- **Technical packet PDF** — the thing to email if someone asks for “the rider plot”
- **Stage plot PNG** — a picture for group chats
- **Input list CSV** — for a console or spreadsheet
- **Editable project** — your backup to open later in StageCraft

### After the show

The link will stop working the day after the date on it. Keep your PDF or project file if you want the plot for the next gig.

---

## Tips

**I signed in and I am not the venue.** Close that page and open the link you were texted.

**I built a whole plot and it vanished.** You are probably on a different phone, a different browser, or private browsing. Import the editable project file if you still have it.

**The venue never got my plot.** Send them the downloaded submission file, or the PDF. Opening the link on your phone does not automatically appear on their office computer.

**Undo / redo.** Ctrl+Z and Ctrl+Y (Cmd on a Mac).

**Dark mode.** Sun/moon button in the header.

**Phone.** Bottom of the screen switches between Objects, Stage, and Details.

---

## What StageCraft is not

It is a **band** advance tool: stage layout, patch list, monitors, power, and notes. It is not a seating chart, ADA plan, or theatre lighting plot.

If something is broken in a way this page does not cover, the person who set up the website (see the project README) owns the login file and the band links.
