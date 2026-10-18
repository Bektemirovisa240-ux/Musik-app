# Pulse – Alle Musik. Eine App.

Eine Web-App, die alle großen Musikplattformen zusammenbringt: **Spotify, YouTube, Apple Music, SoundCloud und Deezer**.
Durchsuche alle gleichzeitig, mische Songs verschiedener Plattformen in **einer** Warteschlange, sammle Favoriten
plattformübergreifend und höre alles direkt in der App – im dunklen LED-Design, dessen Farben langsam durch das
ganze Farbspektrum wandern.

## Funktionen

- 🖼️ **Echte Musik sofort, ohne Login** – Live-Charts mit echten Album-Covern, Künstlerfotos, Top-Alben & Playlists (Deezer, Ausweichquelle Apple/iTunes), animierte Cover-Wand
- 💿 **Album-, Künstler- & Playlist-Seiten** – alles abspielen oder zufällig
- 🔍 **Eine Suche für alles** – Treffer aller verbundenen Plattformen, nach Plattform filterbar
- 🔗 **Link einfügen = abspielen** – Spotify-, YouTube-, SoundCloud-, Apple-Music- und Deezer-Links
- 🎧 **Ein Player für alle** – Warteschlange, Zufall, Wiederholen, Lautstärke, Vollbild-Player, Leertaste = Play/Pause
- ♥ **Plattformübergreifende Favoriten** & „Zuletzt gehört“
- 📚 **Deine Bibliotheken** – Spotify-Lieblingssongs, YouTube-„Mag ich“, Apple-Music-Mediathek
- 🌈 **LED-Look** – dunkles Glas-Design, Farbe wechselt langsam (ein Durchlauf ≈ 3 Minuten), mobil optimiert

## Anmeldung mit deinen echten Konten

Die Anmeldung läuft immer über die **offizielle Login-Seite** der jeweiligen Plattform (OAuth). Du gibst dort deine
echte E-Mail und dein Passwort ein – die App selbst sieht dein Passwort nie. Tokens werden nur lokal im Browser
gespeichert. Damit eine App das darf, muss sie bei jeder Plattform einmalig als Entwickler-App registriert werden
(kostenlos, außer Apple). Die Schritte stehen auch direkt in der App unter **Verbindungen → Einrichtung**.

| Plattform | Was du brauchst | Wiedergabe |
|---|---|---|
| **Deezer** | nichts | 30-s-Hörproben (Deezer bietet keine offene Vollwiedergabe) |
| **SoundCloud** | nichts – Link einfügen | volle Songs |
| **YouTube** | Google OAuth Client-ID (+ optional API-Schlüssel) | volle Songs |
| **Spotify** | Spotify Client-ID | volle Songs mit **Premium** |
| **Apple Music** | Suche ohne Konto; für volle Songs Developer-Token (99 $/Jahr) | volle Songs mit Abo, sonst Hörproben |
| Amazon Music, Tidal | – | nicht möglich, keine öffentliche Wiedergabe-API |

### Spotify
1. <https://developer.spotify.com/dashboard> → *Create app*, Häkchen bei **Web API** und **Web Playback SDK**.
2. Redirect-URI eintragen – genau die Adresse, die die App unter *Verbindungen* anzeigt
   (lokal `http://127.0.0.1:5173/`, Spotify akzeptiert **nicht** `localhost`).
3. Client-ID in der App eintragen → *Mit Spotify anmelden*.
4. Im Entwicklungsmodus können sich nur Konten anmelden, die du im Dashboard unter **User Management** hinzufügst.

### YouTube
1. <https://console.cloud.google.com> → Projekt anlegen → **YouTube Data API v3** aktivieren.
2. *Anmeldedaten → OAuth-Client-ID → Webanwendung*, unter **Autorisierte JavaScript-Quellen** den Origin der App
   eintragen (z. B. `http://127.0.0.1:5173`). OAuth-Zustimmungsbildschirm konfigurieren und dich als Testnutzer hinzufügen.
3. Optional einen **API-Schlüssel** anlegen – dann funktioniert die YouTube-Suche auch ohne Anmeldung.

### Apple Music
Im Apple Developer Program einen **MusicKit-Schlüssel** erstellen und daraus einen Developer-Token (JWT, ES256) erzeugen.
Den Token in der App einfügen und mit der Apple-ID anmelden.

## Starten

```bash
npm install
npm run dev        # → http://127.0.0.1:5173
```

Schlüssel kannst du in der App eintragen oder als Umgebungsvariablen (siehe `.env.example`, als `.env.local` kopieren).

## Online stellen (GitHub Pages)

Der Workflow `.github/workflows/deploy.yml` baut die App bei jedem Push auf `main` und veröffentlicht sie.
Einmalig aktivieren: *Settings → Pages → Source: GitHub Actions*. Die Adresse
(`https://<user>.github.io/<repo>/`) dann als Redirect-URI bei Spotify bzw. als JavaScript-Quelle bei Google eintragen.
Schlüssel können optional als Repository-*Variables* (`VITE_SPOTIFY_CLIENT_ID` …) hinterlegt werden.

## Technik

React 19 + TypeScript + Vite, kein Backend. Jede Plattform ist ein Modul in `src/providers/` mit Suche, Login und einer
Wiedergabe-Engine (Spotify Web Playback SDK, YouTube IFrame API, SoundCloud Widget API, MusicKit JS, HTML-Audio).
`src/player/player.ts` steuert sie gemeinsam als ein Player.
