# STRATEGY.md — GRIDCORE Strategie-Guide

## Überblick

GRIDCORE ist ein Grid-basiertes Tower Defense Spiel auf einem 30×30 Feld. Du verteidigst den **Kern** (Mitte) gegen Gegnerwellen von allen Seiten. Baue Gebäude, produziere Ressourcen, forsche und überlebe so lange wie möglich.

---

## Ressourcen

| Ressource | Farbe | Quelle |
|-----------|-------|--------|
| **Energie** | 🟡 | Solarfeld, Kern |
| **Schrott** | 🟣 | Schrottbohrer (auf Erz), Kern |
| **Stahl** | 🟠 | Gießerei, Stahlschmelze, Recycler |
| **Elektronik** | 🟢 | E-Fabrik, Kristallbohrer, Recycler |
| **Daten** | 🔵 | Forschungslabor |

> **Tipp:** Schrott und Energie sind deine Startressourcen. Stahl, Elektronik und Daten kommen erst durch den Techbaum.

---

## Startstrategie (Erste 60 Sekunden)

1. **3–4 Solarfelder** bauen → Energieversorgung sichern
2. **2–3 Schrottbohrer** auf Erz-Felder (lila Quadrate) → Schrott-Einkommen
3. **2 Wächtergeschütze** an exponierten Seiten → erste Verteidigung
4. **Mauern** um den Kern als Puffer → gewinnt Zeit
5. Techbaum öffnen (T) → Gießerei + Reparaturbucht freischalten (je 5 KP)

> **Fehler vermeiden:** Nicht zu viele Solarfelder auf einmal — sie haben kein Einkommen außer Energie, und du brauchst Schrott für alles.

---

## Techbaum-Reihenfolge (Empfehlung)

### Tier 1 (5 KP)
| Priorität | Gebäude | Grund |
|-----------|---------|-------|
| ⭐⭐⭐ | **Gießerei** | Stahl ist essentiell für alle Tier-2-Gebäude |
| ⭐⭐⭐ | **Stahlschmelze** | Billiger als Gießerei, kein Schrott-Verbrauch |
| ⭐⭐ | **Reparaturbucht** | Hält deine Front am Leben |
| ⭐⭐ | **EMP-Feld** | Verlangsamt Gegner → Türme schießen öfter |
| ⭐ | **Minenfeld** | Nischeneinsatz, gut für Engpässe |

### Tier 2 (15 KP)
| Priorität | Gebäude | Grund |
|-----------|---------|-------|
| ⭐⭐⭐ | **E-Fabrik** | Elektronik freischalten → Module + Tier 3 |
| ⭐⭐⭐ | **Teslaspule** | Bester Multi-Target DPS |
| ⭐⭐ | **Sturmgeschütz** | Hoher Einzelziel-Schaden |
| ⭐⭐ | **Schildgenerator** | Schützt Frontgebäude |
| ⭐ | **Kristallbohrer** | Alternative Elektronik-Quelle |

### Tier 3 (30 KP)
| Priorität | Gebäude | Grund |
|-----------|---------|-------|
| ⭐⭐⭐ | **Forschungslabor** | Daten-Produktion → Forschungsbaum 2.0 |
| ⭐⭐ | **Recycler** | Stahl + Elektronik aus Schrott |
| ⭐⭐ | **Radarstation** | Reichweiten-Buff für alle Türme im Radius |
| ⭐⭐ | **Laserturm** | Aufladungsstrahl, hoher DPS bei Focus |

### Tier 4 (50 KP)
| Priorität | Gebäude | Grund |
|-----------|---------|-------|
| ⭐⭐⭐ | **Datentresor** | +15% globaler Turm-Schaden (stackt!) |
| ⭐⭐ | **Plasmakanone** | 300 Schaden, AoE — eliminiert Gruppen |
| ⭐⭐ | **Drohnenhangar** | Autonome Drohnen, guter Flächen-DPS |

---

## Gebäude-Übersicht

### Verteidigung

