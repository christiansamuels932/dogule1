export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  LOCKED_OUT: "LOCKED_OUT",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  DENIED: "DENIED",
  DISABLED: "DISABLED",
  REQUIRE_2FA: "REQUIRE_2FA",
};

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}
