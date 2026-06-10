import React, { useState, useEffect, useRef } from "react";

/* A biztosítás-ajánló a saját Netlify Functionön keresztül hívja az AI-t,
   hogy az API-kulcs ne kerüljön a böngészőbe. */
const AI_ENDPOINT = "/api/anthropic";


/* ------------------------------------------------------------------ */
/*  Útravaló — nyugodt pakolólista utazásokhoz                         */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { key: "dokumentum", label: "Dokumentumok", color: "#B58B5A" },
  { key: "ruhazat", label: "Ruházat", color: "#6F8F86" },
  { key: "higienia", label: "Higiénia", color: "#7FA9B0" },
  { key: "elektronika", label: "Elektronika", color: "#8A8FA8" },
  { key: "egeszseg", label: "Egészség", color: "#B07A7A" },
  { key: "felszereles", label: "Felszerelés", color: "#7E8B53" },
  { key: "egyeb", label: "Egyéb", color: "#9A9488" },
];
const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const TEMPLATES = {
  tengerpart: {
    label: "Tengerparti nyaralás",
    blurb: "Nap, homok, fürdőruha",
    items: [
      ["Útlevél / személyi", "dokumentum", 1],
      ["Repülőjegy", "dokumentum", 1],
      ["Szállásfoglalás", "dokumentum", 1],
      ["Fürdőruha", "ruhazat", 2],
      ["Póló", "ruhazat", 4],
      ["Rövidnadrág", "ruhazat", 3],
      ["Könnyű ruha", "ruhazat", 2],
      ["Szandál", "ruhazat", 1],
      ["Strandpapucs", "ruhazat", 1],
      ["Naptej", "higienia", 1],
      ["After sun", "higienia", 1],
      ["Fogkefe + fogkrém", "higienia", 1],
      ["Dezodor", "higienia", 1],
      ["Telefontöltő", "elektronika", 1],
      ["Powerbank", "elektronika", 1],
      ["Napszemüveg", "egyeb", 1],
      ["Strandtörölköző", "egyeb", 1],
      ["Kalap / sapka", "egyeb", 1],
      ["Könyv", "egyeb", 1],
    ],
  },
  sieles: {
    label: "Síelés / téli",
    blurb: "Hó, lejtő, meleg réteg",
    items: [
      ["Útlevél / személyi", "dokumentum", 1],
      ["Síbérlet", "dokumentum", 1],
      ["Utasbiztosítás", "dokumentum", 1],
      ["Sídzseki", "ruhazat", 1],
      ["Sínadrág", "ruhazat", 1],
      ["Hőalsó", "ruhazat", 2],
      ["Sízokni", "ruhazat", 3],
      ["Pulóver", "ruhazat", 2],
      ["Kesztyű", "ruhazat", 1],
      ["Sapka", "ruhazat", 1],
      ["Csősál", "ruhazat", 1],
      ["Síszemüveg", "felszereles", 1],
      ["Sisak", "felszereles", 1],
      ["Ajakápoló", "higienia", 1],
      ["Naptej", "higienia", 1],
      ["Telefontöltő", "elektronika", 1],
      ["Fájdalomcsillapító", "egeszseg", 1],
    ],
  },
  varos: {
    label: "Városnéző / city break",
    blurb: "Séta, kávé, látnivalók",
    items: [
      ["Útlevél / személyi", "dokumentum", 1],
      ["Bankkártya", "dokumentum", 1],
      ["Jegyek / térkép", "dokumentum", 1],
      ["Kényelmes cipő", "ruhazat", 1],
      ["Póló", "ruhazat", 3],
      ["Nadrág", "ruhazat", 2],
      ["Pulóver", "ruhazat", 1],
      ["Átmeneti kabát", "ruhazat", 1],
      ["Fogkefe + fogkrém", "higienia", 1],
      ["Dezodor", "higienia", 1],
      ["Sampon", "higienia", 1],
      ["Telefontöltő", "elektronika", 1],
      ["Powerbank", "elektronika", 1],
      ["Fülhallgató", "elektronika", 1],
      ["Esernyő", "egyeb", 1],
      ["Kis hátizsák", "egyeb", 1],
    ],
  },
  uzleti: {
    label: "Üzleti út",
    blurb: "Tárgyalás, laptop, elegancia",
    items: [
      ["Személyi / útlevél", "dokumentum", 1],
      ["Névjegykártya", "dokumentum", 1],
      ["Nyomtatott dokumentumok", "dokumentum", 1],
      ["Öltöny / kosztüm", "ruhazat", 1],
      ["Ing / blúz", "ruhazat", 3],
      ["Alkalmi cipő", "ruhazat", 1],
      ["Öv", "ruhazat", 1],
      ["Zokni", "ruhazat", 3],
      ["Laptop", "elektronika", 1],
      ["Laptoptöltő", "elektronika", 1],
      ["Telefontöltő", "elektronika", 1],
      ["Powerbank", "elektronika", 1],
      ["Fogkefe + fogkrém", "higienia", 1],
      ["Dezodor", "higienia", 1],
      ["Parfüm", "higienia", 1],
      ["Borotva", "higienia", 1],
      ["Jegyzetfüzet", "egyeb", 1],
      ["Toll", "egyeb", 2],
    ],
  },
  hetvege: {
    label: "Hétvégi rövid út",
    blurb: "Két nap, kis táska",
    items: [
      ["Személyi", "dokumentum", 1],
      ["Bankkártya", "dokumentum", 1],
      ["Póló", "ruhazat", 2],
      ["Nadrág", "ruhazat", 1],
      ["Alsónemű", "ruhazat", 2],
      ["Zokni", "ruhazat", 2],
      ["Pulóver", "ruhazat", 1],
      ["Fogkefe + fogkrém", "higienia", 1],
      ["Dezodor", "higienia", 1],
      ["Telefontöltő", "elektronika", 1],
      ["Könyv", "egyeb", 1],
    ],
  },
  kemping: {
    label: "Kemping / túra",
    blurb: "Sátor, ösvény, szabadég",
    items: [
      ["Személyi", "dokumentum", 1],
      ["Sátor", "felszereles", 1],
      ["Hálózsák", "felszereles", 1],
      ["Hálómatrac", "felszereles", 1],
      ["Túrabakancs", "felszereles", 1],
      ["Fejlámpa", "felszereles", 1],
      ["Bicska", "felszereles", 1],
      ["Túranadrág", "ruhazat", 2],
      ["Funkciós póló", "ruhazat", 3],
      ["Esőkabát", "ruhazat", 1],
      ["Túrazokni", "ruhazat", 3],
      ["Polár pulóver", "ruhazat", 1],
      ["Elsősegélykészlet", "egeszseg", 1],
      ["Rovarriasztó", "egeszseg", 1],
      ["Naptej", "egeszseg", 1],
      ["Kulacs", "egyeb", 1],
      ["Pótelem", "egyeb", 1],
      ["Gyufa / öngyújtó", "egyeb", 1],
    ],
  },
};

/* ----------------------------- helpers ---------------------------- */
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* becsült egységsúly grammban: kulcsszó -> gramm; ha nincs találat, kategória-alap */
const WEIGHT_RULES = [
  [/útlevél|személyi|bankkártya|névjegy/, 30],
  [/jegy|foglalás|bérlet|biztosítás|dokumentum|térkép/, 25],
  [/öltöny|kosztüm/, 900],
  [/sídzseki|dzseki|kabát|esőkabát/, 600],
  [/polár|pulóver/, 350],
  [/túranadrág|sínadrág|nadrág/, 400],
  [/ing|blúz/, 200],
  [/funkciós póló|póló/, 150],
  [/fürdőruha/, 120],
  [/könnyű ruha|ruha/, 250],
  [/hőalsó/, 200],
  [/sízokni|túrazokni|zokni/, 60],
  [/alsónemű/, 50],
  [/túrabakancs|bakancs|cipő/, 800],
  [/szandál|papucs/, 300],
  [/kalap|sapka/, 100],
  [/kesztyű/, 80],
  [/csősál|sál/, 100],
  [/öv\b/, 150],
  [/laptoptöltő/, 300],
  [/laptop/, 1500],
  [/powerbank/, 250],
  [/töltő/, 80],
  [/fülhallgató/, 60],
  [/naptej|after sun|sampon|parfüm/, 200],
  [/fogkefe|fogkrém/, 80],
  [/dezodor/, 100],
  [/borotva/, 80],
  [/ajakápoló/, 15],
  [/napszemüveg|síszemüveg/, 80],
  [/sisak/, 500],
  [/törölköző/, 400],
  [/könyv/, 350],
  [/esernyő/, 350],
  [/hátizsák/, 700],
  [/jegyzetfüzet/, 250],
  [/toll/, 10],
  [/sátor/, 2500],
  [/hálózsák/, 1200],
  [/hálómatrac|matrac/, 800],
  [/fejlámpa/, 150],
  [/bicska/, 100],
  [/elsősegély/, 300],
  [/rovarriasztó/, 150],
  [/kulacs/, 200],
  [/elem/, 50],
  [/gyufa|öngyújtó/, 30],
];
const CAT_WEIGHT = {
  dokumentum: 30, ruhazat: 200, higienia: 100, elektronika: 250,
  egeszseg: 50, felszereles: 600, egyeb: 200,
};
function estWeight(name, cat) {
  const n = (name || "").toLowerCase();
  for (const [re, g] of WEIGHT_RULES) if (re.test(n)) return g;
  return CAT_WEIGHT[cat] ?? 200;
}
function fmtWeight(g) {
  if (g <= 0) return "0 g";
  if (g < 1000) return Math.round(g / 10) * 10 + " g";
  return (g / 1000).toFixed(1).replace(".", ",") + " kg";
}

/* okmány lejárat állapota: "expired" | "soon" (fél éven belül) | "ok" | null */
const DAY = 86400000;
function docStatus(expiry) {
  if (!expiry) return null;
  const d = new Date(expiry + "T00:00:00");
  if (isNaN(d)) return null;
  const days = Math.floor((d - new Date(new Date().toDateString())) / DAY);
  if (days < 0) return { kind: "expired", days };
  if (days < 183) return { kind: "soon", days };
  return { kind: "ok", days };
}
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  if (isNaN(d)) return s;
  return d.toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });
}
const DOC_SUGGESTIONS = ["Útlevél", "Személyi igazolvány", "Jogosítvány", "Lakcímkártya"];
const seedPreps = () => [
  { id: uid(), label: "Utasbiztosítás megkötése", done: false, kind: "insurance" },
];

const storeOk = () => typeof window !== "undefined" && !!window.storage;
const KEY = "utravalo:trips:v1";
const isMissing = (e) => e && e.message === "not found";

