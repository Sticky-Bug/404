# User 1 — Frontend / React UI owner prompt

You are **User 1**, responsible ONLY for VibeWrite's React renderer UI. **User 2 is working in parallel on Electron main/preload, IPC, AI providers, API-key storage, and the project package configuration.** The repository has already been created and cloned from Git. Do not scaffold a new app, reset the starter, or redo the base setup.

## Absolute collaboration rules

- Work only in your own branch, named `feature/user1-ui`.
- You own `src/renderer/src/**` and `src/renderer/index.html` only. Do not edit any other files.
- In particular, do not touch `src/main/**`, `src/preload/**`, `package.json`, `package-lock.json`, `electron.vite.config.*`, `tsconfig*`, `.env*`, or provider/key-storage files. User 2 owns those.
- Do not overwrite, reformat, rename, or “clean up” files owned by User 2. Do not implement AI calls in React and do not place API keys in the renderer, localStorage, or source code.
- Both people are using the same Git base. Do not push to `main` directly. Commit and push only your branch; tell the coordinator which files you changed and any integration needs.
- If a dependency you want is missing, do not edit package files. Tell the coordinator/User 2 the exact install command instead. Prefer the existing dependencies and plain CSS.
- Do not alter the bridge contract below to suit your UI. If something is missing, ask User 2/coordinator before inventing a different interface.

## Goal

Build a polished, minimal, accessible React interface for an Electron desktop app called **VibeWrite**. It transforms one rough draft into up to three persona-styled rewrites and shows a word-level comparison against the original. This is a six-hour Vibeathon MVP, so make the core journey reliable rather than adding unrelated features.

## UI requirements

1. Use a calm, clean productivity aesthetic: light neutral background, restrained borders, crisp typography, one accent color, generous spacing, responsive layout for a laptop-sized window. Avoid neon gradients, glassmorphism overload, chat bubbles, and gamification.
2. Main workspace:
   - Compact header with VibeWrite wordmark, provider/connection status, and Settings action.
   - Large labelled text editor with placeholder, word/character count, clear action, and a 10,000-character limit message.
   - Persona cards/tags: Executive / CEO, Supportive peer, Legal / compliance, Gen Z / casual, Diplomatic, Friendly, Persuasive, Custom. Each has a short description. Permit selection of up to three personas.
   - Tone control with Subtle, Balanced, Bold options.
   - A prominent Generate variants button disabled for empty drafts and while generation is underway.
   - Results cards with persona name, provider/model attribution, word count, Rewrite/Changes toggle, Copy button, and clear loading/error states.
   - Copy selected result and Copy all actions.
   - A settings dialog for setting/testing/clearing Gemini, Groq, and optional OpenRouter keys. Keys must be sent through `window.vibewrite` and never retained in React state longer than necessary; never save them to localStorage.
3. Changes view:
   - Highlight removed words in red with a textual Removed label or accessible equivalent; highlight additions in green with an Added label or accessible equivalent. Do not rely on color alone.
   - Show original and rewritten word counts.
   - Show a clearly labelled approximate **text edit/change rate**, not a semantic-similarity score or a guarantee of preserved meaning.
4. Generate selected personas sequentially so progress is visible and cloud free-tier limits are less likely to be hit. Keep already completed results when a later persona fails. For each failed cloud result, offer a clearly labelled **Try basic offline rewrite** action.
5. Accessible keyboard focus, labels, sensible button states, and readable contrast. Handle clipboard failure visibly.
6. No login, accounts, inbox integration, database, cloud history, telemetry, or email sending.

## Files you may create/change

Only under `src/renderer/src/**` and `src/renderer/index.html`. Keep the starter's existing conventions. Suggested organization (adapt where appropriate, without touching outside your ownership):

```text
src/renderer/src/
  App.tsx
  components/
    DraftEditor.tsx
    PersonaPicker.tsx
    ToneControl.tsx
    VariantCard.tsx
    DiffView.tsx
    SettingsDialog.tsx
    StatusMessage.tsx
  data/personas.ts
  lib/diff.ts
  types/vibewrite-api.d.ts
  styles/tokens.css
  styles/app.css
```

