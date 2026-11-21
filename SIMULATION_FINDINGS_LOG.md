# LUMEN — Deferred Simulation Findings & Tuning Notes

> Log of simulation data and optional balance levers recorded for future reference without modifying live gameplay yet.

---

## Simulation #2 — Card Draft, Luck & Banish Monte Carlo (`2026-11-21`)

**Setup:** `80,000` rarity rolls (`20,000` per `Astral Foresight` rank) + `8,000` full 18-level runs (`2,000` per Banish tier `0–3`) via `DraftService.generateUpgradeDraft()`.

### 2A. Card Rarity Distribution (`Astral Foresight` Luck Curve)
| Astral Foresight LV | Extra Rerolls | Common % | Uncommon % | Rare % | Epic % |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | `1` | `61.6%` | `23.9%` | `10.5%` | `4.1%` |
| **5** | `3` | `34.6%` | `33.8%` | `20.4%` | `11.2%` |
| **10** | `4` | `20.6%` | `38.1%` | `26.4%` | `14.8%` |
| **20 (Max)** | `6` | `9.3%` | `39.8%` | `31.6%` | `19.2%` |

- **Verdict:** Healthy progression curve; no changes needed.

### 2B. 18-Level Run Draft Progression (`2,000` Runs per Banish Count)
| Banishes Used | Avg LV for 6 Slots | Avg LV 1st Ascension (LV 5) | Hit LV 10 Supernova by LV 18 | Avg Synergies @ LV 12 | Avg Synergies @ LV 18 | Avg Peak Ability LV @ 18 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | `11.0` | `13.0` | `0.5%` | `0.41` | `1.06` | `5.8` |
| **1** | `10.8` | `12.9` | `1.1%` | `0.42` | `0.95` | `5.9` |
| **2** | `10.9` | `12.6` | `1.6%` | `0.41` | `0.80` | `6.1` |
| **3** | `10.8` | `12.6` | `2.3%` | `0.38` | `0.70` | `6.3` |

### Deferred Tuning Ideas (If Desired Later)
1. **Carry Momentum Weight (`src/services/DraftService.js` → `getDraftWeight`):** Multiply weight by `1 + curRank * 0.14` so invested abilities show up more frequently, moving 1st LV 5 Ascension earlier (~LV 9–10) and making LV 10 Supernova reachable by LV 15–18.
2. **Synergy Partner Unlock Bias (`src/services/DraftService.js` → `getDraftWeight`):** Boost `NEW` unlock cards by `× 2.0` when the player already owns the Synergy partner (`partnerRank >= 1`), lifting average Synergies at LV 12 from `~0.4` toward `~0.8–1.0`.

---

## Simulation #3 — EXP Curve & Card Drafts vs. Phase Timing (`0s → 300s`) (`2026-11-21`)

**Setup:** Simulated `0s → 300s` across Casual (`55%` kills), Average (`80%`), and Aggressive (`95%` + `25%` EXP) paces on Normal / Hard / Nightmare via `WaveDirectorService` + `RunSessionModel`.

| Profile | 22s (Ph 2) | 46s (Ph 3) | 72s (Ph 4) | 100s (Ph 5) | 150s (2:30) | 300s (5:00) | Score @ 5m | Medal @ 5m |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Casual (NORMAL)** | LV 3 (`2c`) | LV 5 (`4c`) | LV 8 (`7c`) | LV 11 (`10c`) | LV 15 / `OD+2` | LV 24 / `OD+8` | `152,675` | `SUPERNOVA` |
| **Average (NORMAL)** | LV 4 (`3c`) | LV 7 (`7c`) | LV 10 (`11c`) | LV 13 (`15c`) | LV 18 / `OD+2` | LV 29 / `OD+8` | `235,030` | `SUPERNOVA` |
| **Aggressive (NORMAL)** | LV 5 (`4c`) | LV 8 (`8c`) | LV 12 (`13c`) | LV 15 (`17c`) | LV 21 / `OD+2` | LV 34 / `OD+8` | `279,685` | `SUPERNOVA` |
| **Average (HARD)** | LV 5 (`4c`) | LV 8 (`8c`) | LV 11 (`12c`) | LV 15 (`17c`) | LV 21 / `OD+2` | LV 33 / `OD+8` | `333,483` | `SUPERNOVA` |
| **Average (NIGHTMARE)** | LV 5 (`4c`) | LV 9 (`9c`) | LV 12 (`13c`) | LV 16 (`18c`) | LV 22 / `OD+2` | LV 35 / `OD+8` | `469,305` | `SUPERNOVA` |

