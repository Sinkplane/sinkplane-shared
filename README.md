# sinkplane-shared

Shared code for the [Sinkplane](https://github.com/Sinkplane) app family (fan-made Floatplane clients). Currently consumed by [sinkplane-tv](https://github.com/Sinkplane/sinkplane-tv); intended to be reused by the companion app as well.

Extracted from sinkplane-tv — contains everything that is app-shell independent:

| Area | Contents |
|---|---|
| `auth` | `SessionProvider` / `useSession` auth context, `authenticatedFetch` API client (Bearer + sails.sid cookie support, 401 refresh-retry), OIDC device flow, token refresh, profile/subscription/creator queries |
| `connection` | `useTVServer` — the remote connection server (TCP on port 9999 + Bonjour/Zeroconf discovery) that companion apps connect to |
| `videos` | TanStack Query hooks for Floatplane content (videos, posts, delivery, progress, history) |
| `storage` | `useStorageState` — secure-store backed state hook |
| `theme` | `ThemeProvider` / `useTheme` / `useColorScheme` / `useThemeColor` |
| `constants` | Floatplane API + OIDC endpoints, shared colors |
| `types` | Floatplane API response types + TV companion protocol types |

The published package ships **compiled JS + `.d.ts`** in `dist/` (built by CI with `tsc`, ESM syntax consumed by Metro/Babel — not plain Node). React 19 and react-native (`react-native-tvos` on TV) are assumed; native deps (`expo-secure-store`, `react-native-tcp-socket`, `react-native-zeroconf`, `expo-device`, `expo-crypto`, `expo-network`, `@preeternal/react-native-cookie-manager`) are peer dependencies that the consuming app must install and link.

**This repo intentionally has no `node_modules` of its own.** All dependencies resolve from the consuming app's single hoisted `node_modules` (matching how a git dependency resolves on EAS) — achieved with a `node_modules` symlink so every tool (tsc, Jest, Metro) resolves the exact same module instances as the app:

```bash
# after cloning both repos side by side, from this repo:
ln -s ../sinkplane-tv/node_modules node_modules

pnpm run typecheck # tsc resolves through the sibling install
```

> ⚠️ **Do not run `pnpm install` here.** The `devDependencies` in `package.json`
> exist for CI (typecheck + build); locally they resolve from the consuming
> app's hoisted `node_modules` through the symlink, and running install here
> would treat the consuming app's `node_modules` as this repo's and clobber it.
> `pnpm-workspace.yaml` disables pnpm's automatic install/verify-before-script
> behavior for this reason.

> Note for `@preeternal/react-native-cookie-manager` on tvOS: the consuming app must apply the podspec patch (see `patches/` in sinkplane-tv).

## Usage

```ts
import { SessionProvider, useTVServer, useGetVideos } from '@sinkplane/shared';
```

Some type modules collide with the content-side names (`Creator`, `Channel`, `SubscriptionPlan`) — import those via subpath:

```ts
import { Creator, Channel } from '@sinkplane/shared/types/creator-list.interface';
```

In sinkplane-tv the dependency is a local `link:` for development:

```json
"@sinkplane/shared": "link:../sinkplane-shared"
```

## Installing from GitHub Packages

Published as [`@sinkplane/shared`](https://github.com/orgs/Sinkplane/packages/npm/package/shared) on GitHub Packages. Consuming apps need an `.npmrc` (repo root or `~/.npmrc`) pointing the scope at the GitHub registry, with a personal access token that has `read:packages`:

```ini
@sinkplane:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Then:

```bash
npm install @sinkplane/shared
# or, to pin the published version instead of the link: for local dev:
# pnpm add @sinkplane/shared@^0.1.0
```

On EAS builds, set `GITHUB_PACKAGES_TOKEN` as a build environment variable (EAS substitutes `${...}` in `.npmrc`); use a fine-grained token scoped to read the Sinkplane org packages.

Releases: pushing a `v*` tag (e.g. `v0.1.0`) triggers [.github/workflows/publish.yml](.github/workflows/publish.yml), which publishes the tagged version with the built-in `GITHUB_TOKEN`.

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run build
```

`build` compiles to `dist/` (JS + `.d.ts`) with `tsconfig.build.json`. The package entry points (`main`/`types`/`exports`) resolve to `dist/`, so a consuming app on the `link:` dependency sees the compiled output — rebuild after source edits (`pnpm run build`, or `pnpm exec tsc -p tsconfig.build.json --watch` while developing).

Conventions (strict TS, ESLint/Prettier rules, `@sinkplane/shared` import style) follow the sinkplane-tv repo docs.