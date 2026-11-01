/**
 * Google id_token verification + college domain enforcement.
 * Verified identities are cached (keyed by a SHA-256 of the token) so repeat
 * calls skip Google's tokeninfo endpoint.
 */

function authenticate_(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    fail_('UNAUTHORIZED', 'Missing Google id_token.');
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'jwt_' + sha256Hex_(idToken);
  const cached = cache.get(cacheKey);

  let identity = cached ? JSON.parse(cached) : null;
  if (!identity || identity.exp * 1000 <= Date.now()) {
    identity = verifyGoogleToken_(idToken);
    const secondsLeft = Math.floor((identity.exp * 1000 - Date.now()) / 1000);
    const ttl = Math.min(CONFIG.TOKEN_CACHE_SECONDS, secondsLeft);
    if (ttl > 0) cache.put(cacheKey, JSON.stringify(identity), ttl);
  }

  const member = ensureMember_(identity);
  return {
    email: identity.email,
    name: member.name || identity.name,
    picture: identity.picture || member.avatarUrl || '',
    role: member.role || 'Member'
  };
}

function verifyGoogleToken_(idToken) {
  const resp = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) {
    fail_('UNAUTHORIZED', 'Invalid or expired Google login token.');
  }

  const t = JSON.parse(resp.getContentText());
  const clientId = getProp_('CLIENT_ID');
  if (!clientId) {
    fail_('SERVER', 'Backend misconfigured: CLIENT_ID script property is not set.');
  }
  if (t.aud !== clientId) {
    fail_('UNAUTHORIZED', 'Token was not issued for TaskLite.');
  }
  if (String(t.email_verified) !== 'true') {
    fail_('UNAUTHORIZED', 'Google account email is not verified.');
  }
  if (!t.exp || Number(t.exp) * 1000 <= Date.now()) {
    fail_('UNAUTHORIZED', 'Google login token has expired.');
  }

  const email = String(t.email || '').toLowerCase().trim();
  assertAllowedDomain_(email, t.hd);

  return {
    email: email,
    name: t.name || email.split('@')[0],
    picture: t.picture || '',
    exp: Number(t.exp)
  };
}

function assertAllowedDomain_(email, hostedDomain) {
  const domain = getAllowedDomain_();
  if (!domain) {
    fail_('SERVER', 'Backend misconfigured: ALLOWED_DOMAIN script property is not set.');
  }
  const hdMatches = hostedDomain && String(hostedDomain).toLowerCase() === domain;
  const emailMatches = email.endsWith('@' + domain);
  if (!hdMatches && !emailMatches) {
    fail_('DOMAIN_DENIED', 'Only @' + domain + ' Google accounts can use TaskLite.');
  }
}
