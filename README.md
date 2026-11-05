# PDF Werkstatt

Ein PDF-Werkzeug im Stil von iLovePDF, das komplett im Browser läuft – keine Uploads, keine Server, keine Anfragen an Dritte.

**Live:** https://hilalnassrat.github.io/pdf-werkstatt/

## Funktionen

- **Zusammenfügen** – mehrere PDFs in beliebiger Reihenfolge verbinden
- **Teilen** – nach Bereichen, festen Abständen oder ausgewählten Seiten
- **Verkleinern** – drei Stufen, „Nur optimieren“ oder eigene Einstellung (dpi + Bildqualität), Graustufen, mehrere Dateien auf einmal (ZIP)
- **Bearbeiten** – Text, Abdecken, Markieren, Zeichnen, Bilder
- **Unterschreiben** – Unterschrift zeichnen und platzieren
- **Seiten organisieren / drehen** – sortieren (Maus, Touch oder Tastatur: Alt + Pfeiltasten), drehen, löschen, leere Seiten
- **Wasserzeichen** und **Seitenzahlen**
- **Bilder → PDF** und **PDF → Bilder** (JPG/PNG)
- **Passwortgeschützte PDFs** lassen sich mit Passwort öffnen (ansehen, verkleinern, in Bilder umwandeln)
- **Offline nutzbar** und als App installierbar (PWA)

## Datenschutz

- Alle Bibliotheken und die Schrift liegen in [`vendor/`](vendor/README.md) – kein CDN, kein Google Fonts.
- Eine Content-Security-Policy (`connect-src 'self'`) verhindert technisch, dass die Seite Daten an andere Server schickt.
- Der Service Worker speichert nur die App-Dateien, nie deine PDFs.

## Technik

Eine `index.html` mit [pdf-lib](https://pdf-lib.js.org), [PDF.js](https://mozilla.github.io/pdf.js/), [JSZip](https://stuk.github.io/jszip/) und [SortableJS](https://sortablejs.github.io/Sortable/). Kein Build-Schritt.

Lokal starten: `npm start` (oder irgendein statischer Server).

Tests (Playwright, End-to-End): `npm i && npx playwright install chromium && npm test`

Nach Änderungen an Dateien in `vendor/` oder `index.html`: `VERSION` in `sw.js` hochzählen, damit installierte Apps die neue Version laden.

## Einschränkungen

- Verkleinern (alle Stufen außer „Nur optimieren“) rendert Seiten als Bilder – Text ist danach nicht mehr durchsuchbar.
- Verschlüsselte PDFs können nicht verändert werden (zusammenfügen, bearbeiten …) – das kann pdf-lib nicht.
- Eingefügter Text nutzt Helvetica (Latin inkl. Umlaute, kein Arabisch).
