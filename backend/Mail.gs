/**
 * @mention email alerts. Failures are logged, never thrown, so a mail quota
 * problem can't block a comment from being saved.
 */

function sendMentionEmails_(comment, mentionedEmails, taskTitle) {
  try {
    const appUrl = getProp_('APP_URL');
    const title = escapeHtml_(taskTitle || comment.taskId);
    const author = escapeHtml_(comment.authorName);
    const tagBadge = comment.tag && comment.tag !== 'General' ? '[' + escapeHtml_(comment.tag) + '] ' : '';
    const button = appUrl
      ? '<a href="' + escapeHtml_(appUrl) + '" style="display:inline-block;background:#111827;color:#FFFFFF;' +
        'text-decoration:none;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:500;">Open TaskLite →</a>'
      : '';

    const htmlBody =
      '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;max-width:520px;' +
      'padding:20px;border:1px solid #E5E7EB;border-radius:12px;">' +
      '<p style="margin:0 0 8px;font-size:13px;color:#6B7280;">You were mentioned on a task</p>' +
      '<h3 style="margin:0 0 12px;color:#111827;">' + title + '</h3>' +
      '<div style="background:#F9FAFB;padding:14px;border-left:4px solid #4F46E5;border-radius:6px;margin-bottom:16px;">' +
      '<p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">' + author +
      ' <span style="color:#4F46E5;">' + tagBadge + '</span></p>' +
      '<p style="margin:0;font-size:14px;color:#1F2937;white-space:pre-wrap;">' + escapeHtml_(comment.content) + '</p>' +
      '</div>' + button + '</div>';

    mentionedEmails.forEach(recipient => {
      if (recipient === comment.authorEmail) return; // don't email yourself
      MailApp.sendEmail({
        to: recipient,
        subject: comment.authorName + ' mentioned you on "' + (taskTitle || comment.taskId) + '"',
        htmlBody: htmlBody
      });
    });
  } catch (err) {
    Logger.log('Mention email failed (non-fatal): ' + err.message);
  }
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
