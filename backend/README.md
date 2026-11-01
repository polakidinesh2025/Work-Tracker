# TaskLite backend (Google Sheets + Apps Script)

## Deploy

1. Create a Google Sheet with your **college** account, then open **Extensions → Apps Script**.
2. Create one script file per `.gs` file in this folder and paste in its contents. Apps Script shares a single global scope across files, so file order doesn't matter.
3. **Project Settings → Script Properties**, add:

   | Property | Example | Notes |
   |---|---|---|
   | `CLIENT_ID` | `1234-abc.apps.googleusercontent.com` | Same value as `VITE_GOOGLE_CLIENT_ID` |
   | `ALLOWED_DOMAIN` | `iimu.ac.in` | Same value as `VITE_ALLOWED_DOMAIN` |
   | `APP_URL` | `https://tasklite.vercel.app` | Optional; used as the link in @mention emails |

4. Select `setupSheet` in the editor and click **Run**. Approve the permission prompt. It creates the `Tasks`, `Comments` and `TeamMembers` tabs and adds you as `Admin`.
5. **Deploy → New deployment → Web app**: *Execute as* **Me**, *Who has access* **Anyone**. Copy the `/exec` URL into `VITE_GAS_API_URL`.
6. After editing any `.gs` file, use **Deploy → Manage deployments → Edit → New version**. Otherwise the URL keeps serving the old code.

"Anyone" access is safe here: every request must carry a Google id token issued for your `CLIENT_ID`, from a verified account on `ALLOWED_DOMAIN`.

## API

`POST` to the `/exec` URL with `Content-Type: text/plain;charset=utf-8` and the body `{ idToken, action, payload }`.

| Action | Payload | Returns |
|---|---|---|
| `GET_WORKSPACE` | `{}` | `{ tasks, comments, teamMembers, currentUser, lastSyncedAt }` |
| `CREATE_TASK` | `Task` fields, with a client-generated `id` | `{ task }` |
| `UPDATE_TASK` | `{ taskId, changes, autoComment? }` | `{ task, comment }` |
| `DELETE_TASK` | `{ taskId }` (creator or Admin only) | `{ deletedTaskId }` |
| `ADD_COMMENT` | `{ id, taskId, tag, content, mentionedEmails }` | `{ comment }` |

Errors are returned as `{ ok: false, code, error }`. The possible codes are `UNAUTHORIZED`, `DOMAIN_DENIED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `BUSY` and `SERVER`.

Creates and comments are idempotent by `id`, so a retried request never duplicates a row or an email.
