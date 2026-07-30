# Aryc: Your Personal Agent

Master Prompt — Build "Aryc"

Use this as a single prompt for an AI coding tool (Claude Code, Cursor, v0, etc.) to scaffold the application. Copy everything below the line into your coding assistant to start the build.

MASTER PROMPT

Build a mobile-first web app called Aryc — a personal AI assistant, controlled primarily by voice, that helps a busy professional manage their calendar, tasks, and bookings. It connects conceptually to Bluetooth earbuds for hands-free use (build the phone/app experience first; earbud-specific hardware integration comes later).

Product Identity

Name: Aryc

One-line pitch: "Effortless control with Aryc" — an AI assistant you delegate real work to, not just a voice-controlled search box.

Positioning: A smaller, personal-scale version of a "Jarvis"-style assistant — focused specifically on calendar, work tasks, and bookings, reachable by voice.

Core Product Behavior

Aryc is not a chatbot. It's an agent: it takes a spoken instruction, plans the steps needed, and executes across connected tools — but it never sends, books, cancels, or pays for anything without explicit user confirmation first. This confirmation rule is a hard product requirement, not a suggestion — enforce it in application logic, not just in prompt text if an LLM is involved.

Core loop:

User speaks or types a request.

Aryc interprets intent and, if multi-step, builds a short plan.

Aryc proposes the action in plain language ("Move your 3pm to Thursday at 3 — confirm?").

User confirms (or edits/declines).

Aryc executes and reports the outcome plainly ("Done — moved to Thursday.").

Every action, heard command, and outcome is logged to a visible Activity Log.

Feature Scope (v1)

Build these features, in this priority order:

Onboarding — brand intro, sign up / sign in.

Home dashboard — greeting, quick-action cards (Generating Image, Creating Document, Scheduling Meeting, Writing Note — adjust/extend as relevant), and a persistent "talk to Aryc" input bar.

Voice/command capture screen — full-screen active-listening state with live transcript.

Calendar management — view, create, move, cancel events; detect and surface conflicts before confirming.

Task capture — voice-captured tasks/reminders with natural due dates.

Bookings — propose options (e.g., restaurant/appointment), confirm, and complete a booking; handle no-availability by proposing alternatives.

Activity Log screen — full transparent history of every command heard and action taken/proposed, each with a status (done / awaiting confirmation / failed) and a "that wasn't right" feedback control.

Confirmation flow — reusable component: propose action → read back / display clearly → require explicit yes → execute → report.

Do not build payment processing, multi-user/shared calendars, or actual third-party API integrations in this pass — mock the calendar/booking data layer so the UI and confirmation logic can be fully built and tested first. Wire in real integrations (Google Calendar API, a booking partner API) as a later pass.

Design System

Visual identity: dark, premium, minimal. Pure black background. One signature gradient — violet → magenta → orange — used only for the mic orb, glow accents, primary button borders, and small icon fills. Every other surface stays black, white, or gray so the gradient reads as intentional and alive, not decorative clutter.

Tokens:

bg-base: #000000

bg-card: #141414

bg-card-border: #2A2A2A

text-primary: #FFFFFF

text-secondary: #9A9A9A

text-tertiary: #5C5C5C

Signature gradient: radial-gradient(circle, #8B5CF6 0%, #D946EF 45%, #F97316 100%)

Typography: bold rounded-geometric sans-serif for headlines (large scale, tight line-height), regular weight for body text in text-secondary, medium weight for labels/badges.

Shape: full-pill (fully rounded) buttons and badges; 16–20px radius on cards; no gray drop shadows — only the colored gradient glow, applied as a soft blurred halo (60–100px blur, low opacity).

Key reusable component: a circular "mic orb" component with three states — idle (gentle pulse/breathing glow, ~2–3s loop), listening (glow intensifies, ambient border glow around the whole screen), processing (subtle shimmer/rotation on the glow). This orb appears on the onboarding, home, and voice-capture screens.

Screen-specific notes:

Onboarding: centered mic orb, "AI Voice Command" pill badge, headline "Effortless control with Aryc" (muted gray for supporting words, white bold for "Aryc"), pagination dots, full-width "Sign Up" pill (gradient border) and "Sign in" pill (outline only).

Home: "Try Premium" badge + profile avatar top row, "Hi [Name]," greeting, abstract gradient swirl graphic (SVG, conic/radial gradient, decorative), 2×2 action card grid, bottom pill input bar with docked mic button.

Voice capture: back arrow + small gradient sparkle button top row, ambient edge glow (violet→red vignette), live transcript text (progressively appears as speech is recognized), "Listening…" label, centered mic orb at the bottom, warm-tinted home indicator.

Technical Approach

Frontend: React (or your coding tool's default), component-driven, mobile-first responsive layout.

State: keep conversation/task state in a clear, inspectable store (not scattered local state) so the Activity Log can reflect it accurately.

Voice: build the UI and interaction states first with mocked/simulated transcription; wire in real STT/TTS (Whisper, ElevenLabs, or platform-native) once the flow is validated.

Confirmation gate: implement as a single reusable function/component that every consequential action (send, book, cancel, pay) must pass through — this should be impossible to bypass from anywhere else in the code.

Data: mock calendar events, tasks, and bookings in local state/fixtures for this pass; design the data shape so real API responses (Google Calendar, booking partner) can slot in later without restructuring the UI.

What "Done" Looks Like for This Pass

A working, navigable prototype covering: onboarding → home → voice capture → a completed calendar-move flow with confirmation → a completed booking flow with confirmation → an Activity Log showing both actions correctly logged. Visual polish should match the design system above — dark, minimal, with the gradient glow as the one signature visual element.

End of master prompt. Paste everything above into your coding tool. Iterate screen-by-screen if the full build is too large for one pass — start with Onboarding + Home + the mic orb component, since those establish the whole visual language.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/86cd025f-0825-4043-9989-87355a8b8c37).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