| Gebäude | Schaden | Reichweite | Spezial |
|---------|---------|------------|---------|
| Wächtergeschütz | 30 | 6 | Einfach, günstig |
| Sturmgeschütz | 150 | 12 | Hoher Schaden, teuer |
| Teslaspule | 40 | 5 | Trifft 3+ Ziele, Kettenblitz |
| Laserturm | 35 | 8 | Aufladungsstrahl, Schaden steigt |
| Plasmakanone | 300 | 10 | AoE-Explosion, sehr teuer |
| Drohnenhangar | 25 | 10 | Autonome Drohnen |
| Minenfeld | 250 | — | Explodiert bei Kontakt, Einmalnutzung |

### Produktion

| Gebäude | Produziert | Verbraucht | Auf Erz? |
|---------|-----------|------------|----------|
| Solarfeld | 20 Energie/s | — | Nein |
| Schrottbohrer | 25 Schrott/s | — | **Ja** |
| Stahlschmelze | 8 Stahl/s | 12 Energie | **Ja** |
| Kristallbohrer | 5 Elektronik/s | 20 Energie | **Ja** |
| Gießerei | 10 Stahl/s | 15 Energie + 10 Schrott | Nein |
| E-Fabrik | 5 Elektronik/s | 20 Energie + 10 Schrott | Nein |
| Recycler | 10 Stahl + 8 Elek/s | 40 Energie + 15 Schrott | Nein |
| Forschungslabor | 20 Daten/s | 45 Energie + 2 Elektronik | Nein |

### Unterstützung

| Gebäude | Reichweite | Effekt |
|---------|-----------|--------|
| Reparaturbucht | 3 | Heilt Gebäude im Radius |
| EMP-Feld | 5 | Verlangsamt Gegner |
| Schildgenerator | 4 | Gibt Gebäuden Schildpunkte |
| Radarstation | 5 | +Reichweite für Türme im Radius |
| Datentresor | — | +15% globaler Turm-Schaden |

---

## Module

Module werden auf Gebäude installiert (rechte Sidebar). Jedes Gebäude kann **ein** Modul haben. Module werden mit dem Techbaum freigeschaltet.

### Kampf-Module (für Türme)

| Modul | Effekt | Kosten | Benötigt |
|-------|--------|--------|----------|
| Schnellfeuer | +30% Feuerrate | 60 St / 40 Elek | Sturmgeschütz |
| Schadensverstärker | +40% Schaden | 80 St / 60 Elek | Sturmgeschütz |
| Kettenblitz | 2 Extra-Ziele (30% Dmg) | 100 St / 80 Elek | Teslaspule |
| Panzerbrechend | +50% Bonuschaden (ignoriert Schild) | 70 St / 50 Elek | Laserturm |
| Verlangsamung | Getroffene -30% Speed (3s) | 60 Elek / 40 Daten | EMP-Feld |
| Langstrecke | +3 Reichweite | 50 St / 30 Elek | Radarstation |

### Wirtschaft-Module (für Produzenten)

| Modul | Effekt | Kosten | Benötigt |
|-------|--------|--------|----------|
| Effizienz | -50% Verbrauch | 50 Elek / 30 Daten | E-Fabrik |
| Überladung | +60% Einkommen | 80 Elek / 50 Daten | Recycler |
| Doppelertrag | 20% Chance ×2 Output | 100 Elek / 60 Daten | Labor |

### Defensive Module

| Modul | Effekt | Kosten | Benötigt |
|-------|--------|--------|----------|
| Regeneration | Selbstheilung 2% HP/s | 40 St / 30 Elek | Reparaturbucht |

> **Beste Modul-Kombos:**
> - Teslaspule + Kettenblitz = Massiver Multi-Target DPS
> - Plasmakanone + Schadensverstärker = 420 AoE-Schaden
> - Sturmgeschütz + Verlangsamung = Gegner bleiben im Kill-Radius
> - Recycler + Überladung = 16 Stahl + 12.8 Elektronik/s
> - Kern + Regeneration = 100 HP/s Selbstheilung

---

