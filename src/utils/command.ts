import { x } from "tinyexec";

/**
 * Result of a shell command execution
 */
interface ShellCommandResult {
  code: number | undefined;
  stderr: string;
  stdout: string;
}

/**
 * Extended Error type for command execution errors
 */
interface CommandError extends Error {
  result: ShellCommandResult;
}

// Custom error class for command execution
class CommandErrorImpl extends Error implements CommandError {
  result: ShellCommandResult;
  constructor(message: string, result: ShellCommandResult) {
    super(message);
    this.name = "CommandError";
    this.result = result;
  }
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

  const [program, ...commandArguments] = arguments_;

  if (typeof program !== "string") {
    throw new TypeError("Command must be a string");
  }

  const result = await x(program, commandArguments, {
    nodeOptions: {
      cwd,
      env: env ? { ...process.env, ...env } : process.env,
      stdio: silent ? "pipe" : "inherit",
    },
    throwOnError: false,
  });

  const shellResult: ShellCommandResult = {
    code: result.exitCode,
    stderr: result.stderr.trim(),
    stdout: result.stdout.trim(),
  };

  if (shellResult.code === 0) {
    return shellResult;
  }

  throw new CommandErrorImpl(
    `Command failed with exit code ${shellResult.code}: ${arguments_.join(" ")}`,
    shellResult,
  );
}
