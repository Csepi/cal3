# Dokumentáció minőségbiztosítás {#documentation-quality-assurance}

## Automatizált ellenőrzések {#automated-checks}

- Linkellenőrző: `node scripts/docs/check-links.cjs`
- Metaadat-ellenőrző: `node scripts/docs/check-metadata.cjs`
- Portál felépítésének ellenőrzése: `cd docs-portal && npm run build`

## Ajánlott CI Pipeline {#recommended-ci-pipeline}

1. Futtassa le a leértékelési hivatkozás ellenőrzését.
2. Metaadat-ellenőrzés futtatása kanonikus dokumentumterületeken.
3. Dokumentumportál létrehozása a renderelési és útvonali hibák észleléséhez.
4. Sikertelen a folyamat minden hibás hivatkozás vagy hiányzó metaadat esetén.

## Képernyőkép Frissítési ütemezés {#screenshot-refresh-schedule}

- Havi: ellenőrizze a kritikus felhasználói folyamat képernyőképeit.
- Negyedévente: a teljes képernyőkép az összes legfelső szintű területen.
- Kiadás alapú: frissítse a funkciók változásai által érintett képernyőképeket.

## Negyedéves ellenőrzési folyamat {#quarterly-audit-process}

1. Futtassa újra a leltárt és ismételje meg az észlelést.
2. Tekintse át az archivált tartalmat, és hagyja abba az elavult átirányításokat.
3. Hasonlítsa össze a keresési hiányosságokat a támogatási jegyekkel.
4. Részesítse a hiányzó dokumentumokat a használat hatása alapján.
