import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createDevSession, destroyDevSession, isDevAuthenticated } from "@/lib/dev/auth";

const DEV_PASSWORD_HASH = process.env.DEV_PASSWORD_HASH!;

export async function POST(req: NextRequest) {
  const { action, password } = await req.json();

  if (action === "login") {
    if (!DEV_PASSWORD_HASH) {
      return NextResponse.json({ error: "DEV_PASSWORD_HASH not configured" }, { status: 500 });
    }
    const valid = await verifyPassword(password, DEV_PASSWORD_HASH);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    await createDevSession();
    return NextResponse.json({ ok: true });
  }

  if (action === "logout") {
    await destroyDevSession();
    return NextResponse.json({ ok: true });
  }

  if (action === "check") {
    const authenticated = await isDevAuthenticated();
    return NextResponse.json({ authenticated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
