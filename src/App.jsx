import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────
// FIREBASE SETUP — ganti dengan config anda dari Firebase Console
// https://console.firebase.google.com → Project Settings → Your apps
// ─────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
// Tukar IS_FIREBASE_ENABLED = true selepas isi config di atas
const IS_FIREBASE_ENABLED = false;

// ─────────────────────────────────────────────────────────
const C = {
  bg: "#0F0F13", surface: "#16161D", card: "#1C1C26", border: "#2A2A38",
  accent: "#7C6AF7", accentL: "#A594FF", green: "#2ECC8F", red: "#F05C6E",
  yellow: "#F0C93B", blue: "#4EA8DE", text: "#F0EFF8", muted: "#8888AA", dim: "#44445A",
};

const DEFAULT_CATEGORIES = [
  { id: "makan",      label: "Makan & Minum",  icon: "🍜", color: "#F05C6E", budget: 0 },
  { id: "transport",  label: "Transport",       icon: "🚗", color: "#4EA8DE", budget: 0 },
  { id: "utiliti",    label: "Utiliti & Bil",   icon: "⚡", color: "#F0C93B", budget: 0 },
  { id: "hiburan",    label: "Hiburan",         icon: "🎮", color: "#7C6AF7", budget: 0 },
  { id: "kesihatan",  label: "Kesihatan",       icon: "💊", color: "#2ECC8F", budget: 0 },
  { id: "belanja",    label: "Belanja-belah",   icon: "🛍️", color: "#FF8C42", budget: 0 },
  { id: "pendidikan", label: "Pendidikan",      icon: "📚", color: "#A594FF", budget: 0 },
  { id: "lain",       label: "Lain-lain",       icon: "📦", color: "#8888AA", budget: 0 },
];

const DEFAULT_PROFILE = {
  name: "",
  monthlyIncome: 0,
  currency: "RM",
  savingsTarget: 20,
};

