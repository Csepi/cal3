# Dokumentáció Keresés optimalizálás {#documentation-search-optimization}

## SEO és Discovery {#seo-and-discovery}

- Használjon leíró jeleket és oldalcímeket.
- Győződjön meg arról, hogy minden gyűjtőoldal rendelkezik `description` metaadatokkal.
- Tartsa meg a kulcsszavakban gazdag kezdő bekezdéseket.
- Adjon hozzá szinonimákat és alternatív kifejezéseket a GYIK és a hibaelhárítási oldalakon.

## Portál keresése {#portal-search}

- A helyi teljes szöveges keresés alapértelmezés szerint engedélyezve van a `docs-portal`-ban.
- Az Algolia a következőkkel engedélyezhető:
  - `ALGOLIA_APP_ID`
  - `ALGOLIA_API_KEY`
  - `ALGOLIA_INDEX_NAME`

## Szempontok és szűrők {#facets-and-filters}

Metaadatmezők használata szempontdimenzióként:

- `category`
- `audience`
- `difficulty`
- `tags`

## Keresési hiányosság munkafolyamat {#search-gap-workflow}

1. Minden héten exportálja a nulla eredményű lekérdezéseket.
2. Lekérdezések leképezése meglévő oldalakra.
3. Adjon hozzá hiányzó dokumentumokat, vagy javítsa a metaadatokat/szinonimákat.
4. A következő jelentési ciklusban ellenőrizze újra a sikerességi arányt.
