# Speech-to-Text Integration (`stt.md`)

## Goal

Add speech-to-text (STT) to the **existing project** without rebuilding
the app or changing its current design, layout, theme, sidebar, or
existing typing behavior.

Users should be able to click a microphone button, speak, and have their
speech inserted into the existing text input.

## First: inspect the project

Before editing code:

1.  Identify the framework, app entry point, current text
    input/textarea, styling system, and existing state-management
    approach.
2.  Find where the current input value is stored and how it is
    submitted.
3.  Reuse the existing input and state. Do **not** create a separate
    duplicate textbox.
4.  Follow the project's current coding conventions and package manager.
5.  If browser support or project constraints make the proposed API
    unsuitable, explain the limitation and implement the best compatible
    option.

## Required behavior

- Add a microphone button beside or inside the existing text input.
- Clicking the microphone starts speech recognition when permission is
  available.
- While listening, show a clear active state (for example, a pulsing
  mic icon and "Listening..." label).
- Clicking again stops recognition.
- Insert recognized words into the existing input, so the user can
  review or edit them before submitting.
- Preserve text already typed. Append dictated text at the cursor
  where practical; otherwise append it with a sensible space.
- Support interim results if the existing UI can display them without
  disrupting typed text. Final recognized text must remain in the
  input.
- Handle permission denial, unavailable microphone, unsupported
  browser, and recognition errors with short, friendly messages.
- Stop listening when the component unmounts. Avoid duplicate
  recognition sessions.
- Keep keyboard navigation, visible focus styles, accessible labels,
  and responsive layout.
- Do not automatically submit the message after recognition.

## Preferred implementation: Web Speech API

For a browser-only prototype, first check whether
`window.SpeechRecognition` or `window.webkitSpeechRecognition` exists.
The Web Speech API is not supported consistently in every browser, so
feature-detect it and show a graceful fallback.

Implementation requirements:

- Create the recognition instance only in browser/client code, not
  during server-side rendering.
- Configure `recognition.lang` using the app's language setting, or
  default to `en-US` if no setting exists.
- Set `recognition.continuous` and `recognition.interimResults`
  according to the desired interaction; a simple click-to-talk flow is
  a good default.
- Handle `onresult`, `onerror`, and `onend`.
- Use the final results (`isFinal`) to update the existing input value
  reliably.
- Prevent stale state and duplicated text when recognition emits
  multiple result events.
- Set listening state to false when recognition ends or errors.
- Release resources and stop recognition during cleanup.
- Do not assume that browser speech recognition works offline or in
  all browsers.

## Suggested UI states

1.  **Idle:** microphone icon with accessible label "Start voice
    typing".
2.  **Listening:** active microphone appearance and a "Listening..."
    status.
3.  **Processing:** optional short status while final text is being
    received.
4.  **Error / unsupported:** show a concise message and keep manual
    typing available.

Use the project's existing icon library if one is installed. Avoid
adding a new dependency just for a microphone icon.

## Security and privacy

- Request microphone access only after the user activates the
  microphone button.
- Explain that audio processing behavior depends on the browser and
  speech-recognition implementation.
- Do not store or log audio, transcripts, or microphone data unless
  the project already has a clearly disclosed and necessary feature
  for doing so.
- Never place API keys or secret credentials in frontend code.
- If using a paid STT provider instead of the browser API, send audio
  through a secure backend endpoint and keep provider credentials on
  the server.

## Alternative: server-based STT

Use a server-based speech-to-text service only if the project needs more
consistent browser support, better language coverage, or a specific
provider. Before implementing it:

1.  Check the project's existing backend and deployment setup.
2.  Add a server endpoint that authenticates requests, validates payload
    size/type, and applies reasonable rate limits.
3.  Keep provider keys in environment variables on the server.
4.  Avoid retaining uploaded audio unless explicitly required and
    disclosed.
5.  Document required environment variables and setup steps without
    including real secrets.

Do not add a backend or paid provider unnecessarily if browser-based
recognition meets the project's needs.

## Design constraints

- Match the current app's theme, colors, typography, spacing, border
  radius, and hover/focus states.
- Keep the current layout intact; add only the controls needed for
  voice typing.
- Do not replace existing components or rewrite unrelated features.
- If the app has a character/animation that follows typed text,
  continue updating the same input state so that voice-dictated text
  triggers the existing behavior just like keyboard input.

## Acceptance checklist

- [ ] Existing app runs as before.
- [ ] Microphone control appears beside the current input.
- [ ] User can start and stop voice typing.
- [ ] Recognized speech appears in the existing input.
- [ ] Previously typed text is preserved.
- [ ] The user can edit the transcript before submitting.
- [ ] Listening state is visible and accessible.
- [ ] Permission denial and recognition errors are handled.
- [ ] Unsupported browsers can still use manual typing.
- [ ] Recognition is cleaned up on component unmount.
- [ ] Existing theme, sidebar, animations, and submission flow remain
      intact.
- [ ] No secret keys or unnecessary audio storage are introduced.

## Instructions for the coding agent

Make the smallest complete change to the current codebase. Inspect the
actual project files first, then implement the feature using the
project's existing framework and input state. Do not guess file names,
replace the app with a demo, or provide only pseudocode. After
implementation, list the files changed, explain any browser limitations,
and give the exact commands needed to run or test the project.
