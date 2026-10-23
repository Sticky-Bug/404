# VibeWrite ✍️✨

An offline-first, notebook-themed Electron desktop application built with React, TypeScript, and modern AI orchestration. VibeWrite rewrites your raw drafts into 8 distinct emotional personas and connects directly to Gmail for seamless email dispatch.

---

## 🌟 Key Features

1. **Multi-Model Persona Rewriting**:
   - 8 distinct expressive tones: *CEO / Executive*, *Gen-Z*, *Legal Eagle*, *Corporate Professional*, *Warm & Friendly*, *Playful Roast*, *Poetic Romance*, and *Motivational Coach*.
   - Dynamic 3-tier cascade fallback: Google Gemini (`gemini-3-flash-preview`), Groq Cloud (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`), OpenRouter, plus an offline rule-based heuristic transformer.
   - Encrypted API key persistence using OS-level `safeStorage`.

2. **Bilingual & Multilingual Generation**:
   - **Auto-Detection Mode**: Accurately recognizes the source language (Spanish, Russian, Hindi, French, etc.) and writes the persona rewrite in that same language without forcing English.
   - **Target Output Language**: Directly translate and rewrite into 21+ supported languages including Russian, Hindi, Spanish, French, German, Japanese, Korean, Arabic, and Chinese.
   - **Decoupled Persona & Language**: Independently choose persona (CEO, Legal, Friendly, etc.) and language simultaneously.
   - **Honest Offline Guard**: Gracefully warns if offline fallback is used with unsupported foreign translations.
   - **Accessible UI**: Searchable dropdown beside "Convert to Persona" with full keyboard navigation.

3. **Gmail Integration & Direct Delivery**:
   - **Participant Management**: Dynamic `To`, `Cc`, and `Bcc` recipient table with inline RFC email validation.
   - **RFC 2822 Compliant MIME Builder**: Proper UTF-8 subject/body encoding, date stamp, message IDs, and hidden Bcc recipient protection.
   - **Google OAuth 2.0 PKCE Flow**: Secure desktop loopback listener on `http://localhost:32111/oauth2callback` requesting `gmail.send` and `gmail.compose` scopes with automatic token refresh.
   - **1-Click Test Demo Account**: Instant test mode for hackathon judging and evaluations without Google Cloud Console verification bottlenecks.
   - **Strict Decoupling**: Tone drafting never triggers email sending; sending requires an explicit double-confirmation review modal.
   - **Fallbacks**: Direct "Copy to Clipboard" and "Open in Mail App (`mailto:`)".

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Type Checking & Linting

```bash
npm run typecheck
npm run lint -- --quiet
```

### Production Build

```bash
# Build desktop bundles
npm run build

# Platform packages:
npm run build:win   # Windows (.exe installer)
npm run build:mac   # macOS (.dmg)
npm run build:linux # Linux (AppImage)
```

---

## 🔐 Gmail Integration Setup

1. **Connecting via Google Cloud OAuth**:
   - Create a project in Google Cloud Console.
   - Enable the **Gmail API**.
   - Create an **OAuth 2.0 Client ID** for *Desktop App*.
   - Add `http://localhost:32111/oauth2callback` as an authorized redirect URI.
   - Enter your Client ID and Client Secret in the VibeWrite Delivery Panel and click **Connect Gmail Account**.
2. **Instant Demo Mode**:
   - Click **Quick 1-Click Connect Demo Account** to test the complete recipient management, RFC MIME generation, and dispatch UI flow without third-party Google Cloud setup.