## Forschungsbaum 2.0 (F)

Der Forschungsbaum kostet **Daten** und gibt **Run-Buffs** (Reset bei Game Over). Benötigt ein Forschungslabor für Daten-Produktion.

### Empfohlene Forschungsreihenfolge

1. **Schnellbau** (Tier 1) → -8% Baukosten/Stufe — sofort spürbar
2. **Übertaktung** (Tier 1) → +12% Feuerrate — mehr DPS
3. **Ertragsforschung** (Tier 2) → +20% Output — snowballt
4. **Datenkompression** (Tier 3) → +30% Daten-Output — beschleunigt weitere Forschung
5. **Reichweitensensor** (Tier 3) → +1 Reichweite/Stufe — enorm wertvoll
6. **Modulsynergie** (Tier 4) → +20% Modul-Effekte — alles wird stärker

| Tier | Node | Effekt/Stufe | Kosten Lv1→2→3 |
|------|------|-------------|-----------------|
| 1 | Panzerung | +20% Gebäude-HP | 30 → 60 → 120 |
| 1 | Schnellbau | -8% Baukosten | 25 → 50 → 100 |
| 1 | Übertaktung | +12% Feuerrate | 35 → 70 → 140 |
| 2 | Effizienzprotokoll | -15% Energiebedarf | 60 → 120 → 240 |
| 2 | Ertragsforschung | +20% Output | 70 → 140 → 280 |
| 2 | Schildverstärkung | +25% Schildstärke | 55 → 110 → 220 |
| 3 | Reichweitensensor | +1 Türme-Reichweite | 100 → 250 → 625 |
| 3 | Notfallreparatur | +40% Heilrate | 90 → 225 → 562 |
| 3 | Datenkompression | +30% Daten-Output | 80 → 160 → 320 |
| 4 | Modulsynergie | +20% Modul-Effekte | 150 → 450 → 1350 |

---

## Ressourcenmarkt (M)

Tausche Ressourcen untereinander. Kurse sind dynamisch:
- **Viel verkaufen** → Preis sinkt
- **Viel kaufen** → Preis steigt
- Kurse erholen sich langsam über Zeit

### Handelsrouten

| Route | Basiskurs |
|-------|-----------|
| 10 Schrott → 4 Stahl | Gut für Early-Stahl |
| 10 Schrott → 2.5 Elektronik | Teure Konversion |
| 10 Stahl → 5 Elektronik | Standard-Kurs |
| 10 Stahl → 20 Schrott | Not-Schrott |
| 10 Elektronik → 15 Stahl | Downgrade |
| 10 Elektronik → 3 Daten | Teure Daten |
| 10 Daten → 25 Elektronik | Daten-Dump |

> **Tipp:** Der Markt ist ideal für Engpässe. Wenn du viel Schrott aber kein Stahl hast → direkt tauschen statt auf die Gießerei warten.

---

## Prestige-System (⭐)

Bei Game Over bekommst du **Prestige-Punkte** basierend auf Kills und Spielzeit. Diese geben **permanente** Boni über alle Runs.

| Upgrade | Effekt/Stufe | Max | Kosten-Basis |
|---------|-------------|-----|-------------|
| Waffenmeister | +10% Turm-Schaden | 10 | 10 PP |
| Effizienz | +10% Einkommen | 10 | 10 PP |
| Schrottvorrat | +20 Start-Schrott | 10 | 5 PP |
| Energievorrat | +20 Start-Energie | 10 | 5 PP |
| Ingenieur | -5% Baukosten | 10 | 15 PP |

> **Empfehlung:** Erst **Schrottvorrat** und **Energievorrat** für einen schnelleren Start, dann **Waffenmeister** für den DPS-Boost.

---

## Upgrade-System

Jedes Gebäude kann auf **Level 5** aufgerüstet werden (gleiches Gebäude nochmal anklicken). Pro Level:
- **+50% HP** (voll geheilt)
- **+50% Schaden** (Türme)
- **+50% Einkommen** (Produzenten)
- Kosten = Basis × Level

