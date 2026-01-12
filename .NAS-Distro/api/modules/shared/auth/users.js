const USERS = [
  {
    id: "user-admin",
    username: "admin",
    role: "admin",
    passwordHash:
      "pbkdf2$sha256$120000$rSPBtW8a4eFQiMoiUTg81g==$cMprKXdONLgj7wkmtdTInrp1G8Iye799pJ2zB4Fmyi4=",
    requires2fa: false,
  },
  {
    id: "user-staff",
    username: "staff",
    role: "staff",
    passwordHash:
      "pbkdf2$sha256$120000$rakK5AqwTFKD9Iy9xvVWdw==$dVuDO2tz8VcblKv2LNhQMellECOB+Ra47PFixip3YHo=",
    requires2fa: false,
  },
  {
    id: "user-trainer",
    username: "trainer",
    role: "trainer",
    passwordHash:
      "pbkdf2$sha256$120000$BJESFsjzmHdkzaV5sQbg5w==$Jusw6IPvULL4YACbJ4XpDY9sdMe6jX5g1PXvjX807P4=",
    requires2fa: false,
  },
  {
    id: "user-developer",
    username: "developer",
    role: "developer",
    passwordHash:
      "pbkdf2$sha-256$120000$1MgunOkUCaVb2VRvmZtHPA==$+s2yKLLBnaQyf3DSeNbZNNp6HBIngvvdfhx8FXzWACw=",
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
