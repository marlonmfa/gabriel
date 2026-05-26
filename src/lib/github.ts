// GitHub REST API client — no octokit dependency, keeps bundle lean
const GITHUB_API = 'https://api.github.com';
const OWNER = 'marlonmfa';
const REPO = 'gabriel';

function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN env var not set');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function ghFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getMainSha(): Promise<string> {
  const data = await ghFetch(`/repos/${OWNER}/${REPO}/git/ref/heads/main`);
  return data.object.sha;
}

export async function createBranch(branch: string, sha: string): Promise<void> {
  await ghFetch(`/repos/${OWNER}/${REPO}/git/refs`, 'POST', {
    ref: `refs/heads/${branch}`,
    sha,
  });
}

export async function getFileSha(filePath: string, branch: string): Promise<string | undefined> {
  try {
    const data = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${branch}`);
    return data.sha;
  } catch {
    return undefined; // file doesn't exist yet
  }
}

export async function pushFileChange(opts: {
  branch: string;
  filePath: string;
  content: string; // raw file content (not base64)
  message: string;
}): Promise<void> {
  const existingSha = await getFileSha(opts.filePath, opts.branch);
  await ghFetch(`/repos/${OWNER}/${REPO}/contents/${opts.filePath}`, 'PUT', {
    message: opts.message,
    content: Buffer.from(opts.content).toString('base64'),
    branch: opts.branch,
    ...(existingSha ? { sha: existingSha } : {}),
  });
}

export async function openPullRequest(opts: {
  branch: string;
  title: string;
  body: string;
}): Promise<{ number: number; html_url: string }> {
  return ghFetch(`/repos/${OWNER}/${REPO}/pulls`, 'POST', {
    title: opts.title,
    body: opts.body,
    head: opts.branch,
    base: 'main',
  });
}

export async function mergePullRequest(prNumber: number): Promise<void> {
  await ghFetch(`/repos/${OWNER}/${REPO}/pulls/${prNumber}/merge`, 'PUT', {
    merge_method: 'squash',
  });
}

export async function deleteBranch(branch: string): Promise<void> {
  await ghFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, 'DELETE');
}
