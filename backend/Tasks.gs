/**
 * Task mutations. Called inside the write lock by runMutation_.
 */

function createTask_(payload, user) {
  const id = assertId_(payload.id || 'task-' + Utilities.getUuid());
  const sheet = getSheet_(CONFIG.TABS.TASKS);

  // Idempotent: a retried create returns the row that already exists
  const existing = findRowByKey_(sheet, 'id', id);
  if (existing) return { task: existing };

  const fields = validateTaskFields_(payload);
  const task = {
    id: id,
    title: fields.title || 'Untitled Task',
    description: fields.description || '',
    status: fields.status || 'To Do',
    priority: fields.priority || 'Med',
    assigneeEmail: fields.assigneeEmail !== undefined ? fields.assigneeEmail : user.email,
    dueDate: fields.dueDate || '',
    blockerReason: fields.blockerReason || '',
    updatedAt: new Date().toISOString(),
    createdBy: user.email
  };

  appendObject_(sheet, CONFIG.HEADERS.Tasks, task);
  return { task: task };
}

/**
 * DELTA-ONLY UPDATE:
 * payload: { taskId, changes: { status: "Blocked", blockerReason: "..." }, autoComment? }
 * Only the changed, whitelisted columns are written, so concurrent edits to
 * other fields of the same task are never overwritten.
 */
function updateTaskDelta_(payload, user) {
  const taskId = assertId_(payload.taskId);
  if (!payload.changes || typeof payload.changes !== 'object') {
    fail_('BAD_REQUEST', 'UPDATE_TASK requires a changes object.');
  }

  const changes = validateTaskFields_(payload.changes);
  if (Object.keys(changes).length === 0) {
    fail_('BAD_REQUEST', 'UPDATE_TASK has no editable fields in changes.');
  }

  changes.updatedAt = new Date().toISOString();
  const task = updateRowByKey_(getSheet_(CONFIG.TABS.TASKS), 'id', taskId, changes);

  let comment = null;
  if (payload.autoComment) {
    const autoComment = Object.assign({}, payload.autoComment, { taskId: taskId });
    comment = addComment_(autoComment, user).comment;
  }

  return { task: task, comment: comment };
}

/** Only the task's creator or an Admin may delete it. */
function deleteTask_(payload, user) {
  const taskId = assertId_(payload.taskId);
  const sheet = getSheet_(CONFIG.TABS.TASKS);
  const task = findRowByKey_(sheet, 'id', taskId);
  if (!task) return { deletedTaskId: taskId };

  const isCreator = String(task.createdBy).toLowerCase() === user.email;
  if (!isCreator && !isAdmin_(user)) {
    fail_('FORBIDDEN', 'Only the task creator or an Admin can delete this task.');
  }

  deleteRowByKey_(sheet, 'id', taskId);
  return { deletedTaskId: taskId };
}

/** Keeps only editable fields and validates each one. */
function validateTaskFields_(input) {
  const out = {};
  CONFIG.EDITABLE_TASK_FIELDS.forEach(field => {
    if (input[field] === undefined) return;
    out[field] = cleanText_(input[field]);
  });

  if (out.title !== undefined && !out.title) {
    fail_('BAD_REQUEST', 'Task title cannot be empty.');
  }
  if (out.status !== undefined && CONFIG.STATUSES.indexOf(out.status) === -1) {
    fail_('BAD_REQUEST', 'Invalid status: ' + out.status);
  }
  if (out.priority !== undefined && CONFIG.PRIORITIES.indexOf(out.priority) === -1) {
    fail_('BAD_REQUEST', 'Invalid priority: ' + out.priority);
  }
  if (out.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(out.dueDate)) {
    fail_('BAD_REQUEST', 'dueDate must be YYYY-MM-DD.');
  }
  if (out.assigneeEmail !== undefined) {
    out.assigneeEmail = out.assigneeEmail.toLowerCase();
    if (out.assigneeEmail && !findMember_(out.assigneeEmail)) {
      fail_('BAD_REQUEST', 'Assignee is not a TaskLite team member.');
    }
  }
  return out;
}
