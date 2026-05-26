import { execSync, execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const client = new Anthropic();

export type TDDStage =
  | "planning"
  | "writing-tests"
  | "running-tests-initial"
  | "writing-code"
  | "running-tests-final"
  | "committing"
  | "done"
  | "failed";

export interface TDDUpdate {
  stage: TDDStage;
  message: string;
  detail?: string;
  success?: boolean;
}

function readProjectContext(): string {
  const files = [
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/types/index.ts",
    "src/app/globals.css",
  ];
  return files
    .filter((f) => fs.existsSync(path.join(ROOT, f)))
    .map((f) => `\n### ${f}\n\`\`\`\n${fs.readFileSync(path.join(ROOT, f), "utf8")}\n\`\`\``)
    .join("\n");
}

async function askClaude(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  return (msg.content[0] as { text: string }).text;
}

function extractCodeBlocks(text: string): { filename: string; code: string }[] {
  const regex = /```(?:\w+)?\s*\n\/\/ file: ([^\n]+)\n([\s\S]*?)```/g;
  const results: { filename: string; code: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push({ filename: match[1].trim(), code: match[2] });
  }
  return results;
}

async function runJest(testPattern?: string): Promise<{ passed: boolean; output: string }> {
  try {
    const args = ["jest", "--passWithNoTests", "--no-coverage"];
    if (testPattern) args.push(testPattern);
    const { stdout, stderr } = await execFileAsync("npx", args, {
      cwd: ROOT,
      timeout: 60000,
    });
    const output = stdout + stderr;
    const passed = !output.includes("FAIL") && !output.includes("failed");
    return { passed, output };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const output = (error.stdout ?? "") + (error.stderr ?? "") + (error.message ?? "");
    return { passed: false, output };
  }
}

function gitCommit(message: string): string {
  execSync("git add -A", { cwd: ROOT });
  // Use execFile-style via --message flag to avoid shell injection
  execSync(`git commit --message=${JSON.stringify(message)}`, { cwd: ROOT });
  return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
}

export async function* executeTDDCommand(instruction: string): AsyncGenerator<TDDUpdate> {
  const context = readProjectContext();

  yield { stage: "planning", message: "Analisando instrução e planejando testes..." };

  const testPrompt = `You are a TDD engineer for a Next.js 16 / React 19 project.

Project context:
${context}

Developer instruction: "${instruction}"

Write Jest + React Testing Library tests that will FAIL now but PASS after implementing the feature.
For each test file, use this format EXACTLY:
\`\`\`tsx
// file: src/__tests__/[descriptive-name].test.tsx
[test code here]
\`\`\`

Rules:
- Import from "@/..." paths
- Use @testing-library/react and @testing-library/jest-dom
- Tests must be minimal and focused on the instruction
- Only write tests, no implementation code`;

  yield { stage: "writing-tests", message: "Claude escrevendo testes..." };

  let testResponse: string;
  try {
    testResponse = await askClaude(testPrompt);
  } catch (err) {
    yield { stage: "failed", message: "Erro ao conectar com Claude", detail: String(err), success: false };
    return;
  }

  const testFiles = extractCodeBlocks(testResponse);
  if (testFiles.length === 0) {
    yield {
      stage: "failed",
      message: "Claude não gerou arquivos de teste válidos",
      detail: testResponse.slice(0, 500),
      success: false,
    };
    return;
  }

  for (const { filename, code } of testFiles) {
    const fullPath = path.join(ROOT, filename);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, code, "utf8");
  }
  yield {
    stage: "writing-tests",
    message: `${testFiles.length} arquivo(s) de teste criado(s)`,
    detail: testFiles.map((f) => f.filename).join(", "),
    success: true,
  };

  yield { stage: "running-tests-initial", message: "Rodando testes (devem falhar antes da implementação)..." };
  const initialRun = await runJest();
  yield {
    stage: "running-tests-initial",
    message: initialRun.passed ? "Testes passaram (já implementado?)" : "Testes falharam como esperado — ótimo!",
    detail: initialRun.output.slice(-800),
    success: !initialRun.passed,
  };

  const implPrompt = `You are a Next.js 16 / React 19 expert.

Project context:
${context}

Tests that need to pass:
${testFiles.map((f) => `### ${f.filename}\n\`\`\`tsx\n${f.code}\n\`\`\``).join("\n")}

Developer instruction: "${instruction}"

Write the implementation code to make these tests pass.
For each file, use this format EXACTLY:
\`\`\`tsx
// file: src/[path/to/file.tsx]
[code here]
\`\`\`

Rules:
- Use TypeScript, Tailwind CSS, Next.js App Router conventions
- Keep existing code, only add/modify what is needed
- Do NOT rewrite the test files`;

  yield { stage: "writing-code", message: "Claude implementando a feature..." };

  let implResponse: string;
  try {
    implResponse = await askClaude(implPrompt);
  } catch (err) {
    yield { stage: "failed", message: "Erro ao gerar implementação", detail: String(err), success: false };
    return;
  }

  const implFiles = extractCodeBlocks(implResponse);
  if (implFiles.length === 0) {
    yield {
      stage: "failed",
      message: "Claude não gerou implementação válida",
      detail: implResponse.slice(0, 500),
      success: false,
    };
    return;
  }

  for (const { filename, code } of implFiles) {
    const fullPath = path.join(ROOT, filename);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, code, "utf8");
  }
  yield {
    stage: "writing-code",
    message: `${implFiles.length} arquivo(s) implementado(s)`,
    detail: implFiles.map((f) => f.filename).join(", "),
    success: true,
  };

  yield { stage: "running-tests-final", message: "Rodando testes finais..." };
  const finalRun = await runJest();
  yield {
    stage: "running-tests-final",
    message: finalRun.passed ? "Todos os testes passaram!" : "Alguns testes ainda falhando",
    detail: finalRun.output.slice(-800),
    success: finalRun.passed,
  };

  if (!finalRun.passed) {
    yield { stage: "failed", message: "Testes não passaram — mudanças não foram commitadas", success: false };
    return;
  }

  yield { stage: "committing", message: "Fazendo commit das mudanças..." };
  try {
    const hash = gitCommit(`dev: ${instruction.slice(0, 72)}`);
    yield { stage: "done", message: `Commit criado: ${hash}`, detail: instruction, success: true };
  } catch (err) {
    yield { stage: "failed", message: "Erro ao commitar", detail: String(err), success: false };
  }
}