/* régi mentések kiegészítése bőröndökkel és súllyal */
function normalizeTrip(t) {
  let cases = Array.isArray(t.cases) && t.cases.length
    ? t.cases
    : [{ id: uid(), name: "Bőrönd 1" }];
  const firstCase = cases[0].id;
  const items = (t.items || []).map((i) => ({
    packed: false,
    qty: 1,
    ...i,
    caseId: i.caseId && cases.some((c) => c.id === i.caseId) ? i.caseId : firstCase,
    w: typeof i.w === "number" ? i.w : estWeight(i.name, i.cat),
  }));
  const preps = Array.isArray(t.preps) ? t.preps : seedPreps();
  let tplItems = Array.isArray(t.tplItems) ? t.tplItems : null;
  if (!tplItems) {
    let entry = t.templateKey ? TEMPLATES[t.templateKey] : null;
    if (!entry && t.tplLabel) entry = Object.values(TEMPLATES).find((x) => x.label === t.tplLabel);
    if (entry) tplItems = entry.items.map(([n, c, q]) => ({ name: n, cat: c, qty: q, w: estWeight(n, c) }));
  }
  return { ...t, cases, items, preps, tplItems };
}

async function loadTrips() {
  if (!storeOk()) return null;
  let res = null;
  try {
    res = await window.storage.get(KEY);
  } catch (e) {
    if (!isMissing(e)) throw e;
  }
  if (res && res.value) return JSON.parse(res.value).map(normalizeTrip);
  return [];
}
async function persist(trips) {
  if (!storeOk()) return;
  try {
    await window.storage.set(KEY, JSON.stringify(trips));
  } catch (e) {
    console.error("Mentés sikertelen:", e);
  }
}

const TKEY = "utravalo:templates:v1";
async function loadTemplates() {
  if (!storeOk()) return [];
  let r = null;
  try {
    r = await window.storage.get(TKEY);
  } catch (e) {
    if (!isMissing(e)) throw e;
  }
  if (r && r.value) return JSON.parse(r.value);
  return [];
}
async function persistTemplates(tpls) {
  if (!storeOk()) return;
  try {
    await window.storage.set(TKEY, JSON.stringify(tpls));
  } catch (e) {
    console.error("Sablon mentése sikertelen:", e);
  }
}

const DKEY = "utravalo:docs:v1";
async function loadDocs() {
  if (!storeOk()) return [];
  let r = null;
  try {
    r = await window.storage.get(DKEY);
  } catch (e) {
    if (!isMissing(e)) throw e;
  }
  if (r && r.value) return JSON.parse(r.value);
  return [];
}
async function persistDocs(docs) {
  if (!storeOk()) return;
  try {
    await window.storage.set(DKEY, JSON.stringify(docs));
  } catch (e) {
    console.error("Okmány mentése sikertelen:", e);
  }
}

const newItemsFrom = (templateKey, caseId) =>
  (TEMPLATES[templateKey]?.items || []).map(([name, cat, qty]) => ({
    id: uid(),
    name,
    cat,
    qty,
    packed: false,
    w: estWeight(name, cat),
    caseId,
  }));

