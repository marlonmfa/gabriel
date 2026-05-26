import { NextRequest, NextResponse } from "next/server";
import { isDevAuthenticated } from "@/lib/dev/auth";
import { executeTDDCommand } from "@/lib/dev/tdd-executor";

export async function POST(req: NextRequest) {
  if (!(await isDevAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instruction } = await req.json();
  if (!instruction?.trim()) {
    return NextResponse.json({ error: "Instruction required" }, { status: 400 });
  }

  // Stream TDD stages as Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const update of executeTDDCommand(instruction)) {
          send(update);
        }
      } catch (err) {
        send({ stage: "failed", message: "Erro inesperado", detail: String(err), success: false });
      } finally {
        send({ stage: "done", message: "Stream fechado", success: true });
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
