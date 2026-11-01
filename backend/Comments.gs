/**
 * Task comments + @mention notifications. Called inside the write lock.
 */

function addComment_(payload, user) {
  const id = assertId_(payload.id || 'cmt-' + Utilities.getUuid());
  const taskId = assertId_(payload.taskId);
  const commentSheet = getSheet_(CONFIG.TABS.COMMENTS);
  const taskSheet = getSheet_(CONFIG.TABS.TASKS);

  // Idempotent: a retried comment is not appended (or emailed) twice
  const existing = findRowByKey_(commentSheet, 'id', id);
  if (existing) {
    return { comment: Object.assign({}, existing, { mentionedEmails: parseMentions_(existing.mentionedEmails) }) };
  }

  const task = findRowByKey_(taskSheet, 'id', taskId);
  if (!task) fail_('NOT_FOUND', 'Task ' + taskId + ' does not exist.');

  const content = cleanText_(payload.content);
  if (!content) fail_('BAD_REQUEST', 'Comment cannot be empty.');

  const tag = payload.tag || 'General';
  if (CONFIG.TAGS.indexOf(tag) === -1) fail_('BAD_REQUEST', 'Invalid tag: ' + tag);

  // Only real team members can be mentioned, so the endpoint can't email arbitrary addresses
  const memberEmails = getMembers_().map(m => String(m.email).toLowerCase().trim());
  const mentions = (Array.isArray(payload.mentionedEmails) ? payload.mentionedEmails : [])
    .map(e => String(e).toLowerCase().trim())
    .filter((e, i, arr) => e && arr.indexOf(e) === i && memberEmails.indexOf(e) !== -1);

  const now = new Date().toISOString();
  const comment = {
    id: id,
    taskId: taskId,
    authorEmail: user.email,
    authorName: user.name,
    authorAvatar: user.picture || '',
    tag: tag,
    content: content,
    mentionedEmails: JSON.stringify(mentions),
    createdAt: now
  };

  appendObject_(commentSheet, CONFIG.HEADERS.Comments, comment);
  updateRowByKey_(taskSheet, 'id', taskId, { updatedAt: now });

  if (mentions.length > 0) {
    sendMentionEmails_(comment, mentions, task.title);
  }

  return { comment: Object.assign({}, comment, { mentionedEmails: mentions }) };
}

function parseMentions_(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}
