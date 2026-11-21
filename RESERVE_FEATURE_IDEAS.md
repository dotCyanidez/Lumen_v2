# LUMEN — Reserve Feature Ideas (v3–v4+)

> Deferred gameplay systems and mechanics archived for future updates (v3–v4+) so the core v1–v2 loop stays focused and readable.

---

## 1. Arena Shrines, Landmarks & Environmental Risk/Reward Zones

**Goal:** Turn movement across the `4200 × 3000` Sanctuary map from passive kiting into active routing choices.

- **Rotating Sanctuary Shrines / Resonance Beacons:**
  - Periodically illuminate a beacon somewhere across the arena (marked on the minimap and with subtle radial directional ripples).
  - Staying inside the Shrine ring for `4–5s` under heightened shadow pressure rewards the player with a bonus Aspect Card draft, an instant Resonance Surge, HP + Shield restoration, or an Elite bounty.
- **High-Risk / High-Reward Terrain Pockets:**
  - **Void Pools:** Hazardous pockets that slightly dampen glide traction or intensify nearby spawns in exchange for boosted EXP / score yield inside the zone.
  - **Surging Currents:** Stronger directional currents built atop `Environment.sampleCurrent(x, y)` that players can intentionally ride to slingshot out of encirclements.

---

## 2. Slipstream Gale (`slipstream_gale`) — Mobility Ability, Cards, Talents & Synergies

*Archived from active roster to keep run builds tight (6 ability slots) and focused.*

- **Category:** Utility (`UTILITY · MOBILITY`)
- **Base Unlock Effect:** `+8%` glide speed & `+12%` faster Solar Dash recharge.
- **Aspect Upgrade Cards (`ASPECT_DEFS`):**
  - `speedMul` (`+6%` base / scaling by card rarity) — Increase Lumen glide speed.
  - `dashRateMul` (`+12%` base / scaling by card rarity) — Solar Dash recharges faster.
- **Per-Ability Talent Tree (`ABILITY_TALENTS`):**
  1. **Tailwind Current** (`sg_tailwind`, Root, T1): `+4%` glide speed & `+6%` Dash recharge per rank.
  2. **Featherdrift** (`sg_feather`, Left Mid, T2): `+1` Max Solar Dash charge & `+3%` glide speed per rank above 1.
  3. **Chrono-Dash** (`sg_mirage`, Left Cap, T3): Dash shaves `[0.20, 0.35, 0.50, 0.65]s` off automatic ability cooldowns (`abilities.shaveCooldowns`).
  4. **Razor Feathers** (`sg_sparks`, Right Mid, T2): Dash fires `[2, 3, 4, 5]` homing feather sparks (`0.85` dmg).
  5. **Phase Afterimage** (`sg_phase`, Right Cap, T3): Leaves a `74px` delayed explosive afterimage at Dash origin (`[1.0, 1.45, 1.9, 2.4]` dmg) & refunds `[0.25, 0.35, 0.45, 0.55]` Dash charge if `2+` enemies hit.
- **Proposed Synergy (v3–v4):**
  - **Galebloom (`slipstream_gale` + `starbloom_spores`):** Dashing through or near Starblooms scatters toxic tailwind spore clouds behind Lumen and accelerates spore drift speed.
- **Proposed LV 5 Ascension Concept:**
  - **Jetstream Wake:** Leaving a luminous wind-corridor during Solar Dash that slows pursuing shadows and pulls nearby Light Motes along the slipstream.

---

## 3. Pacing & Late-Game Overdrive Scaling

- **Stretch Early-to-Late Phase Curve (`PHASES` in `src/core/Constants.js`):**
  - Currently Phase 5 (`ASTRAL STORM`) and Endless Overdrive begin at `100s` (`1:40`), often before a player fills 6 ability slots or reaches LV 5 Ascensions.
  - Shift Phase 4 → 5 / Overdrive start closer to `130–150s` so early/mid-game build assembly has breathing room before endgame swarms erupt.
- **Progressive Overdrive Threat Scaling (`src/Game.js`):**
  - Scale Overdrive enemy HP, elite cadence, and threat pressure progressively per Overdrive tier so uncapped `Rare`/`Epic` card stacks keep the 3–6 minute endgame challenging rather than an idle screen clear.

---

## 4. Run Milestone Juice & Pause Build Sheet

- **Synergy & Ascension Celebration Banners (`src/Game.js`):**
  - Trigger a dedicated phase-style banner (`◈ SYNERGY AWAKENED: ...` / `★ ASCENSION: ...`), a soft shockwave ring around Lumen, and a distinct synth chime when reaching LV 3+3 Synergies or LV 5/10 Ascensions so power spikes feel unmistakable.
- **Live Run Stats Strip on Pause (`index.html`, `src/ui/UIManager.js`):**
  - Add a compact 1-row stats summary bar inside the Pause panel showing cumulative multipliers (**Damage %, Haste %, Move Speed %, Magnet Reach, Luck %, Rerolls & Banishes remaining**) alongside interactive ability tooltips.

---

## 5. Update "How to Play" Codex Copy

- **Important Onboarding Refresh (`index.html` `#screen-guide`):**
  - Replace outdated copy claiming Lumen always starts with **Starlight Bolt** (since players can unlock and equip other Start Abilities in Sanctuary Talents).
  - Briefly explain **6-slot builds**, **Card Rarities**, **LV 5/10 Ascensions**, **LV 3+3 Synergies**, and **Void Banish** so new players understand the full progression loop upfront.

---

## 6. Streamlined-Out Run Mechanics (`Graze`, `Combo`, `Astral Fever`, `World Events`, `Resonance Weaver`)

*Removed from v1–v2 runs to keep gameplay immediately intuitive and focused on Move · Dash · Collect · Draft.*

- **World Events (`WORLD_EVENTS`):** Periodic `10–12s` mini-objectives (`Starfall Drift`, `Eclipse Surge`, `Prism Convergence`).
- **Graze & Combo / Astral Fever:** Close-skim Dash recharge (`grazeRadius`), `x1–x12` decay multiplier + early `10.5s` `IGNITED!` trigger, and `6s` golden Fever overdrive at `x12`.
- **Resonance Weaver (`starforged_resonance`) & Warden's Spark:** Utility card/5-node talent tree + `Astral Conductor` Ascension (`grazeMul`, `comboMul`, `grazeExpAdd`, `sr_harmonic`, `sr_sustain`, `sr_crescendo`, `sr_graze_arc`, `sr_cascade`) and `aegis_bloom + starforged_resonance` synergy. Can return later as an optional Arcade Remix or high-skill mode.
