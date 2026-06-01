import { describe, expect, it } from "vitest";

import {
  isEmailNotConfirmedError,
  messageForSignInAuthError,
  messageForSignUpAuthError,
} from "@/libs/auth/supabase-auth-error-message";

describe("messageForSignUpAuthError", () => {
  it("maps over_email_send_rate_limit by code", () => {
    const msg = messageForSignUpAuthError({
      code: "over_email_send_rate_limit",
      message: "email rate limit exceeded",
    });
    expect(msg).toContain("limite de envio de e-mails");
    expect(msg).toContain("SMTP");
    expect(msg).not.toContain("Meta");
  });

  it("maps by message substring when code missing", () => {
    const msg = messageForSignUpAuthError({
      message: '{"code":"over_email_send_rate_limit"}',
    });
    expect(msg).toContain("limite de envio de e-mails");
  });

  it("maps user_already_registered", () => {
    const msg = messageForSignUpAuthError({
      code: "user_already_registered",
      message: "User already registered",
    });
    expect(msg).toContain("já está registado");
    expect(msg).toContain("Tenta entrar com a sua senha");
    expect(msg).not.toContain("confirmação");
  });

  it("maps invalid_credentials by code", () => {
    const msg = messageForSignUpAuthError({
      code: "invalid_credentials",
      message: "Invalid login credentials",
    });
    expect(msg).toContain("E-mail ou senha incorretos");
  });

  it("maps invalid_credentials when message is raw JSON", () => {
    const msg = messageForSignUpAuthError({
      message: '{"code":"invalid_credentials","message":"Invalid login credentials"}',
    });
    expect(msg).toContain("E-mail ou senha incorretos");
  });

  it("falls back to message for other errors", () => {
    expect(messageForSignUpAuthError({ message: "Something else" })).toBe("Something else");
  });
});

describe("messageForSignInAuthError", () => {
  it("maps email_not_confirmed", () => {
    const msg = messageForSignInAuthError({
      code: "email_not_confirmed",
      message: "Email not confirmed",
    });
    expect(msg).toContain("Confirme o seu e-mail");
  });

  it("maps invalid_credentials", () => {
    const msg = messageForSignInAuthError({
      code: "invalid_credentials",
      message: "Invalid login credentials",
    });
    expect(msg).toContain("E-mail ou senha incorretos");
  });
});

describe("isEmailNotConfirmedError", () => {
  it("detects by code and message", () => {
    expect(isEmailNotConfirmedError({ code: "email_not_confirmed" })).toBe(true);
    expect(isEmailNotConfirmedError({ message: "Email not confirmed" })).toBe(true);
    expect(isEmailNotConfirmedError({ code: "invalid_credentials" })).toBe(false);
  });
});
