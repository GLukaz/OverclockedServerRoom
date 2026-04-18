# Overclocked: Server Room Intern

Phaser 4 + TypeScript + Vite prototype.

## Run

```
npm install
npm run dev
```

## Controls

- A/D or Arrow keys — move
- W / Space / Up — jump
- E — cool nearest server (when `[E]` prompt shows)
- R — restart after game over

## Loop

Servers overheat over time. Cool them with `E` to keep them alive, but every cooling raises the global Water level. Overclock rises over time, making heat and water grow faster. Lose if all servers fail, or if water hits 100%.
