export const ADMIN_CONFIG = {
  uids: [
    "TljwjuBuKvd6VG9e0Mz81y7ZRgi1",
    "G6RyacKuSUTLXniBWRC1WsAm4Rq2"
  ],
  emails: [
    "noctivehq@gmail.com"
  ],
  usernames: [
    "venus"
  ]
};

export function normalizeAdminValue(value) {
  return String(value || "").trim().toLowerCase();
}

export function isAdminIdentity(identity = {}) {
  const uid = String(identity.uid || "").trim();
  const email = normalizeAdminValue(identity.email);
  const username = normalizeAdminValue(identity.username);
  const displayName = normalizeAdminValue(identity.displayName);

  if (uid && ADMIN_CONFIG.uids.includes(uid)) {
    return true;
  }

  if (email && ADMIN_CONFIG.emails.map(normalizeAdminValue).includes(email)) {
    return true;
  }

  const adminUsernames = ADMIN_CONFIG.usernames.map(normalizeAdminValue);
  return adminUsernames.includes(username) || adminUsernames.includes(displayName);
}
