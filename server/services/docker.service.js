import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function getDockerContainers() {
  try {
    const { stdout } = await execAsync(
      "docker ps --format \"{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}\""
    );

    return stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [id, name, status, image] = line.split("|");
        return { id, name, status, image };
      });
  } catch {
    return [];
  }
}
