# Gmail Integration Specification --- VibeWrite

## Goal

Add optional Gmail account connection and direct email sending to
VibeWrite. Users can draft or transform an email with personas, add
multiple recipients, review the final message, and explicitly send it
through their connected Google account.

**Critical UX requirement:** the email-send action must be visually and
functionally separate from the buttons that generate tone drafts.
Generating a draft must never send an email.

## 1. Required user workflow

1.  User opens VibeWrite and optionally connects a Google account.
2.  User writes or generates one or more tone variants in the existing
    main editor.
3.  A separate **Email participants & delivery** panel appears **below
    the current main window/editor content**. It must not replace or
    overlay the current editor.
4.  User adds recipients and selects To, Cc, or Bcc for each
    participant.
5.  User chooses the final generated version (or edits it), enters a
    subject, and reviews the complete email.
6.  User clicks the distinct **Send email** button in the lower delivery
    panel.
7.  Show a confirmation step with sender account, To/Cc/Bcc, subject,
    and a preview of the message.
8.  Only after the user confirms, send via Gmail API.
9.  Display a clear success or failure state. Never claim the email was
    sent unless the Gmail API confirms success.

## 2. UI requirements

### Gmail account connection

-   Show account status: `Not connected`, `Connecting…`,
    `Connected as name@gmail.com`, or `Connection expired`.
-   Provide a `Connect Gmail` button.
-   Provide `Disconnect` and `Reconnect` actions when appropriate.
-   Show the account currently selected as the sender before sending.
-   Never ask users to paste their Google password into VibeWrite.
-   If Gmail is not connected, allow local drafting and copying; disable
    sending with an explanation.

### Keep generation and sending separate

The existing tone-generation controls remain in the current editor area,
for example:

-   `Generate tone drafts`
-   `Regenerate`
-   `Compare versions`

Below the main editor/result area, add a visually separate section
titled **Email participants & delivery** containing:

-   Sender account selector/status.
-   Recipient rows with email address and recipient type (`To`, `Cc`,
    `Bcc`).
-   `Add participant` and remove-recipient controls.
-   Subject input.
-   Final email body preview/editor populated from the selected tone
    draft.
-   `Send email` button.
-   Optional `Save as Gmail draft` button, if implemented.
-   Delivery status and error messages.

**Do not** put `Send email` beside, inside, or in the same button group
as `Generate tone drafts`. Do not send automatically after generation or
when selecting a persona. The send button must be clearly labeled and
use a separate handler.

### Participant management

-   Support multiple recipients.
-   Validate email syntax on the client for helpful feedback, then
    validate again in the main process.
-   Prevent sending if there are no valid `To` recipients. Cc/Bcc alone
    should not count as the primary recipient unless the product
    intentionally supports that behavior.
-   Deduplicate addresses case-insensitively, or warn users about
    duplicates.
-   Preserve recipient type when adding/removing participants.
-   Display Bcc recipients only in the sender's confirmation UI; never
    include Bcc addresses in visible To/Cc headers.
-   Do not infer or auto-add participants without the user's explicit
    action.
-   Confirm the sender account and all recipients before sending.

## 3. Recommended architecture

Keep all Google OAuth token handling and Gmail API requests in the
Electron **main process**. The React renderer must not receive access
tokens or refresh tokens.

Suggested flow:

`React renderer → narrow preload API → validated IPC handler in Electron main → Google OAuth / Gmail API`

Responsibilities:

### Renderer (React + TypeScript)

-   Render connection status, participant rows, subject, message
    preview, send confirmation, and result states.
-   Use the existing selected tone draft as a starting point, but allow
    the user to review/edit the final body.
-   Call only typed methods exposed by the preload bridge.
-   Never import Google API credentials or OAuth libraries directly into
    renderer components.
-   Never send an email from a React effect or from a draft-generation
    callback.

### Preload

Expose a small, typed API, such as:

``` ts
interface GmailIntegrationAPI {
  getStatus(): Promise<GmailAccountStatus>;
  connect(): Promise<GmailAccountStatus>;
  disconnect(): Promise<void>;
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
  // Optional:
  saveDraft?(input: SendEmailInput): Promise<{ draftId: string }>;
}
```

Adapt names to the project's existing `window.vibewrite` contract
instead of creating a second conflicting global. Validate all inputs
again in the main process. Do not expose generic IPC methods or
arbitrary channel names to the renderer.

### Electron main process

-   Start OAuth using the supported Google OAuth flow for the actual
    distribution model.
-   Open Google's consent/login page in the system browser when
    appropriate; do not collect passwords in an embedded form.
-   Handle the OAuth callback securely and validate `state` to protect
    against CSRF.
-   Exchange authorization codes only in the main process.
-   Keep tokens out of renderer state, logs, crash reports, and error
    messages.
