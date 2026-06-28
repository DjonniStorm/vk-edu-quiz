import { describe, expect, it } from "vitest";

import { BcryptPasswordHasher } from "../password-hasher";

describe("BcryptPasswordHasher", () => {
  it("хеширует пароль и проверяет совпадение", async () => {
    const hasher = new BcryptPasswordHasher(4);
    const password = "secret-password";

    const passwordHash = await hasher.hash(password);

    expect(passwordHash).not.toBe(password);
    expect(await hasher.verify(password, passwordHash)).toBe(true);
    expect(await hasher.verify("wrong-password", passwordHash)).toBe(false);
  });
});
