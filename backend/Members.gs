/**
 * TeamMembers: auto-provisioning on first sign-in + lookups.
 */

/**
 * Returns the member row for a verified college identity, adding it on first
 * sign-in and backfilling a missing avatar. Cached briefly to keep reads fast.
 */
function ensureMember_(identity) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'member_' + sha256Hex_(identity.email);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  let member = findMember_(identity.email);
  const needsAvatar = member && identity.picture && !member.avatarUrl;

  if (!member || needsAvatar) {
    member = withWriteLock_(() => {
      const sheet = getSheet_(CONFIG.TABS.MEMBERS);
      const existing = findMember_(identity.email);
      if (!existing) {
        const created = {
          email: identity.email,
          name: identity.name,
          role: 'Member',
          avatarUrl: identity.picture || '',
          addedAt: new Date().toISOString()
        };
        appendObject_(sheet, CONFIG.HEADERS.TeamMembers, created);
        return created;
      }
      if (identity.picture && !existing.avatarUrl) {
        return updateRowByKey_(sheet, 'email', identity.email, { avatarUrl: identity.picture });
      }
      return existing;
    });
  }

  cache.put(cacheKey, JSON.stringify(member), CONFIG.MEMBER_CACHE_SECONDS);
  return member;
}

function findMember_(email) {
  const clean = String(email || '').toLowerCase().trim();
  return getMembers_().find(m => String(m.email).toLowerCase().trim() === clean) || null;
}

function getMembers_() {
  return sheetToObjects_(getSheet_(CONFIG.TABS.MEMBERS));
}

function isAdmin_(user) {
  return user && user.role === CONFIG.ADMIN_ROLE;
}