const fmt = (n, currency = "RM") =>
  `${currency} ${Number(n || 0).toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (a, b) => (b === 0 ? 0 : Math.min(100, Math.round((a / b) * 100)));
const todayStr = () => new Date().toISOString().split("T")[0];

// ── Persistent storage (localStorage → Firebase when enabled) ──
const store = {
  get: (key, fallback) => {
    try { const v = localStorage.getItem("wangku_" + key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem("wangku_" + key, JSON.stringify(value)); } catch {}
  },
};

// ── Shared UI ─────────────────────────────────────────────
function ProgressBar({ value, max, color = C.accent, height = 6 }) {
  return (
    <div style={{ background: C.border, borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ width: `${pct(value, max)}%`, height: "100%", background: color, borderRadius: 99, transition: "width .5s ease" }} />
    </div>
  );
}
function Badge({ children, color = C.accent }) {
  return <span style={{ background: color + "22", color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{children}</span>;
}
function Input({ label, ...props }) {
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>}
      <input {...props} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%", ...(props.style || {}) }} />
    </div>
  );
}
function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>}
      <select {...props} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%", ...(props.style || {}) }}>
        {children}
      </select>
    </div>
  );
}
function Btn({ children, variant = "primary", ...props }) {
  const styles = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    secondary: { background: C.card, color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.red + "22", color: C.red, border: `1px solid ${C.red}44` },
    ghost: { background: "transparent", color: C.muted, border: `1px dashed ${C.border}` },
  };
  return (
    <button {...props} style={{ ...styles[variant], borderRadius: 10, padding: "11px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13, width: "100%", ...(props.style || {}) }}>
      {children}
    </button>
  );
}

// ── ONBOARDING ────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ ...DEFAULT_PROFILE });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES.map(c => ({ ...c })));

  const totalBudget = categories.reduce((s, c) => s + Number(c.budget || 0), 0);
  const income = Number(profile.monthlyIncome || 0);
  const remaining = income - totalBudget;

  const steps = [
    {
      title: "Selamat Datang ke WangKu 👋",
      subtitle: "App pengurusan kewangan peribadi anda. Mari setup dalam 3 langkah mudah.",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
              WangKu membantu anda track perbelanjaan, set budget, capai goals kewangan, dan imbas resit secara automatik dengan AI.
            </div>
          </div>
          <Input label="Nama Anda" placeholder="cth: Ahmad" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
          <Select label="Mata Wang" value={profile.currency} onChange={e => setProfile({ ...profile, currency: e.target.value })}>
            <option value="RM">🇲🇾 Ringgit Malaysia (RM)</option>
            <option value="USD">🇺🇸 US Dollar (USD)</option>
            <option value="SGD">🇸🇬 Singapore Dollar (SGD)</option>
          </Select>
        </div>
      ),
      canNext: profile.name.trim().length > 0,
    },
    {
      title: "Pendapatan Bulanan 💼",
      subtitle: "Berapa pendapatan bersih anda sebulan? (Selepas potongan)",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Pendapatan Bulanan Bersih</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 20, color: C.muted }}>{profile.currency}</span>
              <input
                type="number"
                placeholder="0.00"
                value={profile.monthlyIncome || ""}
                onChange={e => setProfile({ ...profile, monthlyIncome: e.target.value })}
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 36, fontWeight: 900, color: C.green, width: 180, textAlign: "center" }}
              />
            </div>
          </div>
          <Input
            label={`Sasaran Simpanan (%) — Disyor: 20%`}
            type="number"
            placeholder="20"
            value={profile.savingsTarget || ""}
            onChange={e => setProfile({ ...profile, savingsTarget: e.target.value })}
          />
          {income > 0 && (
            <div style={{ background: C.accent + "11", border: `1px solid ${C.accent}33`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: C.accentL }}>
                💡 Dengan pendapatan {fmt(income, profile.currency)}, sasaran simpanan {profile.savingsTarget || 20}% = <strong>{fmt(income * (profile.savingsTarget || 20) / 100, profile.currency)}/bulan</strong>
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, padding: "0 4px" }}>
            ℹ️ Maklumat ini hanya disimpan di peranti anda dan tidak dikongsi dengan sesiapa.
          </div>
        </div>
      ),
      canNext: Number(profile.monthlyIncome) > 0,
    },
    {
      title: "Set Budget Kategori 📊",
      subtitle: "Berapa nak peruntukkan untuk setiap kategori sebulan?",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {income > 0 && (
            <div style={{ background: remaining >= 0 ? C.green + "11" : C.red + "11", border: `1px solid ${remaining >= 0 ? C.green : C.red}44`, borderRadius: 12, padding: 12, marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted }}>Pendapatan</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{fmt(income, profile.currency)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Total Budget</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{fmt(totalBudget, profile.currency)}</span>
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Baki / Simpanan</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: remaining >= 0 ? C.green : C.red }}>{fmt(remaining, profile.currency)}</span>
              </div>
            </div>
          )}
          {categories.map((cat, i) => (
            <div key={cat.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{cat.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{profile.currency}</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={cat.budget || ""}
                    onChange={e => {
                      const updated = [...categories];
                      updated[i] = { ...cat, budget: Number(e.target.value) };
                      setCategories(updated);
                    }}
                    style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 13, outline: "none", width: 110 }}
                  />
                  {income > 0 && cat.budget > 0 && (
                    <span style={{ fontSize: 11, color: C.muted }}>{pct(cat.budget, income)}%</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.dim, textAlign: "center", marginTop: 4 }}>Boleh ubah bila-bila masa dalam Settings</div>
        </div>
      ),
      canNext: true,
    },
  ];

  const current = steps[step];

  const finish = () => {
    onDone(profile, categories);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: C.text, maxWidth: 480, margin: "0 auto", padding: "0 0 40px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} select option{background:#1C1C26} input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.7)}`}</style>

      {/* Progress dots */}
      <div style={{ padding: "24px 20px 0", display: "flex", justifyContent: "center", gap: 8 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 99, background: i <= step ? C.accent : C.border, transition: "all .3s" }} />
        ))}
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 6 }}>{current.title}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>{current.subtitle}</div>
        {current.content}
      </div>

      <div style={{ padding: "24px 20px 0", display: "flex", gap: 10 }}>
        {step > 0 && (
          <Btn variant="secondary" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>← Balik</Btn>
        )}
        {step < steps.length - 1 ? (
          <Btn onClick={() => setStep(s => s + 1)} style={{ flex: 2 }} disabled={!current.canNext}>
            Seterusnya →
          </Btn>
        ) : (
          <Btn onClick={finish} style={{ flex: 2, background: C.green, fontSize: 15 }}>
            🚀 Mula Guna WangKu!
          </Btn>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────
function Settings({ profile, setProfile, categories, setCategories, bills, setBills, onReset }) {
  const [tab, setTab] = useState("profil");
  const [editCat, setEditCat] = useState(null);
  const [editBill, setEditBill] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveProfile = (updated) => {
    setProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const income = Number(profile.monthlyIncome || 0);
  const totalBudget = categories.reduce((s, c) => s + Number(c.budget || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4 }}>
        {[["profil","👤","Profil"],["budget","◎","Budget"],["bil","◷","Bil"],["data","🗄️","Data"]].map(([id,icon,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, background: tab === id ? C.accent : "transparent", border: "none", borderRadius: 9, padding: "8px 4px", color: tab === id ? "#fff" : C.muted, fontWeight: 700, cursor: "pointer", fontSize: 11, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 16 }}>{icon}</span>{label}
          </button>
        ))}
      </div>

      {saved && (
        <div style={{ background: C.green + "22", border: `1px solid ${C.green}44`, borderRadius: 10, padding: 10, textAlign: "center", fontSize: 13, color: C.green }}>
          ✅ Disimpan!
        </div>
      )}

      {/* ── TAB: PROFIL ── */}
      {tab === "profil" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Maklumat Peribadi</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label="Nama" placeholder="Nama anda" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
              <Select label="Mata Wang" value={profile.currency} onChange={e => setProfile({ ...profile, currency: e.target.value })}>
                <option value="RM">🇲🇾 Ringgit Malaysia (RM)</option>
                <option value="USD">🇺🇸 US Dollar (USD)</option>
                <option value="SGD">🇸🇬 Singapore Dollar (SGD)</option>
              </Select>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Pendapatan & Sasaran</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label={`Gaji / Pendapatan Bulanan (${profile.currency})`} type="number" placeholder="0.00" value={profile.monthlyIncome || ""} onChange={e => setProfile({ ...profile, monthlyIncome: e.target.value })} />
              <Input label="Sasaran Simpanan Bulanan (%)" type="number" placeholder="20" value={profile.savingsTarget || ""} onChange={e => setProfile({ ...profile, savingsTarget: e.target.value })} />
              {income > 0 && (
                <div style={{ background: C.accent + "11", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: C.accentL }}>
                    Sasaran simpan: <strong>{fmt(income * (profile.savingsTarget || 20) / 100, profile.currency)}/bulan</strong>
                    {" "}({profile.savingsTarget || 20}% daripada {fmt(income, profile.currency)})
                  </div>
                </div>
              )}
            </div>
          </div>
          <Btn onClick={() => saveProfile(profile)}>💾 Simpan Profil</Btn>
        </div>
      )}

      {/* ── TAB: BUDGET ── */}
      {tab === "budget" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>Pendapatan</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{fmt(income, profile.currency)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.muted }}>Total Budget</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{fmt(totalBudget, profile.currency)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.muted }}>Baki</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: income - totalBudget >= 0 ? C.green : C.red }}>{fmt(income - totalBudget, profile.currency)}</div>
            </div>
          </div>

          {categories.map((cat, i) => (
            <div key={cat.id} style={{ background: C.card, border: `1px solid ${editCat === i ? C.accent + "88" : C.border}`, borderRadius: 14, padding: 14 }}>
              {editCat === i ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input value={cat.icon} onChange={e => { const u=[...categories]; u[i]={...cat,icon:e.target.value}; setCategories(u); }}
                      style={{ width: 48, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, textAlign: "center", fontSize: 20, color: C.text, outline: "none" }} />
                    <input value={cat.label} onChange={e => { const u=[...categories]; u[i]={...cat,label:e.target.value}; setCategories(u); }}
                      style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{profile.currency}</span>
                    <input type="number" value={cat.budget || ""} placeholder="0" onChange={e => { const u=[...categories]; u[i]={...cat,budget:Number(e.target.value)}; setCategories(u); }}
                      style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, outline: "none", fontWeight: 700 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => setEditCat(null)} style={{ flex: 1 }}>✓ Simpan</Btn>
                    <Btn variant="danger" onClick={() => { setCategories(prev => prev.filter((_,j) => j !== i)); setEditCat(null); }} style={{ flex: 1 }}>🗑 Padam</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={() => setEditCat(i)}>
                  <span style={{ fontSize: 22 }}>{cat.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Budget: {fmt(cat.budget, profile.currency)}</div>
                  </div>
                  <span style={{ fontSize: 12, color: C.accent }}>Edit ✎</span>
                </div>
              )}
            </div>
          ))}

          <Btn variant="ghost" onClick={() => setCategories(prev => [...prev, { id: "cat_" + Date.now(), label: "Kategori Baru", icon: "📌", color: C.accent, budget: 0 }])}>
            + Tambah Kategori
          </Btn>
          <Btn onClick={() => { store.set("categories", categories); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>💾 Simpan Budget</Btn>
        </div>
      )}

      {/* ── TAB: BIL ── */}
      {tab === "bil" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: C.muted, padding: "0 2px" }}>Senarai bil & langganan bulanan anda</div>
          {bills.map((bill, i) => (
            <div key={bill.id} style={{ background: C.card, border: `1px solid ${editBill === i ? C.accent + "88" : C.border}`, borderRadius: 14, padding: 14 }}>
              {editBill === i ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={bill.icon} onChange={e => { const u=[...bills]; u[i]={...bill,icon:e.target.value}; setBills(u); }}
                      style={{ width: 48, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, textAlign: "center", fontSize: 20, color: C.text, outline: "none" }} />
                    <input value={bill.name} onChange={e => { const u=[...bills]; u[i]={...bill,name:e.target.value}; setBills(u); }}
                      style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Jumlah ({profile.currency})</div>
                      <input type="number" value={bill.amount || ""} onChange={e => { const u=[...bills]; u[i]={...bill,amount:Number(e.target.value)}; setBills(u); }}
                        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Hari Due (1-31)</div>
                      <input type="number" min="1" max="31" value={bill.dueDay || ""} onChange={e => { const u=[...bills]; u[i]={...bill,dueDay:Number(e.target.value)}; setBills(u); }}
                        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => setEditBill(null)} style={{ flex: 1 }}>✓ Simpan</Btn>
                    <Btn variant="danger" onClick={() => { setBills(prev => prev.filter((_,j) => j !== i)); setEditBill(null); }} style={{ flex: 1 }}>🗑 Padam</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={() => setEditBill(i)}>
                  <span style={{ fontSize: 22 }}>{bill.icon || "📄"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{bill.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{fmt(bill.amount, profile.currency)} • Due: {bill.dueDay} haribulan</div>
                  </div>
                  <span style={{ fontSize: 12, color: C.accent }}>Edit ✎</span>
                </div>
              )}
            </div>
          ))}
          <Btn variant="ghost" onClick={() => setBills(prev => [...prev, { id: Date.now(), name: "Bil Baru", icon: "📄", amount: 0, dueDay: 1, category: "utiliti" }])}>
            + Tambah Bil
          </Btn>
          <Btn onClick={() => { store.set("bills", bills); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>💾 Simpan Bil</Btn>
        </div>
      )}

      {/* ── TAB: DATA ── */}
      {tab === "data" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>☁️ Firebase Sync</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
              {IS_FIREBASE_ENABLED ? "Firebase aktif — data disimpan ke cloud." : "Firebase belum dikonfigurasi. Data disimpan secara tempatan (localStorage)."}
            </div>
            <div style={{ background: IS_FIREBASE_ENABLED ? C.green + "11" : C.yellow + "11", border: `1px solid ${IS_FIREBASE_ENABLED ? C.green : C.yellow}44`, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 12, color: IS_FIREBASE_ENABLED ? C.green : C.yellow }}>
                {IS_FIREBASE_ENABLED ? "✅ Disambungkan ke Firebase" : "⚠️ Mode Offline — buka fail wangku-app.jsx dan isi FIREBASE_CONFIG"}
              </div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📤 Export Data</div>
            <Btn variant="secondary" onClick={() => {
              const data = { profile, categories, bills, transactions: store.get("transactions", []), goals: store.get("goals", []), exported: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `wangku-backup-${todayStr()}.json`; a.click();
            }}>
              💾 Export JSON Backup
            </Btn>
          </div>

          <div style={{ background: C.red + "11", border: `1px solid ${C.red}44`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ Danger Zone</div>
            {!showResetConfirm ? (
              <Btn variant="danger" onClick={() => setShowResetConfirm(true)}>🗑 Reset Semua Data</Btn>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, color: C.red }}>Adakah anda pasti? Semua data akan dipadam!</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="danger" onClick={onReset} style={{ flex: 1 }}>Ya, Padam</Btn>
                  <Btn variant="secondary" onClick={() => setShowResetConfirm(false)} style={{ flex: 1 }}>Batal</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────
function Dashboard({ transactions, goals, categories, profile, setPage }) {
  const inc = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const exp = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const bal = inc - exp;
  const manualIncome = Number(profile.monthlyIncome || 0);
  const totalIncome = inc || manualIncome;
  const savRate = totalIncome > 0 ? ((totalIncome - exp) / totalIncome * 100).toFixed(1) : 0;

  const catSpend = {};
  categories.forEach(c => { catSpend[c.id] = 0; });
  transactions.filter(t => t.type === "expense").forEach(t => { if (catSpend[t.category] !== undefined) catSpend[t.category] += t.amount; });

  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const isEmpty = transactions.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Welcome */}
      {profile.name && (
        <div style={{ fontSize: 15, color: C.muted }}>Helo, <span style={{ color: C.text, fontWeight: 700 }}>{profile.name}</span> 👋</div>
      )}

      {/* Hero balance */}
      <div style={{ background: `linear-gradient(135deg, ${C.accent}22, ${C.accentL}11)`, border: `1px solid ${C.accent}44`, borderRadius: 18, padding: 22 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>Baki Bulan Ini</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: bal >= 0 ? C.green : C.red, letterSpacing: -1, marginBottom: 16 }}>
          {fmt(bal, profile.currency)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", gap: 8, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: C.muted }}>Masuk</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmt(inc, profile.currency)}</div>
          </div>
          <div style={{ background: C.border, height: 28 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.muted }}>Keluar</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.red }}>{fmt(exp, profile.currency)}</div>
          </div>
          <div style={{ background: C.border, height: 28 }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.muted }}>Simpan</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{savRate}%</div>
          </div>
        </div>
      </div>

      {/* Empty state nudge */}
      {isEmpty && (
        <div style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: 16, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Tiada transaksi lagi</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Mula rekod perbelanjaan atau imbas resit anda</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => setPage("transactions")} style={{ flex: 1, fontSize: 12 }}>+ Tambah Transaksi</Btn>
            <Btn variant="secondary" onClick={() => setPage("scanner")} style={{ flex: 1, fontSize: 12 }}>🧾 Imbas Resit</Btn>
          </div>
        </div>
      )}

      {/* Category budget cards */}
      {categories.some(c => c.budget > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {categories.filter(c => c.budget > 0).slice(0, 4).map(cat => {
            const spent = catSpend[cat.id] || 0;
            const over = spent > cat.budget;
            return (
              <div key={cat.id} style={{ background: C.card, border: `1px solid ${over ? C.red + "55" : C.border}`, borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  {over && <Badge color={C.red}>Lebih!</Badge>}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{cat.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: over ? C.red : C.text }}>{fmt(spent, profile.currency)}</div>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 5 }}>/ {fmt(cat.budget, profile.currency)}</div>
                <ProgressBar value={spent} max={cat.budget} color={over ? C.red : cat.color} />
              </div>
            );
          })}
        </div>
      )}

      {/* Recent transactions */}
      {recent.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Transaksi Terkini</div>
          {recent.map((t, i) => {
            const cat = categories.find(c => c.id === t.category);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: (cat?.color || C.accent) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginRight: 12 }}>
                  {t.fromReceipt ? "🧾" : (cat?.icon || "💰")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.desc}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{t.date}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.type === "income" ? C.green : C.red }}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount, profile.currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goals summary */}
      {goals.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Goals</div>
          {goals.map(g => (
            <div key={g.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{g.icon} {g.title}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{pct(g.saved, g.target)}%</span>
              </div>
              <ProgressBar value={g.saved} max={g.target} color={g.color} height={5} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TRANSACTIONS ──────────────────────────────────────────
function Transactions({ transactions, setTransactions, categories, profile }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const blank = { desc: "", amount: "", type: "expense", category: categories[0]?.id || "lain", date: todayStr(), account: "cash" };
  const [form, setForm] = useState(blank);

  const filtered = transactions.filter(t => {
    if (filter !== "all" && t.type !== filter) return false;
    if (search && !t.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const save = () => {
    if (!form.desc || !form.amount) return;
    if (editId) {
      setTransactions(prev => prev.map(t => t.id === editId ? { ...form, id: editId, amount: parseFloat(form.amount) } : t));
      setEditId(null);
    } else {
      setTransactions(prev => [{ ...form, id: Date.now(), amount: parseFloat(form.amount) }, ...prev]);
    }
    setForm(blank); setShowForm(false);
  };

  const startEdit = (t) => {
    setForm({ desc: t.desc, amount: t.amount, type: t.type, category: t.category, date: t.date, account: t.account });
    setEditId(t.id);
    setShowForm(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="🔍 Cari..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none" }} />
        <button onClick={() => { setForm(blank); setEditId(null); setShowForm(!showForm); }}
          style={{ background: C.accent, border: "none", borderRadius: 10, padding: "10px 18px", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 20 }}>+</button>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {[["all","Semua"],["income","Masuk"],["expense","Keluar"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ flex: 1, background: filter === v ? C.accent : C.card, border: `1px solid ${filter === v ? C.accent : C.border}`, borderRadius: 10, padding: "8px 0", color: filter === v ? "#fff" : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}55`, borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accentL, marginBottom: 14 }}>{editId ? "✎ Edit Transaksi" : "+ Transaksi Baru"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input placeholder="Penerangan (cth: Lunch Mamak)" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="Jumlah" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={{ flex: 1 }} />
              <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ flex: 1 }}>
                <option value="expense">⬇ Keluar</option>
                <option value="income">⬆ Masuk</option>
              </Select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ flex: 1 }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </Select>
              <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ flex: 1 }} />
            </div>
            <Select value={form.account} onChange={e => setForm({...form, account: e.target.value})}>
              <option value="cash">💵 Tunai</option>
              <option value="maybank">🏦 Maybank</option>
              <option value="cimb">🏦 CIMB</option>
              <option value="rh">🏦 RHB</option>
              <option value="tng">💳 Touch 'n Go</option>
              <option value="grabpay">💳 GrabPay</option>
              <option value="boost">💳 Boost</option>
              <option value="card">💳 Kad Kredit</option>
            </Select>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={save} style={{ flex: 2 }}>{editId ? "✓ Kemaskini" : "✓ Simpan"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(blank); }} style={{ flex: 1 }}>Batal</Btn>
            </div>
            {editId && <Btn variant="danger" onClick={() => { setTransactions(prev => prev.filter(t => t.id !== editId)); setShowForm(false); setEditId(null); }}>🗑 Padam Transaksi</Btn>}
          </div>
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            Tiada transaksi
          </div>
        )}
        {filtered.map((t, i) => {
          const cat = categories.find(c => c.id === t.category);
          return (
            <div key={t.id} onClick={() => startEdit(t)} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: (cat?.color || C.accent) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginRight: 12 }}>
                {t.fromReceipt ? "🧾" : (cat?.icon || "💰")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{t.date} · {t.account}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.type === "income" ? C.green : C.red }}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount, profile.currency)}
                </div>
                <div style={{ fontSize: 10, color: C.dim }}>ketik edit</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── BUDGET ────────────────────────────────────────────────
function Budget({ transactions, categories, profile }) {
  const catSpend = {};
  categories.forEach(c => { catSpend[c.id] = 0; });
  transactions.filter(t => t.type === "expense").forEach(t => { if (catSpend[t.category] !== undefined) catSpend[t.category] += t.amount; });
  const totalBudget = categories.reduce((s, c) => s + Number(c.budget || 0), 0);
  const totalSpent = Object.values(catSpend).reduce((s, v) => s + v, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          {[["Total Budget", totalBudget, C.text], ["Dibelanjakan", totalSpent, C.red], ["Baki", totalBudget - totalSpent, totalBudget - totalSpent >= 0 ? C.green : C.red]].map(([l, v, col]) => (
            <div key={l} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: col }}>{fmt(v, profile.currency)}</div>
            </div>
          ))}
        </div>
        <ProgressBar value={totalSpent} max={totalBudget || 1} color={totalSpent > totalBudget ? C.red : C.accent} height={8} />
        <div style={{ textAlign: "right", fontSize: 10, color: C.muted, marginTop: 4 }}>{pct(totalSpent, totalBudget || 1)}% digunakan</div>
      </div>

      {categories.map(cat => {
        const spent = catSpend[cat.id] || 0;
        const over = cat.budget > 0 && spent > cat.budget;
        const remaining = cat.budget - spent;
        return (
          <div key={cat.id} style={{ background: C.card, border: `1px solid ${over ? C.red + "55" : C.border}`, borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginRight: 12 }}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{cat.budget > 0 ? `Budget: ${fmt(cat.budget, profile.currency)}` : "Tiada budget ditetapkan"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: over ? C.red : C.text }}>{fmt(spent, profile.currency)}</div>
                {cat.budget > 0 && <div style={{ fontSize: 11, color: over ? C.red : C.green }}>{over ? `+${fmt(-remaining, profile.currency)} lebih` : `${fmt(remaining, profile.currency)} lagi`}</div>}
              </div>
            </div>
            {cat.budget > 0 && <ProgressBar value={spent} max={cat.budget} color={over ? C.red : cat.color} />}
          </div>
        );
      })}
    </div>
  );
}

// ── GOALS ─────────────────────────────────────────────────
function Goals({ goals, setGoals, profile }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const blank = { title: "", target: "", saved: "0", deadline: "", icon: "🎯", color: C.accent };
  const [form, setForm] = useState(blank);

  const save = () => {
    if (!form.title || !form.target) return;
    const entry = { ...form, target: parseFloat(form.target), saved: parseFloat(form.saved || 0) };
    if (editId) {
      setGoals(prev => prev.map(g => g.id === editId ? { ...entry, id: editId } : g));
      setEditId(null);
    } else {
      setGoals(prev => [...prev, { ...entry, id: Date.now() }]);
    }
    setForm(blank); setShowForm(false);
  };

  const startEdit = (g) => {
    setForm({ title: g.title, target: g.target, saved: g.saved, deadline: g.deadline || "", icon: g.icon, color: g.color });
    setEditId(g.id); setShowForm(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Btn onClick={() => { setForm(blank); setEditId(null); setShowForm(!showForm); }}>+ Tambah Goal Baru</Btn>

      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}55`, borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accentL, marginBottom: 14 }}>{editId ? "✎ Edit Goal" : "🎯 Goal Baru"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input placeholder="Nama goal (cth: Beli Rumah)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="Target (RM)" type="number" value={form.target} onChange={e => setForm({...form, target: e.target.value})} style={{ flex: 1 }} />
              <Input placeholder="Ada simpan" type="number" value={form.saved} onChange={e => setForm({...form, saved: e.target.value})} style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="Emoji" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} style={{ width: 60, textAlign: "center", fontSize: 20 }} />
              <Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={save} style={{ flex: 2 }}>{editId ? "✓ Kemaskini" : "✓ Simpan"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditId(null); }} style={{ flex: 1 }}>Batal</Btn>
            </div>
            {editId && <Btn variant="danger" onClick={() => { setGoals(prev => prev.filter(g => g.id !== editId)); setShowForm(false); setEditId(null); }}>🗑 Padam</Btn>}
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <div style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Tiada goal lagi</div>
          <div style={{ fontSize: 13, color: C.muted }}>Tetapkan matlamat kewangan anda!</div>
        </div>
      )}

      {goals.map(g => {
        const p = pct(g.saved, g.target);
        const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
        const remaining = g.target - g.saved;
        const monthlyNeeded = daysLeft && daysLeft > 0 ? (remaining / (daysLeft / 30)).toFixed(2) : null;
        return (
          <div key={g.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: g.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginRight: 14 }}>{g.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{g.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  {daysLeft !== null && <Badge color={daysLeft < 30 ? C.red : C.blue}>{daysLeft > 0 ? `${daysLeft} hari` : "Tamat!"}</Badge>}
                  {p >= 100 && <Badge color={C.green}>✓ Selesai!</Badge>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: g.color }}>{p}%</div>
                <button onClick={() => startEdit(g)} style={{ background: C.accent + "22", border: "none", borderRadius: 8, padding: "4px 10px", color: C.accent, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Edit ✎</button>
              </div>
            </div>
            <ProgressBar value={g.saved} max={g.target} color={g.color} height={8} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, marginBottom: 14 }}>
              <div><div style={{ fontSize: 10, color: C.muted }}>Terkumpul</div><div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(g.saved, profile.currency)}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.muted }}>Target</div><div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(g.target, profile.currency)}</div></div>
            </div>
            {monthlyNeeded && p < 100 && (
              <div style={{ background: g.color + "11", border: `1px solid ${g.color}33`, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: g.color }}>💡 Perlu simpan <strong>{fmt(monthlyNeeded, profile.currency)}/bulan</strong></div>
              </div>
            )}
            {p < 100 && (
              <div style={{ display: "flex", gap: 6 }}>
                {[100, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setGoals(prev => prev.map(x => x.id === g.id ? {...x, saved: Math.min(x.target, x.saved + amt)} : x))}
                    style={{ flex: 1, background: C.border, border: "none", borderRadius: 8, padding: "8px 0", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    +{profile.currency}{amt}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── RECEIPT SCANNER ───────────────────────────────────────
function ReceiptScanner({ setTransactions, categories, profile }) {
  const [step, setStep] = useState("idle");
  const [imageData, setImageData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [error, setError] = useState(null);
  const [scannedReceipts, setScannedReceipts] = useState([]);
  const fileRef = useRef(); const cameraRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    const r = new FileReader();
    r.onload = e => { setImageData(e.target.result); setStep("preview"); setError(null); setScanResult(null); };
    r.readAsDataURL(file);
  };

  const compressImage = (file) => new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) { if (width > height) { height = Math.round(height * MAX / width); width = MAX; } else { width = Math.round(width * MAX / height); height = MAX; } }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) { rej(new Error("Gagal compress")); return; }
        const r2 = new FileReader();
        r2.onload = () => res(r2.result.split(",")[1]);
        r2.onerror = () => rej(new Error("Gagal baca")); r2.readAsDataURL(blob);
      }, "image/jpeg", 0.82);
    };
    img.onerror = () => rej(new Error("Gagal muatkan")); img.src = url;
  });

  const scanReceipt = async () => {
    if (!imageFile) return;
    setStep("scanning"); setError(null);
    try {
      let base64;
      try { base64 = await compressImage(imageFile); }
      catch { base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(new Error("Gagal baca")); r.readAsDataURL(imageFile); }); }

      const catList = categories.map(c => c.id).join("/");
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1024,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            { type: "text", text: `You are an expert receipt OCR. Read ALL text in this receipt image carefully.
Reply ONLY in this exact JSON format, no other text:
{"merchant":"shop name","amount":total_number,"date":"YYYY-MM-DD","category":"one of: ${catList}","items":["item1","item2"],"tax":0,"payment_method":"cash/card/ewallet","confidence":"high/medium/low"}
Rules: amount=final total as plain number. date=YYYY-MM-DD, today=${todayStr()} if unclear. confidence=high if all fields clear. For Malaysian receipts look for "Rounded Total"/"Grand Total"/"JUMLAH".` }
          ]}]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content.map(c => c.text || "").join("").trim();
      const clean = text.replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(clean); }
      catch { const m = clean.match(/\{[\s\S]*?\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch { throw new Error("AI tidak dapat baca resit"); } } else throw new Error("AI tidak dapat baca resit"); }
      if (!parsed.amount || isNaN(Number(parsed.amount))) { parsed.amount = 0; parsed.confidence = "low"; }
      setScanResult(parsed);
      setEditForm({ desc: parsed.merchant || "Resit Imbasan", amount: Number(parsed.amount).toFixed(2), category: parsed.category || categories[0]?.id || "lain", date: parsed.date || todayStr(), type: "expense", account: parsed.payment_method === "card" ? "card" : parsed.payment_method === "ewallet" ? "tng" : "cash" });
      setStep("result");
    } catch (err) { setError(err.message || "Gagal imbas"); setStep("preview"); }
  };

  const confirmSave = () => {
    if (!editForm.desc || !editForm.amount) return;
    const newTx = { id: Date.now(), ...editForm, amount: parseFloat(editForm.amount), fromReceipt: true };
    setTransactions(prev => [newTx, ...prev]);
    setScannedReceipts(prev => [{ ...newTx, imageData, items: scanResult?.items || [] }, ...prev]);
    setStep("saved");
  };

  const reset = () => { setStep("idle"); setImageData(null); setImageFile(null); setScanResult(null); setEditForm(null); setError(null); };
  const inp = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {step === "idle" && (
        <>
          <div style={{ background: `linear-gradient(135deg,${C.accent}22,${C.blue}11)`, border: `2px dashed ${C.accent}66`, borderRadius: 20, padding: 30, textAlign: "center" }}>
            <div style={{ fontSize: 50, marginBottom: 10 }}>🧾</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Imbas Resit dengan AI</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>Claude AI baca resit automatik — ekstrak jumlah, merchant & kategori</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn onClick={() => cameraRef.current?.click()}>📷 Ambil Gambar Resit</Btn>
              <Btn variant="secondary" onClick={() => fileRef.current?.click()}>🖼️ Upload dari Galeri</Btn>
              <Btn variant="ghost" onClick={() => { setImageData(null); setScanResult(null); setEditForm({ desc: "", amount: "", category: categories[0]?.id || "lain", date: todayStr(), type: "expense", account: "cash" }); setStep("result"); }}>✏️ Isi Manual</Btn>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>
          {scannedReceipts.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Resit Diimbas ({scannedReceipts.length})</div>
              {scannedReceipts.slice(0, 5).map((r, i) => {
                const cat = categories.find(c => c.id === r.category);
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: i < scannedReceipts.length - 1 ? `1px solid ${C.border}` : "none", gap: 10 }}>
                    {r.imageData && <img src={r.imageData} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />}
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{r.desc}</div><div style={{ fontSize: 11, color: C.muted }}>{r.date} · {cat?.icon} {cat?.label}</div></div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>-{fmt(r.amount, profile.currency)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {step === "preview" && imageData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700 }}>📸 Semak Imej</div>
            <img src={imageData} alt="resit" style={{ width: "100%", maxHeight: 380, objectFit: "contain", background: "#111", display: "block" }} />
            <div style={{ padding: "8px 16px", fontSize: 11, color: C.muted }}>💡 Pastikan teks resit jelas untuk hasil terbaik</div>
          </div>
          {error && (
            <div style={{ background: C.red + "11", border: `1px solid ${C.red}44`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, color: C.red, fontWeight: 700, marginBottom: 6 }}>⚠️ Gagal mengimbas</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{error}</div>
              <Btn variant="ghost" onClick={() => { setScanResult(null); setEditForm({ desc: "", amount: "", category: categories[0]?.id || "lain", date: todayStr(), type: "expense", account: "cash" }); setStep("result"); }} style={{ fontSize: 12 }}>✏️ Isi Manual Sahaja</Btn>
            </div>
          )}
          <Btn onClick={scanReceipt}>🤖 {error ? "Cuba Semula" : "Imbas dengan AI"}</Btn>
          <Btn variant="secondary" onClick={reset}>← Pilih Gambar Lain</Btn>
        </div>
      )}

      {step === "scanning" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 20, padding: 30, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }}>🤖</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>AI Sedang Menganalisis...</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>Membaca teks, jumlah & merchant</div>
            <div style={{ background: C.border, borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", background: `linear-gradient(90deg,${C.accent},${C.accentL})`, borderRadius: 99, animation: "bar 2s ease-in-out infinite" }} />
            </div>
          </div>
          {imageData && <img src={imageData} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 12, opacity: 0.5, filter: "blur(1px)" }} />}
          <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}} @keyframes bar{0%{width:0%}50%{width:70%}100%{width:100%}}`}</style>
        </div>
      )}

      {step === "result" && editForm && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {scanResult ? (
              <Badge color={scanResult.confidence === "high" ? C.green : scanResult.confidence === "medium" ? C.yellow : C.red}>
                {scanResult.confidence === "high" ? "✓ Keyakinan Tinggi" : scanResult.confidence === "medium" ? "~ Semak Semula" : "! Semak Semula"}
              </Badge>
            ) : <Badge color={C.yellow}>✏️ Manual</Badge>}
            <span style={{ fontSize: 12, color: C.muted }}>Semak & betulkan maklumat</span>
          </div>
          {scanResult?.confidence === "low" && (
            <div style={{ background: C.yellow + "11", border: `1px solid ${C.yellow}33`, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 12, color: C.yellow }}>⚠️ AI kurang pasti — sila semak semua medan</div>
            </div>
          )}
          {imageData && (
            <div style={{ display: "flex", gap: 10 }}>
              <img src={imageData} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              {scanResult?.items?.length > 0 && (
                <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Item Dikesan</div>
                  {scanResult.items.map((it, i) => <div key={i} style={{ fontSize: 12, color: C.text }}>• {it}</div>)}
                </div>
              )}
            </div>
          )}
          <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accentL, marginBottom: 14 }}>✏️ Sahkan Maklumat</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Penerangan / Merchant</div><input value={editForm.desc} onChange={e => setEditForm({...editForm, desc: e.target.value})} style={inp} /></div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Jumlah ({profile.currency})</div><input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={inp} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Tarikh</div><input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} style={inp} /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Kategori</div>
                  <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} style={inp}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Akaun</div>
                  <select value={editForm.account} onChange={e => setEditForm({...editForm, account: e.target.value})} style={inp}>
                    <option value="cash">💵 Tunai</option>
                    <option value="maybank">🏦 Maybank</option>
                    <option value="cimb">🏦 CIMB</option>
                    <option value="tng">💳 TnG</option>
                    <option value="grabpay">💳 GrabPay</option>
                    <option value="card">💳 Kad Kredit</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <Btn onClick={confirmSave} style={{ flex: 2 }}>✓ Simpan Transaksi</Btn>
                <Btn variant="secondary" onClick={reset} style={{ flex: 1 }}>Batal</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "saved" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.green + "11", border: `1px solid ${C.green}44`, borderRadius: 20, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 50, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.green, marginBottom: 6 }}>Berjaya Disimpan!</div>
            {editForm && (
              <div style={{ background: C.card, borderRadius: 12, padding: 14, textAlign: "left", marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.muted }}>Merchant</span><span style={{ fontSize: 13, fontWeight: 700 }}>{editForm.desc}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.muted }}>Jumlah</span><span style={{ fontSize: 15, fontWeight: 800, color: C.red }}>-{fmt(editForm.amount, profile.currency)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: C.muted }}>Tarikh</span><span style={{ fontSize: 13 }}>{editForm.date}</span></div>
              </div>
            )}
          </div>
          <Btn onClick={reset}>🧾 Imbas Resit Lain</Btn>
        </div>
      )}
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────
function Reports({ transactions, categories, profile }) {
  const inc = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const exp = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savRate = inc > 0 ? ((inc - exp) / inc * 100).toFixed(1) : 0;
  const catSpend = {};
  categories.forEach(c => { catSpend[c.id] = 0; });
  transactions.filter(t => t.type === "expense").forEach(t => { if (catSpend[t.category] !== undefined) catSpend[t.category] += t.amount; });
  const topCats = categories.map(c => ({ ...c, spent: catSpend[c.id] || 0 })).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);
  const totalSpent = topCats.reduce((s, c) => s + c.spent, 0);
  const donutR = 70; const circ = 2 * Math.PI * donutR;
  let off = 0;
  const slices = topCats.slice(0, 5).map(c => { const d = totalSpent > 0 ? (c.spent / totalSpent) * circ : 0; const s = { ...c, d, off }; off += d; return s; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[["Pendapatan", inc, C.green, "↑"], ["Perbelanjaan", exp, C.red, "↓"], ["Simpanan", inc - exp, C.accent, "◈"], ["Kadar Simpan", savRate + "%", C.yellow, "%"]].map(([l, v, col, icon]) => (
          <div key={l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{icon} {l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: col }}>{typeof v === "string" ? v : fmt(v, profile.currency)}</div>
          </div>
        ))}
      </div>

      {topCats.length > 0 ? (
        <>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Perbelanjaan Mengikut Kategori</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <svg width={160} height={160} viewBox="0 0 160 160">
                <circle cx={80} cy={80} r={donutR} fill="none" stroke={C.border} strokeWidth={18} />
                {slices.map((s, i) => (
                  <circle key={i} cx={80} cy={80} r={donutR} fill="none" stroke={s.color} strokeWidth={18}
                    strokeDasharray={`${s.d} ${circ - s.d}`} strokeDashoffset={-s.off + circ * 0.25} transform="rotate(-90 80 80)" />
                ))}
                <text x={80} y={76} textAnchor="middle" fill={C.text} fontSize={12} fontWeight={800}>{fmt(totalSpent, profile.currency).replace(profile.currency + " ", "")}</text>
                <text x={80} y={92} textAnchor="middle" fill={C.muted} fontSize={10}>{profile.currency} total</text>
              </svg>
              <div style={{ flex: 1 }}>
                {topCats.slice(0, 5).map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: c.color, marginRight: 8 }} />
                    <div style={{ fontSize: 12, flex: 1 }}>{c.icon} {c.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{pct(c.spent, totalSpent)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Analisis & Cadangan</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: C.green + "11", border: `1px solid ${C.green}33`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: C.green }}>✅ Kadar simpanan {savRate}% — {savRate >= (profile.savingsTarget || 20) ? "Tahniah! Melebihi sasaran!" : `Sasaran anda: ${profile.savingsTarget || 20}%`}</div>
              </div>
              {topCats[0] && <div style={{ background: C.yellow + "11", border: `1px solid ${C.yellow}33`, borderRadius: 10, padding: 10 }}><div style={{ fontSize: 12, color: C.yellow }}>💡 Perbelanjaan tertinggi: {topCats[0].icon} {topCats[0].label} ({fmt(topCats[0].spent, profile.currency)})</div></div>}
              <div style={{ background: C.blue + "11", border: `1px solid ${C.blue}33`, borderRadius: 10, padding: 10 }}><div style={{ fontSize: 12, color: C.blue }}>📊 Nisbah belanja kepada pendapatan: {inc > 0 ? ((exp / inc) * 100).toFixed(1) : 0}%</div></div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Belum ada data untuk dianalisis</div>
          <div style={{ fontSize: 13, color: C.muted }}>Tambah transaksi untuk melihat laporan</div>
        </div>
      )}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "◈", label: "Utama" },
  { id: "transactions", icon: "⇄", label: "Transaksi" },
  { id: "budget", icon: "◎", label: "Budget" },
  { id: "goals", icon: "◉", label: "Goals" },
  { id: "scanner", icon: "⊡", label: "Scanner" },
  { id: "reports", icon: "▦", label: "Laporan" },
];

export default function App() {
  const [setup, setSetup] = useState(() => store.get("setup_done", false));
  const [profile, setProfile] = useState(() => store.get("profile", DEFAULT_PROFILE));
  const [categories, setCategories] = useState(() => store.get("categories", DEFAULT_CATEGORIES));
  const [transactions, setTransactions] = useState(() => store.get("transactions", []));
  const [goals, setGoals] = useState(() => store.get("goals", []));
  const [bills, setBills] = useState(() => store.get("bills", []));
  const [page, setPage] = useState("dashboard");
  const [showNotif, setShowNotif] = useState(false);

  // Auto-save everything to localStorage
  useEffect(() => { store.set("profile", profile); }, [profile]);
  useEffect(() => { store.set("categories", categories); }, [categories]);
  useEffect(() => { store.set("transactions", transactions); }, [transactions]);
  useEffect(() => { store.set("goals", goals); }, [goals]);
  useEffect(() => { store.set("bills", bills); }, [bills]);

  const handleSetupDone = (p, cats) => {
    setProfile(p); setCategories(cats);
    store.set("setup_done", true); setSetup(true);
  };

  const handleReset = () => {
    localStorage.clear();
    setSetup(false); setProfile(DEFAULT_PROFILE);
    setCategories(DEFAULT_CATEGORIES); setTransactions([]); setGoals([]); setBills([]);
    setPage("dashboard");
  };

  const today = new Date().getDate();
  const urgentBills = bills.filter(b => {
    const d = b.dueDay >= today ? b.dueDay - today : 31 + b.dueDay - today;
    return d <= 5;
  });
  const overBudgetCats = categories.filter(cat => {
    const spent = transactions.filter(t => t.type === "expense" && t.category === cat.id).reduce((s, t) => s + t.amount, 0);
    return cat.budget > 0 && spent > cat.budget;
  });
  const notifications = [
    ...overBudgetCats.map(c => ({ id: "b" + c.id, msg: `Budget ${c.label} telah melebihi had!`, color: C.red, icon: "⚠️" })),
    ...urgentBills.map(b => ({ id: "bi" + b.id, msg: `${b.name} perlu dibayar dalam ${b.dueDay >= today ? b.dueDay - today : 31 + b.dueDay - today} hari`, color: C.yellow, icon: "🔔" })),
    ...goals.filter(g => pct(g.saved, g.target) >= 100).map(g => ({ id: "g" + g.id, msg: `Goal "${g.title}" telah tercapai! 🎉`, color: C.green, icon: "🎯" })),
  ];

  if (!setup) return <Onboarding onDone={handleSetupDone} />;

  const pageTitles = { dashboard: "Dashboard", transactions: "Transaksi", budget: "Budget", goals: "Goals", scanner: "Resit Scanner", reports: "Laporan", settings: "Tetapan" };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: C.text, maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::-webkit-scrollbar{width:0} select option{background:#1C1C26} input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.7)}`}</style>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: C.bg + "EE", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}><span style={{ color: C.accent }}>Wang</span><span style={{ color: C.text }}>Ku</span></div>
          <div style={{ fontSize: 10, color: C.muted }}>
            {new Date().toLocaleDateString("ms-MY", { month: "long", year: "numeric" })}
            {IS_FIREBASE_ENABLED && <span style={{ color: C.green }}> · ☁️ Synced</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setPage("settings")} style={{ background: C.card, border: `1px solid ${page === "settings" ? C.accent : C.border}`, borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>⚙️</button>
          <button onClick={() => setShowNotif(!showNotif)} style={{ position: "relative", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>
            🔔
            {notifications.length > 0 && <span style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, background: C.red, borderRadius: 99, border: `2px solid ${C.bg}` }} />}
          </button>
        </div>
      </div>

      {showNotif && (
        <div style={{ position: "fixed", top: 68, right: 10, left: 10, maxWidth: 460, margin: "0 auto", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, zIndex: 100, boxShadow: "0 16px 48px rgba(0,0,0,.6)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Notifikasi</div>
          {notifications.length === 0 ? (
            <div style={{ fontSize: 13, color: C.dim, padding: "8px 0" }}>Tiada notifikasi buat masa ini ✅</div>
          ) : notifications.map(n => (
            <div key={n.id} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 17 }}>{n.icon}</span>
              <span style={{ fontSize: 13, color: n.color }}>{n.msg}</span>
            </div>
          ))}
          <button onClick={() => setShowNotif(false)} style={{ marginTop: 12, width: "100%", background: C.border, border: "none", borderRadius: 10, padding: "10px", color: C.muted, fontWeight: 700, cursor: "pointer" }}>Tutup</button>
        </div>
      )}

      <div style={{ padding: "16px 18px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>{pageTitles[page]}</div>
        {page === "scanner" && <Badge color={C.accent}>🤖 AI</Badge>}
      </div>

      <div style={{ padding: "10px 16px" }}>
        {page === "dashboard" && <Dashboard transactions={transactions} goals={goals} categories={categories} profile={profile} setPage={setPage} />}
        {page === "transactions" && <Transactions transactions={transactions} setTransactions={setTransactions} categories={categories} profile={profile} />}
        {page === "budget" && <Budget transactions={transactions} categories={categories} profile={profile} />}
        {page === "goals" && <Goals goals={goals} setGoals={setGoals} profile={profile} />}
        {page === "scanner" && <ReceiptScanner setTransactions={setTransactions} categories={categories} profile={profile} />}
        {page === "reports" && <Reports transactions={transactions} categories={categories} profile={profile} />}
        {page === "settings" && <Settings profile={profile} setProfile={setProfile} categories={categories} setCategories={setCategories} bills={bills} setBills={setBills} onReset={handleReset} />}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.surface + "F8", backdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 2px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18, filter: page === n.id ? "none" : "grayscale(1) opacity(.35)", transition: "all .2s" }}>{n.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: page === n.id ? C.accent : C.dim, textTransform: "uppercase", letterSpacing: .5 }}>{n.label}</span>
            {page === n.id && <div style={{ width: 4, height: 4, borderRadius: 99, background: C.accent, marginTop: -2 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
