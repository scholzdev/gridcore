# Gridcore – Balancing-Übersicht

> Komplette Referenz aller Gebäude, Abhängigkeiten, Kosten, Verbrauch und Wirtschaftsformeln.

---

## Inhaltsverzeichnis

1. [Wirtschaftsformeln](#wirtschaftsformeln)
2. [Ressourcenfluss-Übersicht](#ressourcenfluss-übersicht)
3. [Gebäude nach Tier](#gebäude-nach-tier)
4. [Abhängigkeitsmatrix](#abhängigkeitsmatrix)
5. [Schwierigkeitsgrade & Wellen](#schwierigkeitsgrade--wellen)
6. [Potentielle Balancing-Probleme](#potentielle-balancing-probleme)

---

## Wirtschaftsformeln

### Kaufkosten (exponentiell)

```
Kaufpreis = Basiskosten × 1.15^(Anzahl bereits gebaut) × Prestige-Mult × Forschungs-Mult
```

### Upgrade-Kosten (exponentiell)

```
Upgradepreis = Basiskosten × 1.5 × 2.5^(Level − 1) × Prestige-Mult × Forschungs-Mult
```

| Level | Multiplikator |
|-------|---------------|
| 1→2   | ×1.5          |
| 2→3   | ×3.75         |
| 3→4   | ×9.375        |
| 4→5   | ×23.44        |
| 5→6   | ×58.59        |
| 6→7   | ×146.5        |
| 7→8   | ×366.2        |
| 8→9   | ×915.5        |
| 9→10  | ×2288.8       |

### Level-Skalierung (Einkommen, Schaden & Verbrauch)

```
LEVEL_SCALING = 0.25
getLevelMult(level) = 1 + (level − 1) × 0.25
```

| Level | Mult  | Level | Mult  |
|-------|-------|-------|-------|
| 1     | 1.00× | 6     | 2.25× |
| 2     | 1.25× | 7     | 2.50× |
| 3     | 1.50× | 8     | 2.75× |
| 4     | 1.75× | 9     | 3.00× |
| 5     | 2.00× | 10    | 3.25× |

### Verkauf (Erstattung)

```
Erstattung = Basiskosten × Gesamtfaktor × 0.40
Gesamtfaktor = 1 + Σ(l=1 bis level−1) 2.5^(l−1)
```

→ Ca. **40%** der Gesamtinvestition zurück.

### Wartungskosten (Schrott/Tick, alle Nicht-Kern-Gebäude)

```
Wartung = floor(level × 0.5) Schrott/Tick
```

| Level | Wartung | Level | Wartung |
|-------|---------|-------|---------|
| 1     | 0       | 6     | 3       |
| 2     | 1       | 7     | 3       |
| 3     | 1       | 8     | 4       |
| 4     | 2       | 9     | 4       |
| 5     | 2       | 10    | 5       |

### Kill-Belohnung

```
Belohnung = 15 + 0.1 × Spielzeit(Sekunden)   Schrott
```

---

## Ressourcenfluss-Übersicht

### Quellen (Einkommen/Tick, Lv1)

| Ressource    | Gebäude                            | /Tick | Bedingung        |
|-------------|-------------------------------------|-------|------------------|
| **Energie**  | Kern                               | 1     | —                |
|              | Solarfeld (Starter)                | 5     | —                |
|              | Fusionsreaktor (T3)                | 75    | −3 Stahl, −1 Daten |
|              | Hyperreaktor (T6, max 1)           | 200   | −5 Stahl, −3 Elek, −2 Daten |
| **Schrott**  | Kern                               | 1     | —                |
|              | Schrottbohrer (Starter)            | 25    | Erz, −5 Energie  |
|              | Kill-Belohnung                     | 15+   | Pro Kill         |
| **Stahl**    | Stahlschmelze (T1)                 | 8     | Erz, −12 Energie |
|              | Gießerei (T1)                      | 12    | −15 Energie      |
|              | Recycler (T3)                      | 10    | −25 Energie      |
|              | Quantenfabrik (T5)                 | 15    | −50 Energie      |
| **Elektronik** | Kristallbohrer (T2)              | 5     | Erz, −20 Energie |
|              | E-Fabrik (T2)                      | 8     | −20 Energie      |
|              | Recycler (T3)                      | 8     | (inkl. oben)     |
|              | Quantenfabrik (T5)                 | 10    | (inkl. oben)     |
| **Daten**    | Forschungslabor (T3)               | 20    | −30 Energie      |
|              | Quantenfabrik (T5)                 | 8     | (inkl. oben)     |

### Senken – Energie (Verbrauch/Tick, Lv1)

| Gebäude                | Energie | + Andere          |
|------------------------|---------|-------------------|
| Schrottbohrer          | 5       | —                 |
| Reparaturbucht (T1)    | 10      | —                 |
| Stahlschmelze (T1)     | 12      | —                 |
| EMP-Feld (T1)          | 15      | —                 |
| Gießerei (T1)          | 15      | —                 |
| Teslaspule (T2)        | 15      | —                 |
| Schildgenerator (T2)   | 15      | —                 |
| Kristallbohrer (T2)    | 20      | —                 |
| E-Fabrik (T2)          | 20      | —                 |
| Radarstation (T3)      | 25      | —                 |
| Recycler (T3)          | 25      | —                 |
| Datentresor (T4)       | 15      | Daten: 3          |
| Energierelais (T4)     | 20      | —                 |
| Drohnenhangar (T4)     | 25      | Daten: 2          |
| Forschungslabor (T3)   | 30      | —                 |
| Plasmakanone (T4)      | 30      | —                 |
| Naniten-Kuppel (T5)    | 40      | Daten: 4          |
| Artillerie (T5)        | 50      | —                 |
| Laserturm (T3)         | 50      | —                 |
| Quantenfabrik (T5)     | 50      | —                 |
| Kommandozentrale (T5)  | 60      | Daten: 5          |
| Ionenkanone (T5)       | 70      | Daten: 3          |
| Schockwellen-Turm (T5) | 80      | Daten: 4          |
| Gravitationskanone (T6)| 90      | Daten: 5          |
| Annihilator (T6)       | 200     | Daten: 8          |

### Senken – Stahl, Elektronik, Daten (Verbrauch/Tick, Lv1)

| Gebäude              | Stahl | Elek. | Daten |
|----------------------|-------|-------|-------|
| Fusionsreaktor (T3)  | 3     | —     | 1     |
| Hyperreaktor (T6)    | 5     | 3     | 2     |
| Drohnenhangar (T4)   | —     | —     | 2     |
| Datentresor (T4)     | —     | —     | 3     |
| Ionenkanone (T5)     | —     | —     | 3     |
| Naniten-Kuppel (T5)  | —     | —     | 4     |
| Schockwellen-Turm (T5)| —    | —     | 4     |
| Kommandozentrale (T5)| —     | —     | 5     |
| Gravitationskanone (T6)| —   | —     | 5     |
| Annihilator (T6)     | —     | —     | 8     |
| **Σ Gesamt**         | **8** | **3** | **37** |

---

## Gebäude nach Tier

### Kern (einzigartig, kostenlos)

| HP | Einkommen | Besonderes |
|----|-----------|------------|
| 5000 | Energie: 1, Schrott: 1 | Spielende bei Zerstörung |

---

### Starter (frei verfügbar)

| Gebäude        | Kat.   | HP   | Kosten               | Verbrauch  | Einkommen   | Schaden | RW | Besonderes |
|---------------|--------|------|----------------------|------------|-------------|---------|-----|------------|
| Solarfeld      | Infra  | 400  | S:40                 | —          | E:5         | —       | —   | —          |
| Schrottbohrer  | Infra  | 500  | S:40, E:10           | E:5        | S:25        | —       | —   | Erz        |
| Schwere Mauer  | Infra  | 2500 | S:15                 | —          | —           | —       | —   | Blocker    |
| Wächtergeschütz| Def.   | 800  | S:150, E:50          | —          | —           | 30      | 6   | Projektil  |

> Abk: S=Schrott, E=Energie, St=Stahl, El=Elektronik, D=Daten

---

### Tier 1 (KP: 5)

| Gebäude        | Kat.   | HP   | Kosten          | Verbrauch | Einkommen | Schaden | RW  | Besonderes         |
|---------------|--------|------|-----------------|-----------|-----------|---------|-----|--------------------|
| Stahlschmelze  | Infra  | 600  | S:60, E:20      | E:12      | St:8      | —       | —   | Erz                |
| Gießerei       | Verarb.| 1000 | S:120, E:40     | E:15      | St:12     | —       | —   | —                  |
| Reparaturbucht | Infra  | 600  | S:80, E:30      | E:10      | —         | —       | 3   | Heilt 50/Tick      |
| EMP-Feld       | Supp.  | 500  | S:100, E:40     | E:15      | —         | —       | 5   | Slow 40% (+10%/Lv) |
| Minenfeld      | Def.   | 200  | S:60, St:30     | —         | —         | 400     | —   | Einmalig, R:2.5    |

---

### Tier 2 (KP: 15)

| Gebäude         | Kat.  | HP   | Kosten          | Verbrauch | Einkommen | Schaden | RW  | Besonderes          |
|----------------|-------|------|-----------------|-----------|-----------|---------|-----|---------------------|
| Sturmgeschütz   | Def.  | 3000 | St:300, El:200  | —         | —         | 150     | 12  | Projektil           |
| Teslaspule      | Def.  | 1200 | St:120, S:80    | E:15      | —         | 10      | 5   | Multi 3(+1/Lv)      |
| Schildgenerator | Supp. | 800  | St:100, E:50    | E:15      | —         | —       | 4   | Schild 500 HP       |
| Kristallbohrer  | Infra | 600  | S:80, St:40     | E:20      | El:5      | —       | —   | Erz                 |
| E-Fabrik        | Verarb.| 1000| S:200, E:100    | E:20      | El:8      | —       | —   | —                   |

---

### Tier 3 (KP: 25)

| Gebäude          | Kat.  | HP   | Kosten                  | Verbrauch   | Einkommen     | Schaden    | RW | Besonderes           |
|-----------------|-------|------|-------------------------|-------------|---------------|------------|-----|----------------------|
| Laserturm        | Def.  | 1500 | St:400, El:200          | E:50        | —             | 25 (×3 Fokus) | 8 | Strahl               |
| Fusionsreaktor   | Infra | 1200 | St:1000, El:600, D:500  | St:3, D:1   | **E:75**      | —          | —   | —                    |
| Radarstation     | Supp. | 600  | St:80, El:40            | E:25        | —             | —          | 5   | RW+3 (+1/Lv)        |
| Forschungslabor  | Forsch.| 800 | St:80, El:60            | E:30        | **D:20**      | —          | —   | ×Forschungsbuffs     |
| Recycler         | Verarb.| 1200| St:250, El:150, D:80    | E:25        | St:10, El:8   | —          | —   | —                    |

---

### Tier 4 (KP: 50)

| Gebäude       | Kat.  | HP   | Kosten                  | Verbrauch      | Einkommen | Schaden | RW | Besonderes           |
|--------------|-------|------|-------------------------|----------------|-----------|---------|-----|----------------------|
| Plasmakanone  | Def.  | 4000 | St:500, El:400, D:200   | E:30           | —         | 300     | 10  | Splash 2             |
| Datentresor   | Forsch.| 1500| St:300, El:200, D:150   | E:15, **D:3**  | —         | —       | —   | +15% Schaden global  |
| Energierelais | Supp. | 700  | St:150, El:100, D:50    | E:20           | —         | —       | 5   | Feuerrate +4%(+1%/Lv)|
| Drohnenhangar | Def.  | 2000 | St:250, El:200, D:50    | E:25, **D:2**  | —         | 45      | 10  | Drohnen 1(+1/Lv)    |

---

### Tier 5 (KP: 75)

| Gebäude           | Kat.  | HP   | Kosten                  | Verbrauch      | Einkommen        | Schaden       | RW    | Besonderes           |
|------------------|-------|------|-------------------------|----------------|------------------|---------------|-------|----------------------|
| Artillerie        | Def.  | 5000 | St:800, El:600, D:400   | E:50           | —                | 500           | ∞     | Splash 3, langsam    |
| Ionenkanone       | Def.  | 4000 | St:700, El:500, D:350   | E:70, **D:3**  | —                | 120 (×5 Fokus)| 15    | Strahl               |
| Quantenfabrik     | Verarb.| 3500| St:500, El:400, D:300   | E:50           | St:15, El:10, D:8| —             | —     | Allround-Produktion  |
| Kommandozentrale  | Supp. | 8000 | St:600, El:500, D:300   | E:60, **D:5**  | —                | —             | ∞     | +15% DMG, +5% FR, **max 1** |
| Schockwellen-Turm | Def.  | 5000 | St:750, El:550, D:400   | E:80, **D:4**  | —                | 200           | 8     | Puls-AoE alle 5 Ticks|
| Naniten-Kuppel    | Supp. | 6000 | St:550, El:450, D:350   | E:40, **D:4**  | —                | —             | ∞     | Heilt ALLE 30/Tick   |

---

### Tier 6 (KP: 100)

| Gebäude            | Kat.  | HP   | Kosten                   | Verbrauch              | Einkommen  | Schaden | RW | Besonderes                  |
|-------------------|-------|------|---------------------------|-----------------------|------------|---------|-----|------------------------------|
| Annihilator        | Def.  | 1337 | St:1200, El:900, D:700   | E:200, **D:8**        | —          | 1337    | ∞   | Linie alle 10T, **max 1**   |
| Hyperreaktor       | Infra | 6000 | St:1000, El:800, D:600   | St:5, El:3, **D:2**   | **E:200**  | —       | —   | Explosion R:5, **max 1**    |
| Gravitationskanone | Supp. | 8000 | St:1100, El:850, D:650   | E:90, **D:5**         | —          | —       | 12  | Pull+Slow 80%, **max 1**    |

---

## Abhängigkeitsmatrix

### Produktionsketten

```
                    ┌─────────────────────────────────────────────┐
                    │               ERZVORKOMMEN                  │
                    │  (endliche Felder auf der Karte)            │
                    └────┬──────────┬──────────┬──────────────────┘
                         │          │          │
                    Schrottbohrer  Stahlschmelze  Kristallbohrer
                    (−5 E → +25 S) (−12 E → +8 St) (−20 E → +5 El)
                         │          │          │
    ┌────────────────────┼──────────┼──────────┼────────────────────┐
    │                    v          v          v                    │
    │  ┌─ Solarfeld ── ENERGIE ◄── Fusionsreaktor (T3) ◄─┐        │
    │  │  (→ +5 E)       │         (−3 St, −1 D → +75 E) │        │
    │  │                 │                                 │        │
    │  │  Kern ──────────┤     Hyperreaktor (T6, max 1)   │        │
    │  │  (+1 E, +1 S)   │     (−5 St, −3 El, −2 D       │        │
    │  │                 │      → +200 E)                  │        │
    │  │                 v                                 │        │
    │  │        ┌── VERBRAUCHER ──┐                        │        │
    │  │        │  (25 Gebäude    │                        │        │
    │  │        │   5–200 E/Tick) │                        │        │
    │  │        └─────────────────┘                        │        │
    │  │                                                   │        │
    │  │  Gießerei ────── STAHL ◄── Recycler (T3)         │        │
    │  │  (−15 E → +12 St)  │       (−25 E → +10 St, +8 El)       │
    │  │                    │                              │        │
    │  │                    ├── Quantenfabrik (T5)          │        │
    │  │                    │   (−50 E → +15 St, +10 El, +8 D)    │
    │  │                    │                              │        │
    │  │                    ├── → Fusionsreaktor (−3/Tick) ─┘        │
    │  │                    └── → Hyperreaktor (−5/Tick)            │
    │  │                                                           │
    │  │  E-Fabrik ──── ELEKTRONIK                                 │
    │  │  (−20 E → +8 El)  │                                      │
    │  │                    └── → Hyperreaktor (−3/Tick)            │
    │  │                                                           │
    │  │  Forschungslabor ── DATEN                                 │
    │  │  (−30 E → +20 D)     │                                    │
    │  │                       ├── → 10 Gebäude verbrauchen        │
    │  │                       │     (1–8 D/Tick, Σ37 D/Tick)      │
    │  │                       └── → Kaufkosten (T3+ Gebäude)      │
    │  │                                                           │
    │  │  Kills ────────── SCHROTT ── → Kaufkosten                 │
    │  │  (15 + 0.1×Sek)      │       → Wartung (alle Gebäude)     │
    │  │                       │                                    │
    │  └───────────────────────┴────────────────────────────────────┘
```

### Kreislauf-Abhängigkeiten

```
Energie → Forschungslabor → Daten ─┐
  ↑                                 │
  └── Fusionsreaktor ◄── Daten ─────┘  (Daten werden sowohl produziert als auch verbraucht)

Energie → Gießerei → Stahl ─┐
  ↑                          │
  └── Fusionsreaktor ◄──────┘  (Stahl wird ebenfalls im Kreislauf verwendet)
```

### Daten-Budget (alle Verbraucher je 1×, Lv1)

| Gebäude              | Daten/Tick | Kumulativ |
|----------------------|-----------|-----------|
| Fusionsreaktor       | 1         | 1         |
| Drohnenhangar        | 2         | 3         |
| Datentresor          | 3         | 6         |
| Ionenkanone          | 3         | 9         |
| Naniten-Kuppel       | 4         | 13        |
| Schockwellen-Turm    | 4         | 17        |
| Kommandozentrale     | 5         | 22        |
| Gravitationskanone   | 5         | 27        |
| Annihilator          | 8         | 35        |
| Hyperreaktor         | 2         | **37**    |
| **Daten-Quellen**    |           |           |
| Forschungslabor      | +20       |           |
| Quantenfabrik        | +8        |           |
| **Σ Quellen**        | **+28**   |           |
| **Netto (1× alles)** | **−9**    | Defizit!  |

→ Mit je 1 Lab + 1 Quantenfabrik entsteht ein Daten-Defizit von −9/Tick.
→ Erst ab 2 Labs oder 2 Quantenfabriken wird Daten positiv.

---

## Schwierigkeitsgrade & Wellen

### Endlosmodus – Gegner-Skalierung

```
HP    = baseHP × (1 + hpPerSec × 0.08)^(Minuten × 10)   ← exponentiell!
Speed = baseSpeed + speedPerSec × Minuten                 ← linear, Cap: 0.12
Spawn = max(spawnMin, spawnBase − spawnReduction × Sek)    ← linear
```

| Preset  | baseHP | hpPerSec | baseSpeed | speedPerSec | spawnBase | Redukt. | spawnMin | Schaden |
|---------|--------|----------|-----------|-------------|-----------|---------|----------|---------|
| Leicht  | 120    | 4        | 0.018     | 0.00008     | 2200 ms   | 15      | 500 ms   | 80      |
| Mittel  | 180    | 6        | 0.022     | 0.00012     | 1800 ms   | 18      | 350 ms   | 120     |
| Schwer  | 250    | 10       | 0.028     | 0.00018     | 1300 ms   | 20      | 200 ms   | 180     |

### Wellen-Modus

```
Gegner/Welle  = floor(8 × 1.11^(Welle − 1))
HP-Skalierung = baseHP × 1.35^(Welle − 1)
Spd-Skalierung= baseSpeed × 1.06^(Welle − 1)
Spawn-Delay   = max(300, 1200 − 50 × (Welle − 1)) ms
Bauzeit       = 30 Ticks (Start), 15 Ticks (zwischen Wellen)
```

| Welle | Gegner | HP-Mult   | Speed-Mult | Spawn-Delay |
|-------|--------|-----------|------------|-------------|
| 1     | 8      | ×1.0      | ×1.0       | 1200 ms     |
| 5     | 12     | ×3.3      | ×1.3       | 1000 ms     |
| 10    | 20     | ×21.0     | ×1.7       | 750 ms      |
| 15    | 33     | ×133.5    | ×2.3       | 500 ms      |
| 20    | 54     | ×848      | ×3.1       | 300 ms      |
| 25    | 89     | ×5.387    | ×4.1       | 300 ms      |
| 30    | 147    | ×34.200   | ×5.4       | 300 ms      |

---

## Potentielle Balancing-Probleme

### 🔋 Energie: Solarfeld zu effizient

- **Kein Verbrauch**, keine Voraussetzung, unbegrenzt baubar
- Einzige Kosten: Schrott (günstigste Ressource)
- Fusionsreaktor (75E für 3 St + 1 D) verdrängt Solarfelder erst spät
- **Idee**: Solarfeld könnte minimalen Verbrauch haben oder Cap-Mechanik

### 🔩 Schrott: Unbegrenzter Überschuss

- Kill-Belohnung skaliert mit Spielzeit (15 + 0.1/s), kein Cap
- Wartungskosten (Schrott) reichen nicht als Sink
- Ab T3+ brauchen Kaufkosten kaum noch Schrott
- **Idee**: Kill-Reward deckeln oder Schrott-Verbrauch zu Verteidigungen hinzufügen

### ⚙️ Stahl & Elektronik: Wenige laufende Senken

- **Stahl**: Nur Fusionsreaktor (3) + Hyperreaktor (5) = 8/Tick laufend
- **Elektronik**: Nur Hyperreaktor (3) = 3/Tick laufend
- Produktion: Bis zu 45 St/Tick + 31 El/Tick (je 1× alles)
- Hauptverbrauch nur durch Kaufkosten (einmalig) → akkumuliert endlos
- **Idee**: Weitere Verbraucher oder Wartungskosten in Stahl/Elektronik

### 📊 Daten: Fast ausgeglichen

- Quellen: 28/Tick (1× Lab + 1× Quantenfabrik)
- Senken: 37/Tick (alle Verbraucher, je 1×)
- → Leichtes Defizit bei voller Auslastung ✓
- ⚠️ Bei mehreren Labs (×20 D/Tick) kippt die Balance schnell
- **Idee**: Lab-Cap oder steigende Datenverbrauche mit Gebäudeanzahl

### 🎯 Kampf-Balance

- Sturmgeschütz (T2): 150 Schaden, **kein Energieverbrauch** → sehr effizient
- Minenfeld (T1): 400 Schaden, einmalig aber günstig
- Annihilator (T6): 1337 Schaden aber 200 E + 8 D/Tick → teuer im Unterhalt ✓
- Laserturm (T3): 25 Basis × 3 Fokus = 75 effektiv für 50 E → fair
- Artillerie (T5): 500 Schaden global, nur 50 E → könnte mehr kosten

### 📈 Skalierung Late-Game

- Level 10 Buildings: 3.25× Output bei ~2289× Upgrade-Kosten → Upgrades werden irrelevant
- Exponentialkurve der Upgrades steigt zu steil ab Level 7+
- Mehrere günstige Gebäude > ein hochgeleveltes → Spam-Meta möglich
