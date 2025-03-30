import type { SpawnOptions } from "node:child_process";

import spawn from "cross-spawn";

/**
 * Result of a shell command execution
 */
export interface ShellCommandResult {
  code: number;
  stderr: string;
  stdout: string;
}

/**
 * Extended Error type for command execution errors
 */
interface CommandError extends Error {
  result: ShellCommandResult;
}

/**
 * Execute a shell command with consistent error handling
 * @param args Command and arguments as an array
 * @param options Options for the command execution
 * @param options.silent Whether to suppress command output (defaults to false)
 * @param options.cwd Working directory for the command
 * @param options.env Environment variables for the command
 * @returns Promise resolving to command output or rejecting with an error object containing exit code and output
 */
export async function sh(
  arguments_: string[],
  options: Partial<{
    cwd: string;
    env: NodeJS.ProcessEnv;
    silent: boolean;
  }> = {},
): Promise<ShellCommandResult> {
  const { cwd, env, silent = false } = options;

  if (arguments_.length === 0) {
    throw new Error("Command cannot be empty");
  }

  const [program, ...spawnArguments] = arguments_;

  if (typeof program !== "string") {
    throw new TypeError("Command must be a string");
  }

  return new Promise((resolve, reject) => {
    const stdio = silent ? "pipe" : "inherit";
    const spawnOptions: SpawnOptions = {
      cwd,
      env: env ? { ...process.env, ...env } : process.env,
      stdio: [stdio, stdio, stdio],
    };

    // Use cross-spawn which handles Windows issues better
    const child = spawn(program, spawnArguments, spawnOptions);

    let stdout = "";
    let stderr = "";

    // Only collect output if in silent mode (piped)
    if (silent) {
      if (child.stdout) {
        child.stdout.on("data", (data: Buffer) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });
      }
    }

    child.on("close", (code: number | null) => {
      const result: ShellCommandResult = {
        code: code ?? 0,
        stderr: stderr.trim(),
        stdout: stdout.trim(),
      };

      if (code === 0) {
        resolve(result);
      } else {
        // Create an error object that also contains the command result data
        const error = new Error(
          `Command failed with exit code ${code}: ${arguments_.join(" ")}`,
        ) as CommandError;
        error.result = result;
        reject(error);
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}
