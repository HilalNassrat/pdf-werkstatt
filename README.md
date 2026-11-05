# PDF Werkstatt

Ein PDF-Werkzeug im Stil von iLovePDF, das komplett im Browser läuft – keine Uploads, keine Server.

**Live:** https://hilalnassrat.github.io/pdf-werkstatt/

## Funktionen

- **Zusammenfügen** – mehrere PDFs in beliebiger Reihenfolge verbinden
- **Teilen** – nach Bereichen, festen Abständen oder ausgewählten Seiten
- **Verkleinern** – drei Stufen + Graustufen, auch mehrere Dateien auf einmal (ZIP)
- **Bearbeiten** – Text, Abdecken, Markieren, Zeichnen, Bilder
- **Unterschreiben** – Unterschrift zeichnen und platzieren
- **Seiten organisieren / drehen** – sortieren, drehen, löschen, leere Seiten
- **Wasserzeichen** und **Seitenzahlen**
- **Bilder → PDF** und **PDF → Bilder** (JPG/PNG)

## Technik

Eine einzige `index.html` mit [pdf-lib](https://pdf-lib.js.org), [PDF.js](https://mozilla.github.io/pdf.js/), [JSZip](https://stuk.github.io/jszip/) und [SortableJS](https://sortablejs.github.io/Sortable/) per CDN.

## Einschränkungen

- Verkleinern (Stufen 1–3) rendert Seiten als Bilder – Text ist danach nicht mehr durchsuchbar.
- Kein Passwortschutz / Entsperren.
- Eingefügter Text nutzt Helvetica (Latin inkl. Umlaute, kein Arabisch).
