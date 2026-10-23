# VibeWrite — two-person Git workflow

Both people already have the starter project cloned from Git. **Do not run the Electron scaffolder again.** Each person should work in a separate clone or their own working directory and feature branch.

## 1. Sync and create separate branches

Run in each user's own clone, from the repository root:

```powershell
git status
git switch main
git pull origin main
```

User 1:

```powershell
git switch -c feature/user1-ui
```

User 2:

```powershell
git switch -c feature/user2-ai-backend
```

If a branch already exists, use `git switch feature/user1-ui` or `git switch feature/user2-ai-backend` instead of creating it again.

## 2. Ownership boundary

- **User 1:** `src/renderer/src/**`, `src/renderer/index.html` only.
- **User 2:** `src/main/**`, `src/preload/index.ts`, `package.json`, lockfile, plus minimal Electron config only if required.
- User 1 must not edit main/preload/package files. User 2 must not edit renderer files.
- Both prompts define the same `window.vibewrite` contract. Do not casually rename methods or fields. Discuss contract changes first.
- Never commit API keys or `.env` secrets. Each developer should keep personal keys local.

## 3. Commit and push separately

After running and checking your work:

```powershell
git status
git add <only-your-owned-files>
git commit -m "feat(ui): build VibeWrite renderer"
git push -u origin feature/user1-ui
```

User 2 uses:

```powershell
git status
git add <only-your-owned-files>
git commit -m "feat(ai): add secure provider router and IPC bridge"
git push -u origin feature/user2-ai-backend
```

Use `git add <only-your-owned-files>`; avoid `git add .` if there could be secrets or unrelated changes. If you are using a single shared working directory on one computer, do not switch branches while the other person has uncommitted work; use separate clones or Git worktrees.

## 4. Integrate after both branches are pushed

Have one person act as integrator. Prefer two pull requests into `main`. Resolve only real conflicts; do not choose one whole directory over the other without reviewing. Since the ownership boundaries differ, there should be few conflicts. `package.json` and the lockfile are User 2's responsibility.

Then in the integration clone:

```powershell
git switch main
git pull origin main
git merge --no-ff origin/feature/user1-ui
git merge --no-ff origin/feature/user2-ai-backend
npm install
npm run dev
```

If you use pull requests, merge those instead of running the two `git merge` commands. Run the scripts defined in `package.json`; if the starter has a build script, test it too (for example `npm run build`).

## 5. Integration test sequence

1. App launches from a fresh clone with `npm install` and the existing dev command.
2. Type a draft, select two personas, and generate both results sequentially.
3. Open Changes for each result and verify word additions/removals and counts.
4. Copy a result and Copy all.
5. Enter a valid Gemini key in Settings; test generation.
6. Force a controlled Gemini failure and confirm Groq is attempted next.
7. Clear or omit cloud keys and confirm that the app offers a labelled basic offline rewrite.
8. Confirm keys and drafts are not written to logs, committed, or sent to a history service.

## Shared bridge contract

The two individual prompts contain the exact TypeScript contract. Treat it as an API agreement. User 1 owns the renderer-side declaration; User 2 implements that interface in preload/main. The renderer never directly calls cloud providers.