-   Store secrets/tokens using OS-backed secure storage where available
    (Electron `safeStorage` can protect stored token material, but it is
    not a replacement for correct OAuth design).
-   Validate recipient addresses, subject/body types, limits, and
    account state before making API calls.
-   Construct and send the Gmail API request.
-   Return a minimal result (success and message/thread ID if useful),
    never raw tokens.

## 4. Google Cloud and Gmail API setup

1.  Create or select a project in Google Cloud Console.
2.  Enable the **Gmail API**.
3.  Configure the OAuth consent screen, app name, support/developer
    contact, and audience.
4.  Configure the OAuth client appropriate to the app's real
    distribution and redirect strategy. Do not blindly use a web-client
    secret inside a packaged desktop app; desktop-installed applications
    cannot safely keep a shared client secret confidential.
5.  Add only the scopes the feature needs. For sending messages, prefer
    the narrow Gmail sending scope:
    -   `https://www.googleapis.com/auth/gmail.send`
6.  If saving drafts is implemented, evaluate whether
    `https://www.googleapis.com/auth/gmail.compose` is needed. Request
    only scopes actually used.
7.  Test with development/test users if the OAuth consent screen is in
    testing mode.
8.  Before public distribution, review Google's verification and
    restricted/sensitive-scope requirements for the selected scopes and
    app type. Do not promise that an unverified app can be used by every
    Google account without warnings or restrictions.

Use Google's current official documentation for the exact OAuth client
type, redirect flow, publishing requirements, and API setup: - Gmail API
overview: https://developers.google.com/workspace/gmail/api/guides -
Gmail API sending:
https://developers.google.com/workspace/gmail/api/guides/sending - OAuth
2.0 for installed apps:
https://developers.google.com/identity/protocols/oauth2/native-app -
OAuth consent screen / verification:
https://developers.google.com/workspace/guides/configure-oauth-consent

OAuth behavior and Google verification rules can change; verify current
requirements before shipping.

## 5. Gmail send implementation

Gmail API `users.messages.send` accepts a MIME email encoded as
Base64URL in the `raw` field.

Implementation outline for the main process:

1.  Confirm the user is connected and has granted the sending scope.
2.  Validate at least one `To` recipient, subject, and body.
3.  Build a MIME message with correct headers:
    -   `To`
    -   `Cc` only when present
    -   `Subject`
    -   `MIME-Version: 1.0`
    -   `Content-Type: text/plain; charset=UTF-8` (or a carefully
        escaped multipart/HTML implementation if rich text is supported)
4.  Put Bcc recipients in the MIME message's `Bcc` header for delivery,
    but never expose them in To/Cc display or recipient-visible copies.
5.  Encode the complete MIME message as Base64URL (URL-safe Base64 with
    padding removed as required by the API).
6.  Call `users.messages.send` for the authenticated user
    (`userId: "me"`).
7.  Handle API errors and show a clear outcome.

Use a maintained Google API client where suitable, or a carefully
implemented HTTPS request. Do not hand-roll MIME handling if the project
needs attachments, HTML, inline images, or complex internationalized
email. For a hackathon MVP, plain-text UTF-8 is the safest first
version.

Pseudo-code only:

``` ts
async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const validated = validateSendInput(input);
  const account = await requireConnectedGmailAccount();
  await requireGrantedScope(account, "https://www.googleapis.com/auth/gmail.send");

  // Build MIME message from validated recipients, subject, and body.
  // Base64URL-encode it and call Gmail users.messages.send.
  // Return success only after the API responds successfully.
}
```

Do not copy/paste this as a complete implementation; OAuth, token
refresh, MIME encoding, and error handling must be implemented for the
project's actual setup.

## 6. Suggested TypeScript data types

``` ts
type RecipientType = "to" | "cc" | "bcc";

interface EmailParticipant {
  id: string;
  email: string;
  type: RecipientType;
  displayName?: string;
}

interface GmailAccountStatus {
  connected: boolean;
  email?: string;
  displayName?: string;
  needsReconnect?: boolean;
}

interface SendEmailInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  userMessage?: string;
}
```

Use the project's existing ID-generation convention. Treat all
renderer-supplied fields as untrusted input.

## 7. Error handling

Provide actionable messages for common cases:

-   Not connected: `Connect a Gmail account to send this email.`
-   Consent/scope missing:
    `Reconnect Gmail and approve the requested sending permission.`
-   Expired/revoked credentials:
    `Your Gmail connection expired. Reconnect to continue.`
-   Invalid recipient: `Check the highlighted email address.`
-   Offline/network error:
    `Couldn't reach Gmail. Your message has not been confirmed as sent.`
