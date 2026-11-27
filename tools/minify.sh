#!/usr/bin/env bash
# 用 Google Closure Compiler 压缩 js/*.js（SIMPLE 优化，就地覆盖）。
# 依赖：Java 11+ 与 Node/npx（首次运行会下载 google-closure-compiler），
# 或通过 CLOSURE_JAR=/path/to/compiler.jar 指定本地编译器。
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${CLOSURE_JAR:-}" ]]; then
  run_cc() { java -jar "$CLOSURE_JAR" "$@"; }
else
  run_cc() { npx --yes google-closure-compiler "$@"; }
fi

for src in js/*.js; do
  tmp="$(mktemp)"
  run_cc \
    --compilation_level SIMPLE \
    --rewrite_polyfills=false \
    --warning_level QUIET \
    --js "$src" \
    --js_output_file "$tmp"
  mv "$tmp" "$src"
  printf 'compressed %s -> %s bytes\n' "$src" "$(wc -c < "$src")"
done
