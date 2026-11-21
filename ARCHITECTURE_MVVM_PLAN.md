# LUMEN — MVVM + OOP + SOLID Architecture Plan & Agent Handoff Guide

> **Mode:** `Ponytail Lite` (`/ponytail lite`) + `/ponytail-audit` (baseline included below) + `/ponytail-review` (mandatory gate after each phase).
> **Pre-Refactor Snapshot Backup:** `c:\Users\mathi\Documents\minigames\Lumenv2` (exact untouched backup of the v2 game before the MVVM + SOLID refactor).
> **Active Workspace:** `c:\Users\mathi\Documents\minigames\Lumen`

---

## 1. Agent Takeover Quick-Start (Read First)

If you are a new agent taking over this project, follow these rules to resume seamlessly without context loss:

1. **Check Current Phase Progress:**
   - Look at `git log -n 5`, `git status`, and the **Phase Status Tracker** in **Section 5** below.
   - Each completed phase ends with a commit tagged `phase-1`, `phase-2`, etc., and updates the checkboxes `[x]` in Section 5.
2. **Verify Build & Headless Self-Check Before Touching Code:**
   - Run `npm run build` (must exit 0 with 0 errors).
   - Run `node tests/verify_architecture.mjs` (once created in Phase 1).
3. **Follow `Ponytail Lite` Rules (`/ponytail lite`):**
   - Build the requested MVVM + OOP + SOLID structure cleanly, without enterprise bloat (no DI frameworks, no empty pass-through wrappers, no speculative config).
   - Name any smaller alternative in one line and let the user pick if ambiguous.
   - Mark any intentional pragmatic boundary (e.g., keeping Pixi particle pools inside `ParticleSystem` rather than creating 340 particle ViewModels) with `// shortcut: <the limit>, <when to upgrade>`.
   - End every phase reply with 1–2 lines: **what you skipped or did not check, and any risk the user must know**.
4. **Run `/ponytail-review` After Every Phase:**
   - Before committing a phase, run a `/ponytail-review` pass on `git diff` (using the high-reasoning model) to verify logic, edge cases, callers, performance, and lean code.

---

## 2. Token-Smart Multi-Agent Model Routing Strategy

To minimize token and quota cost while keeping architecture and code quality high, split work across model tiers via `invoke_subagent`:

| Task Type | Model Tier (`invoke_subagent`) | Why / When to Use |
| :--- | :--- | :--- |
| **Architecture, Complex State Wiring & `/ponytail-review` Gates** | **`pro` / `inherit` (Coordinator)** | Designing interface contracts, refactoring `Game.js` state transitions, reviewing diffs for subtle bugs, and final phase sign-off. |
| **Standard OOP Class & ViewModel Extraction** | **`flash`** | Extracting individual enemy subclasses (`StalkerEnemy`, `SentinelEnemy`, etc.), ability subclasses (`StarlightBoltAbility`, etc.), and DOM View/ViewModel pairs where the contract is already defined in this plan. |
| **Mechanical Edits, Imports, Constants Split & Test Runs** | **`flash_lite`** | Moving static tables out of `Constants.js`, updating import paths across files, running `npm run build` / Node assert checks, or grepping callers. |

**Rule of Thumb for Subagent Delegation:**
- Never spawn a `pro` subagent to copy/extract 10 similar enemy or ability classes. Have the Coordinator define `BaseEnemy` + 1 reference subclass (`StalkerEnemy`), then fan out remaining enemy classes to `flash` subagents with the exact class contract.

---

## 3. Baseline `/ponytail-audit` Report (Pre-Refactor Codebase)

**What this repo does:**
LUMEN is a single-player 60 FPS browser arcade survivor game built with PixiJS v8, WebAudio procedural synthesis, and an HTML/CSS overlay UI. Players glide and dash through a `4200 × 3000` arena, level up automatic weapons via card drafts, and spend earned Luminance (LUM) in a persistent `localStorage` Sanctuary talent tree.
**Assumed load:** 1 local browser player at 60 FPS (`16.6ms` frame budget) with up to 36 active enemies, 56 damage popups, 340 particles, and dozens of collectibles on screen during Phase 5 / Endless Overdrive.