-   Rate limit/quota:
    `Gmail is temporarily limiting requests. Try again later.`
-   API rejected message: show a safe, human-readable explanation
    without secrets.
-   Unknown outcome/network timeout:
    `We couldn't confirm whether Gmail sent this message. Check your Sent folder before retrying.`

Do not automatically retry a send request after an ambiguous timeout;
that could send duplicates. If retry is offered, tell the user to check
Sent first.

## 8. Security and privacy requirements

-   Never hard-code OAuth secrets, refresh tokens, or access tokens in
    source code.
-   Never expose tokens to renderer JavaScript or store them in
    `localStorage`.
-   Use least-privilege scopes.
-   Use OAuth `state` validation and the correct redirect flow.
-   Do not log email bodies, recipient lists, OAuth codes, or tokens.
-   Make sending a deliberate user action, preceded by a
    review/confirmation step.
-   Do not send to hidden, automatically generated, or unreviewed
    recipients.
-   Provide disconnect/revoke guidance and clear account identity.
-   Keep API keys and credentials out of Git; add local secret files to
    `.gitignore`.
-   Explain that email content is sent to Google/Gmail and that draft
    content may also be sent to the configured AI provider when users
    request tone generation.
-   Consider a `mailto:`/copy-to-clipboard fallback if Gmail connection
    setup cannot be completed during the hackathon.

## 9. Acceptance criteria

-   [ ] User can connect a Google account through OAuth.
-   [ ] UI shows which Gmail account is connected.
-   [ ] User can disconnect and reconnect.
-   [ ] User can add, remove, and classify multiple To/Cc/Bcc
    participants.
-   [ ] User can edit the subject and final email body.
-   [ ] The delivery panel appears below the existing main editor/window
    content.
-   [ ] `Generate tone drafts` and `Send email` are separate controls
    with separate handlers.
-   [ ] Generating or selecting a tone never sends an email.
-   [ ] Send requires an explicit click and confirmation.
-   [ ] The main process validates all send input and performs Gmail API
    calls.
-   [ ] Tokens are not exposed to the renderer or committed to Git.
-   [ ] Success is displayed only after a successful API response.
-   [ ] Failures are visible and do not falsely claim the email was
    sent.
-   [ ] Bcc recipients are not shown in recipient-visible To/Cc headers.
-   [ ] The app remains usable for drafting when Gmail is not connected.
-   [ ] Basic sending is tested with a development Gmail account before
    the demo.

## 10. Implementation order for the hackathon

1.  Build the lower delivery panel and participant management with mock
    connection status.
2.  Wire it to the existing final selected draft without coupling it to
    generation.
3.  Implement Google OAuth and secure token storage in Electron main.
4.  Implement plain-text `users.messages.send`.
5.  Add confirmation, loading, success, and failure states.
6.  Test with a development account and verify the message in Gmail's
    Sent folder.
7.  If OAuth setup/verification becomes a blocker, keep the UI honest
    and offer copy/email-client fallback instead of pretending direct
    Gmail sending works.

## Definition of done

A user can connect their Gmail account, add multiple recipients below
the existing editor, review a final persona-adjusted email, and send it
only through a separate, explicit **Send email** action. Draft
generation and email delivery remain independent features.

------------------------------------------------------------------------

## 11. Git integration and handoff: commit the complete project to `main`

### Goal

After implementation and testing, integrate the Gmail feature with the
**entire existing VibeWrite project** and push the completed, runnable
frontend and backend to the shared Git remote's `main` branch
(`origin/main`), so another team member can clone/pull the repository,
install dependencies, configure their own credentials, and run the
application.

**Do not commit `node_modules/`, build outputs, local secrets, OAuth
tokens, or personal configuration.** The repository must contain the
source code and all project files needed to install and run the app.

### Important collaboration rules

-   First inspect `git status`, the current branch, remotes, and recent
    commits.
-   Preserve all existing frontend and backend work. Do not overwrite,
    reset, or discard another contributor's changes.
-   If working on a feature branch, commit the feature there, then
    integrate it into `main` using the team's agreed merge workflow.
-   Do not force-push `main` (`git push --force` / `--force-with-lease`
    is not permitted for this task).
-   Do not commit directly to `main` if repository branch protection or
    team policy requires a pull request.
-   If `main` has diverged, conflicts exist, credentials are missing,
    tests fail, or permissions prevent pushing, stop and explain the
    exact blocker. Do not pretend the push succeeded.
-   Only push when the user has authorized the requested repository
    update and the remote/branch are verified. Never invent a remote URL
    or change remotes without approval.

### Files that should be included

Commit all required, non-secret project source and configuration,
including as applicable:

