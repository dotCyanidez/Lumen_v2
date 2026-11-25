# LUMEN — Enemies, Bosses, Abilities & Scaling Reference

A complete reference of every enemy type, boss/elite encounter, enemy attack/ability, spawn rule, phase curve, and difficulty scaling formula in LUMEN.

---

## Quick Index

- [Standard Shadows (8)](#standard-shadows)
  1. [Stalker (`stalker`)](#1-stalker-stalker)
  2. [Manta (`manta`)](#2-manta-manta)
  3. [Sentinel (`sentinel`)](#3-sentinel-sentinel)
  4. [Lancer (`lancer`)](#4-lancer-lancer)
  5. [Spitter (`spitter`)](#5-spitter-spitter)
  6. [Artillery (`artillery`)](#6-artillery-artillery)
  7. [Warden (`warden`)](#7-warden-warden)
  8. [Vortex (`vortex`)](#8-vortex-vortex)
- [Elites & Bosses (3)](#elites--bosses)
  9. [Astral Harbinger (`harbinger`)](#9-astral-harbinger-harbinger) — *Interval Elite*
  10. [Umbral Dreadnought (`behemoth`)](#10-umbral-dreadnought-behemoth) — *Interval Elite*
  11. [Eclipse Core (`core`)](#11-eclipse-core-core) — *Phase & Overdrive Boss*
- [Phase Progression & Spawn Weights](#phase-progression--spawn-weights)
- [Scaling Formulas & Multipliers](#scaling-formulas--multipliers)

---

## Summary Table

| Enemy | Kind ID | Role | Base HP / Shields | Base EXP | Contact DMG | Proj DMG | Radius | Earliest Phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Stalker** | `stalker` | Chaser + Lunge | 10 HP | 10 | 22 | — | 14px | Phase 1 |
| **Manta** | `manta` | Sinusoidal Chaser | 10 HP | 12 | 20 | — | 17px | Phase 2 |
| **Lancer** | `lancer` | Invulnerable Railgun Hazard | Invulnerable | — | 28 | — | 12px | Phase 2 |
| **Sentinel** | `sentinel` | Roaming Pulse Turret | 20 HP | 20 | 24 | — | 20px | Phase 2 |
| **Spitter** | `spitter` | Ranged Kiter | 20 HP | 22 | 18 | 18 | 14px | Phase 3 |
| **Artillery** | `artillery` | Spread Kiter | 30 HP | 32 | 22 | 20 | 17px | Phase 3 |
| **Warden** | `warden` | Splitter Bruiser | 30 HP | 28 | 30 | — | 21px | Phase 3 |
| **Vortex** | `vortex` | Gravity Well | 30 HP | 32 | 26 | — | 19px | Phase 2 |
| **Astral Harbinger** *(Elite)* | `harbinger` | Bullet-Hell Caster | 420 HP | 75 | 28 | 20 (Nova) / 18 (Lance) | 26px | ~30s timer |
| **Umbral Dreadnought** *(Elite)* | `behemoth` | Charge-Slam Bruiser | 640 HP | 90 | 34 | 22 (Bomb) | 30px | Alternating w/ Harbinger |
| **Eclipse Core** *(Boss)* | `core` | Shielded Shockwave Boss | 180–3,040 Shield HP *(3–8 scaled petals)* | 65 *(min 1 level-up)* | 32 | 32 (Ring) | 26px | Phase 3, Phase 5 & Overdrive |

---

## Standard Shadows

> **Shared Shadow Rules:**
> - **Spawn Warmup:** Enemies fade/scale in over `spawnDelay` and cannot deal contact damage or take player damage until `age >= spawnDelay`.
> - **Slow Status:** Any enemy under `slowTimer > 0` moves at **`0.45×`** speed (`55%` slow).
> - **Standard Drop Chance:** Normal shadows have a `32%` chance on kill to drop a Light Mote (`35%` chance to be a Golden Mote).
> - **Stuck / Far Despawn:** Non-boss/non-elite shadows farther than `max(viewW, viewH) + 650px` age `4×` faster (`+3*dt` extra) and fade out over `0.6s` after exceeding `life`.

### 1. Stalker (`stalker`)
- **Appearance:** Crimson-trimmed razor dart with trailing tail.
- **Base Stats:** `10 HP` · `10 EXP` · `22` contact dmg · `14px` radius · `0.65s` spawn warmup · `24s` lifetime.
- **Movement:** Tracks Lumen directly at `132–165 px/s × speedScale` (`turnRate: 2.35 rad/s`).
- **Ability — Predator Lunge:**
  - Every `3.2–5.2s` (initial `3.0–5.0s`), telegraphs by slowing to `0.38×` speed with a glowing crimson rim for `0.34s`, then surges forward at **`1.68×` speed** for `0.44s`.

### 2. Manta (`manta`)
- **Appearance:** Violet stingray with flapping wings and ribbon trail.
- **Base Stats:** `10 HP` · `12 EXP` · `20` contact dmg · `17px` radius · `0.40s` spawn warmup · `24s` lifetime.
- **Movement:** Hunts Lumen steadily at `88–112 px/s × speedScale` (slower than Stalkers) with `turnRate: 1.55 rad/s`, weaving side-to-side along a `34 px/s` perpendicular sine wave.
- **Abilities:** Continuous pursuit + weaving trajectory; no burst attack.

### 3. Sentinel (`sentinel`)
- **Appearance:** Crimson core orbited by 4 rotating violet triangular shards.
- **Base Stats:** `20 HP` · `20 EXP` · `24` contact dmg · `20px` radius · `0.75s` spawn warmup · `24s` lifetime.
- **Movement:** Drifts linearly at `54–86 px/s × speedScale`, bouncing off arena edges (`34px` pad). Spawned at least `170px` from Lumen.
- **Ability — Void Pulse Ring:**
  - Every `3.4–4.8s` (initial `2.4–3.8s`), charges for `0.85s` (shrinking violet telegraph ring & fast shard spin), then emits an expanding crimson shockwave over `0.55s` that grows its effective hitbox radius up to **`+50px` (`70px` total)** (`56px` visual).

### 4. Lancer (`lancer`)
- **Appearance:** High-speed crimson lance arrow with long ribbon trail.
- **Base Stats:** `10 HP` · `15 EXP` · `28` contact dmg · `12px` radius · `1.15s` telegraph warmup · `4.5s` lifetime.
- **Movement & Attack — Telegraph Snipe Dash:**
  - Spawns along the viewport perimeter aimed near Lumen (`±45px` offset), drawing a pulsing crimson laser sight line across the screen for `1.15s` (thickening/brightening at `78%` charge).
  - Launches in a straight line at **`780 × min(1.35, speedScale)` px/s** (`1053 px/s` cap) and despawns upon leaving bounds or `max(viewW, viewH) + 340px` from Lumen.
- **Spawn Cadence:** Independent timer starting from **Phase 2+**: cooldown `max(3.0s, 8.6 - phase.id * 1.15) × (0.86–1.20)`. Twin Lancer spawn chance: `30%` in Phase 4, `55%` in Phase 5. *(Eclipse Volleys also spawn 2–3 staggered Lancers.)*

### 5. Spitter (`spitter`)
- **Appearance:** Magenta-pink winged shadow with glowing eye.
- **Base Stats:** `20 HP` · `22 EXP` · `18` contact dmg · **`18` projectile dmg** · `14px` radius · `0.70s` spawn warmup · `25s` lifetime.
- **Movement:** Kites Lumen at `76–94 px/s × speedScale`, maintaining a `210–310px` band while strafing (`0.55` strafe weight). Spawned at least `210px` from Lumen.
- **Ability — Converging Spine Dart:**
  - Within `500px`, charges for `0.62s` (two magenta guide rails converging onto a glowing aim ring) and fires a single **`dart`** projectile (`6px` radius, `258 × min(1.35, 0.88 + speedScale * 0.14)` px/s, `3.8s` life, `18` dmg).
  - Cooldown: `2.4–3.3s` (initial `1.7–2.5s`).

### 6. Artillery (`artillery`)
- **Appearance:** Tri-prong violet turret frame with pulsing rose core.
- **Base Stats:** `30 HP` · `32 EXP` · `22` contact dmg · **`20` projectile dmg** · `17px` radius · `0.85s` spawn warmup · `28s` lifetime.
- **Movement:** Heavy kiter at `44–58 px/s × speedScale`, keeping a `270–390px` band (`0.35` strafe weight). Spawned at least `240px` from Lumen.
- **Ability — Tri-Spread Arcane Volley:**
  - Within `560px`, charges for `0.85s` (displaying a 3-lane violet fan arc) and fires **`3` `tri` orbs** spread at `-0.28 / 0 / +0.28 rad` (`5.5px` radius, `224 × min(1.3, 0.86 + speedScale * 0.14)` px/s, `4.2s` life, `20` dmg each).
  - Cooldown: `3.6–4.6s` (initial `2.2–3.2s`).

### 7. Warden (`warden`)
- **Appearance:** Orange-rimmed hexagonal bruiser with crimson core.
- **Base Stats:** `30 HP` · `28 EXP` · `30` contact dmg · `21px` radius · `0.78s` spawn warmup · `26s` lifetime.
- **Movement:** Slow, steady pursuit at `66–92 px/s × speedScale` (`3.6` velocity damping). Spawned at least `210px` from Lumen.
- **Ability — Split on Death:**
  - When purged, bursts into **`2` fast Stalker Wisps** launched in opposite directions (`185 px/s`, `1.15×` Stalker speed scale, `0.28s` warmup, `14s` life, base `10 HP` / `hpBonus = 0`).

### 8. Vortex (`vortex`)
- **Appearance:** Violet 3-arm spinning singularity.
- **Base Stats:** `30 HP` · `32 EXP` · `26` contact dmg · `19px` radius · `0.90s` spawn warmup · `21s` lifetime.
- **Movement:** Slowly drifts at `36–56 px/s × speedScale`, bouncing off arena walls (`64px` pad). At most **1 Vortex** is spawned at a time via random phase spawns.
- **Ability — Gravity Singularity:**
  - Once active (`age >= 0.9s`), continuously pulls Lumen (and collectible Motes/items) inward within **`230px`** (`165` base strength × `1.15` on Lumen when closer).

---

## Elites & Bosses

> **Shared Boss/Elite Rules:**
> - **Contact Grace:** All Elites and the Eclipse Core deal contact damage on a `0.55s` cooldown (`coreHitCooldown`) instead of disappearing on touch like normal shadows.
> - **No Far-Off Despawn Acceleration:** Never age faster when far from Lumen, and **cannot** be instant-killed by `purgeNearest` (e.g. Prism pickups).
> - **Visual HP Ring:** Enemies with `maxHp > 80` render a circular gold/crimson HP arc around themselves instead of individual pips.

### 9. Astral Harbinger (`harbinger`) — *Interval Elite*
- **Title Banner:** `ASTRAL HARBINGER` · *ELITE THREAT · DEFEAT FOR A BONUS CARD*
- **Base Stats:** `420 HP` · `75 EXP` · `28` contact dmg · `26px` radius · `62 × min(1.28, speedScale)` px/s · `1.0s` warmup · `95s` lifetime.
- **Movement:** Kites Lumen between `220–320px` (`0.65` strafe weight); slows to **`0.25×` speed** while charging Astral Nova.
- **Abilities:**
  1. **Astral Nova (8-Orb Ring):** Every `4.6s` (initial `3.3s`), charges for `0.90s` with an expanding/contracting gold-rose reticle ring, then fires **8 `nova` projectiles** radially (`6.5px` radius, `205 × min(1.25, 0.9 + speedScale * 0.1)` px/s, `4.4s` life, **`20` dmg** each).
  2. **Twin Gold Lances:** Between novas, every `2.6s` (initial `1.7s`), aims for `0.55s` along twin converging sight lines (`±0.18 rad`) and fires **2 `lance` projectiles** (`5.5px` radius, `270 px/s`, `3.6s` life, **`18` dmg** each).
- **Kill Rewards:**
  - Guarantees a **Bonus Upgrade Card Draft** (`ELITE BOUNTY · ASTRAL HARBINGER`).
  - Grants `650 × combo` base score, `75` base EXP, `+2` Combo, `+1.5` Dash energy, `0.75s` invulnerability, `360px` knockback wave (`380` force), and **4 Golden Motes**.

### 10. Umbral Dreadnought (`behemoth`) — *Interval Elite*
- **Title Banner:** `UMBRAL DREADNOUGHT` · *ELITE THREAT · DEFEAT FOR A BONUS CARD*
- **Base Stats:** `640 HP` · `90 EXP` · `34` contact dmg · `30px` radius · `52 × min(1.28, speedScale)` px/s · `1.0s` warmup · `100s` lifetime.
- **Movement:** Heavy relentless pursuit toward Lumen.
- **Abilities:**
  1. **Armored Charge-Slam & Void Bomb Burst:** Every `4.1s` (initial `3.0s`), brakes to a halt over `0.92s` while projecting a `260px` crimson charge corridor toward Lumen.
  2. Charges forward for `0.56s` at **`330 × min(1.25, 0.9 + speedScale * 0.12)` px/s**.
  3. On landing, slams and launches **6 `bomb` projectiles** in a hexagonal ring (`7px` radius, `178 px/s`, `4.0s` life, **`22` dmg** each).
- **Kill Rewards:**
  - Guarantees a **Bonus Upgrade Card Draft** (`ELITE BOUNTY · UMBRAL DREADNOUGHT`).
  - Same bounty package as Harbinger (`650 × combo` base score, `90` base EXP, `+2` Combo, `+1.5` Dash, `0.75s` invuln, `360px` repulse, **4 Golden Motes**).

### 11. Eclipse Core (`core`) — *Phase & Overdrive Boss*
- **Base Stats:** `3 + extraShields` petals × scaled `petalHp` · `65+` EXP · `32` contact dmg · **`32` ring dmg** · `26px` radius · `74 × min(1.3, speedScale)` px/s · `1.0s` warmup · `40s` lifetime.
- **Shield Mechanics:**
  - Uses **scaled petal shields** (`petalHp = max(10, round(((phase >= 5 ? 90 : 60) + overdriveTier * 25) * difficulty.hpMul * getOverdriveHpMul(overdriveTier)))`) instead of regular HP; each hit subtracts `effAmount` from `shields` and cracks off petals (`220 × combo` score + `+1` Combo per crack).
  - **Total Shield HP by Spawn Trigger** *(Normal / Hard `1.45×` / Nightmare `2.0×`)*:
    - **Phase 3:** `3 / 4 / 5` petals → **`180` (`3×60`) / `348` (`4×87`) / `600` (`5×120`) Shield HP**.
    - **Phase 5:** `5 / 6 / 7` petals → **`450` (`5×90`) / `786` (`6×131`) / `1,260` (`7×180`) Shield HP**.
    - **Overdrive (every 48s starting at 135s):** `3 + min(5, 2 + overdriveTier)` petals (`6–8` petals) → **`690` (`OD+1` Normal) up to `3,040` (`OD+4` Nightmare) Shield HP**.
  - Only **1** Eclipse Core can be active at a time (`spawnEclipseCore` skips if one is already present).
- **Movement:** Orbits/tracks a point drifting smoothly around Lumen (`±185px` X, `±140px` Y).
- **Ability — Telegraphed Shockwave Ring & Void Parry:**
  - Every `3.8s` (initial `3.0s`), telegraphs a `230px` max-radius danger boundary for `0.85s`, then expands a crimson shockwave ring from `32px` → `230px` over `0.90s` (`32` dmg if it catches Lumen).
  - **Counterplay — Void Parry & Solar Dash Smash:** **Solar Dashing** across the expanding ring triggers **Void Parry**, cancelling the wave (`4.6s` cooldown) and dealing **`petalHp` dmg (`1` full Shield petal crack)** back to the Core. Direct Solar Dash contact also cracks `1` full petal (`petalHp` dmg).
- **Shatter Rewards:**
  - `900 × combo` base score, `+2` Combo, `+2.0` Dash energy, `0.85s` invuln, `460px` shockwave repulse (`440` force).
  - Drops **6 Golden Motes**, **1 Radiant Prism**, and **2 Luminance Shards (`33` LUM each)**.
  - Guarantees **at least enough EXP to level up immediately** (`max(65, neededRawExp)`).

---

## Phase Progression & Spawn Weights

A phase advances whenever `survivalTime >= minTime` **OR** (`score >= minScore` AND `survivalTime >= minTime * 0.85`).

| Phase | Name | Time / Score Gate | Spawn Interval | Max Active Enemies | Batch Size | Base Speed Scale | Base `hpBonus` | Scripted Spawns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **01** | `FIRST SPARK` | `0s` / `0` pts | `0.96s` | `10` | `1` | `0.96×` | `+0` | Stalkers only |
| **02** | `DEEP CURRENTS` | `22s` / `1,125` pts | `1.10s` | `10` | `1` (`25%` 2) | `1.06×` | `+0` | Unlocks Manta, Sentinel, Spitter, Vortex & periodic Lancers |
| **03** | `UMBRAL DRIFT` | `46s` / `3,500` pts | `0.94s` | `13` | `1` (`48%` 2) | `1.18×` | `+0` | Unlocks Artillery & Warden · Spawns **Eclipse Core** + 2 Lancers |
| **04** | `ECLIPSE TIDE` | `72s` / `7,000` pts | `0.76s` | `17` | `2` (`40%` 3) | `1.32×` | `+1` | Twin Lancer chance `30%` · `+1` `hpBonus` |
| **05** | `ASTRAL STORM` | `100s` / `12,000` pts | `0.56s` | `23` | `2` (`50%` 3; `35%` 4 if `hpBonus >= 3`) | `1.48×` | `+2` | Twin Lancer chance `55%` · Spawns **Eclipse Core** + 3 Lancers |

### Standard Spawn Probability Table (`_spawnByPhase`)

65% spawn along the viewport perimeter; 35% spawn in the safe interior (`>=170–240px` away from Lumen). Rolls fallback to **Stalker** if a phase or condition gate isn't met:

| Roll Range | Enemy | Condition | Effective Weight (Ph 2) | Effective Weight (Ph 3–5) |
| --- | --- | --- | --- | --- |
| `0.00 – 0.11` | **Vortex** | Phase 2+ & no Vortex active | 11% (when none active) | 11% (when none active) |
| `0.11 – 0.21` | **Warden** | Phase 3+ & `< maxEnemies - 1` | 0% (Stalker) | 10% |
| `0.21 – 0.34` | **Artillery** | Phase 3+ | 0% (Stalker) | 13% |
| `0.34 – 0.50` | **Spitter** | Phase 2+ | 16% | 16% |
| `0.50 – 0.65` | **Manta** | Phase 2+ | 15% | 15% |
| `0.65 – 0.78` | **Sentinel** | Phase 2+ | 13% | 13% |
| `0.78 – 1.00` | **Stalker** (+ fallbacks) | Always | 35%+ | 22%+ |

### Scripted Timers (Elites, Lancer Volleys & Overdrive Cores)
- **Interval Elites (`nextEliteTime`):**
  - First Elite arrives at **`30s`** (alternating **Harbinger** → **Dreadnought** → **Harbinger**…).
  - Next Elite interval: **`max(26s, 35 - overdriveTier * 2)`**. If another Elite or Eclipse Core is already alive, retries every `10s`.
  - **Twin Elite Convergence (`OD+10+`):** At Overdrive Tier `10` and above, each Elite wave spawns **both** an **Astral Harbinger** and an **Umbral Dreadnought** simultaneously.
- **Eclipse Lancer Volleys (`nextVolleyTime`):**
  - Starts at **`52s`** (Phase 3+); spawns **`2` Lancers** (Phase 3–4) or **`3` Lancers** (Phase 5).
  - Next volley interval: **`max(14s, 26 - phase.id * 2 - overdriveTier)`**.
- **Endless Overdrive Cores (`nextOverdriveCoreTime`):**
  - Beyond `100s` (Phase 5), spawns an Overdrive Eclipse Core at **`135s`** and every **`48s`** thereafter.

---

## Scaling Formulas & Multipliers

### 1. Overdrive Tier (Endless Scaling after Phase 5 / 100s)
$$
\text{overdriveTier} = \max\Big(0,\;\Big\lfloor \max\Big(\frac{\text{survivalTime} - 108}{26},\; \min\Big(\frac{\text{score} - 13750}{4500},\; \frac{\text{survivalTime} - 108}{26} + 1\Big)\Big) \Big\rfloor\Big)
$$
- Every Overdrive tier cycles through the 4 Wave Banners (`PRISM DRIFT`, `VIOLET GALE`, `LANCER CHORUS`, `SOLAR ECLIPSE`) and drops a `30` LUM Shard.
- **Overdrive Enemy HP Multiplier (`WaveDirectorService.getOverdriveHpMul`):**
  $$\text{overdriveHpMul} = \begin{cases} 1 & \text{if } \text{od} \le 4 \\ 1.18^{(\text{od} - 4)} & \text{if } \text{od} > 4 \end{cases}$$
  *(Multiplies `hpMul` for normal enemies, Elites, and Eclipse Core `petalHp`: `1.0×` through `OD+4`, `2.70×` at `OD+10`, `14.1×` at `OD+20`, `74×` at `OD+30` — keeps all player abilities uncapped while preventing infinite 30–50 min AFK runs.)*
- **Overdrive Enemy Damage Multiplier (`WaveDirectorService.getOverdriveDamageMul`):**
  $$\text{overdriveDmgMul} = 1 + 0.14 \cdot \text{od} + 0.10 \cdot \max(0, \text{od} - 6) + \max\big(0,\; 1.08^{\max(0, \text{od} - 12)} - 1\big)$$
  *(Applied to all incoming contact, projectile, and shockwave damage in `Game.js`: `1.00×` in Ph 1–5, `1.70×` at `OD+5`, `2.80×` at `OD+10`, `6.05×` at `OD+20`, `10.6×` at `OD+30`.)*

### 2. Enemy HP Scaling (`BaseEnemy.computeScaledHp`)
First, additive `hpBonus` is calculated (with super-linear scaling past `OD+5`):
$$\text{hpBonus} = \text{baseHpBonus}\; (\text{0 in Ph 1–3, 1 in Ph 4, 2 in Ph 5}) + \text{overdriveTier} + \lfloor \max(0, \text{overdriveTier} - 5)^{1.35} \rfloor$$

Then `scaledHp = baseHp + bonusByKind`, and multiplied by `hpMul`:
- **Stalker / Manta / Spitter:** `+hpBonus × 10`
- **Sentinel:** `+floor(hpBonus × 1.35) × 10`
- **Artillery / Warden:** `+floor(hpBonus × 1.40) × 10`
- **Vortex:** `+floor(hpBonus × 1.50) × 10`
- **Lancer:** `+floor(hpBonus × 0.60) × 10`
- **Harbinger / Behemoth (Elites):** `+floor(hpBonus × 8) × 10`
- **Warden Split Wisps:** always spawn with `hpBonus = 0` (`10 HP × diff.hpMul`).

Next, multiplicative `hpMul`:
- **Normal Enemies:** `hpMul = difficulty.hpMul` (`1.0×` Normal · `1.45×` Hard · `2.0×` Nightmare).
- **Interval Elites:** `eliteHpMul = difficulty.hpMul × (1 + eliteWaveCount × 0.35)` *(each subsequent Elite gains `+35%` HP scaling on top of `hpBonus × 80`)*.
- Final HP: `max(10, round(scaledHp * hpMul))`.

### 3. Speed, Spawn Rate & Caps (`effectivePhase`)
- **Max Active Enemies:** `min(36, phase.maxEnemies + overdriveTier * 3 + (eclipseSurge ? 4 : 0))`
- **Spawn Interval:** `max(0.26s, ((phase.spawnInterval - overdriveTier * 0.04) * (eclipseSurge ? 0.84 : 1)) / difficulty.spawnRateMul)`
- **Speed Scale:** `min(2.05, (phase.speedScale + overdriveTier * 0.07) * difficulty.enemySpeedMul * dailyTwist.enemySpeedMul)`

### 4. Difficulty, Daily Twist & Event Modifiers

| Modifier Source | Enemy HP | Enemy Speed | Spawn Rate | Rewards |
| --- | --- | --- | --- | --- |
| **Difficulty: Normal** | `1.00×` | `1.00×` | `1.00×` | `1×` Score · `1×` EXP · `1×` LUM |
| **Difficulty: Hard** | `1.45×` | `1.08×` | `1.06×` | `1.35×` Score · `1.25×` EXP · `1.45×` LUM |
| **Difficulty: Nightmare** | `2.00×` | `1.16×` | `1.14×` | `1.80×` Score · `1.50×` EXP · `2.00×` LUM |
| **Daily Twist: Chrono Surge** | — | `1.10×` | — | Player `+15%` Fire Rate |
| **Daily Twist: Volatile Void** | — | `1.15×` | — | Player `+15%` Ability DMG |
| **World Event: Eclipse Surge** | — | — | `~1.19×` (`0.84×` interval, `+4` cap) | `+50%` EXP & Score |
