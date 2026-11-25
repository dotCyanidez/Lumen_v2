# LUMEN — Abilities, Cards & Talents Reference

A complete reference of every ability, in-run upgrade card, ascension, synergy, and Sanctuary talent in LUMEN.

---

## Core Mechanics & Progression Rules

- **Ability Slots:** Up to **6 abilities** equipped per run (`MAX_ABILITY_SLOTS = 6`). **Starlight Bolt** always starts unlocked at **LV 1**.
- **In-Run Drafts & Controls:** Each level-up or Elite Boss draft offers 3 choices mixing:
  - **Unlock (`NEW`)** cards for unowned abilities (until 6 slots are full).
  - **Aspect cards** for already-unlocked abilities in 4 Rarity tiers (all uncapped, endless scaling):
    - **Common (Grey · `1.0×`):** `62%` base weight
    - **Uncommon (`1.6×`):** `24%` base weight *(integer `+1` cards skip Uncommon)*
    - **Rare (`2.25×`):** `10%` base weight
    - **Epic (`3.0×`):** `4%` base weight *(Future Luck & Astral Foresight shift odds toward Uncommon/Rare/Epic)*
  - **Rerolls & Banishes:** Every run starts with **1 free Reroll** (`Astral Foresight` grants extra Rerolls & Luck). **Void Banish** unlocks up to **3 Banishes** per run to permanently banish all cards for a chosen ability for the rest of the run (so picking 6 abilities and banishing 3 restricts drafts to only the other 3).
- **Ascensions (All 11 Abilities):**
  - **LV 5:** Unlocks the ability's **Ascension** passive.
  - **LV 10:** Upgrades to **Supernova** (amplified effect).
- **Sanctuary Talent Trees:** Each of the 11 abilities has a **5-node** branching talent tree unlocked with **Luminance (LUM)** in the Sanctuary:
  - **Root** → **Left Branch (`leftMid` → `leftCap`)** & **Right Branch (`rightMid` → `rightCap`)**.
  - **Standard LUM Costs per Rank (LV 1 / 2 / 3 / 4):**
    - **Tier 1 (`root`):** `750 / 1200 / 1800 / 2550`
    - **Tier 2 (`leftMid` / `rightMid`):** `1140 / 1740 / 2460 / 3300`
    - **Tier 3 (`leftCap` / `rightCap`):** `1650 / 2400 / 3450 / 4650`
    - Some later weapons scale these costs by `1.1×`, `1.15×`, or `1.2×` (listed per talent below).
- **Synergies:** Automatic combo passives unlocked when both paired abilities reach **LV 3+** in a run.

---

## Quick Index

