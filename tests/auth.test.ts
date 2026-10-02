import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  describeAuthError,
  getDisplayName,
  isGmailAddress,
  validateRegistration,
} from "@/lib/auth";

const valid = {
  name: "Ama",
  email: "Ama@Gmail.com ",
  password: "secret123",
  confirmPassword: "secret123",
};

describe("registration rules", () => {
  it("accepts complete details with a Gmail address", () => {
    expect(validateRegistration(valid)).toBeNull();
  });

  it("rejects missing names, other email providers, short and mismatched passwords", () => {
    expect(validateRegistration({ ...valid, name: " " })).toBe("Your name is required.");
    expect(validateRegistration({ ...valid, email: "ama@yahoo.com" })).toMatch(/Gmail/);
    expect(validateRegistration({ ...valid, password: "abc", confirmPassword: "abc" })).toMatch(/6 characters/);
    expect(validateRegistration({ ...valid, confirmPassword: "other" })).toBe("Passwords do not match.");
  });

  it("only treats real gmail.com addresses as Gmail", () => {
    expect(isGmailAddress("someone@gmail.com")).toBe(true);
    expect(isGmailAddress("someone@notgmail.com")).toBe(false);
    expect(isGmailAddress("@gmail.com")).toBe(false);
  });
});

describe("auth messages", () => {
  it("explains Supabase's email delivery limits in plain language", () => {
    expect(describeAuthError({ code: "over_email_send_rate_limit", message: "x" })).toMatch(/wait a few minutes/);
    expect(describeAuthError({ code: "email_address_not_authorized", message: "x" })).toMatch(/Google/);
    expect(describeAuthError({ message: "Something else" })).toBe("Something else");
  });

  it("prefers the profile name, then the email name", () => {
    expect(getDisplayName({ user_metadata: { full_name: "Jeff Yankson" } } as unknown as User)).toBe("Jeff Yankson");
    expect(getDisplayName({ user_metadata: {}, email: "ama@gmail.com" } as unknown as User)).toBe("ama");
    expect(getDisplayName(null)).toBe("Account");
  });
});
