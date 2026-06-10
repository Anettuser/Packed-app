/* Adattárolás. Ha be vannak állítva a Supabase környezeti változók
   (VITE_SUPABASE_URL és VITE_SUPABASE_ANON_KEY), akkor a Supabase-t használja
   egyetlen "kv" táblán keresztül — így az adatok tartósak és minden eszközön
   ugyanazok. Ha nincsenek beállítva, localStorage-ra esik vissza (pl. helyi
   fejlesztéskor). A window.storage felület változatlan, így az app kódja
   ugyanaz marad. */

import { createClient } from "@supabase/supabase-js";

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TABLE = "kv";

function notFound() {
  const e = new Error("not found");
  return e;
}

function supabaseStore(client) {
  return {
    async get(key) {
      const { data, error } = await client
        .from(TABLE).select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return { key, value: data.value };
    },
    async set(key, value) {
      const { error } = await client
        .from(TABLE)
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      return { key, value };
    },
    async delete(key) {
      const { error } = await client.from(TABLE).delete().eq("key", key);
      if (error) throw error;
      return { key, deleted: true };
    },
    async list(prefix = "") {
      const { data, error } = await client
        .from(TABLE).select("key").like("key", `${prefix}%`);
      if (error) throw error;
      return { keys: (data || []).map((r) => r.key), prefix };
    },
  };
}

function localStore() {
  const mem = new Map();
  const back = (() => {
    try {
      const k = "__packed_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return window.localStorage;
    } catch (e) {
      return {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => mem.set(k, v),
        removeItem: (k) => mem.delete(k),
        key: (i) => Array.from(mem.keys())[i] ?? null,
        get length() { return mem.size; },
      };
    }
  })();
  return {
    async get(key) {
      const v = back.getItem(key);
      if (v === null || v === undefined) throw notFound();
      return { key, value: v };
    },
    async set(key, value) { back.setItem(key, value); return { key, value }; },
    async delete(key) { back.removeItem(key); return { key, deleted: true }; },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < back.length; i++) {
        const k = back.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      return { keys, prefix };
    },
  };
}

if (typeof window !== "undefined" && !window.storage) {
  window.storage =
    URL_ && ANON ? supabaseStore(createClient(URL_, ANON)) : localStore();
}