-   Electron main-process source and IPC handlers.
-   Preload bridge source and TypeScript contracts.
-   React renderer/frontend source, components, styles, and assets.
-   Gmail OAuth and Gmail API integration source.
-   AI provider integration and local fallback source.
-   `package.json` and the correct package-manager lockfile
    (`package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`).
-   Electron/Vite/TypeScript/build configuration.
-   Public assets and any required icons.
-   `.gitignore`.
-   `.env.example` containing placeholder variable names only, if
    environment variables are used.
-   `README.md` with prerequisites, install/run/build commands, and
    setup instructions.
-   This `gmail_integration.md` and other relevant project
    documentation.
-   Tests and scripts needed to verify the application.

Do not add generated files unless the project explicitly requires them
to run or package the app.

### `.gitignore` and secrets check

Before staging, ensure `.gitignore` excludes at least the appropriate
entries for this project's setup:

``` gitignore
node_modules/
dist/
dist-electron/
out/
release/
coverage/
.env
.env.*
!.env.example
*.log
.DS_Store
Thumbs.db
```

Adapt this list to the actual build system. Do not ignore required
source or lockfiles. Check that OAuth client secrets, API keys,
access/refresh tokens, local config files, and private credentials are
not staged. If a secret was already committed, removing it from the
latest commit is not enough if it remains in Git history; revoke/rotate
it and follow the team's secret-removal procedure.

### Lockfile and reproducible installation

-   Commit the package manager's lockfile.
-   Ensure `package.json` declares every required runtime and
    development dependency.
-   Do not rely on globally installed packages or a developer's local
    `node_modules`.
-   After implementation, verify a clean dependency install from the
    lockfile where feasible:
    -   npm: `npm ci`
    -   pnpm: `pnpm install --frozen-lockfile`
    -   Yarn: use the appropriate immutable/frozen-lockfile command for
        the project's Yarn version.
-   Use the package manager already established by the repository. Do
    not create competing lockfiles.

### README handoff requirements

Update `README.md` so a new teammate can get started after cloning
without asking the original developer for undocumented steps. Include:

1.  Supported Node.js version and package manager.
2.  Clone command and repository URL (use the actual configured remote;
    do not invent one).
3.  Dependency-install command.
4.  Development start command.
5.  Production build/package command, if configured.
6.  Google Cloud project setup, Gmail API enablement, OAuth
    client/redirect configuration, consent-screen setup, and required
    Gmail scopes.
7.  Where to configure local credentials and how to keep them out of
    Git.
8.  AI provider key setup, if required.
9.  Known limitations and troubleshooting.
10. A note that each developer must configure their own credentials;
    secrets are not included in the repository.

### Suggested safe Git workflow

Run commands from the repository root, reviewing output after each step.
Adapt commands to the actual branch and package manager.

``` bash
git status
git remote -v
git branch --show-current
git log -5 --oneline
```

Inspect and update `.gitignore`, `README.md`, package scripts, and the
lockfile. Then review what will be staged:

``` bash
git status --short
git diff --check
git diff
```

Stage the intended project files only. Avoid `git add .` if there may be
credentials, build output, or unrelated files. Review the staged
changes:

``` bash
git add <reviewed-project-files>
git diff --cached --check
git diff --cached --stat
git diff --cached
```

If checks pass, commit using a descriptive message, for example:

``` bash
git commit -m "Integrate Gmail sending and complete app handoff"
```

Then update the local branch safely. Follow the project's team workflow;
for a feature branch, push the branch and open/merge a pull request if
required. If authorized and the team explicitly permits direct pushes to
`main`, verify the local `main` is up to date before pushing:

``` bash
git fetch origin
git switch main
git pull --ff-only origin main
```

Integrate the feature branch using the team's agreed merge method,
resolve conflicts without discarding either person's work, rerun checks,
and then push:

``` bash
git push origin main
```

Do not blindly run this sequence if the repository is in a different
state. Inspect first and adapt it. Never force-push to resolve
conflicts.

### Final verification

After pushing, verify the remote branch and commit:

``` bash
git fetch origin
git log -1 --oneline origin/main
git status
```

Where practical, verify the repository can be cloned into a fresh
directory, dependencies can be installed from the lockfile, and the app
starts using the README instructions. Do not claim a clean-clone test
was completed unless it was actually run.

### Completion report

When finished, report:

-   Which branch and commit were pushed.
-   Whether the push to `origin/main` succeeded.
-   Which install, development, build, and test commands were run and
    their outcomes.
-   Any required local setup that is not committed, such as OAuth
    credentials or AI provider keys.
-   Any remaining blockers.

**Definition of done:** The shared repository contains the complete,
integrated frontend and backend source and reproducible dependency
metadata, but no `node_modules` or secrets. A teammate can clone/pull
it, install the dependencies, follow the README to configure their own
credentials, and launch the app.
