# Building & Resource Design – Analyse & Vorschläge

## Aktuelle Situation

### Ressourcen-Kette
```
Solar Panel → Energy ──────┬──→ Foundry (+ Scrap) → Steel
                           │
Core ──→ Energy + Scrap    ├──→ Fabricator (+ Scrap) → Electronics
                           │
Miner → Scrap              └──→ Lab (+ Electronics) → Data
                                                        ↓
                                                       ???
```

### Aktuelles Problem: **Data hat keinen Use-Case**
Das Lab produziert Data, aber nichts im Spiel kostet Data. Die Ressource ist aktuell komplett nutzlos.

---

## Aktuelle Gebäude – Bewertung

| Gebäude | Rolle | Bewertung | Problem |
|---|---|---|---|
| Core | Basis | ✅ OK | – |
| Solar Panel | Energy-Produktion | ✅ OK | Solide Early-Game Grundlage |
| Miner | Scrap-Produktion | ✅ OK | Braucht Ore Patch, gute Mechanik |
| Wall | Defensive Barriere | ⚠️ Langweilig | Kein Spezialeffekt, nur HP-Block |
| Turret | Basis-Verteidigung | ✅ OK | Gute Early-Mid Verteidigung |
| Foundry | Scrap → Steel | ✅ OK | Sinnvolle Veredelung |
| Fabricator | Scrap → Electronics | ✅ OK | Sinnvolle Veredelung |
| Lab | Electronics → Data | ❌ Nutzlos | Data wird nirgends verwendet |
| Heavy Turret | Endgame-Verteidigung | ⚠️ Einsam | Einziges Late-Game Gebäude |

---

## Vorschläge: Neue Gebäude

### Tier 1 – Early Game (kostet Scrap + Energy)

#### 🔧 Repair Bay
> Heilt benachbarte Gebäude langsam über Zeit. Essentiell für Langzeit-Survival.

| Stat | Wert |
|---|---|
| HP | 600 |
| Kosten | 80 Scrap, 30 Energy |
| Kosten-Increase | +30 Scrap, +10 Energy |
| Effekt | Heilt alle Gebäude im Radius 3 um 50 HP/Tick |
| Upgrade | +25 HP/Tick pro Level (+50%) |

**Warum:** Aktuell gibt es keine Möglichkeit, beschädigte Gebäude zu reparieren. Das ist ein fehlendes Kernfeature.

---

#### ❄️ Slow Field (EMP Emitter)
> Verlangsamt Gegner im Radius. Kein Schaden, rein taktisch.

| Stat | Wert |
|---|---|
| HP | 500 |
| Kosten | 100 Scrap, 40 Energy |
| Kosten-Increase | +40 Scrap, +15 Energy |
| Range | 5 |
| Effekt | Gegner im Radius -40% Speed |
| Upgrade | +10% Slow pro Level |

**Warum:** Es gibt keine Crowd-Control. Alle Türme machen nur Damage. Ein Slow-Feld eröffnet taktische Kombos (Slow + Turret Killzone).

---

### Tier 2 – Mid Game (kostet Steel + Energy/Scrap)

#### ⚡ Tesla Coil
> AoE-Turm – trifft mehrere Gegner gleichzeitig (Chain Lightning).

| Stat | Wert |
|---|---|
| HP | 1200 |
| Kosten | 120 Steel, 80 Scrap |
| Kosten-Increase | +60 Steel, +30 Scrap |
| Range | 5 |
| Damage | 40 (an bis zu 4 Targets) |
| Consumes | 15 Energy/Tick |
| Upgrade | +20 Damage pro Level, +1 Target pro Level |

**Warum:** Fehlender AoE-Turm. Der normale Turret ist Single-Target, Heavy Turret auch. Gegen Schwärme braucht man AoE.

---

#### 🛡️ Shield Generator
> Gibt benachbarten Gebäuden einen Schild-Layer der zuerst abgebaut wird.

| Stat | Wert |
|---|---|
| HP | 800 |
| Kosten | 100 Steel, 50 Energy |
| Kosten-Increase | +50 Steel, +25 Energy |
| Range | 4 |
| Effekt | +500 Shield HP für alle Gebäude im Radius |
| Consumes | 25 Energy/Tick |
| Upgrade | +250 Shield pro Level |

**Warum:** Synergiert mit Walls, macht Verteidigungslinien deutlich stärker.

---

#### 📡 Radar Station
> Erhöht die Reichweite benachbarter Turrets.

| Stat | Wert |
|---|---|
| HP | 600 |
| Kosten | 80 Steel, 40 Electronics |
| Kosten-Increase | +30 Steel, +20 Electronics |
| Range (Buff) | 5 |
| Effekt | Turrets im Radius +3 Range |
| Consumes | 10 Energy/Tick |
| Upgrade | +1 Range Buff pro Level |

**Warum:** Gibt einen Grund, Turret-Platzierung strategisch neben Support-Gebäuden zu planen.

---

### Tier 3 – Late Game (kostet Steel + Electronics + Data)

#### 🧠 Data Vault (Research Center)
> **Löst das Data-Problem!** Verbraucht Data und gibt permanente globale Buffs.

