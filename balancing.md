# GRIDCORE — Balancing Guide

Vollständige Übersicht über alle Gebäude, Module, Forschung, Prestige, Schwierigkeitsgrade, Wellenmodus und die besten Strategien.

---

## Inhaltsverzeichnis

1. [Ressourcen & Wirtschaft](#1-ressourcen--wirtschaft)
2. [Alle Gebäude](#2-alle-gebäude)
3. [Alle Module](#3-alle-module)
4. [Tech-Tree](#4-tech-tree)
5. [Forschung (Research 2.0)](#5-forschung-research-20)
6. [Prestige-System](#6-prestige-system)
7. [Schwierigkeitsgrade](#7-schwierigkeitsgrade)
8. [Wellenmodus](#8-wellenmodus)
9. [Gegner-Mechaniken](#9-gegner-mechaniken)
10. [Kill-Belohnung](#10-kill-belohnung)
11. [Level-Skalierung](#11-level-skalierung)
12. [Optimale Kombinationen](#12-optimale-kombinationen)
13. [Build-Order Guides](#13-build-order-guides)
14. [DPS-Analyse](#14-dps-analyse)
15. [Ökonomie-Analyse](#15-ökonomie-analyse)
16. [Balancing-Beobachtungen](#16-balancing-beobachtungen)

---

## 1. Ressourcen & Wirtschaft

| Ressource    | Funktion                                    | Hauptquellen                                      |
|-------------|---------------------------------------------|---------------------------------------------------|
| **Energie**  | Benötigt von fast allen Gebäuden             | Solarfeld (15), Kern (1), Fusionsreaktor (120)    |
| **Schrott**  | Grundwährung für Bauen + Kill-Belohnungen    | Schrottbohrer (25), Kern (1), Kills               |
| **Stahl**    | Fortgeschrittene Gebäude                     | Gießerei (12), Stahlschmelze (8), Recycler (10)   |
| **Elektronik** | High-Tier Gebäude + Module                | E-Fabrik (8), Kristallbohrer (5), Recycler (8)    |
| **Daten**    | Endgame-Ressource (Forschung, T4 Gebäude)   | Forschungslabor (20)                              |

**Produktionsketten:**
```
Ore Patch → Schrottbohrer → Schrott
                               ↓
Ore Patch → Stahlschmelze → Stahl ←── Gießerei (Schrott+Energie → Stahl)
                               ↓
Ore Patch → Kristallbohrer → Elektronik ←── E-Fabrik (Energie → Elektronik)
                                                ↓
                                        Recycler (Schrott+Energie → Stahl+Elektronik)
                                                ↓
                                        Forschungslabor (Energie+Elektronik → Daten)
```

---

## 2. Alle Gebäude

### 2.1 Kern (Core)

| Eigenschaft | Wert |
|---|---|
| HP | 5.000 |
| Einkommen | 1 Energie, 1 Schrott |
| Kategorie | Core |
| Kosten | — (Startgebäude) |

> Einziges Gebäude dessen Zerstörung das Spiel beendet. Produziert minimale Ressourcen.

---

### 2.2 Infrastruktur

#### Solarfeld
| Stat | Wert |
|---|---|
| HP | 400 |
| Einkommen | 15 Energie |
| Kosten | 40 Schrott (+10/Stk) |
| Starter | ✅ |

> Hauptquelle für Energie. Günstig, aber niedrige HP — Schutz durch Mauern/Schilde nötig.

#### Schrottbohrer
| Stat | Wert |
|---|---|
| HP | 500 |
| Einkommen | 25 Schrott |
| Kosten | 40 Schrott + 10 Energie (+15/+5) |
| Benötigt | Ore Patch |
| Starter | ✅ |

> Basis-Schrottproduktion. Auf Ore-Patches platzieren.

#### Schwere Mauer
| Stat | Wert |
|---|---|
| HP | 2.500 |
| Kosten | 15 Schrott (+5/Stk) |
| Starter | ✅ |

> Extrem günstig, hohe HP. Hauptverteidigungslinie um den Kern.

#### Reparaturbucht
| Stat | Wert |
|---|---|
| HP | 600 |
| Reichweite | 3 |
| Heilung | 50 HP/Tick |
| Verbrauch | 10 Energie |
| Kosten | 80 Schrott + 30 Energie (+30/+10) |
| Tech | T1, 5 Kills |

> Heilt alle Gebäude im Radius. Skaliert mit Level-Mult und Research `repairMult`.

#### Stahlschmelze
| Stat | Wert |
|---|---|
| HP | 600 |
| Einkommen | 8 Stahl |
| Verbrauch | 12 Energie |
| Kosten | 60 Schrott + 20 Energie (+20/+10) |
| Benötigt | Ore Patch |
| Tech | T1, 5 Kills |

> Direkter Stahl-Abbau aus Erz. Günstiger als Gießerei, aber belegt Ore-Patch.

#### Kristallbohrer
| Stat | Wert |
|---|---|
| HP | 600 |
| Einkommen | 5 Elektronik |
| Verbrauch | 20 Energie |
| Kosten | 80 Schrott + 40 Stahl (+30/+15) |
| Benötigt | Ore Patch |
| Tech | T2, 15 Kills |

> Direkter Elektronik-Abbau aus Erz. Belegt einen Ore-Patch, spart aber den Umweg über E-Fabrik.

#### Fusionsreaktor
| Stat | Wert |
|---|---|
| HP | 1.200 |
| Einkommen | 120 Energie |
| Verbrauch | 8 Stahl + 3 Daten |
| Kosten | 200 Stahl + 120 Elektronik + 80 Daten (+100/+60/+40) |
| Tech | T3, 30 Kills |

> Lategame-Energiequelle. Kein Ore-Patch nötig, aber teurer Unterhalt (Stahl+Daten). 1 Fusionsreaktor = ~8 Solarfelder.

---

### 2.3 Verteidigung

#### Wächtergeschütz
| Stat | Wert |
|---|---|
| HP | 800 |
| Schaden | 30 |
| Reichweite | 6 |
| FireChance | 0.9 (10% pro Tick) |
| Projektilgeschwindigkeit | 0.4 |
| Kosten | 150 Schrott + 50 Energie (+100/+15) |
| Starter | ✅ |

> Grundgeschütz. Günstig, solider DPS, gut für Early Game.

#### Sturmgeschütz (Heavy Turret)
| Stat | Wert |
|---|---|
| HP | 3.000 |
| Schaden | 150 |
| Reichweite | 12 |
| FireChance | 0.9 |
| Kosten | 300 Stahl + 200 Elektronik (+200/+100) |
| Tech | T2, 15 Kills |

> 5× Schaden des Wächtergeschütz, doppelte Reichweite. Sehr effektiv als Backbone.

#### Teslaspule
| Stat | Wert |
|---|---|
| HP | 1.200 |
| Schaden | 40 |
| Reichweite | 5 |
| Ziele | 3 + 1/Level |
| Verbrauch | 15 Energie |
| Kosten | 120 Stahl + 80 Schrott (+60/+30) |
| Tech | T2, 15 Kills |

> Multi-Target AoE. Effektiv gegen Schwärme. Bei Level 5: 8 Ziele gleichzeitig.

#### Laserturm
| Stat | Wert |
|---|---|
| HP | 1.500 |
| Schaden | 50 (max 150 bei 3× Fokus) |
| Reichweite | 8 |
| Fokus-Rate | +0.02 pro Tick |
| Max Fokus | 3× |
| Verbrauch | 30 Energie |
| Kosten | 200 Stahl + 150 Elektronik (+100/+75) |
| Tech | T3, 30 Kills |

> Kontinuierlicher Strahl, Schaden steigt mit Fokuszeit. Ideal gegen starke Einzelziele.

#### Plasmakanone
| Stat | Wert |
|---|---|
| HP | 4.000 |
| Schaden | 300 |
| Reichweite | 10 |
| Splash | 2 Tiles |
| FireChance | 0.95 (5% pro Tick) |
| Verbrauch | 45 Energie |
| Kosten | 500 Stahl + 400 Elektronik + 200 Daten (+300/+200/+100) |
| Tech | T4, 50 Kills |

> Massiver Flächenschaden. Langsam aber verheerend. Effektive FireChance = fireChance + 0.05.

#### Minenfeld
| Stat | Wert |
|---|---|
| HP | 200 |
| Schaden | 400 |
| Explosionsradius | 2.5 Tiles |
| Kosten | 60 Schrott + 30 Stahl (+20/+10) |
| Tech | T1, 5 Kills |

> Einmalverwendung. Explodiert bei Kontakt. Gut für Chokepoints. Wird nach Detonation entfernt.

#### Drohnenhangar
| Stat | Wert |
|---|---|
| HP | 2.000 |
| Schaden | 45/Drohne |
| Reichweite | 10 |
| Drohnen | 1 + 1/Level |
| Drohnen-Speed | 0.06 |
| Drohnen-FireChance | 0.88 (12% pro Tick) |
| Verbrauch | 35 Energie |
| Kosten | 250 Stahl + 200 Elektronik + 50 Daten (+125/+100/+25) |
| Tech | T4, 50 Kills |

> Autonome Drohnen die Gegner verfolgen. Bei Level 5: 6 Drohnen. DPS skaliert stark mit Level.

---

### 2.4 Unterstützung

#### EMP-Feld (Slow Field)
| Stat | Wert |
|---|---|
| HP | 500 |
| Reichweite | 5 |
| Verlangsamung | 40% + 10%/Level |
| Verbrauch | 15 Energie |
| Kosten | 100 Schrott + 40 Energie (+40/+15) |
| Tech | T1, 5 Kills |

> Verlangsamt alle Gegner im Radius. Level 5 = 80% Slow (Gegner bewegen sich mit 20% Speed).

#### Schildgenerator
| Stat | Wert |
|---|---|
| HP | 800 |
| Reichweite | 4 |
| Schild-Cap | 500/Gebäude |
| Verbrauch | 25 Energie |
| Kosten | 100 Stahl + 50 Energie (+50/+25) |
| Tech | T2, 15 Kills |

> Gibt allen Gebäuden im Radius ein Schild. Skaliert mit Level-Mult und Research `shieldMult`.

#### Radarstation
| Stat | Wert |
|---|---|
| HP | 600 |
| Reichweite | 5 |
| Range-Buff | +3 + 1/Level |
| Verbrauch | 10 Energie |
| Kosten | 80 Stahl + 40 Elektronik (+30/+20) |
| Tech | T3, 30 Kills |

> Erhöht Reichweite aller Geschütze im Radius. Stackt nicht (bester Wert zählt).

#### Energierelais
| Stat | Wert |
|---|---|
| HP | 700 |
| Reichweite | 5 |
| Feuerrate-Buff | −0.04 fireChance + 0.01/Level |
| Verbrauch | 30 Energie |
| Kosten | 150 Stahl + 100 Elektronik + 50 Daten (+75/+50/+25) |
| Tech | T4, 50 Kills |

> Erhöht effektive Feuerrate aller Geschütze im Radius. Level 5 = −0.08 fireChance → ca. 80% mehr Schüsse. Stackt nicht (bester Wert zählt). Wirkt auch auf Drohnenhangar.

---

### 2.5 Verarbeitung

#### Gießerei (Foundry)
| Stat | Wert |
|---|---|
| HP | 1.000 |
| Einkommen | 12 Stahl |
| Verbrauch | 15 Energie + 5 Schrott |
| Kosten | 120 Schrott + 40 Energie (+40/+20) |
| Tech | T1, 5 Kills |

> Schrott+Energie → Stahl. Braucht kein Ore-Patch, aber verbraucht Schrott.

#### E-Fabrik (Fabricator)
| Stat | Wert |
|---|---|
| HP | 1.000 |
| Einkommen | 8 Elektronik |
| Verbrauch | 20 Energie |
| Kosten | 200 Schrott + 100 Energie (+70/+50) |
| Tech | T2, 15 Kills |

> Energie → Elektronik. Kein Ore nötig, rein energiebasiert.

#### Recycler
| Stat | Wert |
|---|---|
| HP | 1.200 |
| Einkommen | 10 Stahl + 8 Elektronik |
| Verbrauch | 40 Energie + 15 Schrott |
| Kosten | 150 Stahl + 100 Elektronik + 50 Daten (+75/+50/+25) |
| Tech | T3, 30 Kills |

> Dual-Output: Stahl + Elektronik. Höchster Verbrauch aber extrem effizient für Late Game.

---

### 2.6 Forschung

#### Forschungslabor
| Stat | Wert |
|---|---|
| HP | 800 |
| Einkommen | 20 Daten |
| Verbrauch | 45 Energie + 2 Elektronik |
| Kosten | 80 Stahl + 60 Elektronik (+40/+30) |
| Tech | T3, 30 Kills |

> Einzige Datenquelle. Hat eigenen `onResourceGained` Hook: Daten-Output skaliert mit `researchBuffs.dataOutputMult`.

#### Datentresor
| Stat | Wert |
|---|---|
| HP | 1.500 |
| Schadensbuff | +15%/Level global |
| Verbrauch | 25 Energie + 10 Daten |
| Kosten | 200 Stahl + 150 Elektronik + 100 Daten (+100/+75/+50) |
| Tech | T4, 50 Kills |

> Globaler Schadensbuff für ALLE Geschütze. Stackt additiv: 3 Datentresore = +45% (×LevelMult).

---

## 3. Alle Module

Module sind einmalige Upgrades die auf ein Gebäude installiert werden (1 pro Gebäude).

### 3.1 Kampf-Module

| Modul | Effekt | Kosten | Unlock | Kompatibel mit |
|---|---|---|---|---|
| **Schnellfeuer** | −0.03 fireChance (~30% mehr Schüsse) | 60 St + 40 El | Sturmgeschütz | Alle Geschütze |
| **Schadensverstärker** | +40% Schaden | 80 St + 60 El | Sturmgeschütz | Alle Geschütze |
| **Langstrecke** | +3 Reichweite | 50 St + 30 El | Radarstation | Geschütze + Support |
| **Kettenblitz** | Hit → 2 Extra-Ziele (30% Dmg, 3R) | 100 St + 80 El | Teslaspule | Alle Geschütze |
| **Panzerbrechend** | +50% Schaden (ignoriert Schild) | 70 St + 50 El | Laserturm | Alle Geschütze |
| **Verlangsamung** | Getroffene: −30% Speed, 3s | 60 El + 40 Da | EMP-Feld | Alle Geschütze |
| **Kritischer Treffer** | 15% Chance: 3× Schaden | 80 St + 60 El + 30 Da | Plasmakanone | Alle Geschütze |

### 3.2 Wirtschafts-Module

| Modul | Effekt | Kosten | Unlock | Kompatibel mit |
|---|---|---|---|---|
| **Effizienz** | −50% Verbrauch | 50 El + 30 Da | E-Fabrik | Produzenten + Shield + Vault |
| **Überladung** | +60% Einkommen | 80 El + 50 Da | Recycler | Alle Produzenten |
| **Doppelertrag** | 20% Chance: 2× Output | 100 El + 60 Da | Labor | Alle Produzenten |

### 3.3 Universal-Module

| Modul | Effekt | Kosten | Unlock | Kompatibel mit |
|---|---|---|---|---|
| **Regeneration** | Selbstheilung 2% maxHP/Tick | 40 St + 30 El | Reparaturbucht | Mauern, Core, Produzenten, Support |

---

## 4. Tech-Tree

Gebäude werden durch Kill Points freigeschaltet. Kill Points = 1 pro getötetem Gegner.

| Tier | Kill-Kosten | Gebäude |
|---|---|---|
| **T1** | 5 | Minenfeld, Reparaturbucht, EMP-Feld, Gießerei, Stahlschmelze |
| **T2** | 15 | Sturmgeschütz, Teslaspule, Schildgenerator, E-Fabrik, Kristallbohrer |
| **T3** | 30 | Laserturm, Radarstation, Recycler, Forschungslabor, Fusionsreaktor |
| **T4** | 50 | Plasmakanone, Drohnenhangar, Datentresor, Energierelais |

**Starter (kein Unlock nötig):** Kern, Solarfeld, Schrottbohrer, Schwere Mauer, Wächtergeschütz

**Optimale Unlock-Reihenfolge:**
1. T1: EMP-Feld + Gießerei (Defense + Wirtschaft)
2. T1: Reparaturbucht + Stahlschmelze (Sustain + Stahl)
3. T2: Sturmgeschütz + E-Fabrik (DPS-Sprung + Elektronik)
4. T2: Teslaspule + Schildgenerator (AoE + Schutz)
5. T3: Forschungslabor + Radarstation (Daten + Range)
6. T3: Recycler + Laserturm (Effizienz + Single-Target DPS)
7. T4: Datentresor + Plasmakanone (Global Buff + AoE)
8. T4: Energierelais + Drohnenhangar (Fire Rate + Autonome DPS)

---

## 5. Forschung (Research 2.0)

Forschung kostet Daten und gibt permanente Buffs pro Runde. Max 3 Level pro Node.

### Tier 1 (keine Voraussetzung)

| Node | Effekt/Stufe | Kosten (1→2→3) | Beschreibung |
|---|---|---|---|
| **Panzerung** | +20% HP (alle Gebäude) | 30 → 60 → 120 | 3 Level = +60% HP |
| **Schnellbau** | −8% Baukosten | 25 → 50 → 100 | 3 Level = −24% Kosten |
| **Übertaktung** | +12% Feuerrate | 35 → 70 → 140 | 3 Level = −36% fireChance |

### Tier 2 (benötigt T1)

| Node | Effekt/Stufe | Kosten (1→2→3) | Benötigt |
|---|---|---|---|
| **Effizienzprotokoll** | −15% Energieverbrauch | 60 → 120 → 240 | Schnellbau |
| **Ertragsforschung** | +20% Produzenten-Output | 70 → 140 → 280 | Schnellbau |
| **Schildverstärkung** | +25% Schild-Stärke | 55 → 110 → 220 | Panzerung |

### Tier 3 (benötigt T2)

| Node | Effekt/Stufe | Kosten (1→2→3) | Benötigt |
|---|---|---|---|
| **Reichweitensensor** | +1 Reichweite (alle Türme) | 100 → 250 → 625 | Übertaktung |
| **Notfallreparatur** | +40% Heilrate | 90 → 225 → 562 | Schildverstärkung |
| **Datenkompression** | +30% Daten-Output | 80 → 160 → 320 | Ertragsforschung |

### Tier 4 (benötigt T3)

| Node | Effekt/Stufe | Kosten (1→2→3) | Benötigt |
|---|---|---|---|
| **Modulsynergie** | +20% Modul-Effekte | 150 → 450 → 1350 | Reichweitensensor |

**Gesamte Datenkosten für volle Forschung:** ~5.162 Daten

**Empfohlene Forschungsreihenfolge:**
1. Schnellbau 1 → Ertragsforschung 1 (mehr Output = schnellere Progression)
2. Übertaktung 1-2 (Feuerrate-Boost)
3. Panzerung 1 (Überlebensfähigkeit)
4. Effizienzprotokoll 1-2 (spart Energie)
5. Datenkompression 1-3 (beschleunigt weitere Forschung)
6. Restliche Nodes nach Bedarf

---

## 6. Prestige-System

Nach Game Over: Prestige-Punkte = `floor(kills × 0.5 + gameTimeSec / 30)`.

| Upgrade | Effekt/Stufe | Kosten (Stufe n) | Max | Total für Max |
|---|---|---|---|---|
| **Waffenmeister** | +10% Turm-Schaden | 10 × (n+1) | 10 | 550 Punkte |
| **Effizienz** | +10% Einkommen | 10 × (n+1) | 10 | 550 Punkte |
| **Schrottvorrat** | +20 Start-Schrott | 5 × (n+1) | 10 | 275 Punkte |
| **Energievorrat** | +20 Start-Energie | 5 × (n+1) | 10 | 275 Punkte |
| **Ingenieur** | −5% Baukosten | 15 × (n+1) | 10 | 825 Punkte |

**Total für alle Max:** 2.475 Prestige-Punkte

**Priorität:**
1. Effizienz (Einkommen = snowball)
2. Waffenmeister (überleben = mehr Kills = mehr Punkte)
3. Schrottvorrat + Energievorrat (besserer Start)
4. Ingenieur (diminishing returns mit Research-Schnellbau)

---

## 7. Schwierigkeitsgrade

| Parameter | Leicht | Mittel | Schwer |
|---|---|---|---|
| Gegner-HP Basis | 100 | 150 | 200 |
| HP/Sekunde | +3 | +5 | +8 |
| Gegner-Speed Basis | 0.015 | 0.02 | 0.025 |
| Speed/Sekunde | +0.00006 | +0.0001 | +0.00015 |
| Spawn-Basis (ms) | 2.500 | 2.000 | 1.500 |
| Spawn-Reduktion/s | 10 | 12 | 15 |
| Min. Spawn-Delay | 600 | 400 | 250 |
| Gebäudeschaden | 60 | 100 | 150 |

**Gegner-HP nach 5 Minuten (Endlos):**

| Schwierigkeit | HP bei t=300s |
|---|---|
| Leicht | 100 + 300×3 = **1.000** |
| Mittel | 150 + 300×5 = **1.650** |
| Schwer | 200 + 300×8 = **2.600** |

---

## 8. Wellenmodus

| Parameter | Wert |
|---|---|
| Gegner pro Welle | 5 + Welle × 3 |
| Spawn-Delay | max(300ms, 1200 − Welle × 50) |
| HP-Skalierung | baseHp × (1 + (Welle−1) × 0.4) |
| Speed-Skalierung | baseSpeed × (1 + (Welle−1) × 0.08) |
| Erste Bauphase | 20 Ticks |
| Zwischen-Wellen | 15 Ticks |

**Gegner-HP nach Welle (Mittel):**

| Welle | Anzahl | HP/Gegner | Gesamt-HP |
|---|---|---|---|
| 1 | 8 | 150 | 1.200 |
| 5 | 20 | 390 | 7.800 |
| 10 | 35 | 690 | 24.150 |
| 15 | 50 | 990 | 49.500 |
| 20 | 65 | 1.290 | 83.850 |

---

## 9. Gegner-Mechaniken

- Gegner spawnen zufällig an einer der 4 Kanten
- Bewegen sich direkt zum Kern
- Beim Erreichen eines Gebäudes: verursachen `enemyDamage` Schaden alle 1s
- **Schilde absorbieren Schaden zuerst** (vor HP)
- **Verlangsamung:** EMP-Feld (bis 80% Slow) + Slow-Hit Modul (30% Slow, 3s)
  - Beides stackt multiplikativ: 80% Feld × 30% Hit = 86% Slow total

---

## 10. Kill-Belohnung

```
Schrott pro Kill = floor(30 + gameTime × 0.1)
```

| Spielzeit | Schrott/Kill |
|---|---|
| 0s | 30 |
| 60s | 36 |
| 300s | 60 |
| 600s | 90 |

---

## 11. Level-Skalierung

**Level-Multiplikator:** `1 + (level − 1) × 0.5`

| Level | Mult | Schaden | Einkommen | HP |
|---|---|---|---|---|
| 1 | 1.0× | 100% | 100% | 100% |
| 2 | 1.5× | 150% | 150% | 150% |
| 3 | 2.0× | 200% | 200% | 200% |
| 4 | 2.5× | 250% | 250% | 250% |
| 5 | 3.0× | 300% | 300% | 300% |

**Upgrade-Kosten:** Basis-Kosten × Level (Level 2 = 1× Basis, Level 3 = 2× Basis, etc.)

**Erstattung beim Abreißen:** 50% der Basis-Kosten × Level

---

## 12. Optimale Kombinationen

### 12.1 Beste Geschütz-Modul-Paare

| Geschütz | Bestes Modul | Warum |
|---|---|---|
| **Wächtergeschütz** | Schnellfeuer | Günstiges Geschütz → maximale Schuss-Frequenz |
| **Sturmgeschütz** | Schadensverstärker | Hoher Basis-Schaden × 1.4 = 210 Dmg/Hit |
| **Sturmgeschütz** | Kritischer Treffer | 150 × 3 = 450 Dmg Crits, brutal mit hohem Basis |
| **Teslaspule** | Kettenblitz | Multi-Target × Chain = bis zu 11 Ziele mit Splash |
| **Teslaspule** | Verlangsamung | Verlangsamt ALLE getroffenen Gegner gleichzeitig |
| **Laserturm** | Schadensverstärker | 50 × 3.0 Fokus × 1.4 = 210 DPS sustained |
| **Laserturm** | Panzerbrechend | 50 × 3.0 × 1.5 = 225 DPS, bester Single-Target |
| **Plasmakanone** | Kritischer Treffer | 300 × 3 = 900 AoE-Crit, devastierend |
| **Drohnenhangar** | Schnellfeuer | Mehr Drohnen-Schüsse = konsistenter DPS |

### 12.2 Beste Support-Kombinationen

| Kombination | Effekt |
|---|---|
| **Radar + Energierelais** | Reichweite + Feuerrate = maximaler DPS-Buff |
| **EMP-Feld + Langstrecke** | Riesiger Slow-Bereich (Radius 8) |
| **Schildgen + Langstrecke** | Schilde über größeren Bereich verteilen |
| **Reparaturbucht + Langstrecke** | Heilung über größeren Bereich |
| **Datentresor + Effizienz** | −50% Verbrauch bei gleichem Damage-Buff |

### 12.3 Beste Wirtschafts-Setups

| Produzent | Modul | Output | Input |
|---|---|---|---|
| **Solarfeld + Überladung** | +60% | 24 Energie | 0 |
| **Solarfeld + Doppelertrag** | Ø+20% | 18 Energie (avg) | 0 |
| **Schrottbohrer + Überladung** | +60% | 40 Schrott | 0 (nur Energie) |
| **Recycler + Effizienz** | −50% Input | 10 St + 8 El | 20 En + 7.5 Schrott |
| **Recycler + Überladung** | +60% Output | 16 St + 12.8 El | 40 En + 15 Schrott |
| **Lab + Überladung** | +60% | 32 Daten | 45 En + 2 El |
| **Lab + Effizienz** | −50% Input | 20 Daten | 22.5 En + 1 El |
| **Fusionsreaktor + Überladung** | +60% | 192 Energie | 8 St + 3 Da |
| **Fusionsreaktor + Effizienz** | −50% Input | 120 Energie | 4 St + 1.5 Da |

---

## 13. Build-Order Guides

### 13.1 Early Game (0-30 Kills)

```
1. Kern platzieren (zentral oder leicht versetzt)
2. 3-4 Solarfelder um den Kern
3. 2 Schrottbohrer auf Ore-Patches
4. Mauern in Angriffsrichtung
5. 2 Wächtergeschütze hinter Mauern
6. Unlock: EMP-Feld (5 Kills) → platzieren vor Mauern
7. Unlock: Gießerei (5 Kills) → Stahlproduktion starten
8. Weitere Geschütze + Solarfelder
```

### 13.2 Mid Game (30-100 Kills)

```
1. Sturmgeschütze ersetzen/ergänzen Wächtergeschütze
2. E-Fabrik für Elektronik
3. Schildgenerator hinter Mauern
4. Teslaspulen für Schwarm-Control
5. Forschungslabor + erste Forschungen
6. Radarstation für Range-Buff
7. Reparaturbuchten für Sustain
```

### 13.3 Late Game (100+ Kills)

```
1. Datentresor(e) für globalen Damage-Buff
2. Plasmakanone(n) mit Krit-Modul
3. Energierelais für Feuerrate-Buff
4. Fusionsreaktor(en) für Energiebedarf
5. Drohnenhangar(s) leveln → viele Drohnen
6. Forschung voll ausbauen
7. Alle Geschütze leveln (Level 3-5)
```

---

## 14. DPS-Analyse

Effektiver DPS = `Schaden × Level-Mult × DataVaultBuff × PrestigeDamageMult × FireRate`

FireRate = `1 − fireChance` pro Tick (1 Tick/Sekunde).

### Basis-DPS pro Geschütz (Level 1, keine Buffs)

| Geschütz | Dmg | FireRate | DPS | Kosten | DPS/Kosten |
|---|---|---|---|---|---|
| Wächtergeschütz | 30 | 10% | **3.0** | ~200 | 0.015 |
| Sturmgeschütz | 150 | 10% | **15.0** | ~500 | 0.030 |
| Teslaspule (×3) | 40×3 | 10% | **12.0** | ~200 | 0.060 |
| Laserturm (avg) | 100 | 10% | **10.0** | ~350 | 0.029 |
| Plasmakanone | 300 | 5% | **15.0** | ~1100 | 0.014 |
| Drohne (×2) | 45×2 | 12% | **10.8** | ~500 | 0.022 |

> **Bester DPS/Kosten:** Teslaspule (Multi-Target macht den Unterschied)
> **Bester Single-Target:** Laserturm (bei vollem Fokus 3× = 15 DPS sustained)
> **Bester AoE:** Plasmakanone (300 Dmg × Splash auf Gruppen)

### DPS mit bestmöglichen Buffs (Level 5, 2× DataVault, Radar+Relay, Krit)

| Geschütz | Basis-Dmg (L5) | ×DataVault | ×Prestige(10) | Effektiver DPS |
|---|---|---|---|---|
| Sturmgeschütz+Krit | 450 | ×1.3 | ×2.0 | **1170** × 18% fire × 1.45 avg Krit = **~305 DPS** |
| Plasmakanone+Krit | 900 | ×1.3 | ×2.0 | **2340** × 9% fire × 1.45 = **~305 DPS** (AoE!) |
| Laserturm+Piercing | 150×3fok | ×1.3 | ×2.0 | **1170** × 1.5 = **~175 sustained DPS** |

---

## 15. Ökonomie-Analyse

### Energiebilanz

| Gebäude | Energieverbrauch | Anmerkung |
|---|---|---|
| Teslaspule | −15 | |
| Laserturm | −30 | |
| Plasmakanone | −45 | |
| Drohnenhangar | −35 | |
| Schildgenerator | −25 | |
| EMP-Feld | −15 | |
| Radarstation | −10 | |
| Energierelais | −30 | |
| Gießerei | −15 | |
| E-Fabrik | −20 | |
| Lab | −45 | |
| Recycler | −40 | |
| Datentresor | −25 | |
| Reparaturbucht | −10 | |
| Stahlschmelze | −12 | |
| Kristallbohrer | −20 | |
| **Solarfeld** | **+15** | Hauptquelle |
| **Fusionsreaktor** | **+120** | (−8 St, −3 Da) |
| **Kern** | **+1** | Minimal |

**Faustregel:** 1 Fusionsreaktor ersetzt ~8 Solarfelder. Lohnt sich ab Mid-Late Game wenn Stahl+Daten verfügbar.

### Break-Even-Analyse Fusionsreaktor

- Kosten: 200 St + 120 El + 80 Da ≈ viel
- Unterhalt: 8 Stahl + 3 Daten pro Tick
- Output: 120 Energie pro Tick
- Spart: ~8 Solarfeld-Slots (8 × 40 = 320 Schrott)
- **Lohnt sich wenn:** Platz knapp ist UND Stahl/Daten-Überschuss vorhanden

---

## 16. Balancing-Beobachtungen

### Potenzielle Issues

1. **EMP-Feld Level 5 (80% Slow)** ist extrem stark — Gegner bewegen sich mit 20% Speed. Kombiniert mit Slow-Hit Modul (weitere 30%) sind Gegner praktisch eingefroren (14% Speed). Möglicherweise Slow-Cap nötig.

2. **Datentresor stackt linear** — 3 Datentresore Level 5 = +135% globaler Schaden. Könnte diminishing returns gebrauchen.

3. **Teslaspule + Kettenblitz** kann theoretisch 8 (Level 5) + 2×8 = 24 Schaden-Instanzen pro Tick erzeugen. Extrem stark gegen Schwärme. Allerdings nur 40 Basis-Schaden, also weniger relevant gegen starke Einzelziele.

4. **Fusionsreaktor Unterhalt** (8 Stahl + 3 Daten) ist hart im Early Game aber trivial im Late Game. Gut balanciert als T3-Gebäude.

5. **Kritischer Treffer auf Plasmakanone** = 15% Chance auf 900 AoE-Schaden (Level 1). Auf Gruppen absolut verheerend. Aber die niedrige Feuerrate (5% pro Tick) gleicht das aus.

6. **Energierelais + Schnellfeuer-Modul + Übertaktung-Research** kann fireChance bis ~0.47 drücken → 53% Feuerrate. Auf einem Sturmgeschütz: 150 × 3.0 (L5) × 0.53 = 238.5 DPS. Stark, aber benötigt massive Infrastruktur.

7. **Recycler + Überladung** ist extrem effizient: 16 Stahl + 12.8 Elektronik pro Tick für 40 Energie + 15 Schrott. Das macht Gießerei + E-Fabrik zusammen fast obsolet.

### Was gut balanciert ist

- **Level-Skalierung (×0.5/Level)** ist stark genug um Upgrades wertvoll zu machen, aber nicht so stark dass Level 5 alles trivial macht
- **Tech-Tree Progression** fühlt sich natürlich an — T1 gibt Basics, T4 gibt Game-Changers
- **Ressourcenketten** erzwingen Entscheidungen (Ore-Patch für Bohrer vs. Schmelze vs. Kristallbohrer)
- **Modul-Entscheidungen** sind meaningful — kein Modul ist auf jedem Geschütz optimal
- **Prestige-System** gibt genug Boost für Wiederholbarkeit ohne das Spiel zu brechen

---

*Letzte Aktualisierung: Februar 2026*
