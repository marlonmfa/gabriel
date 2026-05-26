"use client";

import { useState, useEffect, useRef } from "react";

interface TDDUpdate {
  stage: string;
  message: string;
  detail?: string;
  success?: boolean;
}

interface Commit {
  hash: string;
  short: string;
  subject: string;
  author: string;
  relativeDate: string;
}

const STAGE_LABELS: Record<string, string> = {
  planning: "Planejando",
  "writing-tests": "Escrevendo testes",
  "running-tests-initial": "Rodando testes (inicial)",
  "writing-code": "Implementando",
  "running-tests-final": "Rodando testes (final)",
  committing: "Commitando",
  done: "Concluído",
  failed: "Falhou",
};

export default function DevPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [running, setRunning] = useState(false);
  const [updates, setUpdates] = useState<TDDUpdate[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [reverting, setReverting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"command" | "history">("command");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dev/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check" }),
    })
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated));
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [updates]);

  useEffect(() => {
    if (authenticated && activeTab === "history") {
      loadCommits();
    }
  }, [authenticated, activeTab]);

  async function login() {
    setLoginError("");
    const res = await fetch("/api/dev/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      const d = await res.json();
      setLoginError(d.error ?? "Erro desconhecido");
    }
  }

  async function logout() {
    await fetch("/api/dev/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setAuthenticated(false);
  }

  async function loadCommits() {
    const res = await fetch("/api/dev/git");
    if (res.ok) {
      const d = await res.json();
      setCommits(d.commits ?? []);
    }
  }

  async function revertCommit(hash: string) {
    setReverting(hash);
    const res = await fetch("/api/dev/git", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revert", hash }),
    });
    setReverting(null);
    if (res.ok) {
      await loadCommits();
    } else {
      const d = await res.json();
      alert(`Erro ao reverter: ${d.error}`);
    }
  }

  async function runCommand() {
    if (!instruction.trim() || running) return;
    setRunning(true);
    setUpdates([]);

    const res = await fetch("/api/dev/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction }),
    });

    if (!res.ok || !res.body) {
      setUpdates([{ stage: "failed", message: "Erro ao iniciar comando" }]);
      setRunning(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const update: TDDUpdate = JSON.parse(line.slice(6));
            setUpdates((prev) => [...prev, update]);
            if (update.stage === "done" || update.stage === "failed") {
              setRunning(false);
              if (update.stage === "done") {
                loadCommits();
                setInstruction("");
              }
            }
          } catch {}
        }
      }
    }
    setRunning(false);
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-white">Painel do Desenvolvedor</h1>
            <p className="text-sm text-zinc-500 mt-1">Área restrita — apenas desenvolvedores autorizados</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Senha de desenvolvedor"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              className="w-full bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button
              onClick={login}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-zinc-300">Dev Panel</span>
            <span className="text-xs text-zinc-600">gabriel.hirableaiagents.com</span>
          </div>
          <button
            onClick={logout}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 w-fit">
          {(["command", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "command" ? "Comando" : "Histórico Git"}
            </button>
          ))}
        </div>

        {activeTab === "command" && (
          <div className="space-y-4">
            {/* Instruction input */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-white">Nova instrução</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Descreva a mudança em linguagem natural. Claude vai escrever testes, rodar, implementar e commitar.
                </p>
              </div>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Ex: Adicione um banner de boas-vindas animado na página inicial com o nome Gabriel..."
                rows={4}
                disabled={running}
                className="w-full bg-zinc-800 text-white placeholder-zinc-600 border border-zinc-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
              />
              <button
                onClick={runCommand}
                disabled={running || !instruction.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-xl px-6 py-3 text-sm transition-colors flex items-center gap-2"
              >
                {running && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {running ? "Executando..." : "Executar"}
              </button>
            </div>

            {/* TDD Log */}
            {updates.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800">
                  <h3 className="font-medium text-sm text-zinc-300">Pipeline TDD</h3>
                </div>
                <div ref={logRef} className="p-4 space-y-2 max-h-96 overflow-y-auto">
                  {updates.map((u, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-4 text-sm ${
                        u.stage === "failed"
                          ? "bg-red-950/50 border border-red-900"
                          : u.stage === "done" && u.success
                          ? "bg-green-950/50 border border-green-900"
                          : "bg-zinc-800/50 border border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                          u.stage === "failed" ? "bg-red-900 text-red-300" :
                          u.stage === "done" ? "bg-green-900 text-green-300" :
                          "bg-zinc-700 text-zinc-400"
                        }`}>
                          {STAGE_LABELS[u.stage] ?? u.stage}
                        </span>
                        <span className="text-zinc-300">{u.message}</span>
                        {u.success === true && u.stage !== "running-tests-initial" && (
                          <span className="ml-auto text-green-400 text-xs">✓</span>
                        )}
                        {u.success === false && (
                          <span className="ml-auto text-red-400 text-xs">✗</span>
                        )}
                      </div>
                      {u.detail && (
                        <pre className="mt-2 text-xs text-zinc-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                          {u.detail}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-medium text-sm text-zinc-300">Histórico de commits</h3>
              <button
                onClick={loadCommits}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Atualizar
              </button>
            </div>
            <div className="divide-y divide-zinc-800">
              {commits.length === 0 ? (
                <div className="px-6 py-8 text-center text-zinc-600 text-sm">Nenhum commit encontrado</div>
              ) : (
                commits.map((commit) => (
                  <div key={commit.hash} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors">
                    <code className="text-xs font-mono text-violet-400 bg-violet-950/50 px-2 py-1 rounded-md shrink-0">
                      {commit.short}
                    </code>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{commit.subject}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {commit.author} · {commit.relativeDate}
                      </p>
                    </div>
                    <button
                      onClick={() => revertCommit(commit.hash)}
                      disabled={reverting === commit.hash}
                      className="text-xs text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-800 rounded-lg px-3 py-1.5 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {reverting === commit.hash ? "Revertendo..." : "Reverter"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
