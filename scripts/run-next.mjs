// Runs `next dev` / `next build`, picking the bundler the current path can handle.
// usage: node scripts/run-next.mjs <dev|build> [extra next args]
//
// Turbopack (the Next 16 default) builds an internal asset id from the absolute
// project path and slices that string by byte offset. On a path containing
// non-ASCII characters the slice lands inside a multi-byte character and the
// Rust worker panics:
//
//   panicked at turbopack-core/src/ident.rs:354:34
//   start byte index 54 is not a char boundary; it is inside 'ᄉ'
//
// It aborts `next build` and makes every `next dev` route return 500. CI checks
// the repo out under an ASCII path, so it keeps the default Turbopack build and
// production output does not change. Only a local clone sitting under a
// non-ASCII path (e.g. ~/Downloads/채용관련 문서들/portfolio) falls back to webpack.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const [command, ...rest] = process.argv.slice(2);

if (command !== "dev" && command !== "build") {
  console.error(`run-next: expected "dev" or "build", got "${command ?? ""}"`);
  process.exit(1);
}

const asciiOnly = /^[\x00-\x7F]*$/;
const projectPath = process.cwd();
const needsWebpack = !asciiOnly.test(projectPath);
const bundler = needsWebpack ? "--webpack" : "--turbopack";

if (needsWebpack) {
  console.log(
    `[run-next] 경로에 ASCII 가 아닌 문자가 있어 webpack 으로 실행합니다 — Turbopack 은 이 경로에서 패닉합니다.\n` +
      `[run-next] ${projectPath}`,
  );
}

// resolve the local binary instead of relying on the shell PATH
const localNext = path.join(projectPath, "node_modules", ".bin", "next");
const bin = existsSync(localNext) ? localNext : "next";

const child = spawn(bin, [command, bundler, ...rest], {
  stdio: "inherit",
  shell: false,
  env: process.env,
  cwd: projectPath,
});

child.on("error", (error) => {
  console.error(`[run-next] next 를 실행하지 못했습니다: ${error.message}`);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
