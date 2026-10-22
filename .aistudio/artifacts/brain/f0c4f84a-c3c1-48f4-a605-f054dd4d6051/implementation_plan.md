# Hand Cricket — Online & Solo Practice

A modern, tactile, real-time multiplayer Hand Cricket game combining Apple’s Human Interface Guidelines (frosted liquid glass, squircle cards, crisp typography) with Duolingo-style playful charm (satisfying 3D button presses, celebration animations, and synthesized audio feedback).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following rules and specifications were clarified and established for this build:

- **The "0" (Defensive Dot) Rule**: Batter scoring 0 adds 0 runs. If both batter and bowler pick 0, it acts defensively with a **30% wicket chance** (edge-and-taken simulation), otherwise surviving with no runs added. If both pick matching 1–6, it is an **instant 100% wicket**.
- **Room Customization**: Room creators can choose match parameters:
  - **Wickets**: 1 Wicket Shootout (Classic), 3 Wickets, or 5 Wickets.
  - **Overs**: 1 Over (6 balls), 2 Overs (12 balls), 5 Overs (30 balls), or Unlimited (play until all wickets fall).
- **Game Modes**:
  - **Create / Join Online Room**: Real-time two-player match synchronized over a WebSocket server with shareable room codes.
  - **Solo vs Bot Practice**: Immediate offline practice against an expressive AI Bot with reaction delays, psychological guessing, and difficulty modes.
- **Timer**: 10-second countdown per ball for both players with dynamic urgency visual cues.

---

## 1. Overview & Core Concept

- **What It Does**: Recreates the beloved playground game of Hand Cricket in a sleek digital arena. Two players face off across two innings. After a coin toss, each turn both players simultaneously reveal a finger count (0 to 6) before the 10-second clock expires. When bowler matches batter, a wicket falls; otherwise, the batter stacks runs toward victory.
- **Target Audience**: Casual gamers, friends looking for quick 3-minute competitive duels, and cricket enthusiasts seeking nostalgia with a fresh, tactile modern aesthetic.
- **Key Value**: Low barrier to entry, instant room creation, lag-free real-time sync, and playful sensory feedback (haptic visual bounces, Web Audio synthesized sounds, confetti celebrations).

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Home Lobby    │  ───> │  Room / Match   │  ───> │    Coin Toss    │
│  Create / Join  │       │     Lobby       │       │  Heads or Tails │
│  or Solo Bot    │       │ (Waiting for P2)│       │  Bat or Bowl    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Post-Match Pod  │  <─── │   2nd Innings   │  <─── │   1st Innings   │
│ Rematch / Lobby │       │  (The Chase)    │       │ (Setting Target)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Home Screen**:
   - Clean top bar with brand mark, sound toggle, and theme indicator.
   - Primary action cards: **"Create Room"** (with custom wicket & over options), **"Join Room"** (with 6-character room code input), and **"Practice vs Bot"**.
   - Rules overview modal detailing scoring, the 10s timer, and the 30% defensive 0 mechanic.
2. **Room Waiting Room**:
   - Large room code pill with one-tap copy and QR/share link.
   - Player slot cards displaying readiness states and match settings summary.
3. **Coin Toss Phase**:
   - Realistic 3D coin flip micro-interaction. Caller chooses Heads or Tails; winner selects "Bat First" or "Bowl First".
4. **Active Play Table (Innings 1 & 2)**:
   - **HUD**: Inset Apple glass header displaying current score, wickets, overs (e.g. `24/1 (1.4/2)`), target (in 2nd innings), and required run rate.
   - **Turn Banner**: Identifies current role ("You are Batting" / "You are Bowling") with distinct color-coded badges.
   - **10s Timer Dial**: Smooth SVG circular countdown that changes from Emerald to Amber to Crimson as time runs low.
   - **Tactile Number Pad (0–6)**: Chunky, Duolingo-style 3D buttons with beveled bottom edges (`shadow-[0_4px_0_#...]`), bouncing micro-animations on press, and number hand icons.
   - **Reveal Theater**: Dramatic simultaneous hand reveal! Displays Batter's number vs Bowler's number with outcome callout ("FOUR!", "SIX!", "DEFENDED!", "OUT!").
5. **Innings Break & Game Over**:
   - Clear target announcement between innings.
   - Post-game summary scorecard with ball-by-ball timeline, celebration confetti for winner, and "Rematch" or "Return to Lobby" buttons.

### Visual Identity & Theme

- **Aesthetic Direction**: Apple HIG Liquid Glass combined with Duolingo tactile playfulness. Frosted glassmorphism, crisp San Francisco-style sans typography, continuous rounded squircles (`rounded-3xl`), and 3D pushable buttons.
- **Color Palette**:
  - *Canvas*: Soft porcelain light background (`#F8FAFC`) / Deep charcoal dark background (`#0F1117`).
  - *Cards & Surfaces*: Translucent frosted white (`rgba(255, 255, 255, 0.85)`) and dark glass (`rgba(28, 28, 30, 0.85)`) with `backdrop-blur-xl` and 1px hairline borders (`rgba(0,0,0,0.06)` / `rgba(255,255,255,0.12)`).
  - *Accent System*:
    - Apple System Blue (`#007AFF`) for navigation and primary actions.
    - Stadium Emerald (`#10B981`) for boundary/safe run highlights and batter states.
    - Cricket Crimson (`#EF4444`) for wickets and bowler indicators.
    - Gold Amber (`#F59E0B`) for toss winner and timer alerts.