**Damage Abilities (7)**
1. [Starlight Bolt (`resonant_volley`)](#1-starlight-bolt-resonant_volley) — *Starts unlocked at LV 1*
2. [Orbiting Blades (`solar_orbitals`)](#2-orbiting-blades-solar_orbitals)
3. [Voltaic Arc (`voltaic_chain`)](#3-voltaic-arc-voltaic_chain)
4. [Astral Pulse (`astral_pulse`)](#4-astral-pulse-astral_pulse)
5. [Seeker Needles (`seeker_barrage`)](#5-seeker-needles-seeker_barrage)
6. [Starbloom Spores (`starbloom_spores`)](#6-starbloom-spores-starbloom_spores)
7. [Celestial Spear (`celestial_spear`)](#7-celestial-spear-celestial_spear)

**Utility & Sanctuary Cores (4)**
8. [Gravity Harvest (`gravity_harvest`)](#8-gravity-harvest-gravity_harvest)
9. [Aegis Sanctuary (`aegis_bloom`)](#9-aegis-sanctuary-aegis_bloom)
10. [Starlight Shield (`astral_shield`)](#10-starlight-shield-astral_shield)
11. [Chrono Conduit (`echo_conduit`)](#11-chrono-conduit-echo_conduit)

*(Note: `Slipstream Gale` and `Resonance Weaver` were removed from active runs and archived in [RESERVE_FEATURE_IDEAS.md](file:///c:/Users/mathi/Documents/minigames/Lumen/RESERVE_FEATURE_IDEAS.md).)*

**Also Included**
- [Ability Synergies (LV 3+ Pairs)](#ability-synergies-lv-3-pairs)
- [Global Sanctuary Core Upgrades](#global-sanctuary-core-upgrades)

---

## Damage Abilities

### 1. Starlight Bolt (`resonant_volley`)
- **Tag:** `DAMAGE · BOLT` *(Starts unlocked at LV 1)*
- **Base Description:** Lumen’s automatic starlight bolt firing at nearby shadows.
- **Base Stats:** `0.80s` interval · `360px` range · `740 px/s` bolt speed · `1` bolt per volley · `10` base damage.
- **Ascension (`Forked Light`):**
  - **LV 5:** Bolts split into **2** starlight sparks on kill.
  - **LV 10 (Supernova):** Amplified to **3** starlight sparks on kill.

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Damage (`dmgMul`) | `+8%` | `+13%` | `+18%` | `+24%` | Starlight Bolts deal more damage |
| Attack Rate (`rateMul`) | `7% Faster` | `11% Faster` | `16% Faster` | `21% Faster` | Starlight Bolt fires faster (also boosts bolt speed) |
| Extra Bolts (`countAdd`) | `+1 Bolt` | — | `+2 Bolts` | `+3 Bolts` | Fires additional Starlight Bolts per volley |
| Pierce (`pierceAdd`) | `+1 Pierce` | — | `+2 Pierce` | `+3 Pierce` | Starlight Bolts pierce more shadows |
| Range (`rangeMul`) | `+10%` | `+16%` | `+23%` | `+30%` | Targeting reach increases |

#### Talents
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Focus Bolt** (`rv_velocity`) | Root | — | 4 | 750 / 1200 / 1800 / 2550 | `+8% / +16% / +24% / +32%` single-target dmg & `+12% / +24% / +36% / +48%` bolt speed |
| **Prismatic Ricochet** (`rv_ricochet`) | Left Mid | Focus Bolt | 4 | 1140 / 1740 / 2460 / 3300 | `+1 / +1 / +2 / +2` ricochet(s) to nearby unhit shadows at `55% / 70% / 85% / 100%` dmg |
| **Fan Salvo** (`rv_splitshot`) | Left Cap | Prismatic Ricochet | 4 | 1650 / 2400 / 3450 / 4650 | Every `4th / 3rd / 3rd / 2nd` volley fires `+2` angled flanking Bolts (`60% / 75% / 90% / 100%` dmg) |
| **Starfire Burn** (`rv_starfire`) | Right Mid | Focus Bolt | 4 | 1140 / 1740 / 2460 / 3300 | Sears struck shadows for `4.5 / 7 / 9.5 / 12.5` dmg/s burn over `2.4s` |
| **Supernova Finale** (`rv_crescendo`) | Right Cap | Starfire Burn | 4 | 1650 / 2400 / 3450 / 4650 | Every 4th volley blasts in a `64px` flash (`55% / 80% / 110% / 145%` AoE) & scatters `1 / 2 / 3 / 4` homing spark(s) |

---

### 2. Orbiting Blades (`solar_orbitals`)
- **Tag:** `DAMAGE · ORBITAL`
- **Base Description:** Summons 2 crystalline blades orbiting Lumen to slice nearby shadows.
- **Base Stats:** `2` blades · `74px` orbit radius · `2.95 rad/s` spin · `0.40s` per-target hit cooldown · `10` base damage.
- **Ascension (`Harmonic Halo`):**
  - **LV 5+:** Orbit ring periodically scorches nearby shadows (`LV 10+` amplifies it).

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Blade Count (`countAdd`) | `+1 Blade` | — | `+2 Blades` | `+3 Blades` | Extra orbiting crystalline blades circling Lumen |
| Damage (`dmgMul`) | `+8%` | `+13%` | `+18%` | `+24%` | Orbiting Blades deal more damage |
| Spin Speed (`speedMul`) | `9% Faster` | `14% Faster` | `20% Faster` | `27% Faster` | Blades rotate & strike faster |
| Reach (`sizeMul`) | `+9%` | `+14%` | `+20%` | `+27%` | Wider orbit radius & cleave reach |

#### Talents
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Radiant Edge** (`so_edge`) | Root | — | 4 | 750 / 1200 / 1800 / 2550 | `+10% / +20% / +30% / +40%` blade dmg & `+6% / +12% / +18% / +24%` orbit speed |
| **Solar Rays** (`so_sunray`) | Left Mid | Radiant Edge | 4 | 1140 / 1740 / 2460 / 3300 | Projects `+60 / +82 / +104 / +126px` outward blade laser dealing `25% / 35% / 45% / 55%` dmg |
| **Corona Expansion** (`so_mirror`) | Left Cap | Solar Rays | 4 | 1650 / 2400 / 3450 / 4650 | Every `5.5s / 4.7s / 4.0s / 3.3s` surges `1.45×` outward for `1.6s` with `+25% / +40% / +55% / +75%` dmg |
| **Void Deflector** (`so_repulse`) | Right Mid | Radiant Edge | 4 | 1140 / 1740 / 2460 / 3300 | `+25% / +50% / +75% / +100%` knockback & `-0.15s / -0.25s / -0.35s / -0.45s` Solar Dash CD on Heavy/Elite hits |
| **Eclipse Cleave** (`so_execution`) | Right Cap | Void Deflector | 4 | 1650 / 2400 / 3450 / 4650 | `+20% / +40% / +60% / +85%` finisher dmg vs Heavy/wounded (<50% HP) · **Lifesteal:** `18% / 28% / 40% / 55%` of Blade dmg as HP |

---

### 3. Voltaic Arc (`voltaic_chain`)
- **Tag:** `DAMAGE · LIGHTNING`
- **Base Description:** Strikes nearby shadows with Chain Lightning arcing across 2 targets.
- **Base Stats:** `1.45s` interval · `300px` initial acquire reach · `225px` bounce jump reach · `2` targets · `10` base damage.
- **Ascension (`Ion Anchor`):**
  - **LV 5:** Final chain hit erupts in a `72px` static shockwave (`42%` dmg).
  - **LV 10 (Supernova):** Amplified to `96px` shockwave (`62%` dmg).

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Chain Targets (`targetsAdd`) | `+1 Target` | — | `+2 Targets` | `+3 Targets` | Chains to extra shadows per strike |
| Damage (`dmgMul`) | `+8%` | `+13%` | `+18%` | `+24%` | Voltaic Arc deals more damage |
| Attack Rate (`rateMul`) | `7% Faster` | `11% Faster` | `16% Faster` | `21% Faster` | Discharges more often |
| Jump Reach (`reachMul`) | `+10%` | `+16%` | `+23%` | `+30%` | Jumps further between shadows |

#### Talents
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Overcharged Coil** (`vc_charge`) | Root | — | 4 | 750 / 1200 / 1800 / 2550 | `+10% / +20% / +30% / +40%` arc dmg & `+6% / +12% / +18% / +24%` reach |
| **Relay Conduit** (`vc_relay`) | Left Mid | Overcharged Coil | 4 | 1140 / 1740 / 2460 / 3300 | `+1 / +1 / +2 / +2` chain bounce(s) & `+8% / +16% / +24% / +32%` reach |
| **Twin-Arc Fork** (`vc_fork`) | Left Cap | Relay Conduit | 4 | 1650 / 2400 / 3450 / 4650 | Discharges a simultaneous 2nd forked lightning chain at `45% / 60% / 75% / 95%` dmg |
| **Feedback Capacitor** (`vc_capacitor`) | Right Mid | Overcharged Coil | 4 | 1140 / 1740 / 2460 / 3300 | Surges `+18% / +28% / +38% / +50%` burst dmg into final target per unused bounce |
| **Paralyzing Surge** (`vc_stun`) | Right Cap | Feedback Capacitor | 4 | 1650 / 2400 / 3450 / 4650 | `0.4s / 0.6s / 0.8s / 1.0s` jolt slow (`0.65×` velocity cut, `1.5s` per-enemy stun immunity) & restores `0.12s / 0.2s / 0.28s / 0.38s` Dash on Arc kills |

---

### 4. Astral Pulse (`astral_pulse`)
- **Tag:** `DAMAGE · NOVA`
- **Base Description:** Releases an automatic shockwave nova that damages & pushes shadows back.
- **Base Stats:** `3.25s` interval · `155px` radius · `185` knockback (`-175` pull with Gravity Well) · `0.95s` slow · `10` base damage.
- **Ascension (`Echo Wave`):**
  - **LV 5:** Fires a second trailing shockwave (`105%` radius, `62%` dmg) behind each nova.
  - **LV 10 (Supernova):** Amplified to `120%` radius and `82%` dmg.

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Damage (`dmgMul`) | `+9%` | `+14%` | `+20%` | `+27%` | Astral Pulse deals more damage |
| Attack Rate (`rateMul`) | `7% Faster` | `11% Faster` | `16% Faster` | `21% Faster` | Triggers more often |
| Nova Area (`radiusMul`) | `+10%` | `+16%` | `+23%` | `+30%` | Shockwave expands wider (capped at `480px` before reach multipliers) |
| Slow Duration (`slowMul`) | `+14%` | `+22%` | `+32%` | `+42%` | Slows surviving shadows longer |

#### Talents
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Tidal Resonance** (`ap_swell`) | Root | — | 4 | 750 / 1200 / 1800 / 2550 | `+10% / +20% / +30% / +40%` pulse dmg & `+5% / +10% / +15% / +20%` radius |
| **Gravity Well** (`ap_vortex`) | Left Mid | Tidal Resonance | 1 | 2250 | Reverses knockback to pull struck shadows inward instead of pushing away |
| **Singularity Crush** (`ap_singularity`) | Left Cap | Gravity Well | 4 | 1650 / 2400 / 3450 / 4650 | Delayed inward implode (`5.5 / 8.5 / 11.5 / 15.5` AoE dmg & `1.1s` stasis) |
| **Harmonic Double-Wave** (`ap_twinwave`) | Right Mid | Tidal Resonance | 4 | 1140 / 1740 / 2460 / 3300 | Echoes a second rapid wave after `0.26s` (`35% / 50% / 65% / 85%` dmg) |
| **Tidal Siphon** (`ap_siphon`) | Right Cap | Harmonic Double-Wave | 4 | 1650 / 2400 / 3450 / 4650 | `-0.06s / -0.09s / -0.12s / -0.15s` CD per hit · `180 / 240 / 300 / 380px` Mote pull · **Lifesteal:** `18% / 28% / 38% / 52%` of Pulse dmg as HP |

---

### 5. Seeker Needles (`seeker_barrage`)
- **Tag:** `DAMAGE · HOMING`
- **Base Description:** Launches 2 curved homing starlight needles toward distant shadows.
- **Base Stats:** `2.30s` interval · `2` needles · `760px` range · `490 px/s` speed · `10` base damage.
- **Ascension (`Starburst`):**
  - **LV 5:** Needles burst in a `48px` starlight splash (`50%` dmg) on hit.
  - **LV 10 (Supernova):** Amplified to `64px` splash (`75%` dmg).

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Needle Count (`countAdd`) | `+1 Needle` | — | `+2 Needles` | `+3 Needles` | Launches extra homing needles per volley |
| Damage (`dmgMul`) | `+8%` | `+13%` | `+18%` | `+24%` | Seeker Needles deal more damage |
| Attack Rate (`rateMul`) | `7% Faster` | `11% Faster` | `16% Faster` | `21% Faster` | Launches faster |
| Homing Speed (`speedMul`) | `+10%` | `+16%` | `+23%` | `+30%` | Needles fly & curve faster |

#### Talents *(1.1× base cost scaling)*
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Luminous Guidance** (`sb_guidance`) | Root | — | 4 | 830 / 1320 / 1980 / 2810 | `+10% / +20% / +30% / +40%` dmg & `+12% / +24% / +36% / +48%` turn speed |
| **Twin Volleys** (`sb_twin`) | Left Mid | Luminous Guidance | 4 | 1250 / 1910 / 2710 / 3630 | `+1 / +1 / +2 / +2` needle(s) & `+10% / +20% / +30% / +40%` speed |
| **Ghostbreaker Pierce** (`sb_pierce`) | Left Cap | Twin Volleys | 4 | 1820 / 2640 / 3800 / 5120 | `+1 / +1 / +2 / +2` pierce & automatic homing re-lock after pass-through |
| **Starlight Mark** (`sb_mark`) | Right Mid | Luminous Guidance | 4 | 1250 / 1910 / 2710 / 3630 | Paints a `3.5s` mark increasing ALL damage taken by `+12% / +20% / +28% / +38%` |
| **Guillotine Salvo** (`sb_execute`) | Right Cap | Starlight Mark | 4 | 1820 / 2640 / 3800 / 5120 | `+25% / +40% / +55% / +75%` dmg <45% HP · `+1 / +1 / +2 / +2` free Needle on Marked kill · **Lifesteal:** `18% / 28% / 40% / 55%` of Needle dmg as HP |

---

### 6. Starbloom Spores (`starbloom_spores`)
- **Tag:** `DAMAGE · BLOOM`
- **Base Description:** Releases drifting bioluminescent starblooms that burst in starlight when shadows near.
- **Base Stats:** `1.25s` interval (`1.45×` faster while moving) · `4` max active blooms · `78px` burst radius · `29px` trigger radius · `6.8s` bloom lifetime · `10` base damage.
- **Ascension (`Chain Pollen`):**
  - **LV 5:** Detonating blooms fire **2** seeking sparks.
  - **LV 10 (Supernova):** Amplified to **3** seeking sparks.

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Damage (`dmgMul`) | `+9%` | `+14%` | `+20%` | `+27%` | Starbloom bursts deal more damage |
| Bud Rate (`rateMul`) | `8% Faster` | `13% Faster` | `18% Faster` | `24% Faster` | Spores bud more often |
| Blast Area (`radiusMul`) | `+10%` | `+16%` | `+23%` | `+30%` | Blossom bursts expand wider |
| Max Blooms (`maxAdd`) | `+1 Max Bloom` | — | `+2 Max Blooms` | `+3 Max Blooms` | Hold more active Starblooms in the arena |

#### Talents *(1.15× base cost scaling)*
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Radiant Pollen** (`ss_potency`) | Root | — | 4 | 860 / 1380 / 2070 / 2930 | `+10% / +20% / +30% / +40%` bloom dmg & `+6% / +12% / +18% / +24%` blast radius |
| **Blooming Drift** (`ss_drift`) | Left Mid | Radiant Pollen | 4 | 1310 / 2000 / 2830 / 3790 | `+22% / +44% / +66% / +88%` drift toward shadows & `+6% / +12% / +18% / +24%` trigger area |
| **Spore Mitosis** (`ss_chain`) | Left Cap | Blooming Drift | 4 | 1900 / 2760 / 3970 / 5350 | Scatters `1 / 2 / 3 / 4` spark(s) & `30% / 45% / 60% / 80%` chance to bud a mini-spore (`75%` dmg) |
| **Solar Miasma** (`ss_miasma`) | Right Mid | Radiant Pollen | 4 | 1310 / 2000 / 2830 / 3790 | Sears caught shadows with `4 / 6.5 / 9 / 12` dmg/s miasma DoT (`2.6s`) |
| **Blighted Blossom Pool** (`ss_garden`) | Right Cap | Solar Miasma | 4 | 1900 / 2760 / 3970 / 5350 | Unfurls a `76px` mist pool slowing `45%` & dealing `5.5 / 8.5 / 11.5 / 15` dmg/s (`3.2s`) |

---

### 7. Celestial Spear (`celestial_spear`)
- **Tag:** `DAMAGE · PIERCE`
- **Base Description:** Fires a piercing radiant beam lance through up to 3 aligned shadows.
- **Base Stats:** `2.25s` interval · `560px` acquire range · `680px` beam length · `3` max pierce · `18` base damage.
- **Ascension (`Afterglow Lance`):**
  - **LV 5:** Beam hangs `0.68s` and scorches crossing shadows for `42%` dmg.
  - **LV 10 (Supernova):** Beam hangs `0.95s` and scorches for `60%` dmg.

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Damage (`dmgMul`) | `+9%` | `+14%` | `+20%` | `+27%` | Celestial Spear deals more damage |
| Attack Rate (`rateMul`) | `7% Faster` | `11% Faster` | `16% Faster` | `21% Faster` | Fires more often |
| Pierce (`pierceAdd`) | `+2 Pierce` | `+3 Pierce` | `+5 Pierce` | `+6 Pierce` | Pierces through additional shadows |
| Beam Width (`widthMul`) | `+11%` | `+18%` | `+25%` | `+33%` | Beam sweeps wider |

#### Talents *(1.2× base cost scaling)*
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Lance Caliber** (`cs_caliber`) | Root | — | 4 | 900 / 1440 / 2160 / 3060 | `+10% / +20% / +30% / +40%` beam dmg & `+10% / +20% / +30% / +40%` beam width |
| **Armor Shatter** (`cs_impale`) | Left Mid | Lance Caliber | 4 | 1370 / 2090 / 2950 / 3960 | `+1 / +1 / +2 / +2` pierce & `+15% / +30% / +45% / +60%` first-target dmg |
| **Prismatic Split** (`cs_prism`) | Left Cap | Armor Shatter | 4 | 1980 / 2880 / 4140 / 5580 | Each pierced target refracts 2 angled sparks (`30% / 45% / 60% / 75%` beam dmg) |
| **Suspended Afterglow** (`cs_afterglow`) | Right Mid | Lance Caliber | 4 | 1370 / 2090 / 2950 / 3960 | `+0.45s / +0.65s / +0.85s / +1.1s` beam hang & `35% / 50% / 65% / 85%` afterglow wave |
| **Twin Celestial Lance** (`cs_crossfire`) | Right Cap | Suspended Afterglow | 4 | 1980 / 2880 / 4140 / 5580 | Fires a 2nd intersecting Spear at another nearby threat (`45% / 60% / 75% / 95%` dmg) |

---

## Utility & Sanctuary Core Abilities

### 8. Gravity Harvest (`gravity_harvest`)
- **Tag:** `UTILITY · MAGNET`
- **Unlock Effect:** `+25%` Magnet reach, enables **Constellation Star pull**, and `+10%` more EXP.
- **Ascension (`Orbital Singularity`):**
  - **LV 5:** Every 10 motes collected unleashes a `150px` Gravity Nova & pull.
  - **LV 10 (Supernova):** Amplified Gravity Nova damage, shockwave radius, and inward pull.

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Magnet Reach (`magnetMul`) | `+14%` | `+22%` | `+32%` | `+42%` | Wider Light Mote & Star magnet reach |
| EXP Gain (`expMul`) | `+7%` | `+11%` | `+16%` | `+21%` | Earn more EXP from purified shadows |

#### Talents
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Starwell Magnet** (`gh_attractor`) | Root | — | 4 | 750 / 1200 / 1800 / 2550 | `+10% / +20% / +30% / +40%` Mote magnet range |
| **Luminous Hoard** (`gh_greed`) | Left Mid | Starwell Magnet | 4 | 1140 / 1740 / 2460 / 3300 | `+10% / +20% / +30% / +45%` bonus EXP & Score from Light Motes |
| **Midas Crystallization** (`gh_shimmer`) | Left Cap | Luminous Hoard | 4 | 1650 / 2400 / 3450 / 4650 | `+1 / +2 / +3 / +4` LUM & spawns a Golden Mote every 12 Motes gathered |
| **Slipstream Vacuum** (`gh_vacuum`) | Right Mid | Starwell Magnet | 4 | 1140 / 1740 / 2460 / 3300 | Every 10th Mote pulls collectibles within `240 / 300 / 360 / 440px` |
| **Constellation Blast** (`gh_nova`) | Right Cap | Slipstream Vacuum | 4 | 1650 / 2400 / 3450 / 4650 | Special pickups blast `135px` (`6.5 / 9.5 / 12.5 / 16` dmg) & `+0.2 / +0.3 / +0.4 / +0.5` Solar Dash |

---

### 9. Aegis Sanctuary (`aegis_bloom`)
- **Tag:** `UTILITY · WARD`
- **Unlock Effect:** Restores **+30 HP** & grants a recharging hit-blocking **Aegis Ward**.
- **Ascension (`Sanctuary Aura`):**
  - **LV 5:** Ward block heals `+12 HP` and cuts Ward recharge by `20%`.
  - **LV 10 (Supernova):** Amplified to `+20 HP` heal & `32%` faster Ward recharge.

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Ward Recharge (`wardRateMul`) | `9% Faster` | `14% Faster` | `20% Faster` | `27% Faster` | Aegis Barrier Ward recharges faster |
| Dash Grace (`dashGraceMul`) | `+11%` | `+18%` | `+25%` | `+33%` | Solar Dash stays invulnerable longer |
| Ward Push (`repulseMul`) | `+12%` | `+19%` | `+27%` | `+36%` | Aegis Ward shockwave pushes shadows further |

#### Talents
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Crystal Mantle** (`ab_mantle`) | Root | — | 4 | 750 / 1200 / 1800 / 2550 | `+10% / +20% / +30% / +40%` Dash & Ward invulnerability grace |
| **Quick Mend** (`ab_tempo`) | Left Mid | Crystal Mantle | 4 | 1140 / 1740 / 2460 / 3300 | `12% / 22% / 32% / 42%` faster Ward recharge |
| **Repulsive Bulwark** (`ab_bulwark`) | Left Cap | Quick Mend | 4 | 1650 / 2400 / 3450 / 4650 | While Ward is ready, `96px` pulse every `1.6s` (`4.5 / 7 / 9.5 / 12.5` dmg + knockback) |
| **Mirror Shatter** (`ab_nova`) | Right Mid | Crystal Mantle | 4 | 1140 / 1740 / 2460 / 3300 | Ward block blasts (`12 / 19 / 26 / 34` dmg) & grants `+20% / +30% / +40% / +55%` speed (`1.6s`) |
| **Phoenix Barrier** (`ab_radiance`) | Right Cap | Mirror Shatter | 4 | 1650 / 2400 / 3450 / 4650 | Ward block restores `1` Solar Dash & grants `+25% / +40% / +55% / +75%` Ability DMG for `4.0s` |

---

### 10. Starlight Shield (`astral_shield`)
- **Tag:** `UTILITY · SHIELD`
- **Unlock Effect:** Generates a **35 HP** regenerating Shield that absorbs hits before HP (`3.5 HP/s` base regen after `4.4s` out-of-combat recovery delay, minimum `1.2s`).
- **Ascension (`Prismatic Bulwark`):**
  - **LV 5:** `+15 Max Shield` & emits a `140px` static pulse on full recharge or break.
  - **LV 10 (Supernova):** `+28 Max Shield` & amplified `185px` static pulse on full recharge or break.

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Max Shield (`shieldCapAdd`) | `+12 HP` | `+19 HP` | `+27 HP` | `+36 HP` | Increases Starlight Shield capacity |
| Shield Regen (`shieldRegenMul`) | `14% Faster` | `22% Faster` | `32% Faster` | `42% Faster` | Starlight Shield regenerates faster |
| Recovery Delay (`shieldDelayMul`) | `11% Quicker` | `18% Quicker` | `25% Quicker` | `33% Quicker` | Shield resumes recharging sooner after taking a hit |

#### Talents
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Prism Plating** (`as_plating`) | Root | — | 4 | 750 / 1200 / 1800 / 2550 | `+6 / +12 / +18 / +24` Base Shield & `+6% / +12% / +18% / +24%` Shield regen |
| **Retribution Mirror** (`as_reflect`) | Left Mid | Prism Plating | 4 | 1140 / 1740 / 2460 / 3300 | Reflects `12% / 18% / 26% / 35%` of Shield damage absorbed onto shadows (`135px` burst) |
| **Aegis Overload** (`as_overcharge`) | Left Cap | Retribution Mirror | 4 | 1650 / 2400 / 3450 / 4650 | When Shield breaks, blasts `220px` (`15 / 22 / 30 / 40` dmg) & grants `+0.55s` grace |
| **Harmonic Mend** (`as_mending`) | Right Mid | Prism Plating | 4 | 1140 / 1740 / 2460 / 3300 | `+1.0 / +1.8 / +2.6 / +3.6` HP/s while shielded & `15% / 25% / 35% / 45%` quicker Shield recovery |
| **Astral Fortitude** (`as_bastion`) | Right Cap | Harmonic Mend | 4 | 1650 / 2400 / 3450 / 4650 | `+18% / +32% / +46% / +65%` Max Shield & `+10% / +18% / +26% / +35%` All Ability DMG while >50% Shield |

---

### 11. Chrono Conduit (`echo_conduit`)
- **Tag:** `UTILITY · HASTE`
- **Unlock Effect:** All abilities trigger **10% faster**.
- **Ascension (`Harmonic Overclock`):**
  - **LV 5:** `+12%` global Haste & every 5th cast emits a slowing Chrono Ripple (`200px`).
  - **LV 10 (Supernova):** `+20%` global Haste & amplified slowing Chrono Ripple (`240px`) on every 5th cast.

#### Aspect Cards
| Aspect | Common (`1.0×`) | Uncommon (`1.6×`) | Rare (`2.25×`) | Epic (`3.0×`) | Effect |
| --- | --- | --- | --- | --- | --- |
| Global Haste (`hasteMul`) | `6% Faster` | `10% Faster` | `14% Faster` | `18% Faster` | All automatic abilities fire faster |
| Global Damage (`globalDmgMul`) | `+6%` | `+10%` | `+14%` | `+18%` | All Damage abilities deal more damage |

#### Talents *(1.15× base cost scaling)*
| Talent | Slot | Requires | Max LV | LUM Costs | Effect per Rank (LV 1 → 4) |
| --- | --- | --- | --- | --- | --- |
| **Chrono Alignment** (`ec_tempo`) | Root | — | 4 | 860 / 1380 / 2070 / 2930 | `+2.5% / +5.0% / +7.5% / +10.0%` trigger speed & `+4% / +8% / +12% / +16%` reach |
| **Cadence Overclock** (`ec_overclock`) | Left Mid | Chrono Alignment | 4 | 1310 / 2000 / 2830 / 3790 | `+3% / +6% / +9% / +12%` faster all ability triggers |
| **Mirror Resonance** (`ec_twinbeat`) | Left Cap | Cadence Overclock | 4 | 1900 / 2760 / 3970 / 5350 | Every `6th / 5th / 4th / 3rd` Bolt, Voltaic Arc, Seeker, or Spear echoes a `65%` dmg Mirror Copy |
| **Prismatic Amplify** (`ec_empower`) | Right Mid | Chrono Alignment | 4 | 1310 / 2000 / 2830 / 3790 | `+4% / +8% / +12% / +16%` global Ability Damage |
| **Chromatic Resonance** (`ec_singularity`) | Right Cap | Prismatic Amplify | 4 | 1900 / 2760 / 3970 / 5350 | `+3% / +5% / +7% / +9%` dmg per active Synergy/Ascension & `165px` Echo Wave (`7.5 / 11.0 / 14.5 / 18.0` dmg) every 4s |

---

## Ability Synergies (LV 3+ Pairs)

When **both** abilities in a pair reach **LV 3 or higher** in a run, the Synergy activates automatically:

| Synergy | Required Pair (Both LV 3+) | Effect |
| --- | --- | --- |
| **Storm Pollen** (`storm_pollen`) | Voltaic Arc + Starbloom Spores | Voltaic Arc detonates nearby armed Starblooms (`≤130px`) at `+35%` blast radius. |
| **Event Horizon** (`event_horizon`) | Astral Pulse + Gravity Harvest | Astral Pulse pulls nearby Light Motes & Stars directly toward Lumen. |
| **Halo Lance** (`halo_lance`) | Orbiting Blades + Celestial Spear | Celestial Spear fires a bonus `55%` dmg lance from your leading Blade. |
| **Comet Volley** (`comet_volley`) | Starlight Bolt + Seeker Needles | Every 2nd Starlight Bolt volley launches an extra homing Seeker Needle. |
| **Radiant Bastion** (`radiant_bastion`) | Starlight Shield + Orbiting Blades | While shielded, Orbiting Blades deal +20% dmg, spin `25%` faster & every 4th hit restores `+2` Shield. |
| **Tempest Echo** (`tempest_echo`) | Chrono Conduit + Voltaic Arc | Voltaic Arc gains `+25%` bounce reach & discharges a secondary `60%` Echo Chain. |

---

## Global Sanctuary Core Upgrades

In addition to per-ability Talent Trees, the Sanctuary offers 6 global passive upgrades:

| Upgrade | Max LV | Starting Cost | Effect per Rank |
| --- | --- | --- | --- |
| **Astral Foresight** (`astral_reroll`) | 20 | 1100 LUM (`×1.15`/rank) | `+1` Extra Reroll at Rank 1 & every 4 ranks (all runs start with `1` free Reroll) + `+2.5%` card rarity Luck/rank |
| **Void Banish** (`astral_banish`) | 3 | 900 / 1900 / 3400 LUM | Unlock `+1` Banish per rank (max 3) to permanently banish all cards for an ability from a run |
| **Radiant Core** (`luminous_force`) | 25 | 950 LUM (`×1.13`/rank) | `+1.5%` all automatic Damage per rank |
| **Tempo Flow** (`quickening`) | 25 | 950 LUM (`×1.13`/rank) | All abilities fire `1.5%` faster per rank |
| **Drift Current** (`tide_current`) | 20 | 900 LUM (`×1.14`/rank) | `+1%` glide speed & `+1.5%` Solar Dash recharge per rank |
| **Magnet Tide** (`starlight_harvest`) | 20 | 1000 LUM (`×1.14`/rank) | `+3%` Magnet reach & `+2%` EXP per rank |
