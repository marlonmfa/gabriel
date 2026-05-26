import { NextRequest, NextResponse } from "next/server";
import { execSync, execFileSync } from "child_process";
import { isDevAuthenticated } from "@/lib/dev/auth";

const ROOT = process.cwd();

function gitLog() {
  const raw = execSync(
    'git log --format=%H|%h|%s|%an|%ar -30',
    { cwd: ROOT }
  ).toString().trim();

  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, short, ...rest] = line.split("|");
      const relativeDate = rest.pop() ?? "";
      const author = rest.pop() ?? "";
      const subject = rest.join("|");
      return { hash, short, subject, author, relativeDate };
    });
}

export async function GET() {
  if (!(await isDevAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ commits: gitLog() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isDevAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, hash } = await req.json();

  if (action === "revert") {
    if (!hash || !/^[a-f0-9]{7,40}$/.test(hash)) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
    }
    try {
      // execFileSync prevents shell injection — hash is a validated hex string
      execFileSync("git", ["revert", "--no-edit", hash], { cwd: ROOT });
      const newHash = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT })
        .toString()
        .trim();
      return NextResponse.json({ ok: true, newHash });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