### Deferred Tuning Ideas (If Desired Later)
1. **Stretch Phase 4 / 5 Slightly (`src/core/Constants.js` → `PHASES`):** Shift Phase 4 (`72s → 80s`) and Phase 5 (`100s → 115s`) so casual players hit their 1st LV 5 Ascension before `ASTRAL STORM` begins.
2. **Raise Late-Game Medal Ceilings (`src/core/Constants.js` → `RANK_MEDALS`):** Raise `CELESTIAL` (`68k → 90k`) and `SUPERNOVA` (`120k → 180k`) so `SUPERNOVA` requires a ~4–5 min Normal run.

---

## Simulation #4 — Boss & Elite TTK Benchmark (`2026-11-21` — APPLIED)

**Change Applied:** Scaled `EclipseCoreBoss.petalHp` via `WaveDirectorService.getCorePetalHp(phaseId, overdriveTier, hpMul)` (`60` Ph 3, `90` Ph 5, `+25`/Overdrive tier × `difficulty.hpMul`); Void Parry and Solar Dash smash now deal `1` full petal (`petalHp`).

| Eclipse Core Spawn | Normal HP / TTK (Avg / High) | Hard HP / TTK (Avg / High) | Nightmare HP / TTK (Avg / High) |
| :--- | :---: | :---: | :---: |
| **Phase 3 (46s)** | `180` (`3×60`) · `7.5s / 4.0s` | `348` (`4×87`) · `14.5s / 7.7s` | `600` (`5×120`) · `25.0s / 13.3s` |
| **Phase 5 (100s)** | `450` (`5×90`) · `8.7s / 3.8s` | `786` (`6×131`) · `15.1s / 6.5s` | `1,260` (`7×180`) · `24.2s / 10.5s` |
| **Overdrive +1 (135s)** | `690` (`6×115`) · `9.2s / 3.8s` | `1,002` (`6×167`) · `13.4s / 5.6s` | `1,380` (`6×230`) · `18.4s / 7.7s` |
| **Overdrive +4 (231s)** | `1,520` (`8×190`) · `13.8s / 5.8s` | `2,208` (`8×276`) · `20.1s / 8.5s` | `3,040` (`8×380`) · `27.6s / 11.7s` |

- **Elites (Unchanged):** Harbinger (`420` base HP) and Dreadnought (`640` base HP) already hit `19–27s` Normal, `27–39s` Hard, and `38–54s` Nightmare (well under `95–100s` despawn).

---

## Simulation #6 — Meta-Progression Survival Ceiling (`0 → 30:00`) (`2026-11-21` — APPLIED)

**Changes Applied:**
- `WaveDirectorService.getOverdriveDamageMul(od)`: `1 + od * 0.14 + max(0, od - 8) * 0.08` applied to incoming player damage in `Game.js`.
- `WaveDirectorService.buildEffectivePhase()`: Super-linear late `hpBonus` (`+floor((od - 5)^1.35)` past `OD+5`).
- `Constants.js` → `getLevelMaxHpBonus(level)`: Soft-capped to `+6 HP/lv` past `LV 20` (unchanged for `LV 1–20`).

**Result (`5` runs/cell × `2` bots × `3` difficulties):** 30-minute immortality runs dropped from **`29/120`** to **`1/120`** (only 1 T3 Pro Kiter god-roll on Normal):
- **Normal:** `T0` `4:52–4:55` (`2.4k–3.1k LUM`) · `T1` `4:35–5:28` · `T2` `9:46–16:41` (`15k–76k LUM`) · `T3` `8:35–12:55` (`33k–69k LUM`)
- **Hard:** `T0` `4:59–7:35` → `T2` `7:19–8:58` → `T3` `7:54–9:14` (`0/30` hit 30m)
- **Nightmare:** `T0` `3:59–4:46` → `T2` `6:34–6:44` → `T3` `6:25–8:13` (`0/30` hit 30m)

### Deferred Tuning Note
- Early Sanctuary Tier 1 (`+1.5%` per rank) feels flat compared to `T0`; consider front-loading early Sanctuary ranks (`+3%`/rank) or adding a `+HP` Sanctuary node later if early meta-progression feels slow.



