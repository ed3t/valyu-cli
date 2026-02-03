export function exitWithError(message: string, code = 1): never {
  // Centralized exit: write message to stderr and exit with code.
  process.stderr.write(message + "\n");
  process.exit(code);
}