# vendor/

Alle Bibliotheken liegen lokal im Repo, damit beim Benutzen der Seite **keine einzige Anfrage an fremde Server** geht (kein CDN, kein Google Fonts) und die App offline funktioniert. Die Dateien sind unverändert aus den offiziellen npm-Paketen kopiert.

| Datei | Paket | Version | SHA-384 |
|---|---|---|---|
| pdf-lib.min.js | pdf-lib | 1.17.1 | `sha384-weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI` |
| pdf.min.js, pdf.worker.min.js, cmaps/, standard_fonts/ | pdfjs-dist | 3.11.174 | `sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e` (pdf.min.js) |
| jszip.min.js | jszip | 3.10.1 | `sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG` |
| Sortable.min.js | sortablejs | 1.15.0 | `sha384-eeLEhtwdMwD3X9y+8P3Cn7Idl/M+w8H4uZqkgD/2eJVkWIN1yKzEj6XegJ9dL3q0` |
| fonts/*.woff2 | @fontsource-variable/plus-jakarta-sans | 5.3.0 | – |

Aktualisieren: `npm pack <paket>@<version>`, Datei aus `package/dist` bzw. `package/build` hierher kopieren, Version in `sw.js` (`VERSION`) hochzählen.

Lizenzen: siehe LICENSE-*-Dateien (pdf-lib MIT, PDF.js Apache-2.0, JSZip MIT/GPLv3 dual, SortableJS MIT, Plus Jakarta Sans SIL OFL 1.1).
