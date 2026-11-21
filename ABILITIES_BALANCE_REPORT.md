# LUMEN — Ability & Talent Balance Simulation Report

> Generated from headless 60 FPS (`dt = 1/60`, `1,800` ticks = `30s` per scenario, deterministic PRNG) simulations executed directly against LUMEN's pure OOP domain models (`src/models/abilities/*`, `src/models/enemies/*`, `src/models/PlayerModel.js`, `src/services/SynergyTalentService.js`, `src/services/CombatService.js`).

---

## 1. Simulation Benchmark Methodology

- **Swarm Scenario:** 14 respawning mid-game enemies (`Stalker` 20 HP, `Sentinel` 30 HP, `Warden` 40 HP — Phase 4 `hpBonus = 1`) closing in around a player gliding in a `140px` kiting circle (`~175 px/s`).
- **Boss Scenario:** Single high-HP `Umbral Dreadnought` target maintaining an `88px` engagement distance from the moving player to measure pure single-target sustained DPS.
- **Lifesteal Sustain:** Measured via `CombatService.computeLifestealHeal` (`dmg * lifestealPct * 0.1`) relative to Lumen's `100–160 HP` Spirit health pool.

---

## 2. Balance Tuning Applied (Before → After)

| Ability | What Changed | Why |
| :--- | :--- | :--- |
| **Celestial Spear** (`celestial_spear`) | Base damage **`10` → `18`**, base interval **`2.85s` → `2.25s`** | Was the lowest-DPS weapon in both Swarm (`12.1`) and Boss (`5.1`) despite having the most expensive `1.2×` Sanctuary talent tree. Now serves as the premier boss-piercing sniper lance (`48.3` Left Boss DPS). |
| **Orbiting Blades** (`solar_orbitals`) | Base orbit radius **`64px` → `74px`**, `Solar Rays` (`so_ray_pct`) **`35/50/65/85%` → `25/35/45/55%`** | Base blades felt stubby without rays, while maxed `Solar Rays` was a `+1,210%` outlier (`137.5` DPS vs `16.8` Right Branch). Widening base orbit helps untalented/Right Branch blades while bringing `Solar Rays` closer in line. |
| **Voltaic Arc** (`voltaic_chain`) | Base interval **`1.25s` → `1.45s`**, `Ion Anchor` splash **`58% / 85%` → `42% / 62%`** | Untalented LV 5 Voltaic Arc (`35.5` DPS, `72` kills/min) was `2–3×` ahead of every other base weapon. Still excels at early/mid chain clear (`26.6` DPS) without trivializing other picks. |
| **Astral Pulse** (`astral_pulse`) | `Echo Wave` radius **`72% / 85%` → `105% / 120%`**, `Harmonic Double-Wave` radius **`92%` → `105%`** | Previously, the first wave knocked shadows outside the smaller `72%` trailing wave (`25.3` → `26.6` DPS). Expanding the echo wave lets LV 5/10 Ascensions catch knocked-back shadows (`24.0` → `30.4` → `38.0`). |

---

## 3. Post-Tuning Base Ability Balance (No Talents)

| Ability | Role Identity | Swarm LV 1 | Swarm LV 5 | Swarm LV 10 | Boss LV 1 | Boss LV 5 | Kills/min (LV 5) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Astral Pulse** | Close-Range AoE & Control | `24.0` | **`30.4`** | **`38.0`** | `3.0` | `4.7` | **`56`** |
| **Voltaic Arc** | Mid-Range Chain Clear | `14.0` | `26.6` | `34.6` | `7.0` | `9.9` | `46` |
| **Celestial Spear** | Piercing Boss Sniper | `12.1` | `20.2` | `26.8` | `7.8` | `11.1` | `40` |
| **Seeker Needles** | Long-Range Homing & Debuff | `8.7` | `17.0` | `21.8` | `8.7` | `12.5` | `28` |
| **Starlight Bolt** | Reliable All-Rounder Starter | `12.7` | `15.9` | `18.2` | **`12.7`** | **`12.7`** | `28` |
| **Starbloom Spores** | Kiting Area Denial / DoT | `14.7` | `14.2` | `23.7` | `0.3`* | `0.7`* | `20` |
| **Orbiting Blades** | Close-Orbit Shield / Cleave | `9.7` | `10.8` | `14.5` | `1.0`* | `1.0`* | `12` |

*\*Boss test holds the boss at `88px` radius, just outside base Orbiting Blades (`74px`) and ahead of trailing Starbloom Spores.*

---

## 4. Post-Tuning Talent Tree Balance at LV 5 (Maxed Left vs Right vs Full Tree)

| Ability | Base Swarm | Left Branch Swarm | Right Branch Swarm | Full Tree Swarm | Left Boss | Right Boss | Lifesteal (HP/s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Starlight Bolt** | `15.2` | `95.8` (+530%) | `44.6` (+193%) | **`175.1`** | `30.8` | `43.1` | — |
| **Seeker Needles** | `16.7` | `108.4` (+549%) | `33.5` (+101%)† | `166.1` | `36.4` | `24.9`† | `1.84` |
| **Orbiting Blades** | `14.2` | **`114.7`** (+708%) | `18.9` (+33%) | `126.1` | `15.5` | `3.5` | `1.04` |
| **Starbloom Spores** | `17.4` | `51.7` (+197%) | **`87.7`** (+404%) | `96.1` | `2.2` | `3.5` | — |
| **Celestial Spear** | `21.6` | `66.7` (+209%) | `59.9` (+177%) | `75.0` | **`48.3`** | `23.6` | — |
| **Astral Pulse** | `34.2` | `48.1` (+41%) | `65.4` (+91%) | `74.2` | `7.3` | `11.5` | **`3.40`** |
| **Voltaic Arc** | `28.0` | `61.2` (+119%) | `36.9` (+32%) | `59.6` | `13.9` | `18.8` | — |

*†`Seeker Needles` Right Branch (`Starlight Mark`) applies a `+38%` global damage vulnerability to Marked targets from **all** equipped abilities, making its real team DPS contribution in 6-slot runs significantly higher than solo simulation numbers.*

---

## 5. Archetype & Progression Summary

- **Best Boss Killers (Single-Target):** `Celestial Spear` Left Branch (`48.3` DPS) > `Starlight Bolt` Right Branch (`43.1` DPS) > `Seeker Needles` Left Branch (`36.4` DPS).
- **Best Swarm Clear (Maxed Sanctuary):** `Starlight Bolt` (`175.1` DPS), `Seeker Needles` (`166.1` DPS), `Orbiting Blades` (`126.1` DPS), `Starbloom Spores` (`96.1` DPS).
- **Best Early/Untalented Carry (LV 1–5):** `Astral Pulse` (`24.0 → 30.4`), `Voltaic Arc` (`14.0 → 26.6`), `Celestial Spear` (`12.1 → 20.2`).
- **Lifesteal Sustain:** `Astral Pulse` (`3.40 HP/s`), `Seeker Needles` (`1.84 HP/s`), `Orbiting Blades` (`1.04 HP/s`) — scales cleanly against `100–160 HP` Spirit pools without creating immortality.
