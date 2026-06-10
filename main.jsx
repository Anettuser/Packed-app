import React from "react";
import { createRoot } from "react-dom/client";
import "./storage-shim.js";
import { supabaseReady } from "./supabaseClient";
import App from "./App.jsx";
import Root from "./Root.jsx";

/* Ha be van állítva a Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY),
   bejelentkezéssel, szinkronizált tárolással fut. Ha nincs, localStorage-zal
   indul, hogy helyben is azonnal kipróbálható legyen. */
createRoot(document.getElementById("root")).render(
  supabaseReady ? <Root /> : <App />
);
