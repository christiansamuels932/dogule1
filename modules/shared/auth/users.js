const USERS = [
  {
    id: "user-developer",
    username: "Developer",
    role: "developer",
    passwordHash: "",
    requires2fa: false,
  },
];

export function createUserStore(seed = USERS) {
  const byUsername = new Map(seed.map((u) => [u.username, u]));
  const byId = new Map(seed.map((u) => [u.id, u]));
  return {
    getUserByUsername: (username) => byUsername.get(username),
    getUserById: (id) => byId.get(id),
    hasUser: (username) => byUsername.has(username),
    addUser: (user) => {
      if (!user?.id || !user?.username) return false;
      if (byUsername.has(user.username) || byId.has(user.id)) return false;
      byUsername.set(user.username, user);
      byId.set(user.id, user);
      return true;
    },
    updateUser: (user) => {
      if (!user?.id) return false;
      const existing = byId.get(user.id);
      if (!existing) return false;
      const nextUsername = user.username || existing.username;
      if (nextUsername !== existing.username && byUsername.has(nextUsername)) {
        return false;
      }
      if (nextUsername !== existing.username) {
        byUsername.delete(existing.username);
      }
      const updated = { ...existing, ...user, username: nextUsername };
      byId.set(updated.id, updated);
      byUsername.set(updated.username, updated);
      return true;
    },
  };
}

export function getSeedUsers() {
  return USERS.slice();
}