> **Strategie:** Level 3–4 Türme an der Front sind effizienter als viele Level-1-Türme, weil sie weniger Platz brauchen.

---

## Verteidigungslayout

### Grundprinzip: Ringe um den Kern

```
         [Turm] [Turm] [Turm]
    [Turm] [Mauer] [Mauer] [Mauer] [Turm]
    [Turm] [Mauer]  [KERN]  [Mauer] [Turm]
    [Turm] [Mauer] [Mauer] [Mauer] [Turm]
         [Turm] [Turm] [Turm]
```

### Innerer Ring (um den Kern)
- **Mauern** mit **Regeneration**-Modul → absorben Schaden, heilen sich selbst
- **Reparaturbucht** hinter den Mauern → heilt alles

### Mittlerer Ring (Verteidigung)
- **Türme** mit Modulen → Hauptschaden
- **Radarstation** zentral → buffed alle Türme
- **Schildgeneratoren** → schützt Front

### Äußerer Ring (Wirtschaft)
- **Solarfelder**, **Bohrer**, **Fabriken** → außerhalb der Kampfzone
- **EMP-Felder** am Rand → verlangsamt bevor Gegner die Türme erreichen

---

## Spielmodi

### Endlos
- Gegner spawnen kontinuierlich, werden stetig stärker
- Kein Ende — überlebe so lange wie möglich
- Gut zum Üben und für Prestige-Farming

### Wellen
- Bauphase zwischen Wellen (15–20s)
- Definierte Gegnerzahl pro Welle
- Strategie: Nutze Bauphasen für Upgrades und Umstrukturierung

---

## Steuerung

| Taste / Aktion | Effekt |
|----------------|--------|
| **Linksklick** | Gebäude/Modul platzieren oder upgraden |
| **Rechtsklick** | Gebäude abreißen (50% Refund) |
| **P** | Pause / Weiter |
| **T** | Techbaum öffnen |
| **S** | Statistik-Overlay |
| **M** | Ressourcenmarkt |
| **F** | Forschungsbaum 2.0 |
| **R** | Neustart (nur bei Game Over) |
| **Shift + Hover** | Detaillierte Gebäude-Skalierung (Lv 1–5) |
| **Hover (Modul)** | Zeigt Details gesperrter Module |
| **💾** | Speichern |
| **📂** | Laden |

---

## Fortgeschrittene Tipps

1. **Datentresor stackt** — Jeder gibt +15% Turm-Schaden. 3 Datentresore = +45% Schaden auf alles.

2. **Recycler > Gießerei** im Lategame — Produziert Stahl UND Elektronik aus Schrott.

3. **Laserturm-Focus** — Der Laserturm lädt sich auf je länger er das gleiche Ziel beschießt. Nicht unterbrechen!

4. **Markt-Arbitrage** — Wenn du viel von einer Ressource hast, verkaufe sie bevor der Preis sinkt. Kaufe was du brauchst solange der Preis niedrig ist.

5. **Forschungsbaum zuerst** — Investiere früh in Datenkompression → mehr Daten → schnellere Forschung → Schneeballeffekt.

6. **Teslaspule + Kettenblitz** ist der effizienteste AoE-Schaden im Spiel. Eine Teslaspule Lv 5 mit Kettenblitz trifft 5+ Ziele pro Schuss.

7. **Überladung auf Recycler** — Der Recycler produziert dann 16 Stahl + 12.8 Elektronik/s. Eine Maschine, zwei High-Tier-Ressourcen.

8. **Kern-Regen** — Installiere Regeneration auf dem Kern. Bei 5000 HP heilt er sich um 100 HP/s — das verzeiht viele Fehler.

9. **EMP + Minen Combo** — EMP-Feld verlangsamt Gegner → sie stehen länger auf dem Minenfeld → mehr Detonationen.

10. **Prestige-Loop** — Stirb bewusst nach 3–5 Minuten in den ersten Runs um Prestige-Punkte zu sammeln. Die permanenten Boni machen jeden Run einfacher.
