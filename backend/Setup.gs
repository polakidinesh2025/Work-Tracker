/**
 * STEP 1: Run setupSheet() once from the Apps Script editor.
 * Creates the 3 tabs, formats every column as plain text (so dates and ids are
 * never auto-converted), adds you as Admin, and seeds two sample tasks.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(CONFIG.HEADERS).forEach(tabName => {
    const headers = CONFIG.HEADERS[tabName];
    const sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#F3F4F6')
        .setFontColor('#111827');
      sheet.setFrozenRows(1);
    }
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).setNumberFormat('@');
  });

  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  const now = new Date().toISOString();
  const ownerEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!ownerEmail) {
    throw new Error('Could not read your email. Run setupSheet() while signed in to your college account.');
  }

  const memberSheet = ss.getSheetByName(CONFIG.TABS.MEMBERS);
  if (memberSheet.getLastRow() === 1) {
    appendObject_(memberSheet, CONFIG.HEADERS.TeamMembers, {
      email: ownerEmail, name: 'Project Lead', role: CONFIG.ADMIN_ROLE, avatarUrl: '', addedAt: now
    });
  }

  const taskSheet = ss.getSheetByName(CONFIG.TABS.TASKS);
  if (taskSheet.getLastRow() === 1) {
    const inDays = d => new Date(Date.now() + 86400000 * d).toISOString().split('T')[0];
    appendObject_(taskSheet, CONFIG.HEADERS.Tasks, {
      id: 'task-101',
      title: 'Configure Google OAuth Client ID',
      description: 'Add Authorized JavaScript origins for localhost:5173 and the production URL.',
      status: 'In Progress', priority: 'High', assigneeEmail: ownerEmail,
      dueDate: inDays(2), blockerReason: '', updatedAt: now, createdBy: ownerEmail
    });
    appendObject_(taskSheet, CONFIG.HEADERS.Tasks, {
      id: 'task-102',
      title: 'Invite the team to sign in',
      description: 'Teammates are added automatically the first time they sign in with a college account.',
      status: 'To Do', priority: 'Med', assigneeEmail: ownerEmail,
      dueDate: inDays(5), blockerReason: '', updatedAt: now, createdBy: ownerEmail
    });
  }

  const commentSheet = ss.getSheetByName(CONFIG.TABS.COMMENTS);
  if (commentSheet.getLastRow() === 1) {
    appendObject_(commentSheet, CONFIG.HEADERS.Comments, {
      id: 'cmt-101', taskId: 'task-101', authorEmail: ownerEmail, authorName: 'Project Lead',
      authorAvatar: '', tag: 'Update', content: 'Backend sheet initialized and ready for connection!',
      mentionedEmails: '[]', createdAt: now
    });
  }

  const missing = ['CLIENT_ID', 'ALLOWED_DOMAIN'].filter(k => !getProp_(k));
  Logger.log(missing.length
    ? '⚠️ Setup done, but set these Script Properties before deploying: ' + missing.join(', ')
    : '✅ Setup complete! Deploy as Web App next (Execute as: Me, Who has access: Anyone).');
}
