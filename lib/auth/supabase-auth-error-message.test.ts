import { describe, expect, it } from "vitest";

import { messageForSignUpAuthError } from "@/lib/auth/supabase-auth-error-message";

describe("messageForSignUpAuthError", () => {
  it("maps over_email_send_rate_limit by code", () => {
    const msg = messageForSignUpAuthError({
      code: "over_email_send_rate_limit",
      message: "email rate limit exceeded",
    });
    expect(msg).toContain("limite de envio de e-mails");
    expect(msg).toContain("Meta");
    expect(msg).toContain("SMTP");
  });

  it("maps by message substring when code missing", () => {
    const msg = messageForSignUpAuthError({
      message: '{"code":"over_email_send_rate_limit"}',
    });
    expect(msg).toContain("limite de envio de e-mails");
  });

  it("falls back to message for other errors", () => {
    expect(messageForSignUpAuthError({ message: "User already registered" })).toBe(
      "User already registered"
    );
  });
});
