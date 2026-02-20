# GRIDCORE — Tower Defense

Ein grid-basiertes Tower Defense Spiel im Browser. Baue Türme, produziere Ressourcen, erforsche neue Technologien und verteidige deinen Kern gegen endlose Gegnerwellen.

**[🎮 Jetzt spielen →](https://grid.florianscholz.dev)**

---

## Spielprinzip

Du platzierst deinen Kern auf einem 30×30 Raster. Gegner spawnen am Rand und laufen auf ihn zu. Deine Aufgabe: eine effiziente Verteidigungsanlage aufbauen, bevor sie durchkommen.

Ressourcen werden passiv von Produktionsgebäuden erzeugt. Mit Kills verdienst du **Kill Points (KP)**, mit denen du im **Tech-Baum** neue Gebäude dauerhaft (run-übergreifend) freischaltest.

## Spielmodi

| Modus | Beschreibung |
|-------|-------------|
| **Endlos** | Gegner kommen ununterbrochen, Spawn-Intervall schrumpft mit der Zeit |
| **Wellen** | Wellen mit Bauphasen dazwischen — geordneter, strategischer |

## Schwierigkeiten

| | Leicht | Mittel | Schwer |
|--|--------|--------|--------|
| Gegner-HP Start | 100 | 150 | 200 |
| HP/Sekunde | +3 | +5 | +8 |
| Spawn-Minimum | 600ms | 400ms | 250ms |
| Kern-Schaden | 60 | 100 | 150 |

## Features

- **30+ Gebäude** in 6 Tech-Tree-Tiers (Basis bis Ultimativ)
- **11 Module** die Türme und Produzenten modifizieren
- **Run-basiertes Forschungssystem** mit 10 Nodes und Tier-Progression
- **Permanentes Prestige-System** — KP aus Runs investieren für dauerhafe Boni
- **Marktplatz** zum Tauschen von Ressourcen mit dynamischen Preisen
- **Map Events** (Sonnensturm, Meteoritenregen, Schrottquelle, …)
- **Speichern/Laden** per localStorage
- **Statistik-Overlay** mit Schaden-Tracking pro Gebäude

## Ressourcen

```
Schrott  →  Stahl       (Gießerei / Stahlschmelze)
Schrott  →  Elektronik  (E-Fabrik / Kristallbohrer)
Stahl
Elektronik  →  Daten    (Forschungslabor)
```

Energie wird von fast allen Gebäuden verbraucht und hauptsächlich durch Solarfelder erzeugt.

## Tech-Baum (Kill Points)

| Tier | Kosten | Beispiele |
|------|--------|-----------|
| T1 — Basis | 5 KP | Gießerei, Minenfeld, Reparaturbucht |
| T2 — Erweitert | 15 KP | Sturmgeschütz, Teslaspule, Schildgenerator |
| T3 — Fortgeschritten | 30 KP | Laserturm, Fusionsreaktor, Radar |
| T4 — Elite | 200 KP | Plasmakanone, Drohnenhangar, Data Vault |
| T5 — Legendär | 500 KP | Artillerie, Ionenkanone, Shockwave Tower |
| T6 — Ultimativ | 100 KP | Vernichter, Gravitationskanone, Hyperreaktor |

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Build & Deploy (Docker)

```bash
docker build -t gridcore .
docker run -p 8080:80 gridcore
```

Oder mit Docker Compose:

```bash
docker-compose up
```

## Stack

- **React + TypeScript** (Vite)
- **Canvas 2D** für Rendering (kein WebGL, kein Game-Framework)
- **Keine externen Game-Dependencies** — alles von Hand
