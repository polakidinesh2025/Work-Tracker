/**
 * ============================================================================
 * TASKLITE SERVERLESS BACKEND (Google Sheets + Apps Script)
 * Files share one global scope: Config, Router, Auth, Tasks, Comments,
 * Members, Mail, SheetUtils, Setup.
 *
 * Required Script Properties (Project Settings -> Script Properties):
 *   CLIENT_ID       Google OAuth Web Client ID (must match VITE_GOOGLE_CLIENT_ID)
 *   ALLOWED_DOMAIN  College Workspace domain, e.g. iimu.ac.in
 *   APP_URL         Deployed frontend URL, used in @mention emails (optional)
 * ============================================================================
 */

const CONFIG = {
  TABS: {
    TASKS: 'Tasks',
    COMMENTS: 'Comments',
    MEMBERS: 'TeamMembers'
  },
  HEADERS: {
    Tasks: [
      'id', 'title', 'description', 'status', 'priority',
      'assigneeEmail', 'dueDate', 'blockerReason', 'updatedAt', 'createdBy'
    ],
    Comments: [
      'id', 'taskId', 'authorEmail', 'authorName', 'authorAvatar',
      'tag', 'content', 'mentionedEmails', 'createdAt'
    ],
    TeamMembers: [
      'email', 'name', 'role', 'avatarUrl', 'addedAt'
    ]
  },
  // Only these Task columns may be changed through UPDATE_TASK
  EDITABLE_TASK_FIELDS: [
    'title', 'description', 'status', 'priority',
    'assigneeEmail', 'dueDate', 'blockerReason'
  ],
  STATUSES: ['Backlog', 'To Do', 'In Progress', 'Blocked', 'Done'],
  PRIORITIES: ['Low', 'Med', 'High', 'Urgent'],
  TAGS: ['Update', 'Blocker', 'Question', 'General'],
  ADMIN_ROLE: 'Admin',
  TOKEN_CACHE_SECONDS: 2700,
  MEMBER_CACHE_SECONDS: 600,
  LOCK_WAIT_MS: 10000,
  MAX_TEXT_LENGTH: 5000
};

function getProp_(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value ? String(value).trim() : (fallback || '');
}

function getAllowedDomain_() {
  return getProp_('ALLOWED_DOMAIN').toLowerCase().replace(/^@/, '');
}
