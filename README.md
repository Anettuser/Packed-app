# Packed — *Nothing left behind.*

Nyugodt pakolólista utazásokhoz: több utazás és bőrönd, sablonok, súlybecslés
és súlykorlát, készülődési teendők, úti okmányok lejárata, valamint egy
(opcionális) AI biztosítás-ajánló.

**Vite + React.** Bejelentkezéssel (e-mail + jelszó) és **Supabase**-ben tárolt,
eszközök közt szinkronizált adatokkal. Supabase nélkül helyben azonnal kipróbálható
`localStorage`-zal is.

---

## 1. Helyi futtatás (gyors próba, bejelentkezés nélkül)

Kell: Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173 — localStorage-zal fut
npm run build      # éles build a dist/ mappába
```

Ha nincsenek beállítva a Supabase-változók, az app `localStorage`-zal indul
(böngészőben tárol, bejelentkezés nélkül). Ez jó a kipróbáláshoz.

## 2. Supabase beállítása (bejelentkezés + tartós, szinkron tárolás)

1. Hozz létre egy ingyenes projektet a https://supabase.com oldalon.
2. **Project Settings → API**: másold ki a `Project URL`-t és az `anon` `public`
   kulcsot.
3. **SQL Editor**: futtasd le ezt (létrehozza a kulcs-érték táblát és a
   jogosultságokat, hogy mindenki csak a saját adatait lássa):

   ```sql
   create table if not exists public.kv (
     user_id uuid not null references auth.users on delete cascade,
     key text not null,
     value text,
     updated_at timestamptz default now(),
     primary key (user_id, key)
   );

   alter table public.kv enable row level security;

   create policy "kv_select_own" on public.kv
     for select using (auth.uid() = user_id);
   create policy "kv_insert_own" on public.kv
     for insert with check (auth.uid() = user_id);
   create policy "kv_update_own" on public.kv
     for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
   create policy "kv_delete_own" on public.kv
     for delete using (auth.uid() = user_id);

   -- újabb Supabase projekteknél (2026) kellhet expliciten:
   grant usage on schema public to authenticated;
   grant select, insert, update, delete on public.kv to authenticated;
   ```

4. **Authentication → Sign In / Providers → Email**: a legegyszerűbb induláshoz
   kapcsold KI az e-mail megerősítést ("Confirm email"). Így a regisztráció után
   azonnal be is lép a felhasználó. (Ha bekapcsolva hagyod, regisztrációkor a
   felhasználó kap egy megerősítő e-mailt, és csak utána tud belépni.)

5. Helyi fejlesztéshez hozz létre egy `.env` fájlt (lásd `.env.example`):

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

   Az `anon` kulcs szándékosan publikus — az adatokat a fenti RLS védi.
   Ezután `npm run dev` már a bejelentkező képernyővel indul.

> Jó tudni: az ingyenes Supabase-projekt egy hét inaktivitás után szünetel
> (az adatok megmaradnak, a vezérlőpulton egy kattintással újraindítható).

## 3. Kitétel webre (Netlify)

Ajánlott: **Git + automatikus build**, mert így a környezeti változók és a
biztosítás-ajánló Functionje is működik.

1. Töltsd fel a projektet egy GitHub repóba.
2. Netlify → **Add new site → Import from Git** → válaszd a repót.
   A build beállítások a `netlify.toml`-ból jönnek.
3. Netlify → **Site settings → Environment variables**, add hozzá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` *(csak ha a biztosítás-ajánlót is szeretnéd — lásd 4. pont)*
4. Indíts egy deployt. (A `VITE_…` változók a buildbe épülnek, ezért minden
   változtatás után újra kell buildelni.)

## 4. Biztosítás-ajánló (opcionális)

Az Anthropic API-t hívja egy Netlify Functionön át (`netlify/functions/anthropic.js`,
elérhető `/api/anthropic` címen), hogy az API-kulcs ne kerüljön a böngészőbe.

1. Kulcs: https://console.anthropic.com → API Keys.
2. Netlify env változó: `ANTHROPIC_API_KEY` = a kulcsod, majd új deploy.

Kulcs nélkül minden más megy, csak az ajánló mutat hibát.

> A biztosítási javaslatok **tájékoztató jellegűek**, nem pénzügyi tanácsadás;
> az árak és feltételek változnak, kötés előtt mindig ellenőrizd a biztosítónál.

---

## Fájlszerkezet

```
packed-app/
  index.html
  package.json
  vite.config.js
  netlify.toml
  .env.example
  src/
    main.jsx            # belépés: Root (ha van Supabase) vagy App
    Root.jsx            # auth-kapu: munkamenet + tároló beállítása
    AuthScreen.jsx      # bejelentkezés / regisztráció
    App.jsx             # a teljes app
    supabaseClient.js   # Supabase kliens a környezeti változókból
    supabaseStorage.js  # kulcs-érték tároló a Supabase-ben
    storage-shim.js     # localStorage fallback (Supabase nélkül)
  netlify/
    functions/
      anthropic.js      # AI proxy a biztosítás-ajánlóhoz
```

## Megjegyzések

- Az adatok mostantól a bejelentkezett fiókhoz tartoznak, és minden eszközön
  ugyanazok. Más böngészőből/telefonról ugyanazzal az e-maillel belépve
  ott vannak az utazásaid.
- A korábbi, `localStorage`-ban tárolt adatok nem költöznek át automatikusan a
  fiókba — bejelentkezés után tiszta lappal indulsz.
