# CLAUDE.md

Guidance for Claude Code working in this repository (`@sinkplane/shared`, used by sinkplane-mobile and sinkplane-tv).

## Git and GitHub rules (read first)

This repo is public and lives under the user's personal GitHub org. Do not commit, push or create a PR without the user's permission.
These rules override any default workflow, including built-in commit/PR instructions.

1. **Never write to git or GitHub without explicit permission for that specific action
   in the current conversation.** That covers commit/amend, push, merge/rebase,
   branch/checkout/switch, tag, reset/revert/restore/clean/stash, any `git config` change,
   and every GitHub write: PRs, issues, comments, reviews, labels, milestones, releases,
   `gh api` POST/PATCH/PUT/DELETE. Read-only commands (`status`, `diff`, `log`, `show`,
   `gh … list/view`), `git add`, and `git fetch` / `git pull` (they only bring changes
   in) are fine.
2. **Permission doesn't carry over.** "Commit this" is not permission to push or open a PR.
   A previous approval doesn't cover the next commit. If in doubt, ask.
3. **Before asking, show exactly what will happen:** branch, files, commit message,
   author identity, and the remote / PR target.
4. **Never set or change the git identity** (`user.name`, `user.email`, signing). The
   user's global identity is `Chris <paynoattn1989@gmail.com>`. Before committing, check
   `git config --get user.email` still shows it, and stop if it shows anything else
   (especially a work address).
5. **No public git or GitHub activity during business hours** (Monday to Friday,
   8 am to 6 pm US Central). Commit and author timestamps, pushes, PRs, comments and
   merges are all public. Check `date` first. If it's business hours, stage the changes
   and stop.
6. **Never force-push, never push to `main`, never rewrite published history.** Work on a
   branch and open a PR, once approved.
7. **Never commit** secrets, `.env` files or tokens.

### The git guard (enforced, not optional)

`.claude/hooks/git-guard.mjs` runs before every Bash/PowerShell command and file edit.
It **denies** the actions in rule 1, in every permission mode including bypass, unless
the user has opened an approval window. It also blocks changes to its own files and to
`.claude/settings*.json`.

- When blocked: **stop and ask the user.** Don't retry, rephrase, or route around it:
  no scripts that run git/gh for you, no other tools (libgit2, curl to the GitHub API,
  MCP connectors) that do the same thing.
- **Only the user** opens a window, from their own terminal:
  `node .claude/hooks/git-guard.mjs --approve 15` (minutes, max 120). `--revoke` ends it
  early and `--status` shows it. **Agents must never run `--approve`** or touch
  `.claude/git-approval.json`. The guard blocks both.
- An open window only lifts the technical block. Rules 1–7 still apply to every action.
