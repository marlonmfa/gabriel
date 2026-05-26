import { hashPassword, verifyPassword } from "@/lib/dev/auth";

describe("dev auth utilities", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("supersecret");
    expect(hash).not.toBe("supersecret");
    await expect(verifyPassword("supersecret", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct");
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same input (salt)", async () => {
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
  });
});
