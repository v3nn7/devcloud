import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function getGitStatus(repoPath = process.cwd()) {
  try {
    const { stdout } = await execAsync("git status --short", { cwd: repoPath });
    return stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => ({ raw: line }));
  } catch {
    return [];
  }
}