- **Typography**: `Plus Jakarta Sans` for clean, modern headings and `Inter` / system sans for body, paired with `tabular-nums` for scoreboard accuracy.
- **Sensory Audio & Micro-Interactions**:
  - Web Audio API sound generator (no external audio assets needed): soft tap click, bat strike chime, dramatic wicket crash, timer tick, and victory fanfare.
  - Motion spring animations on reveals and score counters.

---

## 3. Key Product Decisions & Trade-Offs

- **Real-Time Architecture: Node Express + WebSocket (`ws`) on Port 3000**:
  - *Chosen Approach*: Implement a lightweight WebSocket server integrated into the Express server (`server.ts` or Vite proxy) with room-based state isolation. The server maintains authoritative match state (toss, selections, score, wickets, turns, timers).
  - *Why*: Strict adherence to `real-time-and-multi-user` guidelines ("Multiplayer Games: WebSockets with server-authoritative state"). Prevents client-side cheating or desync.
  - *Fallback/Solo*: Full offline Solo Bot engine that simulates human play patterns for instant zero-latency practice without needing a 2nd user.
- **10-Second Countdown & Timeout Handling**:
  - *Chosen Approach*: Server maintains a 10s timer per ball. If a player fails to pick before the timer expires, an automatic random pick is locked in to prevent griefing or stalling.
- **Sound & Haptics via Web Audio API**:
  - *Chosen Approach*: Pure synthesized frequencies and envelope curves. Zero external MP3 downloads to prevent 404s or network delays. Includes an instant mute/unmute toggle in the top bar.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React + Motion)                 │
│  ┌───────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Lobby View   │  │  Play Table HUD  │  │ Sound Engine │  │
│  │ (Create/Join) │  │  (Bat/Bowl Pad)  │  │ (Web Audio)  │  │
│  └───────┬───────┘  └─────────┬────────┘  └──────────────┘  │
└──────────┼────────────────────┼─────────────────────────────┘
           │ WebSocket          │ WebSocket
           ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node Express Server + WebSocket              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     Room Manager                       │ │
│  │   - Room Code Generator (e.g. "HC-7492")               │ │
│  │   - Player 1 & Player 2 Session Pairing                │ │
│  │   - Authoritative Game State Engine:                   │ │
│  │       • Coin Toss & Choice                             │ │
│  │       • Simultaneous Move Lock-In                      │ │
│  │       • 0-Rule (30% Edge Wicket Logic)                 │ │
│  │       • Runs, Overs, Wickets Calculation               │ │
│  │       • Innings Switch & Victory Determination         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

- **`src/App.tsx`**: Main game container, screen router (`LOBBY`, `WAITING`, `TOSS`, `MATCH`, `GAME_OVER`), WebSocket connection provider.
- **`src/components/Header.tsx`**: Top bar contract (Wordmark, Room info, Sound toggle, Dark mode toggle).
- **`src/components/LobbyView.tsx`**: Create Room form (Overs & Wickets selectors), Join Room code input, Solo Bot launcher.
- **`src/components/WaitingView.tsx`**: Room code display with copy link, waiting animation, player connection statuses.
- **`src/components/TossModal.tsx`**: Coin flip animation, Heads/Tails selection, Bat/Bowl choice buttons.
- **`src/components/MatchView.tsx`**:
  - **`ScoreHeader.tsx`**: Live scoreboard, target tracker, overs progression dots.
  - **`TimerRing.tsx`**: 10-second animated SVG countdown with warning pulses.
  - **`RevealArena.tsx`**: Dual player hand cards showing locked/revealed digits with animated outcome splash.
  - **`Keypad.tsx`**: Duolingo-styled 3D tactile buttons (0, 1, 2, 3, 4, 5, 6) with quick keyboard shortcut support (keys 0–6).
  - **`TimelineBar.tsx`**: Over-by-over ball history (dots, runs, wickets).
- **`src/components/GameOverModal.tsx`**: Match result, celebration confetti, detailed scorecard breakdown, and rematch buttons.
- **`src/utils/audio.ts`**: Web Audio synthesizer for tactile UI clicks, timer ticks, bat hits, wickets, and victory jingles.
- **`src/types/game.ts`**: Full TypeScript definitions for game state, match settings, player roles, and socket payloads.
- **`server.ts`**: Express + WebSocket server handling rooms, match logic, and timer timeouts.

---

## Verification & Compilation Plan

1. Install `ws` and `@types/ws` if needed for WebSocket connectivity.
2. Build server and client game logic with full TypeScript definitions.
3. Verify dev server and bundle compilation with `compile_applet`.
4. Test room creation, code joining, coin toss, 10s timer, scoring, wickets, and rematch loop.
