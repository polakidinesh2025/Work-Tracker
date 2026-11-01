# TaskLite (Work-Tracker)

A fast Kanban task tracker for college teams. It tracks sub-team progress so you can see work priority, blockers and the flow of events at a glance.

It runs entirely on free services: a React app on Vercel or GitHub Pages, and Google Sheets + Apps Script as the backend. Sign-in is restricted to your college Google Workspace domain.

## Features

- **Kanban board** with 5 columns (Backlog, To Do, In Progress, Blocked, Done), drag-and-drop, and type-and-Enter quick add.
- **Blocker prompt:** dropping a card on Blocked asks what's blocking it and who can help. It posts a `[Blocker]` comment and emails anyone you tag.
- **Task drawer:** edit any field, comment, and tag comments as Update, Blocker or Question. Typing `@` autocompletes teammates and emails them.
- **Mentions inbox:** a bell in the navbar lists comments that mention you.
- **Team Dashboard:** active, completion, blocked and overdue KPIs; a progress card per teammate with workload and current focus; a feed of recent activity.
- **Instant UI:** every change shows immediately and syncs in the background. Unsent changes survive reloads and retry automatically.
- **Filters and search:** My Tasks, teammate avatars, priority, and `Ctrl/⌘+K` search.
- **Mobile-friendly and installable:** on phones the board shows one column at a time, with swipe snapping and jump tabs. Cards have a **Move to…** button instead of needing a drag. The task drawer goes full-screen and its comment box stays above the keyboard. Add TaskLite to your home screen to open it like an app.

### On your phone

Open the app URL, then:

- **iPhone (Safari):** Share → **Add to Home Screen**.
- **Android (Chrome):** ⋮ menu → **Add to Home screen** (or **Install app**).

TaskLite then opens full-screen with its own icon. It still needs a connection to sync; changes made while offline are queued and sent when you're back online.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl/⌘ + K` | Search and jump to a task |
| `/` | Filter the board |
| `N` | New task in To Do |
| `Esc` | Leave a field, then close the drawer or search |
| `Space`, then arrow keys | Move the focused card with the keyboard |

## Try it locally (no setup)

```bash
npm install
npm run dev
```

Open http://localhost:5173. Without Google settings the app runs in **Local Demo Mode** with sample data kept in your browser; the pill shows "Offline Demo". The ↺ button resets the sample data.

## Connect it to Google (about 15 minutes)

### 1. Google OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorized JavaScript origins**, add `http://localhost:5173` and your production URL, e.g. `https://tasklite.vercel.app` or `https://<user>.github.io`.
4. Copy the **Client ID**.

If the consent screen asks for a user type, choose **Internal**. Only accounts in your college Workspace can then sign in. If your college admin doesn't allow that, use **External**; the backend still rejects other domains.

### 2. Backend

Follow [backend/README.md](backend/README.md): paste the `.gs` files into Apps Script, set the `CLIENT_ID` and `ALLOWED_DOMAIN` script properties, run `setupSheet()`, and deploy it as a web app.

### 3. Frontend settings

Copy `.env.example` to `.env.local` and fill in:

```
VITE_GAS_API_URL=https://script.google.com/macros/s/<id>/exec
VITE_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
VITE_ALLOWED_DOMAIN=iimu.ac.in
```

Restart `npm run dev`. You'll see the college sign-in screen. The first person to sign in should be the account that ran `setupSheet()`, which makes them **Admin**. Everyone else is added as **Member** automatically the first time they sign in.

## Deploy

### Vercel (recommended)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new). It picks up Vite and `vercel.json`.
2. Add the three `VITE_*` variables under **Settings → Environment Variables**, then redeploy.
3. Add the Vercel URL to the OAuth client's **Authorized JavaScript origins**, and to the `APP_URL` script property so mention emails link to it.

### GitHub Pages

1. **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**: add `VITE_GAS_API_URL`, `VITE_GOOGLE_CLIENT_ID` and `VITE_ALLOWED_DOMAIN`.
3. Push to `main`. [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds the app with the right base path and publishes it to `https://<user>.github.io/<repo>/`.
4. Add `https://<user>.github.io` to the OAuth client's authorized origins.

## How it works

```
React (Vite + Zustand) ──POST text/plain──► Apps Script web app ──► Google Sheet
  │ optimistic store (localStorage)         │ verifies Google id_token        Tasks
  │ outbox queue → one request at a time    │   aud, email_verified, hd       Comments
  └ refresh on load / focus / 60s / Sync    └ LockService + delta writes      TeamMembers
```

- **Requests:** every call is a `POST` with `Content-Type: text/plain`, so the browser skips the CORS preflight. `UPDATE_TASK` sends only the changed fields, so teammates editing different fields never overwrite each other.
- **Changes:** each one updates the screen first, then waits in a saved queue ([src/sync/](src/sync/)). Failed sends retry with increasing delays (1s up to 30s). Fresh server data is merged underneath unsent changes, so a refresh never undoes an edit.
- **Security:** the backend checks that each sign-in token was issued for your Client ID, belongs to a verified account, and comes from your college domain. Only the creator or an Admin can delete a task. @mention emails can only go to team members.

## Project layout

```
backend/            Apps Script (Config, Router, Auth, Tasks, Comments, Members, Mail, SheetUtils, Setup)
src/auth/           Google sign-in gate, silent token refresh
src/sync/           outbox, sync engine, server/optimistic merge
src/store/          Zustand stores: workspace, auth, UI
src/services/       Apps Script client, demo backend, sample data
src/components/     board/, drawer/, dashboard/, layout/, search/, ui/
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 5173 |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run typecheck` | TypeScript only |
| `npm run preview` | Serve the production build locally |
