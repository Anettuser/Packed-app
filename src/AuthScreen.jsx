import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const T = {
  bg: "#E8ECE0", bg2: "#EFF2E8", surface: "#FCFDF9", ink: "#2B3326",
  soft: "#61705A", moss: "#5B7350", mossDeep: "#41523A", line: "#D8DECC", danger: "#9a4039",
};

export default function AuthScreen() {
  const [mode, setMode] = useState("in"); // in | up
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {tone, text}

  const submit = async () => {
    if (!email.trim() || pw.length < 6) {
      setMsg({ tone: "err", text: "Adj meg e-mailt és legalább 6 karakteres jelszót." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pw });
        if (error) throw error;
        if (!data.session) {
          setMsg({ tone: "ok", text: "Nézd meg az e-mailed a megerősítéshez, majd jelentkezz be." });
          setMode("in");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
      }
    } catch (e) {
      setMsg({ tone: "err", text: humanError(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.mark} aria-hidden="true">
          <svg viewBox="0 0 64 64" width="30" height="30">
            <path d="M24 18v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" fill="none"
              stroke={T.moss} strokeWidth="3.4" strokeLinecap="round" />
            <rect x="12" y="18" width="40" height="34" rx="8" fill={T.moss} />
            <path d="M24 35l5.5 5.5 11-13" fill="none" stroke={T.surface}
              strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={S.title}>Packed</h1>
        <p style={S.tag}>Nothing left behind.</p>

        <div style={S.tabs}>
          <button style={tab(mode === "in")} onClick={() => { setMode("in"); setMsg(null); }}>Bejelentkezés</button>
          <button style={tab(mode === "up")} onClick={() => { setMode("up"); setMsg(null); }}>Regisztráció</button>
        </div>

        <input style={S.input} type="email" placeholder="E-mail" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={S.input} type="password"
          placeholder={mode === "up" ? "Jelszó (min. 6 karakter)" : "Jelszó"}
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          value={pw} onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />

        {msg && <p style={msg.tone === "err" ? S.err : S.okmsg}>{msg.text}</p>}

        <button style={S.cta} onClick={submit} disabled={busy}>
          {busy ? "Egy pillanat…" : mode === "up" ? "Fiók létrehozása" : "Belépés"}
        </button>

        <p style={S.fine}>Az adataid a fiókodhoz kötve, eszközök közt szinkronban tárolódnak.</p>
      </div>
    </div>
  );
}

function humanError(e) {
  const m = (e && e.message) || "";
  if (/invalid login/i.test(m)) return "Hibás e-mail vagy jelszó.";
  if (/already registered|already exists/i.test(m)) return "Ezzel az e-maillel már van fiók — jelentkezz be.";
  if (/rate limit/i.test(m)) return "Túl sok próbálkozás, várj egy kicsit.";
  return "Valami nem sikerült. Próbáld újra.";
}

const tab = (on) => ({
  flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontFamily: "'Mulish',sans-serif",
  fontWeight: 700, fontSize: 13.5, borderRadius: 9,
  background: on ? "#fff" : "transparent", color: on ? T.mossDeep : T.soft,
  boxShadow: on ? "0 1px 3px rgba(43,51,38,.08)" : "none",
});

const S = {
  root: {
    minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, boxSizing: "border-box",
    background: `radial-gradient(120% 80% at 10% -10%, ${T.bg2} 0%, ${T.bg} 55%)`,
    fontFamily: "'Mulish',system-ui,sans-serif", color: T.ink,
  },
  card: {
    width: "100%", maxWidth: 380, background: T.surface, border: `1px solid ${T.line}`,
    borderRadius: 20, padding: "30px 26px", textAlign: "center",
    boxShadow: "0 10px 40px rgba(43,51,38,.08)",
  },
  mark: {
    width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px", display: "grid",
    placeItems: "center", background: "#fff", border: `1px solid ${T.line}`,
  },
  title: { fontFamily: "'Fraunces',Georgia,serif", fontWeight: 500, fontSize: 28, margin: 0 },
  tag: { fontFamily: "'Fraunces',Georgia,serif", fontStyle: "italic", color: T.soft, fontSize: 14, margin: "2px 0 20px" },
  tabs: { display: "flex", gap: 4, background: "#EEF1E9", borderRadius: 11, padding: 4, marginBottom: 16 },
  input: {
    width: "100%", boxSizing: "border-box", fontFamily: "'Mulish',sans-serif", fontSize: 15,
    color: T.ink, background: "#fff", border: `1px solid ${T.line}`, borderRadius: 11,
    padding: "12px 13px", marginBottom: 10, outline: "none",
  },
  cta: {
    width: "100%", fontFamily: "'Mulish',sans-serif", fontWeight: 700, fontSize: 15, color: "#fff",
    background: T.moss, border: "none", borderRadius: 12, padding: "12px", cursor: "pointer", marginTop: 4,
  },
  err: { color: T.danger, fontSize: 13, margin: "0 0 10px", lineHeight: 1.4 },
  okmsg: { color: T.mossDeep, fontSize: 13, margin: "0 0 10px", lineHeight: 1.4 },
  fine: { color: "#93A089", fontSize: 12, margin: "16px 0 0", lineHeight: 1.5 },
};
