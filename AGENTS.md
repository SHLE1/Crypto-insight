<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Crypto Insight Agent Rules

## Package manager

- Use `pnpm` only.
- Use `pnpm install`, `pnpm dev`, `pnpm build`, and `pnpm lint`.
- `pnpm dev` must use `next dev --webpack` for now. Do not switch dev back to Turbopack unless the compile hang is explicitly re-tested and confirmed gone.
- Keep `pnpm-lock.yaml` as the single source of truth for dependencies.
- Do not add or regenerate `package-lock.json`, `yarn.lock`, or `bun.lock`.
- If dependencies change, update `pnpm-lock.yaml` in the same change.

## Framework rules

- This repo is on `Next.js 16` with App Router.
- Before changing framework behavior, read the relevant docs under `node_modules/next/dist/docs/`.
- Prefer current App Router conventions. Do not rely on outdated Next.js patterns from memory.

## Build and runtime constraints

- Keep the project buildable in restricted or offline environments.
- Do not introduce build-time network dependencies such as Google Fonts.
- Prefer local assets, system fonts, and server-side integrations that fail clearly.
- If an external API may fail or time out, return a clear error state instead of hanging the page.

## Product constraints

- Wallets, exchange accounts, snapshots, and settings are local-first.
- Never export API keys, API secrets, or passphrases.
- Import flows may restore structure and labels, but secrets must be re-entered manually.
- Do not silently mix stale snapshots with active data after a source is removed or disabled.

## Verification

- Before finishing, run `pnpm lint` and `pnpm build`.
- If the change touches routes, market data, wallet queries, or exchange queries, also verify the affected path or API response when possible.
- Do not mark work complete if the main flow is still demo-only, broken, or blocked by avoidable errors.