Keep your changes focused; do not restructure the whole project just to match this suggested tree. Use `diff` if it's already available. If not, implement a small local diff helper or report the missing dependency—do not change `package.json`.

## Required bridge contract

User 2 will implement this bridge in Electron preload/main. Add the renderer-side TypeScript declaration under your owned renderer directory (for example `src/renderer/src/types/vibewrite-api.d.ts`) to match the contract exactly. Do not edit preload files.

## Shared frontend ↔ Electron bridge contract (must match exactly)

The renderer calls only `window.vibewrite`. Do not use direct Node APIs or call cloud APIs from React.

```ts
type ProviderId = 'gemini' | 'groq' | 'openrouter';
type PersonaId = 'executive' | 'supportive' | 'legal' | 'gen-z' | 'diplomatic' | 'friendly' | 'persuasive' | 'custom';
type ToneIntensity = 'subtle' | 'balanced' | 'bold';
type ProviderName = ProviderId | 'local';

type RewriteRequest = {
  draft: string;
  personaId: PersonaId;
  intensity: ToneIntensity;
  customInstruction?: string;
};

type RewriteResponse =
  | { ok: true; text: string; provider: ProviderName; model: string; fallbackUsed: boolean }
  | { ok: false; error: string; providersAttempted: ProviderId[] };

type ProviderStatus = {
  provider: ProviderId;
  configured: boolean;
  lastStatus: 'ok' | 'error' | 'rate-limited' | 'not-tested';
  message?: string;
};

type OperationResult = { success: boolean; message: string };

interface VibeWriteBridge {
  getProviderStatus(): Promise<ProviderStatus[]>;
  generateRewrite(request: RewriteRequest): Promise<RewriteResponse>;
  generateOfflineRewrite(request: RewriteRequest): Promise<RewriteResponse>;
  setApiKey(input: { provider: ProviderId; key: string }): Promise<OperationResult>;
  clearApiKey(input: { provider: ProviderId }): Promise<OperationResult>;
  testProvider(input: { provider: ProviderId }): Promise<OperationResult>;
}
```

The `generateRewrite` call tries configured cloud providers sequentially (Gemini, then Groq, then optional OpenRouter). If all cloud attempts fail, return `{ ok: false, ... }`. Do not silently replace cloud output with local output. The UI then offers `generateOfflineRewrite`, which returns a result with `provider: 'local'` and a clear low-quality/offline label.


## Behavior and quality rules

- Persona definitions should be data-driven. For a custom persona, expose a short instruction field and pass it as `customInstruction`.
- Treat draft content as untrusted data. The UI should explain that cloud providers receive the text only when the user clicks Generate; don't claim confidential drafts are safe on free tiers.
- Do not claim facts are guaranteed to be preserved. Avoid fake AI output. If you need temporary UI fixtures, keep them visibly labelled as sample/demo content and remove them from the final flow.
- Do not expose API-key values again after save; show only configured/not-configured and operation status.
- Handle `window.vibewrite` temporarily being unavailable without crashing: show a useful integration message, not a fake successful result.
- Avoid global state libraries unless one already exists. Prefer React state and small components.
- Do not change `package.json` or lockfiles.

## Acceptance checklist

- UI launches and remains responsive while rewrites run.
- User can enter a draft, select 1–3 personas and intensity, generate results, compare changes, copy a result, and copy all.
- Each selected persona can succeed or fail independently; completed variants remain visible.
- API Settings talks through the bridge only and never saves keys to browser storage.
- Offline rewrite is separately labelled and only shown as local/basic output.
- Empty input, oversized input, provider failure, loading, and clipboard failure are handled.
- Run the existing lint/typecheck/build scripts if available. If the standard dev app requires User 2's bridge, note any missing bridge integration clearly.

## Finish and handoff

Before finishing, inspect `git status`, confirm all changed paths are within your ownership, then commit with a message such as `feat(ui): build VibeWrite renderer`. Push `feature/user1-ui`. In your final handoff, list changed files, tests run, assumptions, and any exact integration steps. Do not edit User 2's files to fix an integration problem—report it with a concise reproduction instead.
