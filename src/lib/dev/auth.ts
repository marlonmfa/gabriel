import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const DEV_SESSION_COOKIE = "dev_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createDevSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = Buffer.from(`dev:${Date.now()}:${Math.random()}`).toString("base64");
  cookieStore.set(DEV_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroyDevSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_SESSION_COOKIE);
}

export async function isDevAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(DEV_SESSION_COOKIE);
  return !!session?.value;
}
