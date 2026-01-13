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
  };
}

export function getSeedUsers() {
  return USERS.slice();
}