### Must Fix (Bugs & Data/Contract Mismatches)

1. **`recordRun` checks an `undefined` `maxCombo` parameter** ([src/Game.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/Game.js#L1978-L1986), [src/core/Storage.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/core/Storage.js#L615-L641))
   - **What this is:** At game over, `Game._finishGameOver()` saves run stats to `storage.recordRun(...)`.
   - **Problem:** Combo was removed from gameplay, so `Game.js` no longer passes `maxCombo`, leaving `maxCombo` as `undefined` inside `Storage.recordRun()` (`undefined > this.data.bestCombo` is always `false`, and `combinedMetrics.maxCombo` is `undefined`).
   - **Fix:** Remove dead `maxCombo` / `bestCombo` parameters and fields from `Storage.js` while keeping safe save-load migration.
   - **If we skip it:** Dead state pollutes `StorageService` and `combinedMetrics` carries `undefined` fields into quest evaluation.

2. **"How to Play" Codex teaches removed mechanics (`Graze` & `Resonance`)** ([index.html](file:///c:/Users/mathi/Documents/minigames/Lumen/index.html#L273-L298))
   - **What this is:** The `#screen-guide` modal explains the core rules to new players.
   - **Problem:** It still instructs players to *"collect Light Motes rapidly to raise your Resonance"* and *"Graze close to recharge Dash faster"*, both of which were removed from the game.
   - **Fix:** Update those two paragraphs in `index.html` to describe the real loop (Light Motes grant EXP/Score, 6-slot ability builds, LV 5/10 Ascensions, LV 3+3 Synergies, and Banish).
   - **If we skip it:** Players try to graze enemies for dash energy and take contact damage instead.

### Should Fix (Architecture Bloat, Hot-Loop Churn & Missing Tests)

3. **Four God-files mix Domain State, Business Rules, Pixi Rendering & DOM Manipulation** ([src/Game.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/Game.js#L1-L2785), [src/entities/Enemies.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/entities/Enemies.js#L1-L2247), [src/ui/UIManager.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/ui/UIManager.js#L1-L2236), [src/entities/Abilities.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/entities/Abilities.js#L1-L1596))
   - **What this is:** `Game.js` (2,785 lines), `Enemies.js` (2,247 lines), `UIManager.js` (2,236 lines), and `Abilities.js` (1,596 lines) hold 55% of the repo in four classes.
   - **Problem:** Adding or testing one enemy, ability, or UI screen requires editing multi-thousand-line files that directly instantiate Pixi `Container`s or query DOM nodes, violating SRP, OCP, and DIP.
   - **Fix:** Execute the 5-phase MVVM + OOP + SOLID split in Sections 4–5 below.
   - **If we skip it:** Every change risks regressions across unrelated abilities/UI, and unit testing requires mocking PixiJS and the DOM.

4. **`CollectibleManager` allocates and destroys Pixi `Container` + 3–4 `Sprite`s on every Mote drop/pickup instead of pooling** ([src/entities/Collectibles.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/entities/Collectibles.js#L43-L91), [src/entities/Collectibles.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/entities/Collectibles.js#L450-L520))
   - **What this is:** Spawns and removes Light Motes, Prisms, Shards, and Constellation Stars during combat.
   - **Problem:** Every `spawnMote()` calls `new Container()` and `new Sprite()` three times, and every pickup/expiry calls `item.root.destroy({ children: true })`. In Phase 5 swarms, this churns hundreds of Pixi display objects and triggers GC pauses.
   - **Fix:** Pool collectible item slots (or separate `CollectibleModel` state from a pooled `CollectibleCanvasView`) just like `ParticleSystem` and `AbilityManager` projectiles.
   - **If we skip it:** Frame-time spikes during late-game Mote bursts and vacuum pulls.

5. **`_getCombatCallbacks()` allocates a fresh 18-closure object every frame (and per triggered nova/pulse)** ([src/Game.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/Game.js#L1245-L1295), [src/Game.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/Game.js#L2531))
   - **What this is:** Creates the callback bag passed to `abilities.update()` and `enemies.update()` at 60 FPS.
   - **Problem:** Every frame (plus every shield pulse, ward nova, or gravity blast) allocates 18 new arrow functions and spreads them via `{ ...this._getCombatCallbacks(), sourceAbility }`.
   - **Fix:** Replace callback bags with a single persistent `CombatService` + `EventBus` instance injected once at construction.
   - **If we skip it:** Unnecessary per-frame closure allocations and tangled callback chains between `Game`, `Enemies`, and `Abilities`.

6. **`Constants.js` mixes static balance data with stateful draft & talent calculation logic** ([src/core/Constants.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/core/Constants.js#L361-L745), [src/core/Constants.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/core/Constants.js#L1017-L1175))
   - **What this is:** A 1,497-line file holding both static config tables (`ENEMY_STATS`, `PHASES`, `BLESSINGS`) and complex business rules (`rollBlessingOptions`, `applyUpgradeOption`, `getGroupTalentEffects`, `getActiveSynergies`).
   - **Problem:** Violates SRP; config tables cannot be imported without pulling in draft/synergy algorithms, and draft logic has no dedicated service or unit test suite.
   - **Fix:** Keep `Constants.js` pure data and extract `DraftService.js` and `SynergyTalentService.js` with a dedicated `node:assert` test suite.
   - **If we skip it:** Draft weighting, banish edge cases, and talent math remain untested and buried in a config file.

7. **Leftover dead `grazeCooldown` / `grazed` properties on all 11 enemy & projectile factories** ([src/entities/Enemies.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/entities/Enemies.js#L110), [src/entities/Enemies.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/entities/Enemies.js#L152-L836))
   - **What this is:** Every enemy and enemy projectile object initializes `grazeCooldown: 0` or `grazed: false`.
   - **Problem:** Nothing reads or decrements `grazeCooldown` or `grazed` anymore since Graze was removed.
   - **Fix:** Delete `grazeCooldown` and `grazed` when extracting `BaseEnemy` and `EnemyProjectile`.
   - **If we skip it:** Dead properties confuse readers about whether Graze still exists.

8. **Duplicate Spirit Selector & Mode Cycler inside `#screen-settings` duplicates Title & Sanctuary UI logic** ([index.html](file:///c:/Users/mathi/Documents/minigames/Lumen/index.html#L332-L341), [src/ui/UIManager.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/ui/UIManager.js#L622-L668))
   - **What this is:** Settings renders its own Spirit selector (`renderSpiritSelector`) and Mode cycler in addition to the Title Screen mode pills and Sanctuary → Spirits tab.
   - **Problem:** Two different UI paths mutate `selectedSpirit` and `gameMode`, requiring redundant sync code in `UIManager` and `Game`.
   - **Fix:** When splitting `SettingsViewModel` / `SettingsView`, keep Settings focused on Audio, Visuals, and Controls (or drive both from one shared `ProfileViewModel` if kept).
   - **If we skip it:** Extra DOM synchronization code across every state change.

### Nice to Have (Small Speed-Ups & Cleanup)

9. **`updateHUD` allocates a fresh `minimap` object and array snapshots every frame** ([src/Game.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/Game.js#L2616-L2655))
   - **What this is:** `Game._update()` builds a new payload object and `minimap` sub-object 60 times per second.
   - **Problem:** Most HUD fields (`level`, `exp`, `phaseCode`, `dashCharges`, `health`, `shield`) only change on events, not every frame.
   - **Fix:** With `HudViewModel` observables, DOM text/bars only update when `hp`, `shield`, `exp`, `score`, or `dashCharges` actually change; only the canvas minimap and smooth dash progress bar tick per frame.
   - **If we skip it:** Minor per-frame object allocation and redundant DOM checks.

- **Verdict:** Gameplay and balance work well, but the 4 God-classes (`Game.js`, `Enemies.js`, `UIManager.js`, `Abilities.js`) and mixed data/logic in `Constants.js` need the 5-phase MVVM + OOP + SOLID refactor below, plus fixing findings #1, #2, #4, #5, and #7 during the migration.
- **Lean:** `~450–650 lines` of dead/duplicate/boilerplate code removable during the MVVM + SOLID refactor, `0` new npm dependencies required.
- **Not checked:** Live mobile touch ergonomics on physical iOS/Android hardware (verified code paths only).

---

## 4. Target MVVM + OOP + SOLID Architecture Blueprint

### 4.1 Core Architectural Rules (SOLID + MVVM + Ponytail Lite)

1. **Models (`src/models/`) & Services (`src/services/`) NEVER import `pixi.js` or touch `document`/`window`:**
   - All domain models (`PlayerModel`, `RunSessionModel`, `MetaProfileModel`, `BaseEnemy` subclasses, `BaseAbility` subclasses) and services (`CombatService`, `DraftService`, `WaveDirectorService`, `SynergyTalentService`) are 100% pure JavaScript.
   - They must be runnable in headless Node (`node tests/verify_architecture.mjs`) with **zero** PixiJS or DOM mocks.
2. **ViewModels (`src/viewmodels/`) expose `Observable` properties and command methods:**
   - ViewModels translate Model state into UI-ready strings/numbers/arrays and expose user actions (`selectCard(uid)`, `reroll()`, `toggleBanish()`, `buyUpgrade(id)`).
   - ViewModels never call `document.getElementById` or `new Sprite()`.
3. **Views (`src/views/dom/` and `src/views/canvas/`) only subscribe to ViewModels/Events and render:**
   - DOM Views (`HudView`, `TitleView`, `DraftModalView`, `SanctuaryModalView`, `SettingsModalView`, `PauseGameOverView`) bind DOM events to ViewModel commands and subscribe to ViewModel observables.
   - Canvas Views (`EnemyCanvasRenderer`, `AbilityCanvasRenderer`, `PlayerCanvasRenderer`, `CollectibleCanvasRenderer`) manage PixiJS `Container`/`Sprite`/`Graphics` pools and sync visuals to active domain models each frame.
4. **Ponytail Lite Guardrail (No Bloat):**
   - Do **not** add external state libraries (MobX, Redux, RxJS) or DI frameworks.
   - `Observable.js` + `EventBus.js` together must stay under **70 lines** total.
   - Keep already-isolated visual/audio leaf modules ([src/core/AudioEngine.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/core/AudioEngine.js), [src/graphics/Shaders.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/graphics/Shaders.js), [src/graphics/TextureFactory.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/graphics/TextureFactory.js), [src/vfx/ParticleSystem.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/vfx/ParticleSystem.js), [src/world/Environment.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/world/Environment.js)) intact and wrap them cleanly behind thin adapter calls.

### 4.2 Target Directory Tree

```text
src/
├── main.js                              # Entry point -> boots GameCoordinator
├── GameCoordinator.js                   # Slim (~250 lines) composition root & ticker loop
├── core/
│   ├── Observable.js                    # <35 lines: Observable(initial) +Computed helper
│   ├── EventBus.js                      # <35 lines: on(evt, fn), off(evt, fn), emit(evt, payload)
│   ├── Constants.js                     # Pure static data tables only (no business logic)
│   ├── MathUtils.js                     # Pure math helpers
│   ├── Storage.js                       # IStorageAdapter + LocalStorageService (cleaned of bestCombo)
│   └── AudioEngine.js                   # Existing procedural WebAudio engine (kept intact)
├── services/                            # Pure Domain Services (SRP + DIP)
│   ├── SynergyTalentService.js          # getGroupTalentEffects, getActiveSynergies, getUpgradeEffects
│   ├── DraftService.js                  # rollBlessingOptions, applyUpgradeOption,getAbilityModifierLines
│   ├── CombatService.js                 # Resolves damage, mark multipliers, crits, lifesteal, shield reflect
│   └── WaveDirectorService.js           # Phase escalation, Overdrive tier math, elite/volley/core timers
├── models/                              # Pure OOP Domain Models (Zero Pixi, Zero DOM)
│   ├── MetaProfileModel.js              # Wraps storage: LUM, upgrades, talents, quests, daily streak
│   ├── RunSessionModel.js               # Score, level, EXP, survivalTime, phase, buildState, drafts
│   ├── PlayerModel.js                   # x, y, vx, vy, health, shield, dashCharges, invulnTimer, kinematics
│   ├── CollectibleModel.js              # Pure state & magnetic/constellation update for arena items
│   ├── enemies/
│   │   ├── BaseEnemy.js                 # Abstract base class: HP, burn, mark, slow, warmup, takeDamage()
│   │   ├── EnemyProjectile.js           # Pure enemy projectile state & linear/homing step
│   │   ├── StalkerEnemy.js              # Chaser + Predator Lunge AI
│   │   ├── MantaEnemy.js                # Sinusoidal Chaser AI
│   │   ├── SentinelEnemy.js             # Roaming bounce + Void Pulse Ring AI
│   │   ├── LancerEnemy.js               # Perimeter telegraph + railgun dash AI
│   │   ├── SpitterEnemy.js              # Ranged kiter + converging spine dart AI
│   │   ├── ArtilleryEnemy.js            # Heavy kiter + tri-spread volley AI
│   │   ├── WardenEnemy.js               # Bruiser + split-into-2-wisps on death hook
│   │   ├── VortexEnemy.js               # Drifting gravity well (`getGravitySource()`)
│   │   ├── HarbingerElite.js            # Bullet-hell 8-orb nova + twin gold lances AI
│   │   ├── BehemothElite.js             # Armored charge-slam + 6-bomb burst AI
│   │   ├── EclipseCoreBoss.js           # Overrides takeDamage() for petal shields + shockwave Void Parry
│   │   └── EnemyRegistry.js             # Open/Closed factory map (`kind -> EnemyClass`) + list manager
│   └── abilities/
│       ├── BaseAbility.js               # Abstract base class: id, timer, shouldMirrorCast(), trigger()
│       ├── AbilityProjectileModel.js    # Pure bolt/seeker/spark projectile state, pierce & ricochet
│       ├── LightPoolModel.js            # Pure hazard pool tick state
│       ├── StarlightBoltAbility.js      # resonant_volley
│       ├── OrbitingBladesAbility.js     # solar_orbitals
│       ├── VoltaicArcAbility.js         # voltaic_chain
│       ├── AstralPulseAbility.js        # astral_pulse (+ delayed echo pulses)
│       ├── SeekerBarrageAbility.js      # seeker_barrage
│       ├── StarbloomSporesAbility.js    # starbloom_spores
│       ├── CelestialSpearAbility.js     # celestial_spear
│       ├── EchoConduitPassive.js        # echo_conduit (Overclock ripple + Chromatic wave)
│       └── AbilityRegistry.js           # Open/Closed registry + orchestrator for equipped abilities
├── viewmodels/                          # MVVM ViewModels (Observable UI state + Commands)
│   ├── HudViewModel.js                  # HP, Shield, Dash, Score, EXP/Level, Phase, Loadout chips, Minimap
│   ├── TitleViewModel.js                # High scores, Mode/Difficulty selection, Quests, Start/Nav commands
│   ├── DraftViewModel.js                # 3 Draft Cards, Reroll/Banish counts & commands, Tooltip lines
│   ├── SanctuaryViewModel.js            # LUM balance, 4 tabs (Upgrades, Talents, Looks, Spirits), buy/equip
│   ├── SettingsViewModel.js             # SFX, Music, Mute, Bloom, Shake, Steer mode, Tutorial tips
│   └── PauseGameOverViewModel.js        # Pause stats/loadout + Game Over summary, damage report, quests
└── views/
    ├── dom/                             # HTML DOM Views (Subscribe to ViewModels, zero business logic)
    │   ├── DomIcons.js                  # Shared SVG constants (ABILITY_ICONS, TALENT_GLYPHS, buildTalentRingSvg)
    │   ├── HudView.js                   # Binds #hud, #hud-minimap, #phase-banner, #tutorial-toast
    │   ├── TitleView.js                 # Binds #screen-title & #screen-guide
    │   ├── DraftModalView.js            # Binds #screen-blessing
    │   ├── SanctuaryModalView.js        # Binds #screen-sanctuary
    │   ├── SettingsModalView.js         # Binds #screen-settings
    │   └── PauseGameOverView.js         # Binds #screen-pause & #screen-gameover
    └── canvas/                          # PixiJS Renderers (Sync visuals to Models)
        ├── PlayerCanvasRenderer.js      # Renders PlayerModel (ribbon trail, dash ghosts, orb sprites)
        ├── EnemyCanvasRenderer.js       # Renders BaseEnemy instances, telegraphs, HP pips & core petals
        ├── AbilityCanvasRenderer.js     # Renders projectiles, orbitals, sunrays, spores, pools & beams
        └── CollectibleCanvasRenderer.js # Pooled Pixi sprites for CollectibleModel items
```

---

## 5. Step-by-Step 5-Phase Execution Plan & Progress Tracker

> **Instructions for Active Agent:** Complete one phase at a time. After finishing a phase:
> 1. Run `npm run build` and `node tests/verify_architecture.mjs`.
> 2. Run a `/ponytail-review` check on `git diff`.
> 3. Check off `[x]` the completed items in this file and commit with `git commit -m "refactor(phase-N): ..."`.

---

### Phase 1: Core Reactive Primitives (`Observable`, `EventBus`) & Pure Domain Services
**Recommended Model Tier:** `pro` / `inherit` to design contracts + `flash` for service extraction & unit tests.

- [ ] **1.1 Create `src/core/Observable.js` & `src/core/EventBus.js` (<70 lines total):**
  - `Observable(initialValue)`: `.value` getter/setter (only notifies subscribers on `!==`), `.subscribe(fn, { immediate = true })`, `.notify()`.
  - `EventBus`: `.on(event, handler)` (returns unsubscribe fn), `.off(event, handler)`, `.emit(event, payload)`, `.clear()`.
- [ ] **1.2 Extract `src/services/SynergyTalentService.js` from `src/core/Constants.js`:**
  - Move `getUpgradeEffects`, `getGroupTalentEffects`, `getActiveSynergies`, `getSynergyHintsForAbility`, `RANK_VALS` into `SynergyTalentService.js`.
  - Re-export them from `Constants.js` temporarily so existing callers don't break during Phases 1–4.
- [ ] **1.3 Extract `src/services/DraftService.js` from `src/core/Constants.js`:**
  - Move `createDefaultBuildState`, `getAbilityInfo`, `getAbilityModifierLines`, `rollBlessingOptions`, `applyUpgradeOption`, `ASPECT_DEFS`, `RARITY_TIERS` into `DraftService.js` (and re-export from `Constants.js` for backward compatibility).
- [ ] **1.4 Create `src/services/WaveDirectorService.js` & `src/services/CombatService.js`:**
  - `WaveDirectorService`: pure calculation of `getPhaseForRun(survivalTime, score)`, `getOverdriveTier(survivalTime, score)`, `getEffectivePhase(phase, overdriveTier, difficulty, twist)`, and elite/volley/overdriveCore schedule checks.
  - `CombatService`: pure resolution of `resolvePlayerHit({ rawDamage, playerModel, aegisRank, aegisFx, shieldRank, shieldFx, globalDmgMul, zenMode })` and `resolveLifesteal({ dealtDmg, lifestealPct, playerModel })`.
- [ ] **1.5 Clean up Audit Finding #1 & #2:**
  - Remove dead `bestCombo` / `maxCombo` from `src/core/Storage.js`.
  - Fix outdated `Graze` / `Resonance` text in `index.html` `#screen-guide`.
- [ ] **1.6 Create `tests/verify_architecture.mjs`:**
  - Node `assert/strict` test suite verifying `Observable`, `EventBus`, `SynergyTalentService`, `DraftService`, `WaveDirectorService`, and `CombatService` with zero Pixi/DOM imports.
- [ ] **1.7 Gate 1 Verification & `/ponytail-review`:**
  - `npm run build` passes + `node tests/verify_architecture.mjs` passes + `/ponytail-review` sign-off + commit `refactor(phase-1): extract observable, eventbus, and pure domain services`.

---

### Phase 2: MVVM Split for HTML UI (Decompose 2,236-line `UIManager.js`)
**Recommended Model Tier:** `pro` / `inherit` for ViewModel contracts + `flash` for the 6 DOM Views.

- [ ] **2.1 Create `src/models/MetaProfileModel.js` & `src/models/RunSessionModel.js`:**
  - `MetaProfileModel` wraps `storage` with reactive `Observable` properties (`luminance`, `lifetimeLuminance`, `selectedSpirit`, `selectedStartAbility`, `gameMode`, `selectedDifficulty`, `prefs`).
  - `RunSessionModel` holds reactive run metrics (`score`, `level`, `exp`, `expToNext`, `phaseCode`, `abilityRanks`, `buildState`, `activeSynergies`, `rerollsLeft`, `banishesLeft`, `banishedAbilities`).
- [ ] **2.2 Create ViewModels in `src/viewmodels/`:**
  - `HudViewModel.js`, `TitleViewModel.js`, `DraftViewModel.js`, `SanctuaryViewModel.js`, `SettingsViewModel.js`, `PauseGameOverViewModel.js`.
- [ ] **2.3 Create DOM Views in `src/views/dom/`:**
  - `DomIcons.js`, `HudView.js`, `TitleView.js`, `DraftModalView.js`, `SanctuaryModalView.js`, `SettingsModalView.js`, `PauseGameOverView.js`.
  - Keep `UIManager.js` as a thin ~120-line facade delegating to the 6 ViewModels/Views until Phase 5 so `Game.js` continues working with zero breakage.
- [ ] **2.4 Extend `tests/verify_architecture.mjs`:**
  - Add headless tests for `HudViewModel`, `DraftViewModel`, `SanctuaryViewModel`, and `SettingsViewModel` verifying reactive state updates and commands without a browser DOM.
- [ ] **2.5 Gate 2 Verification & `/ponytail-review`:**
  - `npm run build` passes + `node tests/verify_architecture.mjs` passes + `/ponytail-review` sign-off + commit `refactor(phase-2): implement MVVM viewmodels and DOM views`.

---

### Phase 3: OOP Enemy Hierarchy & Canvas Renderer (Decompose 2,247-line `Enemies.js`)
**Recommended Model Tier:** `pro` / `inherit` for `BaseEnemy` & `EclipseCoreBoss` + `flash` to extract the remaining 10 enemy classes.

- [ ] **3.1 Create `src/models/enemies/BaseEnemy.js` & `EnemyProjectile.js`:**
  - `BaseEnemy`: encapsulates `kind`, `x`, `y`, `vx`, `vy`, `radius`, `hp`, `maxHp`, `spawnDelay`, `age`, `life`, `slowTimer`, `burnTimer`, `burnDps`, `markTimer`, `markMul`, `takeDamage(amount, opts)` (LSP-compliant!), `applyBurn(dps, dur, tint, source)`, `isAlive()`, `isTargetable()`, and abstract `updateAI(dt, ctx)`.
  - Strip dead `grazeCooldown` and `grazed` fields (Audit Finding #7).
- [ ] **3.2 Extract 11 Polymorphic Enemy Subclasses (`src/models/enemies/*.js`):**
  - `StalkerEnemy`, `MantaEnemy`, `SentinelEnemy`, `LancerEnemy`, `SpitterEnemy`, `ArtilleryEnemy`, `WardenEnemy`, `VortexEnemy`, `HarbingerElite`, `BehemothElite`, and `EclipseCoreBoss` (overrides `takeDamage()` for 10-HP-per-petal shield math & Void Parry).
  - Register all 11 in `EnemyRegistry.js` (Open/Closed Principle: adding a 12th enemy only registers a new class).
- [ ] **3.3 Separate `src/views/canvas/EnemyCanvasRenderer.js`:**
  - Moves all PixiJS `Container`/`Graphics`/`Sprite` creation, telegraph drawing, HP pip drawing (`_drawHpPips`), and Eclipse Core petal drawing (`_drawCoreShield`) out of enemy models into `EnemyCanvasRenderer`.
- [ ] **3.4 Extend `tests/verify_architecture.mjs`:**
  - Instantiate every single enemy class (`stalker` through `core`) in pure Node (no Pixi mock needed!), run `updateAI(dt, ctx)` and `takeDamage(10)`, and assert lunge/shoot/split/shield-crack behavior.
- [ ] **3.5 Gate 3 Verification & `/ponytail-review`:**
  - `npm run build` passes + `node tests/verify_architecture.mjs` passes + `/ponytail-review` sign-off + commit `refactor(phase-3): extract polymorphic OOP enemy models and canvas renderer`.

---

### Phase 4: OOP Ability Hierarchy & Pooled Collectibles (Decompose 1,596-line `Abilities.js` & `Collectibles.js`)
**Recommended Model Tier:** `pro` / `inherit` for `BaseAbility` contract + `flash` for individual ability subclasses & collectible pooling.

- [ ] **4.1 Create `src/models/abilities/BaseAbility.js`, `AbilityProjectileModel.js`, `LightPoolModel.js`:**
  - `BaseAbility`: common cooldown ticking (`tickTimer(dt, hasteMul, rateMul)`), rank/ascension/talent lookup, mirror cast check, and `update(dt, abilityCtx)` contract using segregated interfaces (`ITargetFinder`, `ICombatSink`).
- [ ] **4.2 Extract Polymorphic Ability Classes (`src/models/abilities/*.js`):**
  - `StarlightBoltAbility`, `OrbitingBladesAbility`, `VoltaicArcAbility`, `AstralPulseAbility`, `SeekerBarrageAbility`, `StarbloomSporesAbility`, `CelestialSpearAbility`, `EchoConduitPassive`, and `AbilityRegistry.js`.
- [ ] **4.3 Separate `src/views/canvas/AbilityCanvasRenderer.js`:**
  - Renders active `AbilityProjectileModel`s, orbital blades/sunrays, spores, light pools, spear beams, and pulse rings in PixiJS.
- [ ] **4.4 Separate `src/models/CollectibleModel.js` & Pooled `src/views/canvas/CollectibleCanvasRenderer.js` (Audit Finding #4):**
  - Pure collectible physics/magnet/constellation logic in `CollectibleModel.js`; pooled Pixi display objects in `CollectibleCanvasRenderer.js` (eliminating per-mote `new Container()` / `.destroy()` churn).
- [ ] **4.5 Extend `tests/verify_architecture.mjs`:**
  - Test all 7 damage abilities + `EchoConduitPassive` + `CollectibleModel` in pure Node with zero Pixi mocks.
- [ ] **4.6 Gate 4 Verification & `/ponytail-review`:**
  - `npm run build` passes + `node tests/verify_architecture.mjs` passes + `/ponytail-review` sign-off + commit `refactor(phase-4): extract polymorphic OOP abilities and pooled collectible views`.

---

### Phase 5: PlayerModel, Slim `GameCoordinator` & Final Cleanup (Decompose 2,785-line `Game.js`)
**Recommended Model Tier:** `pro` / `inherit` for coordinator wiring & final `/ponytail-review`.

- [ ] **5.1 Split `src/entities/Player.js` into `src/models/PlayerModel.js` + `src/views/canvas/PlayerCanvasRenderer.js`:**
  - `PlayerModel`: pure kinematics, dash charges/cooldowns, HP/shield state.
  - `PlayerCanvasRenderer`: Pixi ribbon trail, dash ghosts, aura/core/soul sprites.
- [ ] **5.2 Extract `src/views/InputController.js` & `src/GameCoordinator.js`:**
  - Replace the 2,785-line `Game.js` and 18-closure `_getCombatCallbacks()` (Audit Finding #5) with a slim `GameCoordinator.js` (~250–350 lines) that wires `Models ↔ Services ↔ ViewModels ↔ Views` via `EventBus`.
  - Delete obsolete facade wrappers once all imports point to the new MVVM + SOLID modules.
- [ ] **5.3 Final Verification & Full `/ponytail-review`:**
  - `npm run build` passes with zero warnings/errors.
  - `node tests/verify_architecture.mjs` exercises the full MVVM + OOP + SOLID stack headlessly.
  - Live browser playtest check confirms identical 60 FPS visual/audio feel.
  - Commit `refactor(phase-5): replace monolithic Game.js with MVVM GameCoordinator`.
