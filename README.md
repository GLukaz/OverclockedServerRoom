# Overclocked: Server Room Intern

A small arcade survival prototype built with **Phaser 4**, **TypeScript**, and **Vite**. You're the intern in a server room that won't stop overheating. Cool the servers, manage the water, and last as long as you can.

## Getting Started

Prerequisites: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

### Scripts

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check and produce a production build in `dist/`
- `npm run preview` — serve the production build locally

## Controls

| Key            | Action                              |
| -------------- | ----------------------------------- |
| A / D / ← / →  | Move                                |
| W / Space / ↑  | Jump                                |
| E              | Cool nearest server (when `[E]` shows) |
| R              | Restart after game over             |

## Gameplay

Servers overheat over time. Cool them with `E` to keep them alive — but every cooling raises the **Water** level in the room. An **Overclock** meter steadily rises, making both heat and water accumulate faster.

You lose if:

- All servers fail, or
- Water reaches 100%.

The tension is the tradeoff: saving a server costs water, ignoring one costs a server. Overclock guarantees things fall apart eventually — the question is how long you can stretch it.

## Project Structure

```
src/
  main.ts              # Phaser bootstrap
  scenes/GameScene.ts  # Main game loop and world setup
  entities/
    Player.ts          # Movement, input, interaction
    Server.ts          # Heat state, cooling, failure
    DrainValve.ts      # Water drain interactable
  events/EventManager.ts  # Timed events / difficulty escalation
  ui/UIManager.ts      # HUD: heat bars, water, overclock, prompts
```

## Tech

- [Phaser 4](https://phaser.io/) — rendering and physics
- [TypeScript](https://www.typescriptlang.org/) — strict typing
- [Vite](https://vitejs.dev/) — dev server and bundler