/* --------------------------- progress ring ------------------------ */
function Ring({ value, size = 56, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = value >= 1;
  return (
    <svg width={size} height={size} className="uv-ring" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--track)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={done ? "var(--moss)" : "var(--moss)"} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

/* ------------------------------ app ------------------------------- */
export default function App({ account = null } = {}) {
  const [trips, setTrips] = useState([]);
  const [customTpls, setCustomTpls] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [openId, setOpenId] = useState(null); // null = home
  const [creating, setCreating] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  useEffect(() => {
    let on = true;
    Promise.all([loadTrips(), loadTemplates(), loadDocs()])
      .then(([t, tpls, d]) => {
        if (!on) return;
        setTrips(t || []);
        setCustomTpls(tpls || []);
        setDocs(d || []);
        setLoaded(true);
      })
      .catch(() => {
        if (!on) return;
        setLoadError(true); // loaded marad false -> nem írunk felül semmit
      });
    return () => (on = false);
  }, []);

  useEffect(() => {
    if (loaded) persist(trips);
  }, [trips, loaded]);
  useEffect(() => {
    if (loaded) persistTemplates(customTpls);
  }, [customTpls, loaded]);
  useEffect(() => {
    if (loaded) persistDocs(docs);
  }, [docs, loaded]);

  const open = trips.find((t) => t.id === openId) || null;

  /* sel: "" üres · "b:kulcs" beépített · "c:id" saját */
  const addTrip = (name, sel) => {
    const firstCase = { id: uid(), name: "Bőrönd 1" };
    let cases = [firstCase];
    let items = [];
    let tplLabel = null;
    let tplItems = null;

    if (sel && sel.startsWith("b:")) {
      const key = sel.slice(2);
      items = newItemsFrom(key, firstCase.id);
      tplLabel = TEMPLATES[key]?.label || null;
      tplItems = (TEMPLATES[key]?.items || []).map(([n, c, q]) => ({
        name: n, cat: c, qty: q, w: estWeight(n, c),
      }));
    } else if (sel && sel.startsWith("c:")) {
      const tpl = customTpls.find((t) => t.id === sel.slice(2));
      if (tpl) {
        cases = tpl.cases.map((c) => ({
          id: uid(),
          name: c.name,
          ...(c.limit ? { limit: c.limit } : {}),
        }));
        items = tpl.items.map((it) => ({
          id: uid(),
          name: it.name,
          cat: it.cat,
          qty: it.qty,
          packed: false,
          w: typeof it.w === "number" ? it.w : estWeight(it.name, it.cat),
          caseId: cases[Math.min(it.caseIdx || 0, cases.length - 1)].id,
        }));
        tplLabel = tpl.label;
        tplItems = tpl.items.map((it) => ({
          name: it.name, cat: it.cat, qty: it.qty,
          w: typeof it.w === "number" ? it.w : estWeight(it.name, it.cat),
        }));
      }
    }

    const trip = {
      id: uid(),
      name: name.trim() || "Névtelen utazás",
      tplLabel,
      tplItems,
      created: Date.now(),
      cases,
      items,
      preps: seedPreps(),
    };
    setTrips((p) => [trip, ...p]);
    setCreating(false);
    setOpenId(trip.id);
  };

  const updateTrip = (id, fn) =>
    setTrips((p) => p.map((t) => (t.id === id ? fn(t) : t)));

  const removeTrip = (id) => {
    setTrips((p) => p.filter((t) => t.id !== id));
    setOpenId(null);
  };

  const saveTemplate = (trip, label) => {
    const idx = {};
    trip.cases.forEach((c, i) => (idx[c.id] = i));
    const tpl = {
      id: uid(),
      label: label.trim() || trip.name,
      created: Date.now(),
      cases: trip.cases.map((c) => ({ name: c.name, ...(c.limit ? { limit: c.limit } : {}) })),
      items: trip.items.map((it) => ({
        name: it.name, cat: it.cat, qty: it.qty, w: it.w, caseIdx: idx[it.caseId] ?? 0,
      })),
    };
    setCustomTpls((p) => [tpl, ...p]);
  };
  const removeTemplate = (id) =>
    setCustomTpls((p) => p.filter((t) => t.id !== id));

  const togglePrep = (tripId, prepId) =>
    updateTrip(tripId, (t) => ({
      ...t,
      preps: t.preps.map((p) => (p.id === prepId ? { ...p, done: !p.done } : p)),
    }));
  const addDoc = (label, expiry) =>
    setDocs((p) => [...p, { id: uid(), label: label.trim() || "Okmány", expiry: expiry || "" }]);
  const updateDoc = (id, patch) =>
    setDocs((p) => p.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const removeDoc = (id) => setDocs((p) => p.filter((d) => d.id !== id));

  if (loadError) {
    return (
      <div className="uv-root">
        <Style />
        <div className="uv-shell">
          <div className="uv-empty" style={{ marginTop: 40 }}>
            <p className="uv-empty-lead">Nem sikerült betölteni az adatokat.</p>
            <p className="uv-muted">
              Ellenőrizd az internetkapcsolatot (és a Supabase beállításokat),
              majd próbáld újra. A meglévő adataid biztonságban vannak.
            </p>
            <button className="uv-cta" onClick={() => window.location.reload()}>
              Újratöltés
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="uv-root">
      <Style />
      <div className="uv-shell">
        {open ? (
          <TripView
            trip={open}
            docs={docs}
            onBack={() => setOpenId(null)}
            onUpdate={(fn) => updateTrip(open.id, fn)}
            onDelete={() => removeTrip(open.id)}
            onSaveTemplate={(label) => saveTemplate(open, label)}
            onOpenDocs={() => setDocsOpen(true)}
          />
        ) : (
          <Home
            trips={trips}
            docs={docs}
            loaded={loaded}
            account={account}
            onOpen={setOpenId}
            onNew={() => setCreating(true)}
            onTogglePrep={togglePrep}
            onOpenDocs={() => setDocsOpen(true)}
          />
        )}
      </div>
      {creating && (
        <NewTrip
          onClose={() => setCreating(false)}
          onCreate={addTrip}
          customTpls={customTpls}
          onRemoveTemplate={removeTemplate}
        />
      )}
      {docsOpen && (
        <DocsModal
          docs={docs}
          onClose={() => setDocsOpen(false)}
          onAdd={addDoc}
          onUpdate={updateDoc}
          onRemove={removeDoc}
        />
      )}
    </div>
  );
}

/* ---------------------------- account menu ------------------------ */
function AccountMenu({ account }) {
  const [open, setOpen] = useState(false);
  const initial = (account.email || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="uv-acct-wrap">
      <button className="uv-acct" onClick={() => setOpen((o) => !o)} aria-label="Fiók">
        {initial}
      </button>
      {open && (
        <>
          <div className="uv-acct-back" onClick={() => setOpen(false)} />
          <div className="uv-acct-menu">
            <p className="uv-acct-email">{account.email}</p>
            <button className="uv-acct-out" onClick={account.onSignOut}>Kijelentkezés</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ home ------------------------------ */
function Home({ trips, docs, loaded, account, onOpen, onNew, onTogglePrep, onOpenDocs }) {
  const expDocs = docs
    .map((d) => ({ d, st: docStatus(d.expiry) }))
    .filter((x) => x.st && (x.st.kind === "expired" || x.st.kind === "soon"));

  return (
    <>
      <header className="uv-head">
        <div className="uv-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="25" height="25">
            <path d="M24 18v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" fill="none"
              stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
            <rect x="12" y="18" width="40" height="34" rx="8" fill="currentColor" />
            <path d="M24 35l5.5 5.5 11-13" fill="none" stroke="#FCFDF9"
              strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="uv-head-text">
          <h1 className="uv-title">Packed</h1>
          <p className="uv-tag">Nothing left behind.</p>
        </div>
        <button className="uv-docs-btn" onClick={onOpenDocs}>
          <svg viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="5" width="18" height="14"
            rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M7 10h4M7 14h7"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span className="uv-docs-btn-label">Okmányok</span>
          {expDocs.length > 0 && <span className="uv-docs-badge">{expDocs.length}</span>}
        </button>
        {account && <AccountMenu account={account} />}
      </header>

      {!loaded ? (
        <p className="uv-muted" style={{ padding: "8px 4px" }}>Betöltés…</p>
      ) : trips.length === 0 ? (
        <div className="uv-empty">
          <p className="uv-empty-lead">Még nincs egyetlen utazásod sem.</p>
          <p className="uv-muted">
            Indíts egy listát üresen, vagy válassz egy kész sablont — a tengerparttól
            a hegyi túráig.
          </p>
          <button className="uv-cta" onClick={onNew}>Új utazás</button>
        </div>
      ) : (
        <>
          <div className="uv-list-head">
            <span className="uv-eyebrow">Utazásaim · {trips.length}</span>
            <button className="uv-cta uv-cta-sm" onClick={onNew}>Új utazás</button>
          </div>
          <div className="uv-grid">
            {trips.map((t) => {
              const total = t.items.length;
              const done = t.items.filter((i) => i.packed).length;
              const v = total ? done / total : 0;
              const packedG = t.items
                .filter((i) => i.packed)
                .reduce((s, i) => s + i.w * i.qty, 0);
              const nCases = t.cases?.length || 1;
              const preps = t.preps || [];
              const ins = preps.find((p) => p.kind === "insurance") || preps[0];
              const otherTodo = preps.filter((p) => !p.done && p !== ins).length;
              return (
                <div key={t.id} className="uv-card" role="button" tabIndex={0}
                  onClick={() => onOpen(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(t.id); }
                  }}>
                  <div className="uv-card-top">
                    <div className="uv-card-ring">
                      <Ring value={v} />
                      <span className="uv-card-pct">
                        {total ? Math.round(v * 100) : 0}<i>%</i>
                      </span>
                    </div>
                    <div className="uv-card-body">
                      <h3 className="uv-card-name">{t.name}</h3>
                      <p className="uv-muted">
                        {t.tplLabel || (t.templateKey ? TEMPLATES[t.templateKey]?.label : null) || "Saját lista"}
                        {nCases > 1 ? ` · ${nCases} bőrönd` : ""}
                      </p>
                      <p className="uv-card-meta">
                        {total === 0
                          ? "Üres lista"
                          : `${done} / ${total} becsomagolva · ≈ ${fmtWeight(packedG)}`}
                      </p>
                    </div>
                  </div>

                  <div className="uv-chips">
                    {ins && (
                      <button className={"uv-chk" + (ins.done ? " is-done" : "")}
                        onClick={(e) => { e.stopPropagation(); onTogglePrep(t.id, ins.id); }}>
                        <span className="uv-chk-box">
                          {ins.done && (
                            <svg viewBox="0 0 24 24" width="11" height="11"><path d="M5 13l4 4L19 7"
                              fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"
                              strokeLinejoin="round" /></svg>
                          )}
                        </span>
                        {ins.done ? "Biztosítás megvan" : "Biztosítás megkötve?"}
                      </button>
                    )}
                    {expDocs.map(({ d, st }) => (
                      <button key={d.id}
                        className={"uv-chip-warn is-" + (st.kind === "expired" ? "danger" : "warn")}
                        onClick={(e) => { e.stopPropagation(); onOpenDocs(); }}>
                        <svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 4l9 16H3z"
                          fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                          <path d="M12 10v4M12 17v.4" stroke="currentColor" strokeWidth="1.7"
                            strokeLinecap="round" /></svg>
                        {d.label} {st.kind === "expired" ? "lejárt" : "hamarosan lejár"} — meghosszabbítottad?
                      </button>
                    ))}
                    {otherTodo > 0 && (
                      <span className="uv-chip-mini">+{otherTodo} teendő</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ---------------------------- new trip ---------------------------- */
function NewTrip({ onClose, onCreate, customTpls, onRemoveTemplate }) {
  const [name, setName] = useState("");
  const [sel, setSel] = useState(""); // "" üres · "b:kulcs" · "c:id"
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="uv-overlay" onClick={onClose}>
      <div className="uv-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="uv-sheet-grip" />
        <h2 className="uv-sheet-title">Új utazás</h2>

        <label className="uv-label">Hova mész?</label>
        <input ref={ref} className="uv-input" value={name} placeholder="pl. Lisszabon, július"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCreate(name, sel)} />

        {customTpls.length > 0 && (
          <>
            <label className="uv-label" style={{ marginTop: 18 }}>Saját sablonok</label>
            <div className="uv-tpl-grid">
              {customTpls.map((t) => {
                const token = "c:" + t.id;
                return (
                  <div key={t.id}
                    className={"uv-tpl uv-tpl-own" + (sel === token ? " is-on" : "")}
                    onClick={() => setSel(token)}>
                    <span className="uv-tpl-name">{t.label}</span>
                    <span className="uv-tpl-blurb">
                      {t.items.length} tétel
                      {t.cases.length > 1 ? ` · ${t.cases.length} bőrönd` : ""}
                    </span>
                    <button className="uv-tpl-del" aria-label="Sablon törlése"
                      onClick={(e) => { e.stopPropagation(); onRemoveTemplate(t.id); if (sel === token) setSel(""); }}>
                      <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <label className="uv-label" style={{ marginTop: 18 }}>Kezdj egy sablonnal</label>
        <div className="uv-tpl-grid">
          <button className={"uv-tpl" + (sel === "" ? " is-on" : "")}
            onClick={() => setSel("")}>
            <span className="uv-tpl-name">Üres lista</span>
            <span className="uv-tpl-blurb">Mindent magad veszel fel</span>
          </button>
          {Object.entries(TEMPLATES).map(([k, t]) => {
            const token = "b:" + k;
            return (
              <button key={k} className={"uv-tpl" + (sel === token ? " is-on" : "")}
                onClick={() => setSel(token)}>
                <span className="uv-tpl-name">{t.label}</span>
                <span className="uv-tpl-blurb">{t.blurb}</span>
              </button>
            );
          })}
        </div>

        <div className="uv-sheet-foot">
          <button className="uv-ghost" onClick={onClose}>Mégse</button>
          <button className="uv-cta" onClick={() => onCreate(name, sel)}>Létrehozás</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- trip view --------------------------- */
function TripView({ trip, docs, onBack, onUpdate, onDelete, onSaveTemplate, onOpenDocs }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(trip.name);
  const [filter, setFilter] = useState("all"); // all | left
  const [confirm, setConfirm] = useState(false);
  const [activated, setActivated] = useState([]); // üres kategóriák megnyitva
  const [selId, setSelId] = useState(trip.cases[0]?.id);
  const [caseEdit, setCaseEdit] = useState(false);
  const [caseDraft, setCaseDraft] = useState("");
  const [caseConfirm, setCaseConfirm] = useState(null); // törlendő bőrönd id
  const [limitEdit, setLimitEdit] = useState(false);
  const [limitDraft, setLimitDraft] = useState("");
  const [tplSaving, setTplSaving] = useState(false);
  const [tplName, setTplName] = useState("");
  const [toast, setToast] = useState(null);
  const [newPrep, setNewPrep] = useState("");
  const [insOpen, setInsOpen] = useState(false);
  const toastTimer = useRef(null);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  const doSaveTpl = () => {
    onSaveTemplate(tplName);
    setTplSaving(false);
    showToast("Sablon mentve");
  };

  /* --- készülődés (preps) --- */
  const preps = trip.preps || [];
  const togglePrep = (id) =>
    onUpdate((t) => ({
      ...t,
      preps: t.preps.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
    }));
  const addPrep = () => {
    const label = newPrep.trim();
    if (!label) return;
    onUpdate((t) => ({ ...t, preps: [...t.preps, { id: uid(), label, done: false }] }));
    setNewPrep("");
  };
  const removePrep = (id) =>
    onUpdate((t) => ({ ...t, preps: t.preps.filter((p) => p.id !== id) }));

  const expDocs = (docs || [])
    .map((d) => ({ d, st: docStatus(d.expiry) }))
    .filter((x) => x.st && (x.st.kind === "expired" || x.st.kind === "soon"));

  const cases = trip.cases;
  const selected = cases.find((c) => c.id === selId) || cases[0];

  /* --- tétel műveletek --- */
  const toggle = (id) =>
    onUpdate((t) => ({
      ...t,
      items: t.items.map((i) => (i.id === id ? { ...i, packed: !i.packed } : i)),
    }));
  const setQty = (id, q) =>
    onUpdate((t) => ({
      ...t,
      items: t.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, q) } : i)),
    }));
  const setItemWeight = (id, totalG) =>
    onUpdate((t) => ({
      ...t,
      items: t.items.map((i) =>
        i.id === id ? { ...i, w: Math.max(0, Math.round(totalG / i.qty)) } : i
      ),
    }));
  const removeItem = (id) =>
    onUpdate((t) => ({ ...t, items: t.items.filter((i) => i.id !== id) }));
  const addItem = (name, cat, qty) =>
    onUpdate((t) => ({
      ...t,
      items: [
        ...t.items,
        { id: uid(), name, cat, qty, packed: false, w: estWeight(name, cat), caseId: selected.id },
      ],
    }));
  const saveName = () => {
    onUpdate((t) => ({ ...t, name: draft.trim() || t.name }));
    setEditing(false);
  };

  /* --- bőrönd műveletek --- */
  const addCase = () => {
    const c = { id: uid(), name: `Bőrönd ${cases.length + 1}` };
    onUpdate((t) => ({ ...t, cases: [...t.cases, c] }));
    setSelId(c.id);
    setActivated([]);
    setFilter("all");
  };
  const renameCase = () => {
    const name = caseDraft.trim();
    if (name) onUpdate((t) => ({
      ...t,
      cases: t.cases.map((c) => (c.id === selected.id ? { ...c, name } : c)),
    }));
    setCaseEdit(false);
  };
  const removeCase = (id) => {
    onUpdate((t) => {
      const rest = t.cases.filter((c) => c.id !== id);
      const fallback = rest[0].id;
      return {
        ...t,
        cases: rest,
        items: t.items.map((i) => (i.caseId === id ? { ...i, caseId: fallback } : i)),
      };
    });
    setSelId(cases.filter((c) => c.id !== id)[0].id);
    setActivated([]);
    setCaseConfirm(null);
  };
  const fillCaseFromTemplate = () => {
    const src = trip.tplItems;
    if (!src || !src.length) return;
    onUpdate((t) => ({
      ...t,
      items: [
        ...t.items,
        ...src.map((it) => ({
          id: uid(),
          name: it.name,
          cat: it.cat,
          qty: it.qty,
          packed: false,
          w: typeof it.w === "number" ? it.w : estWeight(it.name, it.cat),
          caseId: selected.id,
        })),
      ],
    }));
    setActivated([]);
  };
  const applyLimit = (g) => {
    onUpdate((t) => ({
      ...t,
      cases: t.cases.map((c) => (c.id === selected.id ? { ...c, limit: g } : c)),
    }));
    setLimitEdit(false);
  };
  const saveLimit = () => {
    const kg = parseFloat((limitDraft || "").replace(",", "."));
    applyLimit(!isNaN(kg) && kg > 0 ? Math.round(kg * 1000) : null);
  };

  /* --- számítások --- */
  const total = trip.items.length;
  const done = trip.items.filter((i) => i.packed).length;
  const v = total ? done / total : 0;
  const tripPackedG = trip.items
    .filter((i) => i.packed)
    .reduce((s, i) => s + i.w * i.qty, 0);
  const casePackedG = (cid) =>
    trip.items
      .filter((i) => i.caseId === cid && i.packed)
      .reduce((s, i) => s + i.w * i.qty, 0);
  const caseAllG = (cid) =>
    trip.items.filter((i) => i.caseId === cid).reduce((s, i) => s + i.w * i.qty, 0);
  const caseTone = (cid) => {
    const c = cases.find((x) => x.id === cid);
    if (!c || !c.limit) return null;
    if (casePackedG(cid) > c.limit) return "over";
    if (caseAllG(cid) > c.limit) return "plan";
    return null;
  };

  const caseItems = trip.items.filter((i) => i.caseId === selected.id);
  const caseTotal = caseItems.length;
  const caseDone = caseItems.filter((i) => i.packed).length;
  const caseTotalG = caseItems.reduce((s, i) => s + i.w * i.qty, 0);
  const caseDoneG = casePackedG(selected.id);

  let warn = null;
  if (selected.limit) {
    const lim = selected.limit;
    if (caseDoneG > lim)
      warn = { tone: "danger", text: `Túlsúly: ≈ ${fmtWeight(caseDoneG)} / ${fmtWeight(lim)}.` };
    else if (caseTotalG > lim)
      warn = { tone: "warn", text: `A tervezett súly túllépi a limitet: ≈ ${fmtWeight(caseTotalG)} / ${fmtWeight(lim)}.` };
    else if (caseTotalG >= 0.9 * lim)
      warn = { tone: "info", text: `Közel a limithez: ≈ ${fmtWeight(caseTotalG)} / ${fmtWeight(lim)}.` };
  }

  const catData = CATEGORIES.map((c) => {
    const all = caseItems.filter((i) => i.cat === c.key);
    const vis = filter === "left" ? all.filter((i) => !i.packed) : all;
    return { cat: c, all, vis };
  });
  const visibleCount = catData.reduce((n, d) => n + d.vis.length, 0);
  const emptyCats = catData.filter(
    (d) => d.all.length === 0 && !activated.includes(d.cat.key)
  );

  return (
    <>
      <div className="uv-bar">
        <button className="uv-back" onClick={onBack} aria-label="Vissza">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 5l-7 7 7 7"
            fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            strokeLinejoin="round" /></svg>
        </button>
        <div className="uv-bar-actions">
          <button className="uv-bar-btn" aria-label="Sablonként mentés"
            onClick={() => { setTplName(trip.name); setTplSaving(true); }}
            disabled={trip.items.length === 0}>
            <svg viewBox="0 0 24 24" width="15" height="15"><path
              d="M6 4h9l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M8 4v5h6V4 M8 14h8v6H8z"
              fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              strokeLinejoin="round" /></svg>
            <span className="uv-bar-btn-label">Sablonként mentés</span>
          </button>
          <button className="uv-del" onClick={() => setConfirm(true)}>Törlés</button>
        </div>
      </div>

      <div className="uv-trip-head">
        <div className="uv-trip-ring"><Ring value={v} size={84} stroke={8} /></div>
        <div className="uv-trip-meta">
          {editing ? (
            <input className="uv-name-edit" value={draft} autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()} />
          ) : (
            <h2 className="uv-trip-name" onClick={() => { setDraft(trip.name); setEditing(true); }}>
              {trip.name}
              <svg viewBox="0 0 24 24" width="15" height="15" className="uv-pencil">
                <path d="M14 5l5 5M4 20l1-4L16 5l3 3L8 19l-4 1z" fill="none"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
                  strokeLinejoin="round" /></svg>
            </h2>
          )}
          <p className="uv-trip-sub">
            <b>{Math.round(v * 100)}%</b> kész · {done} / {total} becsomagolva
          </p>
          <p className="uv-trip-weight">
            ≈ {fmtWeight(tripPackedG)} becsomagolva
            {cases.length > 1 ? ` · ${cases.length} bőrönd` : ""}
          </p>
        </div>
      </div>

      {/* készülődés */}
      <section className="uv-prep">
        <h3 className="uv-prep-head">Készülődés</h3>

        {expDocs.length > 0 && expDocs.map(({ d, st }) => (
          <button key={d.id} className={"uv-prep-doc is-" + (st.kind === "expired" ? "danger" : "warn")}
            onClick={onOpenDocs}>
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4l9 16H3z"
              fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M12 10v4M12 17v.4" stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" /></svg>
            <span>
              <b>{d.label}</b> {st.kind === "expired"
                ? `lejárt (${fmtDate(d.expiry)})`
                : `hamarosan lejár (${fmtDate(d.expiry)})`} — meghosszabbítottad?
            </span>
            <span className="uv-prep-doc-go">Frissítés</span>
          </button>
        ))}

        {preps.map((p) => (
          <div key={p.id} className={"uv-prep-row" + (p.done ? " is-done" : "")}>
            <button className="uv-check" onClick={() => togglePrep(p.id)}
              aria-pressed={p.done} aria-label={p.done ? "Visszavonás" : "Kész"}
              style={p.done ? { background: "var(--moss)", borderColor: "var(--moss)" } : {}}>
              {p.done && (
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 13l4 4L19 7"
                  fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"
                  strokeLinejoin="round" /></svg>
              )}
            </button>
            <span className="uv-prep-label">{p.label}</span>
            {p.kind === "insurance" && !p.done && (
              <button className="uv-prep-suggest" onClick={() => setInsOpen(true)}>
                Ajánlj biztosítást
              </button>
            )}
            <button className="uv-trash" onClick={() => removePrep(p.id)} aria-label="Teendő törlése">
              <svg viewBox="0 0 24 24" width="16" height="16"><path
                d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        ))}

        <div className="uv-prep-add">
          <input className="uv-input uv-prep-input" value={newPrep} placeholder="Új teendő…"
            onChange={(e) => setNewPrep(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPrep()} />
          <button className="uv-add-btn" onClick={addPrep}>Hozzáad</button>
        </div>
        <button className="uv-prep-docs-link" onClick={onOpenDocs}>
          Úti okmányok kezelése →
        </button>
      </section>

      {/* bőrönd-fülek */}
      <div className="uv-cases">
        {cases.map((c) => (
          <button key={c.id}
            className={"uv-case" + (c.id === selected.id ? " is-on" : "")}
            onClick={() => { setSelId(c.id); setActivated([]); setCaseEdit(false); }}>
            <span className="uv-case-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"
                  fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="4" y="7" width="16" height="13" rx="2.5" fill="none"
                  stroke="currentColor" strokeWidth="1.6" /></svg>
            </span>
            <span className="uv-case-name">{c.name}</span>
            <span className="uv-case-w" style={{
              color: caseTone(c.id) === "over" ? "#B0564E"
                : caseTone(c.id) === "plan" ? "#B07A2E" : undefined,
            }}>
              ≈ {fmtWeight(casePackedG(c.id))}
              {c.limit ? ` / ${fmtWeight(c.limit)}` : ""}
            </span>
          </button>
        ))}
        <button className="uv-case-add" onClick={addCase} aria-label="Bőrönd hozzáadása">+</button>
      </div>

      {/* kiválasztott bőrönd sávja */}
      <div className="uv-casebar">
        {caseEdit ? (
          <input className="uv-case-edit" value={caseDraft} autoFocus
            onChange={(e) => setCaseDraft(e.target.value)}
            onBlur={renameCase}
            onKeyDown={(e) => e.key === "Enter" && renameCase()} />
        ) : (
          <button className="uv-case-title"
            onClick={() => { setCaseDraft(selected.name); setCaseEdit(true); }}>
            {selected.name}
            <svg viewBox="0 0 24 24" width="13" height="13" className="uv-pencil">
              <path d="M14 5l5 5M4 20l1-4L16 5l3 3L8 19l-4 1z" fill="none"
                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                strokeLinejoin="round" /></svg>
          </button>
        )}
        {cases.length > 1 && (
          <button className="uv-case-rm"
            onClick={() => (caseItems.length ? setCaseConfirm(selected.id) : removeCase(selected.id))}>
            Bőrönd törlése
          </button>
        )}
      </div>
      <div className="uv-cw">
        <div className="uv-cw-top">
          <span className="uv-cw-main">
            ≈ <b>{fmtWeight(caseDoneG)}</b>
            {selected.limit ? ` / ${fmtWeight(selected.limit)}` : ""} becsomagolva
          </span>
          {!limitEdit && (
            <button className="uv-cw-limit" onClick={() => {
              setLimitDraft(selected.limit ? String(selected.limit / 1000).replace(".", ",") : "");
              setLimitEdit(true);
            }}>
              {selected.limit ? `Limit: ${fmtWeight(selected.limit)}` : "+ Súlykorlát"}
            </button>
          )}
        </div>

        {limitEdit && (
          <div className="uv-cw-edit">
            <div className="uv-cw-presets">
              {[8, 10, 20, 23, 32].map((kg) => (
                <button key={kg} className="uv-cw-preset" onClick={() => applyLimit(kg * 1000)}>
                  {kg} kg
                </button>
              ))}
            </div>
            <div className="uv-cw-editrow">
              <input className="uv-winput uv-cw-input" type="number" inputMode="decimal" autoFocus
                value={limitDraft} placeholder="kg"
                onChange={(e) => setLimitDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveLimit();
                  if (e.key === "Escape") setLimitEdit(false);
                }} />
              <span className="uv-wunit">kg</span>
              <button className="uv-add-btn" onClick={saveLimit}>Mentés</button>
              <button className="uv-gclose"
                onClick={() => (selected.limit ? applyLimit(null) : setLimitEdit(false))}>
                {selected.limit ? "Nincs limit" : "Mégse"}
              </button>
            </div>
          </div>
        )}

        {selected.limit && (
          <div className="uv-cw-bar" aria-hidden="true">
            <div className="uv-cw-plan" style={{
              width: Math.min(100, (caseTotalG / selected.limit) * 100) + "%",
              background: caseTotalG > selected.limit ? "rgba(192,134,88,.55)" : "rgba(91,115,80,.22)",
            }} />
            <div className="uv-cw-fill" style={{
              width: Math.min(100, (caseDoneG / selected.limit) * 100) + "%",
              background: caseDoneG > selected.limit ? "#B0564E" : "var(--moss)",
            }} />
          </div>
        )}

        {selected.limit ? (
          warn && (
            <div className={"uv-cw-warn is-" + warn.tone}>
              <span className="uv-cw-ic" aria-hidden="true">
                {warn.tone === "info" ? (
                  <svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="9"
                    fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 11v5M12 7.5v.5"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="15" height="15"><path d="M12 4l9 16H3z"
                    fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    <path d="M12 10v4M12 17v.5" stroke="currentColor" strokeWidth="1.7"
                      strokeLinecap="round" /></svg>
                )}
              </span>
              {warn.text}
            </div>
          )
        ) : (
          caseTotal > caseDone && (
            <p className="uv-cw-note">≈ {fmtWeight(caseTotalG)} ha minden bekerül</p>
          )
        )}
      </div>

      {caseTotal === 0 && trip.tplItems && trip.tplItems.length > 0 && (
        <div className="uv-fill-offer">
          <div className="uv-fill-offer-text">
            <svg viewBox="0 0 24 24" width="18" height="18"><path
              d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
              fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              strokeLinejoin="round" /></svg>
            <span>
              Ezt a bőröndöt is feltöltheted a(z) <b>{trip.tplLabel || "sablon"}</b> listájával
              ({trip.tplItems.length} tétel).
            </span>
          </div>
          <button className="uv-cta uv-cta-sm" onClick={fillCaseFromTemplate}>
            Lista feltöltése
          </button>
        </div>
      )}

      {caseTotal > 0 && (
        <div className="uv-filter">
          <button className={"uv-chip" + (filter === "all" ? " is-on" : "")}
            onClick={() => setFilter("all")}>Mind</button>
          <button className={"uv-chip" + (filter === "left" ? " is-on" : "")}
            onClick={() => setFilter("left")}>Még hátra ({caseTotal - caseDone})</button>
        </div>
      )}

      {caseTotal > 0 && filter === "left" && visibleCount === 0 ? (
        <div className="uv-allset">
          <span className="uv-allset-mark">✓</span>
          <p>Ez a bőrönd kész. Jó utat!</p>
        </div>
      ) : (
        catData.map((d) => {
          const shown =
            (d.all.length > 0 && (filter === "all" || d.vis.length > 0)) ||
            activated.includes(d.cat.key);
          if (!shown) return null;
          return (
            <section key={d.cat.key} className="uv-group">
              <h4 className="uv-group-head">
                <span className="uv-dot" style={{ background: d.cat.color }} />
                {d.cat.label}
                <span className="uv-group-count">{d.all.length}</span>
              </h4>
              {d.vis.map((i) => (
                <div key={i.id} className={"uv-item" + (i.packed ? " is-packed" : "")}>
                  <button className="uv-check" onClick={() => toggle(i.id)}
                    aria-pressed={i.packed} aria-label={i.packed ? "Kivenni" : "Becsomagolva"}
                    style={i.packed ? { background: d.cat.color, borderColor: d.cat.color } : {}}>
                    {i.packed && (
                      <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 13l4 4L19 7"
                        fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"
                        strokeLinejoin="round" /></svg>
                    )}
                  </button>
                  <div className="uv-item-main">
                    <span className="uv-item-name">{i.name}</span>
                    <WeightChip item={i} onSave={(g) => setItemWeight(i.id, g)} />
                  </div>
                  <div className="uv-qty">
                    <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Kevesebb">–</button>
                    <span>{i.qty}</span>
                    <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Több">+</button>
                  </div>
                  <button className="uv-trash" onClick={() => removeItem(i.id)}
                    aria-label="Tétel törlése">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path
                      d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              ))}
              {filter === "all" && (
                <GroupAdder
                  catKey={d.cat.key}
                  autoOpen={d.all.length === 0}
                  onAdd={addItem}
                  onClose={() => setActivated((a) => a.filter((k) => k !== d.cat.key))}
                />
              )}
            </section>
          );
        })
      )}

      {filter === "all" && emptyCats.length > 0 && (
        <div className="uv-startcat">
          <span className="uv-eyebrow">
            {caseTotal === 0 ? "Kezdj egy kategóriával" : "Hozzáadás másik kategóriához"}
          </span>
          <div className="uv-startcat-chips">
            {emptyCats.map((d) => (
              <button key={d.cat.key} className="uv-startchip"
                onClick={() => setActivated((a) => [...a, d.cat.key])}>
                <span className="uv-dot" style={{ background: d.cat.color }} />
                {d.cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {confirm && (
        <div className="uv-overlay" onClick={() => setConfirm(false)}>
          <div className="uv-confirm" onClick={(e) => e.stopPropagation()}>
            <p className="uv-confirm-q">Törlöd a(z) „{trip.name}" listát?</p>
            <p className="uv-muted">Ez nem vonható vissza.</p>
            <div className="uv-sheet-foot">
              <button className="uv-ghost" onClick={() => setConfirm(false)}>Mégse</button>
              <button className="uv-cta uv-danger" onClick={onDelete}>Törlés</button>
            </div>
          </div>
        </div>
      )}

      {tplSaving && (
        <div className="uv-overlay" onClick={() => setTplSaving(false)}>
          <div className="uv-confirm" onClick={(e) => e.stopPropagation()}>
            <p className="uv-confirm-q">Mentés sablonként</p>
            <p className="uv-muted">
              A tételek (kategóriák, mennyiségek, becsült súlyok) és a bőröndök
              újrahasználható sablonként mentődnek. A becsomagolt állapot nem.
            </p>
            <input className="uv-input" style={{ marginTop: 12 }} value={tplName} autoFocus
              placeholder="Sablon neve" onChange={(e) => setTplName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSaveTpl()} />
            <div className="uv-sheet-foot">
              <button className="uv-ghost" onClick={() => setTplSaving(false)}>Mégse</button>
              <button className="uv-cta" onClick={doSaveTpl}>Mentés</button>
            </div>
          </div>
        </div>
      )}

      {insOpen && (
        <InsuranceModal
          trip={trip}
          onClose={() => setInsOpen(false)}
          onMarkDone={() => {
            const ins = (trip.preps || []).find((p) => p.kind === "insurance");
            if (ins && !ins.done) togglePrep(ins.id);
            setInsOpen(false);
            showToast("Biztosítás bejelölve");
          }}
        />
      )}

      {toast && (
        <div className="uv-toast" role="status">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 13l4 4L19 7"
            fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
            strokeLinejoin="round" /></svg>
          {toast}
        </div>
      )}
    </>
  );
}

/* --------------------------- weight chip -------------------------- */
function WeightChip({ item, onSave }) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (edit) ref.current?.select();
  }, [edit]);
  const totalG = item.w * item.qty;
  const open = () => {
    setVal(String(totalG));
    setEdit(true);
  };
  const save = () => {
    const n = parseInt(val, 10);
    if (!isNaN(n)) onSave(n);
    setEdit(false);
  };
  if (edit)
    return (
      <span className="uv-wedit">
        <input ref={ref} className="uv-winput" type="number" inputMode="numeric"
          value={val} onChange={(e) => setVal(e.target.value)} onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEdit(false);
          }} />
        <span className="uv-wunit">g</span>
      </span>
    );
  return (
    <button className="uv-wchip" onClick={open} title="Becsült súly — koppints a módosításhoz">
      ≈ {fmtWeight(totalG)}
    </button>
  );
}

/* -------------------------- group adder --------------------------- */
function GroupAdder({ catKey, onAdd, autoOpen, onClose }) {
  const [open, setOpen] = useState(!!autoOpen);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const ref = useRef(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), catKey, qty);
    setName("");
    setQty(1);
    ref.current?.focus();
  };
  const close = () => {
    setOpen(false);
    setName("");
    setQty(1);
    onClose?.();
  };

  if (!open)
    return (
      <button className="uv-group-add" onClick={() => setOpen(true)}>
        + tétel
      </button>
    );

  return (
    <div className="uv-ginline">
      <input ref={ref} className="uv-input uv-ginput" value={name}
        placeholder="Tétel neve…"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") close();
        }} />
      <div className="uv-qty uv-qty-add">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kevesebb">–</button>
        <span>{qty}</span>
        <button onClick={() => setQty((q) => q + 1)} aria-label="Több">+</button>
      </div>
      <button className="uv-add-btn" onClick={submit}>Hozzáad</button>
      <button className="uv-gclose" onClick={close} aria-label="Bezárás">Kész</button>
    </div>
  );
}

/* ----------------------------- docs modal ------------------------- */
function DocsModal({ docs, onClose, onAdd, onUpdate, onRemove }) {
  const [label, setLabel] = useState("");
  const [expiry, setExpiry] = useState("");
  const add = () => {
    if (!label.trim() && !expiry) return;
    onAdd(label || "Okmány", expiry);
    setLabel("");
    setExpiry("");
  };
  const used = docs.map((d) => d.label);
  return (
    <div className="uv-overlay" onClick={onClose}>
      <div className="uv-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="uv-sheet-grip" />
        <h2 className="uv-sheet-title">Úti okmányok</h2>
        <p className="uv-muted" style={{ margin: "0 0 14px" }}>
          Add meg a lejárati dátumokat. Ha egy okmány fél éven belül lejár,
          minden utazásnál figyelmeztetünk. Megújítás után csak frissítsd a dátumot.
        </p>

        {docs.length === 0 && (
          <p className="uv-muted" style={{ marginBottom: 12 }}>Még nincs rögzített okmány.</p>
        )}

        {docs.map((d) => {
          const st = docStatus(d.expiry);
          return (
            <div key={d.id} className="uv-doc">
              <div className="uv-doc-main">
                <input className="uv-input uv-doc-label" value={d.label}
                  onChange={(e) => onUpdate(d.id, { label: e.target.value })} />
                <div className="uv-doc-date">
                  <input className="uv-input" type="date" value={d.expiry || ""}
                    onChange={(e) => onUpdate(d.id, { expiry: e.target.value })} />
                  {st && (
                    <span className={"uv-doc-badge is-" +
                      (st.kind === "expired" ? "danger" : st.kind === "soon" ? "warn" : "ok")}>
                      {st.kind === "expired" ? "lejárt"
                        : st.kind === "soon" ? "hamarosan lejár" : "érvényes"}
                    </span>
                  )}
                </div>
              </div>
              <button className="uv-trash" onClick={() => onRemove(d.id)} aria-label="Okmány törlése">
                <svg viewBox="0 0 24 24" width="16" height="16"><path
                  d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          );
        })}

        <div className="uv-doc-add">
          <div className="uv-startcat-chips" style={{ marginBottom: 9 }}>
            {DOC_SUGGESTIONS.filter((s) => !used.includes(s)).map((s) => (
              <button key={s} className="uv-startchip" onClick={() => setLabel(s)}>{s}</button>
            ))}
          </div>
          <div className="uv-doc-addrow">
            <input className="uv-input" value={label} placeholder="Okmány neve"
              onChange={(e) => setLabel(e.target.value)} />
            <input className="uv-input" type="date" value={expiry}
              onChange={(e) => setExpiry(e.target.value)} />
            <button className="uv-add-btn" onClick={add}>Hozzáad</button>
          </div>
        </div>

        <div className="uv-sheet-foot">
          <button className="uv-cta" onClick={onClose}>Kész</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- insurance modal ----------------------- */
const INS_PRIORITIES = [
  "Legolcsóbb", "Legjobb fedezet", "Magas sürgősségi limit", "Kalandsport / extrém",
  "Családi csomag", "Hosszú út (több hónap)", "Sztornó biztosítás", "COVID / járvány fedezet",
];
function InsuranceModal({ trip, onClose, onMarkDone }) {
  const [dest, setDest] = useState(trip.name || "");
  const [picks, setPicks] = useState([]);
  const [state, setState] = useState("form"); // form | loading | done | error
  const [results, setResults] = useState([]);
  const [errMsg, setErrMsg] = useState("");

  const toggle = (p) =>
    setPicks((a) => (a.includes(p) ? a.filter((x) => x !== p) : [...a, p]));

  const run = async () => {
    setState("loading");
    setErrMsg("");
    const prompt =
      `Egy magyarországi utazó utasbiztosítást keres. Úti cél: "${dest || "nincs megadva"}". ` +
      `Szempontok: ${picks.length ? picks.join(", ") : "általános"}. ` +
      `Adj 3 konkrét, aktuális, tájékoztató javaslatot a magyar piacról (biztosító vagy összehasonlító + csomagtípus). ` +
      `Keress rá a weben a friss kínálatra. Csak egy JSON tömböt adj vissza, semmi mást, ` +
      `pontosan ilyen formában: [{"name":"...","type":"...","fit":"egy mondat, miért illik a szempontokhoz","note":"egy rövid tipp vagy figyelmeztetés"}]. ` +
      `Magyarul írj.`;
    try {
      const res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await res.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      const clean = text.replace(/```json|```/g, "").trim();
      const start = clean.indexOf("[");
      const end = clean.lastIndexOf("]");
      const parsed = JSON.parse(clean.slice(start, end + 1));
      if (!Array.isArray(parsed) || !parsed.length) throw new Error("üres");
      setResults(parsed);
      setState("done");
    } catch (e) {
      setErrMsg("Most nem sikerült javaslatot kérni. Próbáld újra kicsit később.");
      setState("error");
    }
  };

  return (
    <div className="uv-overlay" onClick={onClose}>
      <div className="uv-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="uv-sheet-grip" />
        <h2 className="uv-sheet-title">Biztosítás-ajánló</h2>

        {state === "form" && (
          <>
            <label className="uv-label">Úti cél</label>
            <input className="uv-input" value={dest} placeholder="pl. Thaiföld"
              onChange={(e) => setDest(e.target.value)} />
            <label className="uv-label" style={{ marginTop: 16 }}>Mi a fontos? (több is)</label>
            <div className="uv-startcat-chips">
              {INS_PRIORITIES.map((p) => (
                <button key={p}
                  className={"uv-startchip" + (picks.includes(p) ? " is-on" : "")}
                  onClick={() => toggle(p)}>{p}</button>
              ))}
            </div>
            <p className="uv-ins-disc">
              Tájékoztató jellegű, a beépített AI és webkeresés alapján — nem pénzügyi tanácsadás.
              Az árak és feltételek változnak, kötés előtt mindig ellenőrizd a biztosítónál.
            </p>
            <div className="uv-sheet-foot">
              <button className="uv-ghost" onClick={onClose}>Mégse</button>
              <button className="uv-cta" onClick={run}>Javaslatok kérése</button>
            </div>
          </>
        )}

        {state === "loading" && (
          <div className="uv-ins-loading">
            <span className="uv-spin" aria-hidden="true" />
            <p className="uv-muted">Friss ajánlatok keresése…</p>
          </div>
        )}

        {state === "error" && (
          <>
            <p className="uv-muted">{errMsg}</p>
            <div className="uv-sheet-foot">
              <button className="uv-ghost" onClick={onClose}>Bezár</button>
              <button className="uv-cta" onClick={run}>Újra</button>
            </div>
          </>
        )}

        {state === "done" && (
          <>
            {results.map((r, i) => (
              <div key={i} className="uv-ins-card">
                <div className="uv-ins-card-head">
                  <span className="uv-ins-name">{r.name}</span>
                  {r.type && <span className="uv-ins-type">{r.type}</span>}
                </div>
                {r.fit && <p className="uv-ins-fit">{r.fit}</p>}
                {r.note && <p className="uv-ins-note">{r.note}</p>}
              </div>
            ))}
            <p className="uv-ins-disc">
              Tájékoztató jelleggel — az árakat és feltételeket kötés előtt ellenőrizd a biztosítónál.
            </p>
            <div className="uv-sheet-foot">
              <button className="uv-ghost" onClick={() => setState("form")}>Új keresés</button>
              <button className="uv-cta" onClick={onMarkDone}>Megvan, bejelölöm</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ styles ---------------------------- */
function Style() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Mulish:wght@400;500;600;700&display=swap');

.uv-root{
  --bg:#E8ECE0; --bg2:#EFF2E8; --surface:#FCFDF9; --surface2:#F4F6EE;
  --ink:#2B3326; --soft:#61705A; --faint:#93A089;
  --moss:#5B7350; --moss-deep:#41523A; --clay:#C08658;
  --line:#D8DECC; --track:#DCE2D0;
  font-family:'Mulish',system-ui,sans-serif; color:var(--ink);
  background:
    radial-gradient(120% 80% at 10% -10%, var(--bg2) 0%, var(--bg) 55%);
  min-height:100%; padding:22px 16px 56px; box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
}
.uv-root *{box-sizing:border-box;}
.uv-shell{max-width:560px;margin:0 auto;}
.uv-muted{color:var(--soft);font-size:13.5px;line-height:1.5;margin:2px 0;}
.uv-eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);font-weight:700;}

/* header */
.uv-head{display:flex;align-items:center;gap:13px;margin-bottom:26px;}
.uv-head-text{flex:1;min-width:0;}
.uv-mark{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;
  background:var(--surface);color:var(--moss);border:1px solid var(--line);
  box-shadow:0 1px 0 rgba(65,82,58,.04);}
.uv-title{font-family:'Fraunces',serif;font-weight:500;font-size:27px;margin:0;letter-spacing:-.01em;}
.uv-tag{margin:1px 0 0;color:var(--soft);font-size:13.5px;font-style:italic;font-family:'Fraunces',serif;}
.uv-docs-btn{position:relative;display:inline-flex;align-items:center;gap:7px;flex:none;
  background:var(--surface);border:1px solid var(--line);border-radius:11px;color:var(--moss);
  font-family:'Mulish';font-weight:600;font-size:13px;cursor:pointer;padding:9px 13px;transition:all .15s;}
.uv-docs-btn:hover{border-color:var(--moss);background:#fff;}
.uv-docs-badge{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;
  border-radius:9px;background:#C08658;color:#fff;font-size:11px;font-weight:700;
  display:grid;place-items:center;}
.uv-acct-wrap{position:relative;flex:none;}
.uv-acct{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:var(--surface);
  color:var(--moss-deep);font-family:'Mulish';font-weight:700;font-size:15px;cursor:pointer;
  display:grid;place-items:center;transition:all .15s;}
.uv-acct:hover{border-color:var(--moss);background:#fff;}
.uv-acct-back{position:fixed;inset:0;z-index:30;}
.uv-acct-menu{position:absolute;top:46px;right:0;z-index:31;background:var(--surface);
  border:1px solid var(--line);border-radius:13px;padding:12px;min-width:200px;
  box-shadow:0 10px 30px rgba(43,51,38,.16);animation:uv-up .18s ease;}
.uv-acct-email{font-size:12.5px;color:var(--soft);margin:0 0 10px;word-break:break-all;line-height:1.4;}
.uv-acct-out{width:100%;font-family:'Mulish';font-weight:600;font-size:13.5px;color:#9a4039;
  background:#f6ece9;border:none;border-radius:10px;padding:9px;cursor:pointer;transition:background .15s;}
.uv-acct-out:hover{background:#efdcd8;}

/* list head */
.uv-list-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}

/* buttons */
.uv-cta{font-family:'Mulish';font-weight:700;font-size:14.5px;color:#fff;background:var(--moss);
  border:none;border-radius:12px;padding:11px 18px;cursor:pointer;letter-spacing:.01em;
  transition:background .18s,transform .1s;box-shadow:0 2px 8px rgba(65,82,58,.18);}
.uv-cta:hover{background:var(--moss-deep);}
.uv-cta:active{transform:translateY(1px);}
.uv-cta-sm{padding:8px 14px;font-size:13.5px;border-radius:10px;}
.uv-cta.uv-danger{background:#B0564E;box-shadow:none;}
.uv-cta.uv-danger:hover{background:#974a43;}
.uv-ghost{background:none;border:none;color:var(--soft);font-family:'Mulish';font-weight:600;
  font-size:14px;cursor:pointer;padding:11px 14px;border-radius:10px;}
.uv-ghost:hover{background:var(--surface2);}

/* empty */
.uv-empty{background:var(--surface);border:1px solid var(--line);border-radius:18px;
  padding:30px 26px;text-align:center;}
.uv-empty-lead{font-family:'Fraunces',serif;font-size:19px;margin:0 0 6px;}
.uv-empty .uv-cta{margin-top:18px;}

/* trip grid */
.uv-grid{display:grid;gap:12px;}
.uv-card{display:flex;flex-direction:column;gap:11px;text-align:left;width:100%;
  background:var(--surface);border:1px solid var(--line);border-radius:16px;
  padding:15px 17px;cursor:pointer;font-family:'Mulish';color:var(--ink);
  transition:transform .14s,box-shadow .18s,border-color .18s;}
.uv-card:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(65,82,58,.1);border-color:#c7d1b6;}
.uv-card-top{display:flex;align-items:center;gap:16px;}
.uv-card-ring{position:relative;width:56px;height:56px;flex:none;display:grid;place-items:center;}
.uv-card-pct{position:absolute;font-family:'Fraunces',serif;font-size:14px;font-weight:600;color:var(--moss-deep);}
.uv-card-pct i{font-size:9px;font-style:normal;color:var(--faint);}
.uv-card-body{min-width:0;}
.uv-card-name{font-family:'Fraunces',serif;font-weight:500;font-size:17.5px;margin:0 0 2px;
  letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.uv-card-meta{font-size:12.5px;color:var(--moss);font-weight:600;margin:4px 0 0;}

/* card chips */
.uv-chips{display:flex;flex-wrap:wrap;gap:7px;}
.uv-chk{display:inline-flex;align-items:center;gap:7px;font-family:'Mulish';font-weight:600;
  font-size:12.5px;color:#8a5a23;background:#f6ecdf;border:none;border-radius:20px;padding:6px 12px 6px 8px;cursor:pointer;}
.uv-chk-box{width:16px;height:16px;border-radius:5px;border:2px solid #c79a5e;background:#fff;
  display:grid;place-items:center;flex:none;}
.uv-chk.is-done{color:var(--moss-deep);background:#eaf0e2;}
.uv-chk.is-done .uv-chk-box{background:var(--moss);border-color:var(--moss);}
.uv-chip-warn{display:inline-flex;align-items:center;gap:6px;font-family:'Mulish';font-weight:600;
  font-size:12.5px;border:none;border-radius:20px;padding:6px 12px;cursor:pointer;text-align:left;}
.uv-chip-warn.is-warn{background:#f6ecdf;color:#8a5a23;}
.uv-chip-warn.is-danger{background:#f6ece9;color:#9a4039;}
.uv-chip-mini{display:inline-flex;align-items:center;font-family:'Mulish';font-weight:600;
  font-size:12px;color:var(--soft);background:var(--surface2);border-radius:20px;padding:6px 11px;}

/* overlay + sheet */
.uv-overlay{position:fixed;inset:0;background:rgba(43,51,38,.34);backdrop-filter:blur(3px);
  display:flex;align-items:flex-end;justify-content:center;z-index:40;
  animation:uv-fade .2s ease;}
@keyframes uv-fade{from{opacity:0}to{opacity:1}}
.uv-sheet{background:var(--bg2);width:100%;max-width:560px;border-radius:22px 22px 0 0;
  padding:14px 20px 22px;max-height:88vh;overflow:auto;animation:uv-up .26s cubic-bezier(.2,.8,.2,1);}
@keyframes uv-up{from{transform:translateY(26px);opacity:.4}to{transform:none;opacity:1}}
.uv-sheet-grip{width:38px;height:4px;border-radius:3px;background:var(--line);margin:2px auto 14px;}
.uv-sheet-title{font-family:'Fraunces',serif;font-weight:500;font-size:22px;margin:0 0 16px;}
.uv-label{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;
  color:var(--faint);font-weight:700;margin-bottom:7px;}
.uv-input{width:100%;font-family:'Mulish';font-size:15px;color:var(--ink);background:var(--surface);
  border:1px solid var(--line);border-radius:11px;padding:11px 13px;outline:none;
  transition:border-color .15s,box-shadow .15s;}
.uv-input:focus{border-color:var(--moss);box-shadow:0 0 0 3px rgba(91,115,80,.14);}

.uv-tpl-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
.uv-tpl{position:relative;text-align:left;background:var(--surface);border:1.5px solid var(--line);border-radius:13px;
  padding:12px 13px;cursor:pointer;font-family:'Mulish';transition:border-color .15s,background .15s;}
.uv-tpl:hover{border-color:#c7d1b6;}
.uv-tpl.is-on{border-color:var(--moss);background:#fff;box-shadow:0 0 0 3px rgba(91,115,80,.12);}
.uv-tpl-name{display:block;font-weight:700;font-size:14px;color:var(--ink);padding-right:16px;}
.uv-tpl-blurb{display:block;font-size:12px;color:var(--soft);margin-top:2px;}
.uv-tpl-own .uv-tpl-name{color:var(--moss-deep);}
.uv-tpl-del{position:absolute;top:7px;right:7px;width:22px;height:22px;border:none;background:none;
  border-radius:7px;color:var(--faint);cursor:pointer;display:grid;place-items:center;
  opacity:0;transition:opacity .15s,color .12s,background .12s;}
.uv-tpl:hover .uv-tpl-del,.uv-tpl-own.is-on .uv-tpl-del{opacity:1;}
.uv-tpl-del:hover{color:#B0564E;background:#f6ece9;}
.uv-sheet-foot{display:flex;justify-content:flex-end;gap:6px;margin-top:20px;}

/* confirm */
.uv-confirm{background:var(--bg2);border-radius:18px;padding:22px;max-width:340px;width:100%;
  margin:auto;animation:uv-up .22s ease;}
.uv-overlay:has(.uv-confirm){align-items:center;}
.uv-confirm-q{font-family:'Fraunces',serif;font-size:17px;margin:0 0 4px;}

/* trip bar */
.uv-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px;}
.uv-back{width:38px;height:38px;border-radius:11px;border:1px solid var(--line);background:var(--surface);
  display:grid;place-items:center;cursor:pointer;color:var(--ink);transition:background .15s;}
.uv-back:hover{background:var(--surface2);}
.uv-bar-actions{display:flex;align-items:center;gap:4px;}
.uv-bar-btn{display:inline-flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--line);
  border-radius:10px;color:var(--moss);font-family:'Mulish';font-weight:600;font-size:13px;cursor:pointer;
  padding:8px 12px;transition:all .15s;}
.uv-bar-btn:hover{border-color:var(--moss);background:#fff;}
.uv-bar-btn:disabled{opacity:.45;cursor:not-allowed;border-color:var(--line);background:var(--surface);}
.uv-del{background:none;border:none;color:var(--faint);font-family:'Mulish';font-weight:600;
  font-size:13px;cursor:pointer;padding:8px 10px;border-radius:9px;}
.uv-del:hover{color:#B0564E;background:#f6ece9;}

/* toast */
.uv-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:60;
  display:inline-flex;align-items:center;gap:8px;background:var(--moss-deep);color:#fff;
  font-family:'Mulish';font-weight:600;font-size:14px;padding:11px 18px;border-radius:13px;
  box-shadow:0 8px 24px rgba(43,51,38,.28);animation:uv-toast-in .3s cubic-bezier(.2,.8,.2,1);}
@keyframes uv-toast-in{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}

/* trip head */
.uv-trip-head{display:flex;align-items:center;gap:18px;margin:6px 2px 20px;}

/* készülődés */
.uv-prep{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:18px;}
.uv-prep-head{font-family:'Fraunces',serif;font-weight:500;font-size:16px;margin:0 0 11px;}
.uv-prep-doc{display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:none;border-radius:11px;
  padding:10px 12px;margin-bottom:8px;cursor:pointer;font-family:'Mulish';font-size:13px;line-height:1.4;}
.uv-prep-doc.is-warn{background:#f6ecdf;color:#8a5a23;}
.uv-prep-doc.is-danger{background:#f6ece9;color:#9a4039;}
.uv-prep-doc svg{flex:none;}
.uv-prep-doc span{flex:1;}
.uv-prep-doc b{font-weight:700;}
.uv-prep-doc-go{flex:none!important;font-weight:700;text-decoration:underline;font-size:12.5px;}
.uv-prep-row{display:flex;align-items:center;gap:11px;padding:7px 2px;}
.uv-prep-label{flex:1;min-width:0;font-size:14px;font-weight:500;}
.uv-prep-row.is-done .uv-prep-label{color:var(--faint);text-decoration:line-through;text-decoration-color:var(--line);}
.uv-prep-suggest{flex:none;font-family:'Mulish';font-weight:600;font-size:12px;color:var(--moss-deep);
  background:#eaf0e2;border:none;border-radius:9px;padding:6px 11px;cursor:pointer;transition:background .15s;}
.uv-prep-suggest:hover{background:#dde7cf;}
.uv-prep-add{display:flex;gap:8px;margin-top:8px;}
.uv-prep-input{flex:1;}
.uv-prep-docs-link{background:none;border:none;color:var(--moss);font-family:'Mulish';font-weight:600;
  font-size:12.5px;cursor:pointer;padding:9px 2px 2px;}
.uv-prep-docs-link:hover{text-decoration:underline;}

/* okmány modal */
.uv-doc{display:flex;align-items:flex-start;gap:9px;padding:10px 0;border-bottom:1px solid var(--line);}
.uv-doc-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px;}
.uv-doc-label{font-weight:600;}
.uv-doc-date{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.uv-doc-date .uv-input{width:auto;}
.uv-doc-badge{font-family:'Mulish';font-weight:700;font-size:11.5px;border-radius:20px;padding:4px 10px;}
.uv-doc-badge.is-ok{background:#eaf0e2;color:var(--moss-deep);}
.uv-doc-badge.is-warn{background:#f6ecdf;color:#8a5a23;}
.uv-doc-badge.is-danger{background:#f6ece9;color:#9a4039;}
.uv-doc-add{margin-top:14px;}
.uv-doc-addrow{display:flex;gap:8px;flex-wrap:wrap;}
.uv-doc-addrow .uv-input{flex:1;min-width:120px;}

/* biztosítás */
.uv-startchip.is-on{border-color:var(--moss);background:#fff;color:var(--moss-deep);
  box-shadow:0 0 0 2px rgba(91,115,80,.18);}
.uv-ins-disc{font-size:12px;color:var(--faint);line-height:1.5;margin:14px 0 0;}
.uv-ins-loading{display:flex;flex-direction:column;align-items:center;gap:14px;padding:30px 0;}
.uv-spin{width:28px;height:28px;border-radius:50%;border:3px solid var(--track);border-top-color:var(--moss);
  animation:uv-spin 0.8s linear infinite;}
@keyframes uv-spin{to{transform:rotate(360deg)}}
.uv-ins-card{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:13px 15px;margin-bottom:9px;}
.uv-ins-card-head{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;}
.uv-ins-name{font-family:'Fraunces',serif;font-weight:600;font-size:16px;color:var(--ink);}
.uv-ins-type{font-size:12px;font-weight:600;color:var(--moss);background:#eaf0e2;border-radius:20px;padding:3px 9px;}
.uv-ins-fit{font-size:13.5px;color:var(--ink);line-height:1.5;margin:7px 0 0;}
.uv-ins-note{font-size:12.5px;color:var(--soft);line-height:1.45;margin:5px 0 0;}
.uv-trip-ring{width:84px;height:84px;flex:none;}
.uv-trip-name{font-family:'Fraunces',serif;font-weight:500;font-size:25px;margin:0;letter-spacing:-.01em;
  cursor:text;display:inline-flex;align-items:center;gap:8px;}
.uv-pencil{color:var(--faint);opacity:0;transition:opacity .15s;}
.uv-trip-name:hover .uv-pencil{opacity:1;}
.uv-name-edit{font-family:'Fraunces',serif;font-weight:500;font-size:24px;color:var(--ink);
  background:var(--surface);border:1px solid var(--moss);border-radius:9px;padding:3px 9px;outline:none;width:100%;}
.uv-trip-sub{color:var(--soft);font-size:13.5px;margin:7px 0 0;}
.uv-trip-sub b{color:var(--moss-deep);font-weight:700;}
.uv-trip-weight{color:var(--moss);font-size:13px;font-weight:600;margin:3px 0 0;}

/* bőrönd fülek */
.uv-cases{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;margin:0 -2px 4px;
  scrollbar-width:thin;-webkit-overflow-scrolling:touch;}
.uv-case{flex:none;text-align:left;background:var(--surface);border:1px solid var(--line);
  border-radius:13px;padding:9px 13px;cursor:pointer;font-family:'Mulish';color:var(--ink);
  display:flex;flex-direction:column;gap:2px;min-width:104px;transition:all .15s;}
.uv-case:hover{border-color:#c7d1b6;}
.uv-case.is-on{border-color:var(--moss);background:#fff;box-shadow:0 0 0 3px rgba(91,115,80,.12);}
.uv-case-ic{color:var(--soft);display:flex;}
.uv-case.is-on .uv-case-ic{color:var(--moss);}
.uv-case-name{font-weight:700;font-size:13.5px;white-space:nowrap;}
.uv-case-w{font-size:11.5px;color:var(--moss);font-weight:600;font-variant-numeric:tabular-nums;}
.uv-case-add{flex:none;width:42px;border:1px dashed var(--track);background:none;border-radius:13px;
  color:var(--moss);font-size:20px;cursor:pointer;transition:all .15s;}
.uv-case-add:hover{border-color:var(--moss);background:var(--surface);}

/* kiválasztott bőrönd sávja */
.uv-casebar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px;}
.uv-case-title{background:none;border:none;padding:0;cursor:text;font-family:'Fraunces',serif;
  font-weight:500;font-size:17px;color:var(--ink);display:inline-flex;align-items:center;gap:6px;}
.uv-case-title .uv-pencil{opacity:0;transition:opacity .15s;}
.uv-case-title:hover .uv-pencil{opacity:1;}
.uv-case-edit{font-family:'Fraunces',serif;font-weight:500;font-size:16px;color:var(--ink);
  background:var(--surface);border:1px solid var(--moss);border-radius:8px;padding:3px 9px;outline:none;}
.uv-case-rm{background:none;border:none;color:var(--faint);font-family:'Mulish';font-weight:600;
  font-size:12.5px;cursor:pointer;padding:6px 9px;border-radius:9px;white-space:nowrap;}
.uv-case-rm:hover{color:#B0564E;background:#f6ece9;}
.uv-case-sum{color:var(--soft);font-size:13px;margin:5px 2px 16px;}
.uv-case-sum b{color:var(--moss-deep);font-weight:700;}

/* bőrönd súly + limit */
.uv-cw{margin:6px 2px 18px;}
.uv-cw-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.uv-cw-main{color:var(--soft);font-size:13px;}
.uv-cw-main b{color:var(--moss-deep);font-weight:700;}
.uv-cw-limit{background:none;border:1px solid var(--line);border-radius:9px;padding:5px 11px;cursor:pointer;
  font-family:'Mulish';font-weight:600;font-size:12.5px;color:var(--moss);transition:all .15s;white-space:nowrap;}
.uv-cw-limit:hover{border-color:var(--moss);background:var(--surface);}
.uv-cw-edit{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:11px;margin-top:9px;}
.uv-cw-presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px;}
.uv-cw-preset{font-family:'Mulish';font-weight:600;font-size:12.5px;color:var(--ink);background:var(--surface2);
  border:1px solid var(--line);border-radius:8px;padding:6px 11px;cursor:pointer;transition:all .15s;}
.uv-cw-preset:hover{border-color:var(--moss);background:#fff;}
.uv-cw-editrow{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.uv-cw-input{width:64px;}
.uv-cw-bar{position:relative;height:8px;border-radius:6px;background:var(--track);overflow:hidden;margin-top:11px;}
.uv-cw-plan,.uv-cw-fill{position:absolute;left:0;top:0;height:100%;border-radius:6px;
  transition:width .5s cubic-bezier(.4,0,.2,1),background .25s;}
.uv-cw-warn{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;font-weight:600;line-height:1.4;
  border-radius:10px;padding:9px 12px;margin-top:11px;}
.uv-cw-ic{flex:none;display:flex;margin-top:1px;}
.uv-cw-warn.is-info{background:#eef1e9;color:var(--moss-deep);}
.uv-cw-warn.is-warn{background:#f6ecdf;color:#8a5a23;}
.uv-cw-warn.is-danger{background:#f6ece9;color:#9a4039;}
.uv-cw-note{color:var(--soft);font-size:12.5px;margin:9px 0 0;}

/* per-category add */
.uv-group-add{display:inline-flex;align-items:center;gap:5px;font-family:'Mulish';font-weight:600;
  font-size:13px;color:var(--moss);background:none;border:1px dashed var(--track);border-radius:10px;
  padding:8px 13px;margin-top:2px;cursor:pointer;transition:all .15s;}
.uv-group-add:hover{border-color:var(--moss);background:var(--surface);}
.uv-ginline{display:flex;gap:7px;align-items:stretch;margin-top:2px;flex-wrap:wrap;}
.uv-ginput{flex:1;min-width:140px;padding:9px 12px;font-size:14px;}
.uv-add-btn{font-family:'Mulish';font-weight:700;font-size:13px;color:#fff;background:var(--moss);
  border:none;border-radius:10px;padding:9px 14px;cursor:pointer;transition:background .15s;white-space:nowrap;}
.uv-add-btn:hover{background:var(--moss-deep);}
.uv-qty-add{background:var(--surface2);border:1px solid var(--line);}
.uv-gclose{font-family:'Mulish';font-weight:600;font-size:13px;color:var(--soft);background:none;
  border:none;border-radius:10px;padding:9px 12px;cursor:pointer;}
.uv-gclose:hover{background:var(--surface2);color:var(--ink);}

/* start a new category */
/* sablon-feltöltés felajánlás */
.uv-fill-offer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
  background:#eef1e9;border:1px solid #d7decb;border-radius:13px;padding:12px 14px;margin-bottom:14px;}
.uv-fill-offer-text{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--moss-deep);
  line-height:1.4;flex:1;min-width:160px;}
.uv-fill-offer-text svg{flex:none;color:var(--moss);}
.uv-fill-offer-text b{font-weight:700;}

.uv-startcat{margin-top:6px;padding-top:18px;border-top:1px solid var(--line);}
.uv-startcat-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px;}
.uv-startchip{display:inline-flex;align-items:center;gap:7px;font-family:'Mulish';font-weight:600;
  font-size:13px;color:var(--ink);background:var(--surface);border:1px solid var(--line);
  border-radius:20px;padding:8px 14px;cursor:pointer;transition:all .15s;}
.uv-startchip:hover{border-color:var(--moss);background:#fff;transform:translateY(-1px);}

/* filter */
.uv-filter{display:flex;gap:8px;margin-bottom:14px;}
.uv-chip{font-family:'Mulish';font-weight:600;font-size:13px;color:var(--soft);background:var(--surface);
  border:1px solid var(--line);border-radius:20px;padding:7px 15px;cursor:pointer;transition:all .15s;}
.uv-chip.is-on{background:var(--moss);color:#fff;border-color:var(--moss);}

/* groups + items */
.uv-group{margin-bottom:20px;}
.uv-group-head{display:flex;align-items:center;gap:8px;font-family:'Mulish';font-weight:700;font-size:13px;
  letter-spacing:.03em;color:var(--soft);margin:0 2px 9px;text-transform:uppercase;}
.uv-dot{width:8px;height:8px;border-radius:50%;flex:none;}
.uv-group-count{margin-left:auto;color:var(--faint);font-weight:600;font-size:12px;}
.uv-item{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--line);
  border-radius:12px;padding:11px 13px;margin-bottom:7px;transition:opacity .2s,background .2s;}
.uv-item.is-packed{background:var(--surface2);}
.uv-item.is-packed .uv-item-name{color:var(--faint);text-decoration:line-through;text-decoration-color:var(--line);}
.uv-check{width:24px;height:24px;border-radius:8px;border:2px solid var(--line);background:var(--surface);
  flex:none;cursor:pointer;display:grid;place-items:center;transition:all .16s;}
.uv-check:hover{border-color:var(--moss);}
.uv-item-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;align-items:flex-start;}
.uv-item-name{font-size:14.5px;font-weight:500;line-height:1.25;}
.uv-wchip{border:none;background:none;padding:1px 0;margin:0;cursor:pointer;font-family:'Mulish';
  font-size:11.5px;font-weight:600;color:var(--faint);font-variant-numeric:tabular-nums;
  border-bottom:1px dashed transparent;transition:color .12s,border-color .12s;}
.uv-wchip:hover{color:var(--moss);border-bottom-color:var(--track);}
.uv-wedit{display:inline-flex;align-items:center;gap:3px;}
.uv-winput{width:54px;font-family:'Mulish';font-size:12px;font-weight:600;color:var(--ink);
  background:var(--surface2);border:1px solid var(--moss);border-radius:7px;padding:2px 6px;outline:none;
  -moz-appearance:textfield;}
.uv-winput::-webkit-outer-spin-button,.uv-winput::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.uv-wunit{font-size:11.5px;color:var(--faint);font-weight:600;}
.uv-qty{display:inline-flex;align-items:center;gap:2px;background:var(--surface2);border-radius:9px;padding:2px;flex:none;}
.uv-qty button{width:26px;height:26px;border:none;background:none;border-radius:7px;cursor:pointer;
  font-size:17px;line-height:1;color:var(--soft);font-family:'Mulish';transition:background .12s;}
.uv-qty button:hover{background:#e7ecdb;color:var(--ink);}
.uv-qty span{min-width:18px;text-align:center;font-weight:700;font-size:13.5px;font-variant-numeric:tabular-nums;}
.uv-qty-add{background:var(--surface2);border:1px solid var(--line);}
.uv-trash{border:none;background:none;color:var(--faint);cursor:pointer;padding:5px;border-radius:8px;
  flex:none;transition:color .12s,background .12s;}
.uv-trash:hover{color:#B0564E;background:#f6ece9;}

/* all set */
.uv-allset{text-align:center;padding:36px 20px;color:var(--soft);}
.uv-allset-mark{display:inline-grid;place-items:center;width:48px;height:48px;border-radius:50%;
  background:var(--moss);color:#fff;font-size:24px;margin-bottom:12px;}
.uv-allset p{font-family:'Fraunces',serif;font-size:17px;margin:0;}
.uv-pad{padding:8px 4px;}

/* focus + motion */
.uv-root button:focus-visible,.uv-root input:focus-visible,.uv-root select:focus-visible{
  outline:2px solid var(--moss);outline-offset:2px;}
@media (prefers-reduced-motion:reduce){
  .uv-root *{animation:none!important;transition:none!important;}
}
@media (max-width:420px){
  .uv-tpl-grid{grid-template-columns:1fr;}
  .uv-trip-name{font-size:22px;}
  .uv-bar-btn-label{display:none;}
  .uv-docs-btn-label{display:none;}
}
`}</style>
  );
}
