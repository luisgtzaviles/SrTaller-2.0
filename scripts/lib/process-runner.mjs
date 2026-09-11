import { spawn } from 'node:child_process';

function terminateProcessTree(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (child.pid && process.platform !== 'win32') {
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
}

export async function runStreamingCommand(
  command,
  argumentsList,
  {
    cwd = process.cwd(),
    env = process.env,
    timeoutMs = 30 * 60_000,
    stream = true,
  } = {},
) {
  const child = spawn(command, argumentsList, {
    cwd,
    detached: process.platform !== 'win32',
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    if (stream) process.stdout.write(chunk);
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
    if (stream) process.stderr.write(chunk);
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    terminateProcessTree(child, 'SIGTERM');
    setTimeout(() => terminateProcessTree(child, 'SIGKILL'), 2_000).unref();
  }, timeoutMs);
  timer.unref();

  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  }).finally(() => clearTimeout(timer));

  if (result.code !== 0) {
    const error = new Error(
      timedOut
        ? `Verification command timed out: ${command}`
        : `Verification command failed: ${command} (exit ${String(result.code)}, signal ${String(result.signal)})`,
    );
    error.code = result.code;
    error.signal = result.signal;
    error.stdout = stdout;
    error.stderr = stderr;
    throw error;
  }
  return Object.freeze({ stdout, stderr });
}
