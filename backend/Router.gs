/**
 * HTTP entry points.
 * All data access goes through POST so the id_token never appears in a URL.
 * Body (Content-Type: text/plain;charset=utf-8): { idToken, action, payload }
 */

/** Health check only — returns no workspace data. */
function doGet() {
  return jsonResponse_({ ok: true, data: { service: 'TaskLite', status: 'up' } });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      fail_('BAD_REQUEST', 'Missing POST body.');
    }

    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (_) {
      fail_('BAD_REQUEST', 'POST body must be valid JSON.');
    }

    const user = authenticate_(body.idToken);
    const action = body.action;
    const payload = body.payload || {};

    // Reads don't need the write lock
    if (action === 'GET_WORKSPACE') {
      const state = getWorkspaceState_();
      state.currentUser = user;
      return jsonResponse_({ ok: true, data: state });
    }

    const result = withWriteLock_(() => runMutation_(action, payload, user));
    return jsonResponse_({ ok: true, data: result });
  } catch (err) {
    return jsonResponse_({ ok: false, code: err.code || 'SERVER', error: err.message });
  }
}

function runMutation_(action, payload, user) {
  switch (action) {
    case 'CREATE_TASK':
      return createTask_(payload, user);
    case 'UPDATE_TASK':
      return updateTaskDelta_(payload, user);
    case 'DELETE_TASK':
      return deleteTask_(payload, user);
    case 'ADD_COMMENT':
      return addComment_(payload, user);
    default:
      fail_('BAD_REQUEST', 'Unknown action: ' + action);
  }
}

function getWorkspaceState_() {
  const tasks = sheetToObjects_(getSheet_(CONFIG.TABS.TASKS));
  const teamMembers = sheetToObjects_(getSheet_(CONFIG.TABS.MEMBERS));
  const comments = sheetToObjects_(getSheet_(CONFIG.TABS.COMMENTS)).map(c =>
    Object.assign({}, c, { mentionedEmails: parseMentions_(c.mentionedEmails) })
  );

  return {
    tasks: tasks,
    comments: comments,
    teamMembers: teamMembers,
    lastSyncedAt: new Date().toISOString()
  };
}
