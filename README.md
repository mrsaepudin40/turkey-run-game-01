# Pardon Run

A turkey escape game for make.fun `turkey-run-game-01`. A turkey sprints
from the Thanksgiving farmyard, through the barn and the kitchen, to
forest freedom — chased the whole way by the farmer, jumping ovens and
dodging carving knives.

## Play

Open `game/index.html` in desktop Chrome (or `node serve.ts`, then
http://localhost:8080).

- **← → / A D** — run left and right
- **Space / ↑ / W** — jump (twice, for a double jump)
- **↓ / S** — slide under swinging knives
- **H** — hide in a haystack when you stand in one
- **P / Esc** — pause
- Click or Space — start / restart

## The run

- **HUD:** score, metres left to freedom, 3 lives, and the farmer bar —
  how close the farmer is behind you.
- **Corn** scores and pushes the farmer back; **feathers** block one hit;
  **haystacks** hide you and the farmer loses your trail.
- **Ovens** glow on the floor — jump them. **Carving knives** fall from
  above in the farmyard and swing from the ceiling in the kitchen.
- Get hit and the farmer closes in; caught, and it is dinner. Reach
  3,000 m and you are **PARDONED!**

## Screenshots

`?shot=start|play|kitchen|escaped&seed=1` stages each scene from the
real game rules, for the four screenshots in `screenshots/`.