| Stat | Wert |
|---|---|
| HP | 1500 |
| Kosten | 200 Steel, 150 Electronics, **100 Data** |
| Kosten-Increase | +100 Steel, +75 Electronics, +50 Data |
| Effekt | Alle Turrets +15% Damage global |
| Consumes | 30 Energy, 10 Data/Tick |
| Upgrade | +10% Damage-Buff pro Level |

**Warum:** Data bekommt endlich einen Nutzen. Das Research Center ist das ultimative Late-Game Gebäude.

---

#### 🔥 Plasma Cannon
> Ultimativer Turm. Extrem teuer, extrem stark. AoE + hoher Damage.

| Stat | Wert |
|---|---|
| HP | 4000 |
| Kosten | 500 Steel, 400 Electronics, **200 Data** |
| Kosten-Increase | +300 Steel, +200 Electronics, +100 Data |
| Range | 10 |
| Damage | 300 (Splash in 2 Tiles Radius) |
| Consumes | 60 Energy/Tick |
| Upgrade | +150 Damage pro Level |

**Warum:** Klarer Endgame-Turm der das Erreichen der Data-Stufe belohnt.

---

#### ♻️ Recycler
> Konvertiert Scrap effizienter zu Steel UND Electronics gleichzeitig.

| Stat | Wert |
|---|---|
| HP | 1200 |
| Kosten | 150 Steel, 100 Electronics, **50 Data** |
| Kosten-Increase | +75 Steel, +50 Electronics, +25 Data |
| Consumes | 40 Energy, 15 Scrap |
| Income | 8 Steel, 6 Electronics |
| Upgrade | +50% Produktion pro Level |

**Warum:** Ersetzt im Late-Game die Kombination aus Foundry + Fabricator und ist effizienter. Belohnt den Spieler für den Fortschritt.

---

## Upgrade-Kosten Übersicht

Alle Gebäude: **Max Level 5**, Upgrade-Kosten = `Basis-Kosten × aktuelles Level`

| Upgrade | Faktor | Beispiel (Solar, Base: 40 Sc) |
|---|---|---|
| Lv 1 → 2 | ×1 | 40 Sc |
| Lv 2 → 3 | ×2 | 80 Sc |
| Lv 3 → 4 | ×3 | 120 Sc |
| Lv 4 → 5 | ×4 | 160 Sc |
| **Gesamt** | **×10** | **400 Sc** |

### Stat-Scaling pro Level: +50%

| Level | Income/Damage Mult | HP Mult |
|---|---|---|
| 1 | ×1.0 | ×1.0 |
| 2 | ×1.5 | ×1.5 |
| 3 | ×2.0 | ×2.0 |
| 4 | ×2.5 | ×2.5 |
| 5 | ×3.0 | ×3.0 |

> **Bewertung:** Das aktuelle Upgrade-System ist **solide**. ×3 Income bei ×10 Gesamtkosten ist ein fairer Trade-off. Lohnt sich für teure Gebäude mehr als für billige.

---

## Empfohlene Resourcen-Erweiterung

### Data als Baukosten einführen
Data wird aktuell nur produziert, nie verbraucht. **Mindestens 2–3 Gebäude sollten Data als Baukosten haben** (Data Vault, Plasma Cannon, Recycler).

### Optionale neue Ressource: **Nanites**
Falls das Spiel noch komplexer werden soll, könnte eine 6. Ressource sinnvoll sein:
- Produziert vom Recycler
- Gebraucht für Ultra-Late-Game Upgrades (Lv 6–10?)
- **Aber:** Nur einführen wenn nötig. 5 Ressourcen + Data-Fix reichen erstmal.

---

## Zusammenfassung – Priorität

| Prio | Was | Warum |
|---|---|---|
| 🔴 P1 | **Repair Bay** | Fehlendes Core-Feature |
| 🔴 P1 | **Data als Baukosten** | Data ist aktuell nutzlos |
| 🟡 P2 | **Slow Field** | Fehlende Crowd-Control |
| 🟡 P2 | **Tesla Coil** | Fehlender AoE-Turm |
| 🟡 P2 | **Data Vault** | Gibt Data einen Sinn |
| 🟢 P3 | **Shield Generator** | Nice-to-have Defensive |
| 🟢 P3 | **Radar Station** | Taktische Tiefe |
| 🟢 P3 | **Plasma Cannon** | Endgame-Belohnung |
| 🟢 P3 | **Recycler** | Quality-of-Life |
| ⚪ P4 | **Wall rework** | Slow-on-Hit oder Thorns-Damage |

---

## Vorgeschlagene Gebäude-Progression

```
EARLY GAME (Scrap + Energy)
├── Solar Panel    → Energy
├── Miner          → Scrap  
├── Wall           → Defense
├── Turret         → Damage
├── Repair Bay     → Healing   ← NEU
└── Slow Field     → CC        ← NEU

MID GAME (Steel + Electronics)
├── Foundry        → Steel
├── Fabricator     → Electronics
├── Heavy Turret   → Big Damage
├── Tesla Coil     → AoE       ← NEU
├── Shield Gen     → Protection ← NEU
└── Radar Station  → Buff      ← NEU

LATE GAME (Data + Advanced)
├── Lab            → Data
├── Data Vault     → Global Buff ← NEU
├── Plasma Cannon  → Ultimate    ← NEU
└── Recycler       → Efficiency  ← NEU
```
