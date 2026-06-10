import { supabase } from "./supabaseClient";

/* A felhasználó adatait egy egyszerű kulcs-érték táblában tároljuk (kv).
   Ugyanazt a felületet adja, mint a Claude.ai window.storage API-ja, így
   az App.jsx változatlanul fut. Soronkénti RLS gondoskodik róla, hogy
   mindenki csak a saját adatait lássa. */

const TABLE = "kv";

export function makeStorage(userId) {
  return {
    async get(key) {
      const { data, error } = await supabase
        .from(TABLE)
        .select("value")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("not found");
      return { key, value: data.value };
    },
    async set(key, value) {
      const { error } = await supabase
        .from(TABLE)
        .upsert(
          { user_id: userId, key, value, updated_at: new Date().toISOString() },
          { onConflict: "user_id,key" }
        );
      if (error) throw error;
      return { key, value };
    },
    async delete(key) {
      await supabase.from(TABLE).delete().eq("user_id", userId).eq("key", key);
      return { key, deleted: true };
    },
    async list(prefix = "") {
      const { data } = await supabase
        .from(TABLE)
        .select("key")
        .eq("user_id", userId)
        .like("key", prefix + "%");
      return { keys: (data || []).map((r) => r.key), prefix };
    },
  };
}

let installedFor = null;
export function installStorage(userId) {
  if (typeof window === "undefined") return;
  if (installedFor === userId && window.storage) return;
  window.storage = makeStorage(userId);
  installedFor = userId;
}
