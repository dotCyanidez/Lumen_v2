# LUMEN — Balance Changes & Future Tuning Watchlist

> Living tracker of gameplay balance changes we have applied (and deferred levers) that may need fine-tuning based on real playtesting.

---

## 1. Overdrive & Late-Game Scaling *(Highest Watch Priority)*

| Change | Where | Current Value | Why We Changed It | Watch For / How to Tune Later |
| :--- | :--- | :--- | :--- | :--- |
| **Exponential Overdrive Enemy HP** | [WaveDirectorService.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/services/WaveDirectorService.js#L37-L40) (`getOverdriveHpMul`) | `1.18^(od - 4)` past `OD+4` (`1×` Ph 1–5, `2.7×` @ `OD+10`, `14.1×` @ `OD+20`, `74×` @ `OD+30`) | Stops uncapped `LV 50+` builds (e.g. Voltaic + Chrono) from going 54+ min while keeping all ability ranks uncapped. | If runs feel like they hit a brick wall too abruptly around `6:00–9:00` (`OD+10–15`), lower `1.18` → `1.14–1.15` or start past `OD+6`. If god-builds still exceed 20m, raise to `1.20–1.22`. |
| **Overdrive Enemy Damage Scaling** | [WaveDirectorService.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/services/WaveDirectorService.js#L42-L46) (`getOverdriveDamageMul`) + [Game.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/Game.js#L1691-L1692) | `1 + 0.14*od + 0.10*max(0, od-6) + max(0, 1.08^(od-12) - 1)` | Enemy damage previously never scaled with Overdrive, letting shielded/high-HP builds face-tank endlessly. | If `OD+10` (`~6:00`) starts one-shotting glass-cannon Spirits (`Solar Tempest` 75 HP / `Astral Comet` 95 HP), trim `0.14` → `0.10` or delay the `1.08^od` tail to `OD+16`. |
| **Super-Linear `hpBonus` Curve** | [WaveDirectorService.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/services/WaveDirectorService.js#L50-L64) (`buildEffectivePhase`) | `baseHpBonus + od + floor((od - 5)^1.35)` | Stacks with `overdriveHpMul` to keep late swarm units threatening. | Since `getOverdriveHpMul` is now exponential, this additive curve may double-dip slightly at `OD+12–20` — can be simplified back to `baseHpBonus + od` if mid-Overdrive feels too spongey. |
| **Level Max HP Soft-Cap** | [Constants.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/core/Constants.js#L103-L111) (`getLevelMaxHpBonus`) | `+6 HP/lv` past `LV 20` (unchanged `LV 1–20`) | Previously grew unboundedly (`+50 HP/lv` at `LV 59`, granting `+1,550+ HP`). | If late-game level-ups feel unrewarding defensively against exponential Overdrive damage, bump `+6` → `+8` or `+10` past `LV 20`. |

---

## 2. Bosses & Enemies

| Change | Where | Current Value | Why We Changed It | Watch For / How to Tune Later |
| :--- | :--- | :--- | :--- | :--- |
| **Eclipse Core Scaled `petalHp`** | [WaveDirectorService.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/services/WaveDirectorService.js#L76-L81) (`getCorePetalHp`) + [EclipseCoreBoss.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/models/enemies/EclipseCoreBoss.js) | `((ph >= 5 ? 90 : 60) + od * 25) * diff.hpMul * getOverdriveHpMul(od)` | Previously `10 HP/petal` (`30–80 HP` total), dying in `<1s` before firing its first shockwave. | On **Phase 3 Nightmare** (`600 HP`), low-DPS builds may get close to the `40s` despawn without Void Parries. On **OD+15+**, `getOverdriveHpMul` makes Core petals huge (making Void Parry / Solar Dash smash mandatory — watch whether that feels awesome or too tanky). |
| **Twin Elites at `OD+10+`** | [Game.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/Game.js#L2031-L2062) | Spawns both `harbinger` + `behemoth` simultaneously when `overdriveTier >= 10` | Gives late Overdrive a visible mechanical escalation beyond raw HP/damage scaling. | Watch whether both Elites dropping 2 bonus cards feels too generous or if Harbinger bullet-hell + Dreadnought charge overlap is too punishing on Hard/Nightmare (can push threshold `OD+10 → OD+12` or scale Twin HP `× 0.85`). |

---

## 3. Abilities, Talents & Synergies

| Change | Where | Current Value | Why We Changed It | Watch For / How to Tune Later |
| :--- | :--- | :--- | :--- | :--- |
| **Voltaic Arc Anti-Perma-Freeze** | [VoltaicArcAbility.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/models/abilities/VoltaicArcAbility.js#L58-L67) | Velocity cut `0.2× → 0.65×` + `1.5s` per-enemy stun immunity | Maxed Voltaic + Chrono Conduit was permanently freezing every enemy on screen (`94%` damage share in 54m run). | Watch if `Paralyzing Surge` (`vc_stun`) still feels impactful as a Tier 3 capstone. If too weak, tighten immunity `1.5s → 1.0s` or velocity cut `0.65× → 0.5×`. Also watch if Voltaic Arc's uncapped `reachMul` still dominates damage share past `LV 15`. |
| **Voltaic Arc Cadence, `Ion Anchor` & Acquire Cap** | [VoltaicArcAbility.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/models/abilities/VoltaicArcAbility.js#L10-L135) | `1.45s` interval · `Ion Anchor` `42% / 62%` dmg · initial acquire reach capped at `540px` (`560px` Tempest Echo) | Sim #0 showed Voltaic out-DPSing other abilities `2×+`, and uncapped `reachMul` caused `94%` damage share by killing enemies off-screen. | Re-check damage share in 6–12 min runs; bounce reach (`225 * rMul`) is still uncapped, so if it still takes `>60%` share, cap bounce reach too (`min(420, 225 * rMul)`). |
| **Celestial Spear Buff** | [CelestialSpearAbility.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/models/abilities/CelestialSpearAbility.js) | `18` base dmg · `2.25s` interval | Sim #0 showed Spear lagging behind Bolt/Blades. | Watch boss/elite burst — if `Twin Celestial Lance` deletes Elites too fast early, trim base dmg `18 → 16`. |
| **Orbiting Blades Buff & `Radiant Bastion`** | [OrbitingBladesAbility.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/models/abilities/OrbitingBladesAbility.js) | `74px` radius · `so_ray_pct: [25,35,45,55]%` · `+20%` dmg while shielded | Sim #0/#1 showed Blades underperforming in mid-range clear and low synergy lift. | Watch melee safety in Overdrive — `74px` is close to fast `2.05×` Stalkers. |
| **Astral Pulse `Echo Wave`** | [AstralPulseAbility.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/models/abilities/AstralPulseAbility.js) | `105% / 120%` trailing radius | Sim #0 showed low LV 5/10 ascension jump. | Watch screen-wide knockback stacking with high `radiusMul`. |
| **Chrono Conduit & `Comet Volley`** | [SynergyTalentService.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/services/SynergyTalentService.js) + [StarlightBoltAbility.js](file:///c:/Users/mathi/Documents/minigames/Lumen/src/models/abilities/StarlightBoltAbility.js) | `ec_syn_pct: [3,5,7,9]%` · `ec_mirror_every: [6,5,4,3]` · Comet Volley every 2nd volley | Sim #1 showed Chrono Conduit & Comet Volley were weak 5th-slot picks. | Watch uncapped `Chrono Conduit` `LV 20+` haste scaling with Voltaic Arc / Starlight Bolt. |

---

## 4. Deferred Items (Not Changed Yet — Ready If Needed)

From [SIMULATION_FINDINGS_LOG.md](file:///c:/Users/mathi/Documents/minigames/Lumen/SIMULATION_FINDINGS_LOG.md):
1. **Early Sanctuary `T0 → T1` Feel (`Constants.js` → `SANCTUARY_UPGRADES`):** Rank 1 Sanctuary upgrades (`+1.5%` dmg/haste for `900–1,100 LUM`) had almost zero measurable survival lift in Sim #6. Consider bumping early ranks to `+3%` or adding a `+HP` Sanctuary node if the first few runs feel flat.
2. **Draft Carry Momentum & Synergy Bias (`DraftService.js` → `getDraftWeight`):** Currently only `0.5%–2.3%` of 18-level runs hit a `LV 10` Supernova and avg Synergies at `LV 12` is `~0.4`. Optional `1 + curRank * 0.14` carry weight and `× 2.0` synergy-partner unlock bias are logged if you want earlier ascensions.
3. **Phase 4/5 Timing & Late Medal Ceilings (`Constants.js` → `PHASES` / `RANK_MEDALS`):** Optional shift of Phase 4 (`72s → 80s`) / Phase 5 (`100s → 115s`) and raising `CELESTIAL` (`68k → 90k`) / `SUPERNOVA` (`120k → 180k`).
4. **Dev Controls Cleanup (`index.html`, `src/Game.js`, `src/ui/UIManager.js`):** `?dev=1` exposes `DEV`, `MONEY`, `+60s`, and `CORE` — keep gated behind `?dev=1` or strip before public release.
