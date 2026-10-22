# MARSCHALL/ES auf Netlify veröffentlichen

Alles ist kostenlos. Dauer: ca. 10 Minuten. Du brauchst kein Terminal.

## 1. Gratis Gemini-Schlüssel holen
1. Öffne https://aistudio.google.com/apikey und melde dich mit deinem Google-Konto an.
2. Klicke auf **Create API key** und kopiere den Schlüssel. Er bleibt geheim und wird nur bei Netlify eingetragen.

## 2. Dateien auf GitHub hochladen
Netlify-Funktionen werden beim einfachen Drag & Drop **nicht** mit hochgeladen. Deshalb geht es über GitHub.
1. Erstelle ein Gratis-Konto auf https://github.com.
2. Klicke oben rechts auf **+** und dann **New repository**. Gib einen Namen ein, z. B. `puente-translator`, und klicke auf **Create repository**.
3. Klicke auf **uploading an existing file**.
4. Ziehe den **Inhalt** dieses `website`-Ordners in das Fenster: `index.html`, `app.js`, `netlify.toml` und den Ordner `netlify`. Klicke dann auf **Commit changes**.
   - Danach muss im Repository `netlify/functions/translate.mjs` zu sehen sein.

## 3. Mit Netlify verbinden
1. Erstelle ein Gratis-Konto auf https://app.netlify.com, am einfachsten mit „Sign up with GitHub“.
2. Klicke auf **Add new project**, dann **Import an existing project**, dann **GitHub**, und wähle dein Repository.
3. Lass alle Einstellungen so und klicke auf **Deploy**.

## 4. Schlüssel eintragen
1. Öffne bei Netlify dein Projekt, dann **Project configuration**, dann **Environment variables**, dann **Add a variable**.
2. Key: `GEMINI_API_KEY`, Value: dein Schlüssel aus Schritt 1. Speichern.
3. Gehe zu **Deploys**, dann **Trigger deploy**, dann **Deploy project**, damit der Schlüssel aktiv wird.

Fertig. Deine Seite läuft unter `https://<name>.netlify.app`. Unter **Project configuration → Change project name** kannst du den Namen ändern, und unter **Domain management** eine eigene Domain verbinden.

## Später etwas ändern
Ändere die Datei auf GitHub (Stift-Symbol), und Netlify veröffentlicht die neue Version automatisch.

## Falls das Modell irgendwann nicht mehr geht
Google ersetzt ältere Modelle ab und zu. Wenn die Seite dann „Übersetzung fehlgeschlagen“ meldet, lege bei Netlify zusätzlich die Variable `GEMINI_MODEL` an. Trage als Wert ein aktuelles Flash-Modell aus https://ai.google.dev/gemini-api/docs/models ein und deploye neu.
