module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => /^INIT_REPO_\d+\b/.test(message)]
};
