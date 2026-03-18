import { useState, useEffect, useRef } from "react";

const HEADERS = { "Content-Type": "application/json" };
const MODEL = "claude-sonnet-4-20250514";
const BG = "#6b6b69";

const DECEASED_ARTISTS = new Set([
  "John Singer Sargent","Rembrandt","Claude Monet","J.M.W. Turner","Edgar Degas",
  "Vincent van Gogh","Mary Cassatt","Winslow Homer","Caravaggio","Johannes Vermeer",
  "Francisco Goya","Paul Cézanne","Gustav Klimt","Edward Hopper","Andrew Wyeth",
  "Joaquín Sorolla","Anders Zorn","Lucian Freud","Basquiat","Osamu Tezuka",
  "Katsuhiro Otomo","Chuck Jones","Richard Williams","Yoshitaka Amano",
  "Leonardo da Vinci","Michelangelo","Raphael","Titian","Gustave Courbet",
  "Egon Schiele","Ernst Ludwig Kirchner","Käthe Kollwitz","Jacques-Louis David",
  "William-Adolphe Bouguereau","Pablo Picasso","Henri Matisse","Paul Gauguin",
  "Georges Seurat","Jack Kirby","Steve Ditko","Will Eisner","Moebius",
  "Georgia O'Keeffe","Frida Kahlo","Henri de Toulouse-Lautrec","Paul Klee",
  "Wassily Kandinsky","Salvador Dali","Francis Bacon","Isao Takahata","Satoshi Kon"
]);

const MOVEMENT_ARTISTS = {
  "Impressionism": ["Claude Monet","Edgar Degas","Mary Cassatt","Joaquín Sorolla"],
  "Realism": ["Gustave Courbet","Winslow Homer","Edward Hopper","Andrew Wyeth","Lucian Freud","Jenny Saville","Tim Benson"],
  "Baroque": ["Rembrandt","Caravaggio","Johannes Vermeer","Francisco Goya"],
  "Renaissance": ["Leonardo da Vinci","Michelangelo","Raphael","Titian"],
  "Post-Impressionism": ["Paul Cézanne","Vincent van Gogh","Paul Gauguin","Georges Seurat"],
  "Expressionism": ["Egon Schiele","Ernst Ludwig Kirchner","Käthe Kollwitz"],
  "Plein Air": ["John Singer Sargent","Joaquín Sorolla","Anders Zorn","Claude Monet"],
  "Classical": ["Jacques-Louis David","William-Adolphe Bouguereau","John Singer Sargent"],
  "Modernism": ["Pablo Picasso","Henri Matisse","Gustav Klimt","Egon Schiele"],
  "Contemporary": ["Basquiat","Jenny Saville","Lucian Freud","Tim Benson","Kehinde Wiley"],
  "Manga": ["Osamu Tezuka","Naoki Urasawa","Katsuhiro Otomo","Rumiko Takahashi","Yoshitaka Amano"],
  "Anime": ["Hayao Miyazaki","Isao Takahata","Yoshitaka Amano","Satoshi Kon"],
  "Sequential art": ["Naoki Urasawa","Alan Moore","Frank Miller","Will Eisner","Chris Ware"],
  "Character design": ["Glen Keane","Yoshitaka Amano","Rumiko Takahashi","Craig McCracken"],
  "Animation": ["Chuck Jones","Richard Williams","Glen Keane","Hayao Miyazaki","Isao Takahata"],
  "Graphic novel": ["Will Eisner","Frank Miller","Alan Moore","Chris Ware","Moebius"],
  "Comics": ["Jack Kirby","Steve Ditko","Frank Miller","Will Eisner","Moebius"],
};
const ALL_ARTISTS = [...new Set(Object.values(MOVEMENT_ARTISTS).flat())].sort();
const MOVEMENTS = ["Impressionism","Realism","Baroque","Renaissance","Post-Impressionism","Expressionism","Plein Air","Classical","Modernism","Contemporary","Manga","Anime","Sequential art","Character design","Animation","Graphic novel","Comics"];
const MEDIUMS = ["Oil paint","Watercolour","Acrylic","Gouache","Pencil","Charcoal","Pastel","Ink","Digital","Mixed media","Brush & ink","Marker","Screen tone","Digital painting","Frame-by-frame animation"];
const LEVELS = ["Beginner","Developing","Intermediate","Experienced","Advanced"];
const GOALS = ["Portraiture","Figures","Landscapes","Still life","Abstraction","Urban scenes","Animals","Fantasy / imaginative","En plein air","Character design","Manga panels","Storyboarding","Sequential art","Action & movement","Creature design","Environmental design"];

const storage = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  delete: (key) => { try { localStorage.removeItem(key); return true; } catch { return false; } },
  list: (prefix) => { try { const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix)); return { keys }; } catch { return { keys: [] }; } }
};

const callAPI = async (messages, tools = true, maxTokens = 4000) => {
  const body = { model: MODEL, max_tokens: maxTokens, messages };
  if (tools) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch("/api/chat", { method: "POST", headers: HEADERS, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(`${data.error.type}: ${data.error.message}`);
  return data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
};

if (!document.getElementById("teknon-font")) {
  const style = document.createElement("style");
  style.id = "teknon-font";
  style.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Serif+Display&family=Dancing+Script:wght@600&display=swap');`;
  document.head.appendChild(style);
}

// ─── Shared design tokens ───────────────────────────────────────────
const T = {
  body: { fontFamily: "'DM Sans', sans-serif", fontWeight: 300 },
  serif: { fontFamily: "'DM Serif Display', serif" },
  script: { fontFamily: "'Dancing Script', cursive", fontWeight: 600 },
  cream: "#f0ebe3",
  muted: "rgba(240,235,227,0.45)",
  faint: "rgba(240,235,227,0.2)",
  border: "rgba(240,235,227,0.18)",
  borderHover: "rgba(240,235,227,0.6)",
  amber: "#c8893a",
  amberMuted: "rgba(200,137,58,0.7)",
};

const divider = { height: 1, background: T.border, margin: "2rem 0" };

// ─── Logo ────────────────────────────────────────────────────────────
function TeknonLogo({ size = "md" }) {
  const scale = size === "lg" ? 1.8 : size === "sm" ? 0.7 : 1;
  const cx = 18 * scale, cy = 18 * scale;
  const lines = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return { x1: cx + Math.cos(a) * 2.5 * scale, y1: cy + Math.sin(a) * 2.5 * scale, x2: cx + Math.cos(a) * 16 * scale, y2: cy + Math.sin(a) * 16 * scale };
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 * scale }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 * scale }}>
        <svg width={36 * scale} height={36 * scale} viewBox={`0 0 ${36 * scale} ${36 * scale}`} fill="none">
          {lines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={T.cream} strokeWidth={0.6 * scale} strokeLinecap="round" opacity="0.9" />)}
          <circle cx={cx} cy={cy} r={1.5 * scale} fill={T.cream} />
        </svg>
        <span style={{ ...T.body, fontSize: 15 * scale, letterSpacing: 3.5 * scale, color: T.cream, fontWeight: 300 }}>teknon</span>
      </div>
      {size !== "sm" && <div style={{ height: 0.5, background: T.cream, opacity: 0.2, width: "100%" }} />}
    </div>
  );
}

// ─── Pill button (outline, landing-page style) ────────────────────────
function PillBtn({ children, onClick, disabled, style: extra }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        ...T.body, fontSize: "0.9rem", letterSpacing: "0.1em", color: disabled ? T.muted : T.cream,
        background: hover && !disabled ? "rgba(240,235,227,0.08)" : "transparent",
        border: `1px solid ${disabled ? "rgba(240,235,227,0.15)" : hover ? T.borderHover : T.border}`,
        borderRadius: 50, padding: "0.75rem 2rem", cursor: disabled ? "default" : "pointer",
        transition: "all 0.2s", ...extra
      }}>{children}</button>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────
const Tag = ({ label, selected, onClick }) => (
  <button onClick={onClick} style={{ ...T.body, fontSize: "0.8rem" }}
    className={`px-3 py-1 rounded-full text-sm border transition-all ${selected ? "bg-amber-800 border-amber-700 text-amber-100" : "border-stone-600 text-stone-400 hover:border-amber-700 hover:text-amber-200"}`}
  >{label}</button>
);

// ─── Section label (sparse, uppercase) ───────────────────────────────
const SectionLabel = ({ children }) => (
  <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "1rem" }}>
    ✦ {children}
  </p>
);

const Hairline = () => <div style={divider} />;

// ─── Header ──────────────────────────────────────────────────────────
function Header({ onEditProfile, onAbout, sessionSaved, sessions, onLoadSession, onDeleteSession }) {
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const navBtn = { ...T.body, fontSize: "0.75rem", letterSpacing: "0.08em", color: T.muted, background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem 0.8rem", transition: "color 0.2s" };
  return (
    <div style={{ padding: "1.2rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, background: "rgba(107,107,105,0.96)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}` }}>
      <TeknonLogo size="sm" />
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {sessionSaved && <span style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.amber, border: `1px solid ${T.amberMuted}`, padding: "0.2rem 0.75rem", borderRadius: 50 }}>Saved</span>}
        {sessions?.length > 0 && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setSessionsOpen(o => !o)}
              style={{ ...navBtn, border: `1px solid ${T.border}`, borderRadius: 50, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              My Sessions
              <span style={{ background: "rgba(240,235,227,0.1)", borderRadius: 50, padding: "0.1rem 0.5rem", fontSize: "0.65rem" }}>{sessions.length}</span>
            </button>
            {sessionsOpen && (
              <div style={{ position: "absolute", right: 0, top: "2.8rem", width: 320, background: "rgba(85,83,80,0.98)", border: `1px solid ${T.border}`, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", zIndex: 50, overflow: "hidden" }}>
                <div style={{ padding: "0.9rem 1.2rem", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.15em", color: T.muted, textTransform: "uppercase" }}>My Sessions</p>
                  <button onClick={() => setSessionsOpen(false)} style={{ ...navBtn, fontSize: "0.8rem", color: T.muted }}>✕</button>
                </div>
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.9rem 1.2rem", borderBottom: `1px solid ${T.border}` }}
                      className="group hover:bg-stone-800 transition-all">
                      <img src={s.imageSrc} alt="artwork" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.border}`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => { onLoadSession(s); setSessionsOpen(false); }}>
                        <p style={{ ...T.body, fontSize: "0.8rem", color: T.amber, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.targetArtist || "No mentor"}</p>
                        <p style={{ ...T.body, fontSize: "0.7rem", color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.description}</p>
                        <p style={{ ...T.body, fontSize: "0.65rem", color: "rgba(240,235,227,0.25)", marginTop: 2 }}>{new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <button onClick={() => onDeleteSession(s.id)} style={{ ...navBtn, color: "rgba(240,235,227,0.2)", fontSize: "0.75rem" }} className="opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={onAbout} style={navBtn} onMouseEnter={e => e.target.style.color = T.cream} onMouseLeave={e => e.target.style.color = T.muted}>About</button>
        {onEditProfile && <button onClick={onEditProfile} style={{ ...navBtn, border: `1px solid ${T.border}`, borderRadius: 50 }} onMouseEnter={e => e.target.style.color = T.cream} onMouseLeave={e => e.target.style.color = T.muted}>Edit Profile</button>}
      </div>
    </div>
  );
}

// ─── Landing ─────────────────────────────────────────────────────────
function LandingPage({ onStart }) {
  return (
    <div style={{ width: "100%", height: "100vh", background: BG, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem 2.5rem 3rem", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      <img
        src="/hero.jpg"
        alt=""
        style={{ position: "absolute", right: "-2%", bottom: "-2%", height: "88vh", width: "auto", opacity: 0.55, pointerEvents: "none", userSelect: "none" }}
      />
      <TeknonLogo size="md" />
      <div style={{ maxWidth: 560, position: "relative", zIndex: 1 }}>
        <h1 style={{ ...T.body, fontSize: "clamp(2.8rem,8vw,5.5rem)", fontWeight: 300, lineHeight: 1.05, color: T.cream, letterSpacing: "-0.01em", marginBottom: "2rem" }}>
          your art tutor<br />in your pocket
        </h1>
        <PillBtn onClick={onStart}>get started</PillBtn>
        <p style={{ ...T.body, fontSize: "0.7rem", letterSpacing: "0.08em", color: "rgba(240,235,227,0.3)", marginTop: "1.2rem" }}>master wisdom · private studio · no judgement</p>
      </div>
    </div>
  );
}

// ─── Mentor Select ────────────────────────────────────────────────────
const PORTRAIT_ARTISTS = [
  { file: "Rembrandt.jpg",  name: "Rembrandt" },
  { file: "Sargent.jpg",    name: "John Singer Sargent" },
  { file: "OKeeffe.jpg",    name: "Georgia O'Keeffe" },
  { file: "DaVici.jpg",    name: "Leonardo da Vinci" },
  { file: "Monet.jpg",      name: "Claude Monet" },
  { file: "Kahlo.jpg",      name: "Frida Kahlo" },
  { file: "Caravaggio.jpg", name: "Caravaggio" },
  { file: "Degas.jpg",      name: "Edgar Degas" },
  { file: "Picasso.jpg",    name: "Pablo Picasso" },
  { file: "Sorolla.jpg",    name: "Joaquín Sorolla" },
  { file: "VanGogh.jpg",    name: "Vincent van Gogh" },
  { file: "Vermeer.jpg",    name: "Johannes Vermeer" },
  { file: "Zornself.jpg",   name: "Anders Zorn" },
  { file: "Matisse.jpg",    name: "Henri Matisse" },
  { file: "Klimt.jpg",      name: "Gustav Klimt" },
  { file: "Cezanne.jpg",    name: "Paul Cézanne" },
  { file: "Cassatt.jpg",    name: "Mary Cassatt" },
  { file: "GwenJohn.jpg",   name: "Gwen John" },
  { file: "Kauffmann.jpg",  name: "Angelica Kauffmann" },
  { file: "LeBrun.jpg",     name: "Élisabeth Vigée Le Brun" },
];

const COLLAGE_LAYOUT = [
  { top:"4%",  left:"2%",  rotate:-4, size:130, zIndex:3 },
  { top:"2%",  left:"22%", rotate:3,  size:115, zIndex:2 },
  { top:"1%",  left:"42%", rotate:-2, size:125, zIndex:4 },
  { top:"3%",  left:"62%", rotate:5,  size:110, zIndex:2 },
  { top:"3%",  left:"80%", rotate:-3, size:120, zIndex:3 },
  { top:"26%", left:"5%",  rotate:2,  size:120, zIndex:4 },
  { top:"25%", left:"24%", rotate:-5, size:130, zIndex:3 },
  { top:"24%", left:"45%", rotate:4,  size:115, zIndex:2 },
  { top:"27%", left:"64%", rotate:-2, size:125, zIndex:5 },
  { top:"25%", left:"82%", rotate:3,  size:110, zIndex:3 },
  { top:"50%", left:"3%",  rotate:-3, size:125, zIndex:2 },
  { top:"49%", left:"22%", rotate:5,  size:115, zIndex:4 },
  { top:"51%", left:"42%", rotate:-4, size:130, zIndex:3 },
  { top:"50%", left:"63%", rotate:2,  size:120, zIndex:2 },
  { top:"52%", left:"81%", rotate:-5, size:115, zIndex:4 },
  { top:"73%", left:"6%",  rotate:4,  size:120, zIndex:3 },
  { top:"72%", left:"25%", rotate:-2, size:130, zIndex:2 },
  { top:"74%", left:"44%", rotate:3,  size:115, zIndex:5 },
  { top:"73%", left:"64%", rotate:-4, size:125, zIndex:3 },
  { top:"75%", left:"82%", rotate:2,  size:110, zIndex:2 },
];

function ArtistCollage({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 500 }}>
      {PORTRAIT_ARTISTS.map((artist, i) => {
        const pos = COLLAGE_LAYOUT[i];
        const isHov = hovered === i;
        return (
          <button key={i} onClick={() => onSelect(artist.name)}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            style={{
              position: "absolute", top: pos.top, left: pos.left,
              width: pos.size, height: pos.size * 1.25,
              transform: `rotate(${isHov ? 0 : pos.rotate}deg) scale(${isHov ? 1.08 : 1})`,
              zIndex: isHov ? 20 : pos.zIndex,
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
              background: "transparent", border: "none", padding: 0, cursor: "pointer",
              boxShadow: isHov ? "0 12px 40px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.35)",
            }}>
            <div style={{ width: "100%", height: "100%", background: "#3a3835", overflow: "hidden", borderRadius: 2 }}>
              <img src={`/artists/${artist.file}`} alt={artist.name}
                style={{ width: "100%", height: "88%", objectFit: "cover", objectPosition: "top", display: "block", filter: "sepia(20%) brightness(0.88)" }} />
              <div style={{ height: "12%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                <p style={{ ...T.body, fontSize: "0.55rem", letterSpacing: "0.08em", color: "rgba(240,235,227,0.6)", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", margin: 0 }}>{artist.name}</p>
              </div>
            </div>
            {isHov && (
              <div style={{ position: "absolute", bottom: -28, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", ...T.body, fontSize: "0.7rem", color: T.amber, letterSpacing: "0.06em" }}>
                {artist.name} →
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MentorSelectPage({ onSelect }) {
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef();
  const suggestions = PORTRAIT_ARTISTS.map(a => a.name);
  const filtered = name.length > 0 ? suggestions.filter(s => s.toLowerCase().includes(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase()) : [];
  const proceed = (artist) => { const val = (artist || name).trim(); if (val) onSelect(val); };
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);
  return (
    <div style={{ width: "100%", height: "100vh", background: BG, display: "grid", gridTemplateColumns: "1fr 1fr", boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem 2.5rem 3rem", boxSizing: "border-box" }}>
        <TeknonLogo size="md" />
        <div>
          <h1 style={{ ...T.body, fontSize: "clamp(1.6rem,3.5vw,3rem)", fontWeight: 300, lineHeight: 1.1, color: T.cream, letterSpacing: "-0.01em", marginBottom: "2.5rem" }}>
            who would you like<br />to mentor you today?
          </h1>
          <div style={{ position: "relative" }}>
            <input ref={inputRef} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && proceed()} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="type an artist's name…"
              style={{ width: "100%", boxSizing: "border-box", ...T.body, fontSize: "1rem", color: T.cream, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none", letterSpacing: "0.02em" }} />
            {focused && filtered.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "rgba(80,78,74,0.97)", border: `1px solid ${T.border}`, borderRadius: 10, marginTop: 4, overflow: "hidden", zIndex: 10 }}>
                {filtered.slice(0, 5).map((s, i) => (
                  <button key={i} onClick={() => proceed(s)}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", textAlign: "left", padding: "0.65rem 1rem", ...T.body, fontSize: "0.9rem", color: "#d6cfc4", background: "transparent", border: "none", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(240,235,227,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {(() => { const p = PORTRAIT_ARTISTS.find(a => a.name === s); return p ? <img src={`/artists/${p.file}`} alt={s} style={{ width: 28, height: 28, objectFit: "cover", objectPosition: "top", borderRadius: 2, flexShrink: 0, filter: "sepia(10%)" }} /> : null; })()}
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <PillBtn onClick={() => proceed()} disabled={!name.trim()}>begin</PillBtn>
            <button onClick={() => onSelect("")}
              style={{ ...T.body, fontSize: "0.8rem", color: T.faint, background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.05em" }}>
              skip for now
            </button>
          </div>
          <p style={{ ...T.body, fontSize: "0.68rem", letterSpacing: "0.05em", color: "rgba(240,235,227,0.22)", marginTop: "1.5rem", lineHeight: 1.8 }}>
            Choose any artist — living or from history.<br />If they are no longer with us, they will speak<br />to you directly in their own voice.
          </p>
        </div>
        <div />
      </div>
      <div style={{ position: "relative", overflow: "hidden", borderLeft: `1px solid ${T.border}` }}>
        <div style={{ position: "absolute", inset: "1.5rem" }}>
          <ArtistCollage onSelect={proceed} />
        </div>
      </div>
    </div>
  );
}

// ─── About ───────────────────────────────────────────────────────────
function AboutPage({ onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.cream }}>
      <div style={{ padding: "1.2rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(107,107,105,0.96)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, zIndex: 10 }}>
        <TeknonLogo size="sm" />
        <PillBtn onClick={onBack} style={{ fontSize: "0.75rem", padding: "0.5rem 1.2rem" }}>← Back</PillBtn>
      </div>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "5rem 2rem 6rem" }}>
        <div style={{ marginBottom: "4rem", textAlign: "center" }}>
          <TeknonLogo size="lg" />
          <p style={{ ...T.body, color: T.muted, fontSize: "0.85rem", marginTop: "1rem" }}>Private guidance. Master wisdom. No judgement.</p>
        </div>
        {[
          { title: "The name", body: ["Teknon (τέκνον) is an ancient Greek word meaning child, offspring — but also a term used to describe the relationship between a teacher and their student. In the classical tradition, a pupil was the teacher's teknon: someone whose mind was being nourished, whose character was being shaped, who was being brought into their fullest creative self.", "Its root is closely related to tektōn — the craftsman, the maker, the one who carves and moulds. From this root we get the word architect. Together, these words describe something essential: the creative child being guided by a master who has walked the same difficult path."] },
          { title: "The philosophy", body: ["Teknon was born from a simple observation: the internet has made it easier than ever to share your work, and harder than ever to receive genuine feedback on it. Public forums are too often unkind. Social media rewards the polished and punishes the vulnerable.", "And yet the great artists of history were deeply generous with those who came after them. Across a thousand years and every tradition, artists wrote and taught and encouraged with extraordinary openness.", "Teknon exists to bring that tradition into the private studio of every artist, at every level, at any hour."] },
          { title: "What Teknon is not", body: ["Teknon is a companion to your creative journey, not a replacement for the irreplaceable. No algorithm can replicate the experience of standing at an easel beside a working artist.", "We actively encourage every Teknon user to seek out teachers, mentors, workshops, and classes in the real world. Nothing we build will ever compete with a great teacher — and we wouldn't want it to."] },
          { title: "Your privacy", body: ["Everything you upload and every session you create belongs entirely to you. Your artwork is never shared, never used for training, never seen by anyone but you and your mentor.", "This is your studio. The door closes behind you."] },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: "3.5rem" }}>
            <h2 style={{ ...T.serif, fontSize: "1.4rem", color: T.amber, marginBottom: "1rem" }}>{s.title}</h2>
            {s.body.map((p, j) => <p key={j} style={{ ...T.body, color: "rgba(240,235,227,0.7)", fontSize: "0.9rem", lineHeight: 1.8, marginBottom: "0.9rem" }}>{p}</p>)}
            {i < 3 && <Hairline />}
          </div>
        ))}
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <PillBtn onClick={onBack}>Enter the Studio →</PillBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Quote ───────────────────────────────────────────────────────────
function InspirationalQuote() {
  const [quote, setQuote] = useState(null);
  const quotes = [
    { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson" },
    { text: "I am always doing that which I cannot do, in order that I may learn how to do it.", author: "Pablo Picasso" },
    { text: "The painter has the universe in his mind and hands.", author: "Leonardo da Vinci" },
    { text: "Colour is my day-long obsession, joy and torment.", author: "Claude Monet" },
    { text: "I dream of painting and then I paint my dream.", author: "Vincent van Gogh" },
    { text: "The job of the artist is always to deepen the mystery.", author: "Francis Bacon" },
    { text: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },
    { text: "I found I could say things with colour and shapes that I couldn't say any other way.", author: "Georgia O'Keeffe" },
    { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
    { text: "Creativity takes courage.", author: "Henri Matisse" },
  ];
  useEffect(() => { setQuote(quotes[Math.floor(Math.random() * quotes.length)]); }, []);
  if (!quote) return null;
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1.5rem", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, margin: "2.5rem 0" }}>
      <p style={{ ...T.script, fontSize: "1.35rem", lineHeight: 1.7, color: "rgba(240,235,227,0.75)" }}>"{quote.text}"</p>
      <p style={{ ...T.script, fontSize: "1.1rem", color: T.muted, marginTop: "0.5rem" }}>— {quote.author}</p>
    </div>
  );
}

// ─── Profile Setup ────────────────────────────────────────────────────
function ProfileSetup({ onSave, existing, onAbout }) {
  const [artists, setArtists] = useState(existing?.artists || []);
  const [movements, setMovements] = useState(existing?.movements || []);
  const [mediums, setMediums] = useState(existing?.mediums || []);
  const [level, setLevel] = useState(existing?.level || "");
  const [goals, setGoals] = useState(existing?.goals || []);
  const [customArtist, setCustomArtist] = useState("");
  const toggle = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  const addCustom = () => { const v = customArtist.trim(); if (v && !artists.includes(v)) setArtists([...artists, v]); setCustomArtist(""); };
  const suggested = movements.length > 0 ? [...new Set(movements.flatMap(m => MOVEMENT_ARTISTS[m] || []))] : ALL_ARTISTS;
  const visible = [...new Set([...suggested, ...artists.filter(a => !suggested.includes(a))])];
  const handleMovement = m => {
    const nxt = movements.includes(m) ? movements.filter(x => x !== m) : [...movements, m];
    setMovements(nxt);
    const ns = [...new Set(nxt.flatMap(mv => MOVEMENT_ARTISTS[mv] || []))];
    if (nxt.length > 0) setArtists(prev => prev.filter(a => ns.includes(a) || !ALL_ARTISTS.includes(a)));
  };
  const valid = (artists.length || movements.length) && mediums.length && level && goals.length;

  const inputStyle = { width: "100%", boxSizing: "border-box", ...T.body, fontSize: "0.85rem", color: T.cream, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 50, padding: "0.6rem 1.2rem", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.cream }}>
      <div style={{ padding: "1.2rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, background: "rgba(107,107,105,0.96)" }}>
        <TeknonLogo size="sm" />
        <button onClick={onAbout} style={{ ...T.body, fontSize: "0.75rem", color: T.muted, background: "transparent", border: "none", cursor: "pointer" }}>About</button>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "1rem" }}>Welcome to</p>
          <TeknonLogo size="lg" />
        </div>
        <p style={{ ...T.body, fontSize: "0.9rem", color: T.muted, lineHeight: 1.8, maxWidth: 480, marginTop: "1.5rem" }}>
          A private studio where your work is met with thoughtful, generous feedback in the spirit of the masters.
        </p>
        <InspirationalQuote />

        <p style={{ ...T.body, fontSize: "0.8rem", color: T.muted, marginBottom: "2.5rem" }}>
          Tell us about your artistic journey so we can tailor your mentor's guidance personally to you.
        </p>

        {/* Movements */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>Movements & styles that interest you</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>{MOVEMENTS.map(m => <Tag key={m} label={m} selected={movements.includes(m)} onClick={() => handleMovement(m)} />)}</div>
        </div>
        <Hairline />

        {/* Artists */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>{movements.length > 0 ? "Artists who inspire you — based on your selections" : "Artists who inspire you"}</SectionLabel>
          {movements.length === 0 && <p style={{ ...T.body, fontSize: "0.75rem", color: T.muted, marginBottom: "0.75rem" }}>Select a movement above to see relevant artists, or browse all below.</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>{visible.map(a => <Tag key={a} label={a} selected={artists.includes(a)} onClick={() => toggle(artists, setArtists, a)} />)}</div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <input value={customArtist} onChange={e => setCustomArtist(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustom()} placeholder="Add another artist…" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addCustom} style={{ ...T.body, fontSize: "0.8rem", color: T.muted, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 50, padding: "0.6rem 1.2rem", cursor: "pointer" }}>Add</button>
          </div>
        </div>
        <Hairline />

        {/* Medium */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>Your medium</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>{MEDIUMS.map(m => <Tag key={m} label={m} selected={mediums.includes(m)} onClick={() => toggle(mediums, setMediums, m)} />)}</div>
        </div>
        <Hairline />

        {/* Level */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>Skill level</SectionLabel>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>{LEVELS.map(l => <Tag key={l} label={l} selected={level === l} onClick={() => setLevel(l)} />)}</div>
          <p style={{ ...T.body, fontSize: "0.72rem", color: T.muted, marginTop: "0.75rem" }}>There is no wrong answer — every level is welcome here.</p>
        </div>
        <Hairline />

        {/* Goals */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>What do you love to paint / draw?</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>{GOALS.map(g => <Tag key={g} label={g} selected={goals.includes(g)} onClick={() => toggle(goals, setGoals, g)} />)}</div>
        </div>

        {!valid && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.15em", color: T.amber, textTransform: "uppercase", marginBottom: "0.5rem" }}>Still needed:</p>
            {!artists.length && !movements.length && <p style={{ ...T.body, fontSize: "0.8rem", color: T.muted, marginBottom: "0.3rem" }}>✕ Select at least one movement or artist</p>}
            {!mediums.length && <p style={{ ...T.body, fontSize: "0.8rem", color: T.muted, marginBottom: "0.3rem" }}>✕ Select at least one medium</p>}
            {!level && <p style={{ ...T.body, fontSize: "0.8rem", color: T.muted, marginBottom: "0.3rem" }}>✕ Select your skill level</p>}
            {!goals.length && <p style={{ ...T.body, fontSize: "0.8rem", color: T.muted, marginBottom: "0.3rem" }}>✕ Select at least one subject</p>}
          </div>
        )}

        <PillBtn onClick={() => valid && onSave({ artists, movements, mediums, level, goals })} disabled={!valid} style={{ width: "100%", textAlign: "center" }}>
          Enter the Studio →
        </PillBtn>

        <p style={{ ...T.body, fontSize: "0.7rem", color: "rgba(240,235,227,0.25)", textAlign: "center", marginTop: "1.5rem", lineHeight: 1.8 }}>
          Your sessions are private and belong only to you.<br />No public sharing. No judgement. Just honest, expert guidance.
        </p>
      </div>
    </div>
  );
}

// ─── Feedback renderer ────────────────────────────────────────────────
function FeedbackBlock({ text }) {
  return text.split("\n").map((line, i) => {
    if (/^\d+\.\s\*\*/.test(line)) {
      const p = line.replace(/^\d+\.\s\*\*/, "").split("**");
      return <div key={i} style={{ marginTop: "1.75rem" }}>
        <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.amber, textTransform: "uppercase", marginBottom: "0.5rem" }}>{p[0]}</p>
        {p[1] && <p style={{ ...T.body, fontSize: "0.9rem", color: "rgba(240,235,227,0.75)", lineHeight: 1.8 }}>{p[1].replace(/^[\s—–-]+/, "")}</p>}
      </div>;
    }
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.amber, textTransform: "uppercase", marginTop: "1.75rem", marginBottom: "0.5rem" }}>{line.replace(/\*\*/g, "")}</p>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} style={{ ...T.body, fontSize: "0.9rem", color: "rgba(240,235,227,0.72)", lineHeight: 1.8, paddingLeft: "1rem" }}>– {line.replace(/^[-•]\s/, "").replace(/\*\*/g, "")}</p>;
    if (line.trim() === "") return <div key={i} style={{ height: "0.5rem" }} />;
    return <p key={i} style={{ ...T.body, fontSize: "0.9rem", color: "rgba(240,235,227,0.72)", lineHeight: 1.8 }}>{line.replace(/\*\*/g, "")}</p>;
  });
}

// ─── Resource card ────────────────────────────────────────────────────
function ResourceCard({ r }) {
  const [hover, setHover] = useState(false);
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.2rem 0", borderBottom: `1px solid ${T.border}`, textDecoration: "none", transition: "all 0.2s" }}>
      <div style={{ flex: 1 }}>
        <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.12em", color: T.muted, textTransform: "uppercase", marginBottom: "0.3rem" }}>{r.type} · {r.source}</p>
        <p style={{ ...T.body, fontSize: "0.9rem", color: hover ? T.cream : "rgba(240,235,227,0.8)", transition: "color 0.2s" }}>{r.title}</p>
        {r.description && <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted, marginTop: "0.25rem", lineHeight: 1.6 }}>{r.description}</p>}
      </div>
      <span style={{ color: hover ? T.amber : T.muted, transition: "color 0.2s", marginTop: 4 }}>↗</span>
    </a>
  );
}

// ─── Annotated Image ──────────────────────────────────────────────────
function AnnotatedImage({ imageSrc, annotations }) {
  const [active, setActive] = useState(null);
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#0d0d0d", border: `1px solid ${T.border}` }}>
      <img src={imageSrc} alt="artwork" style={{ width: "100%", objectFit: "contain", maxHeight: 380 }} />
      {annotations.map((a, i) => (
        <button key={i} onClick={() => setActive(active === i ? null : i)}
          style={{ position: "absolute", left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", border: `2px solid ${active === i ? T.cream : T.amber}`, background: active === i ? T.amber : "rgba(15,12,10,0.8)", color: active === i ? "#1a1208" : T.amber, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", transform: `translate(-50%,-50%) scale(${active === i ? 1.2 : 1})`, zIndex: 10 }}>
          {i + 1}
        </button>
      ))}
      {active !== null && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.2rem 1.5rem", borderTop: `1px solid rgba(200,137,58,0.3)`, background: "rgba(12,10,8,0.95)" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.amber, color: "#1a1208", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{active + 1}</span>
            <p style={{ ...T.body, fontSize: "0.85rem", color: "rgba(240,235,227,0.8)", lineHeight: 1.7 }}>{annotations[active].note}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Visual Analysis ──────────────────────────────────────────────────
function VisualAnalysis({ imageSrc, imageB64, imageMime, feedback, targetArtist }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [annotations, setAnnotations] = useState(null);
  const [refs, setRefs] = useState(null);
  const [error, setError] = useState(null);
  const build = async () => {
    if (annotations) { setOpen(true); return; }
    setOpen(true); setLoading(true); setError(null);
    await new Promise(r => setTimeout(r, 5000));
    try {
      const at = await callAPI([{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: imageMime, data: imageB64 } }, { type: "text", text: `Feedback:\n\n${feedback}\n\nIdentify 3-4 specific areas. Return ONLY valid JSON:\n[{"x":45,"y":30,"note":"max 15 words"}]` }] }], false);
      const ac = at.replace(/```json|```/g, "").trim(); const as = ac.indexOf("["), ae = ac.lastIndexOf("]");
      const pa = as !== -1 ? JSON.parse(ac.slice(as, ae + 1)) : [];
      setAnnotations(pa);
      const rt = await callAPI([{ role: "user", content: `Feedback:\n\n${feedback}\n\nFind ${pa.length} master examples for:\n${pa.map((a, i) => `${i + 1}. ${a.note}`).join("\n")}\n\nReturn ONLY valid JSON:\n[{"issue":"...","artist":"...","work":"...","what_to_notice":"one sentence","search_query":"artist + work"}]` }]);
      const rc = rt.replace(/```json|```/g, "").trim(); const rs = rc.indexOf("["), re = rc.lastIndexOf("]");
      if (rs !== -1) setRefs(JSON.parse(rc.slice(rs, re + 1)));
    } catch (e) { setError(`Error: ${e.message}`); }
    setLoading(false);
  };
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "2rem" }}>
      <button onClick={build} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ textAlign: "left" }}>
          <SectionLabel>Visual Annotations & Master References</SectionLabel>
          <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted, marginTop: "-0.5rem" }}>See exactly where to focus, with examples from the masters</p>
        </div>
        <span style={{ color: T.muted, fontSize: "0.75rem", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: "1.5rem" }}>
          {loading && <p style={{ ...T.body, fontSize: "0.85rem", color: T.muted, padding: "2rem 0" }}>Preparing visual analysis…</p>}
          {error && <p style={{ ...T.body, fontSize: "0.8rem", color: "#f87171" }}>{error}</p>}
          {annotations && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              <div>
                <p style={{ ...T.body, fontSize: "0.7rem", color: T.muted, marginBottom: "0.75rem" }}>Tap a marker to see the note</p>
                <AnnotatedImage imageSrc={imageSrc} annotations={annotations} />
              </div>
              {refs?.length > 0 && <div>
                <SectionLabel>Study these master works</SectionLabel>
                {refs.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.9rem", padding: "1.2rem 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(200,137,58,0.2)", color: T.amber, fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <div>
                      <p style={{ ...T.body, fontSize: "0.72rem", color: T.muted, fontStyle: "italic", marginBottom: "0.3rem" }}>{r.issue}</p>
                      <p style={{ ...T.body, fontSize: "0.9rem", color: T.amber }}>{r.artist}</p>
                      <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted, marginBottom: "0.5rem" }}>{r.work}</p>
                      <p style={{ ...T.body, fontSize: "0.85rem", color: "rgba(240,235,227,0.7)", lineHeight: 1.7, marginBottom: "0.75rem" }}>{r.what_to_notice}</p>
                      <a href={`https://www.google.com/search?q=${encodeURIComponent(r.search_query)}&tbm=isch`} target="_blank" rel="noopener noreferrer"
                        style={{ ...T.body, fontSize: "0.72rem", color: T.amber, border: `1px solid rgba(200,137,58,0.4)`, padding: "0.3rem 0.9rem", borderRadius: 50, textDecoration: "none" }}>
                        Find this work ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Lost Button ──────────────────────────────────────────────────────
function LostButton({ onSelect }) {
  const [open, setOpen] = useState(false);
  const opts = ["It just doesn't look right, but I can't say why", "I don't know what to work on next", "Something feels off but I can't put my finger on it", "I've lost confidence in this piece", "I keep making the same mistake and don't know how to fix it", "It looks flat or lifeless and I don't know why"];
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        style={{ ...T.body, fontSize: "0.82rem", color: open ? T.cream : T.muted, background: "transparent", border: `1px solid ${open ? T.border : "rgba(240,235,227,0.1)"}`, borderRadius: 50, padding: "0.6rem 1.2rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s" }}>
        I'm not sure what's wrong <span style={{ fontSize: "0.65rem", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: "0.75rem", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <p style={{ ...T.body, fontSize: "0.7rem", color: T.muted, padding: "0.75rem 1rem 0.5rem", letterSpacing: "0.05em" }}>Choose what resonates:</p>
          {opts.map((o, i) => (
            <button key={i} onClick={() => { onSelect(o); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", textAlign: "left", padding: "0.75rem 1rem", ...T.body, fontSize: "0.83rem", color: "rgba(240,235,227,0.7)", background: "transparent", border: "none", borderTop: i > 0 ? `1px solid ${T.border}` : "none", cursor: "pointer", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = T.cream}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(240,235,227,0.7)"}>
              <span style={{ color: T.amber, fontSize: "0.55rem" }}>✦</span>{o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Voice Button ─────────────────────────────────────────────────────
function VoiceButton({ onTranscript }) {
  const [state, setState] = useState("idle");
  const recRef = useRef(null);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const start = () => { const r = new SR(); r.continuous = true; r.interimResults = false; r.lang = "en-GB"; r.onresult = e => { const t = Array.from(e.results).map(r => r[0].transcript).join(" ").trim(); if (t) onTranscript(t); }; r.onerror = () => setState("error"); r.onend = () => setState(s => s === "recording" ? "idle" : s); recRef.current = r; r.start(); setState("recording"); };
  const stop = () => { recRef.current?.stop(); recRef.current = null; setState("idle"); };
  const isRec = state === "recording";
  return (
    <button onMouseDown={start} onMouseUp={stop} onTouchStart={e => { e.preventDefault(); start(); }} onTouchEnd={e => { e.preventDefault(); stop(); }}
      style={{ ...T.body, fontSize: "0.82rem", color: isRec ? "#fca5a5" : T.muted, background: "transparent", border: `1px solid ${isRec ? "rgba(248,113,113,0.4)" : "rgba(240,235,227,0.1)"}`, borderRadius: 50, padding: "0.6rem 1.2rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", userSelect: "none", transition: "all 0.2s" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: isRec ? "#f87171" : "rgba(240,235,227,0.3)" }} />
      {isRec ? "Recording — release to stop" : "Hold to speak"}
    </button>
  );
}

// ─── Classes Panel ────────────────────────────────────────────────────
function ClassesPanel({ profile }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("both");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loc, setLoc] = useState(null);
  const search = async () => {
    setLoading(true); setError(null); setResults(null);
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
      const geo = await (await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)).json();
      const city = geo.address?.city || geo.address?.town || geo.address?.village || "your area";
      const location = `${city}, ${geo.address?.country || ""}`;
      setLoc(location);
      const styleCtx = [...(profile.artists || []), ...(profile.movements || [])].join(", ");
      const typeLabel = type === "schools" ? "art schools" : type === "workshops" ? "workshops and short courses" : "art schools, workshops and short courses";
      await new Promise(r => setTimeout(r, 10000));
      const text = await callAPI([{ role: "user", content: `Find 5-6 real, active ${typeLabel} near ${location} for an artist interested in ${styleCtx || "painting"} at ${profile.level || "developing"} level.\n\nReturn ONLY valid JSON:\n[{"name":"...","type":"school|workshop","location":"...","description":"...","url":"...","distance":"local|regional|international"}]` }]);
      const c = text.replace(/```json|```/g, "").trim(); const s = c.indexOf("["), e = c.lastIndexOf("]");
      if (s !== -1) setResults(JSON.parse(c.slice(s, e + 1))); else setError("Couldn't parse results.");
    } catch (e) { setError(e.code === 1 ? "Location access denied." : `Error: ${e.message}`); }
    setLoading(false);
  };
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "2rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ textAlign: "left" }}>
          <SectionLabel>Find Classes & Workshops Near You</SectionLabel>
          <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted, marginTop: "-0.5rem" }}>Deepen your practice with a living artist</p>
        </div>
        <span style={{ color: T.muted, fontSize: "0.75rem", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: "1.5rem" }}>
          {!results && !loading && <>
            <p style={{ ...T.body, fontSize: "0.85rem", color: T.muted, marginBottom: "1.25rem", lineHeight: 1.7 }}>We'll use your location to find schools and workshops suited to your style and level.</p>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {[["both", "Schools & Workshops"], ["schools", "Art Schools"], ["workshops", "Workshops"]].map(([v, l]) => (
                <button key={v} onClick={() => setType(v)} style={{ ...T.body, fontSize: "0.75rem", color: type === v ? T.cream : T.muted, background: "transparent", border: `1px solid ${type === v ? T.border : "rgba(240,235,227,0.1)"}`, borderRadius: 50, padding: "0.5rem 1rem", cursor: "pointer", transition: "all 0.2s" }}>{l}</button>
              ))}
            </div>
            <PillBtn onClick={search} style={{ fontSize: "0.82rem", padding: "0.65rem 1.5rem" }}>Find Near Me</PillBtn>
            {error && <p style={{ ...T.body, fontSize: "0.78rem", color: "#f87171", marginTop: "0.75rem" }}>{error}</p>}
          </>}
          {loading && <p style={{ ...T.body, fontSize: "0.85rem", color: T.muted, padding: "1.5rem 0" }}>Searching near you…</p>}
          {results && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted }}>Near <span style={{ color: T.amber }}>{loc}</span></p>
              <button onClick={() => { setResults(null); setError(null); }} style={{ ...T.body, fontSize: "0.72rem", color: T.muted, background: "transparent", border: "none", cursor: "pointer" }}>Search again</button>
            </div>
            {results.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", padding: "1.2rem 0", borderBottom: `1px solid ${T.border}`, textDecoration: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ ...T.body, fontSize: "0.9rem", color: T.cream }}>{r.name}</p>
                  <span style={{ color: T.muted, fontSize: "0.8rem" }}>↗</span>
                </div>
                <p style={{ ...T.body, fontSize: "0.72rem", color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0.2rem 0" }}>{r.type} · {r.location}</p>
                {r.description && <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted, lineHeight: 1.6, marginTop: "0.3rem" }}>{r.description}</p>}
              </a>
            ))}
          </>}
        </div>
      )}
    </div>
  );
}

// ─── Easel Page ───────────────────────────────────────────────────────
function EaselPage({ profile, onEditProfile, onAbout, onAnalyse, sessions, onLoadSession, onDeleteSession, defaultMentor }) {
  const [image, setImage] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [description, setDescription] = useState("");
  const [struggle, setStruggle] = useState("");
  const [targetArtist, setTargetArtist] = useState(defaultMentor || "");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const cameraRef = useRef();

  const handleFile = file => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|heic|tiff|tif)$/i)) {
      setError("Please upload an image file — JPG, PNG, WEBP, HEIC or similar."); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            const maxSize = 1200; let w = img.width, h = img.height;
            if (w > maxSize || h > maxSize) { if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; } else { w = Math.round(w * maxSize / h); h = maxSize; } }
            const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL("image/jpeg", 0.82);
            setImage(compressed); setImageB64(compressed.split(",")[1]); setImageMime("image/jpeg"); setError(null);
          } catch { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime(file.type || "image/jpeg"); setError(null); }
        };
        img.onerror = () => { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime(file.type || "image/jpeg"); setError(null); };
        img.src = e.target.result;
      } catch { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime(file.type || "image/jpeg"); setError(null); }
    };
    reader.onerror = () => setError("Could not read the image file. Please try another.");
    reader.readAsDataURL(file);
  };

  const analyse = async () => {
    if (!imageB64 || !description) return;
    setLoading(true); setError(null); setLoadingStep("Reading your painting…");
    const profileCtx = `User profile — Level: ${profile.level}. Medium: ${profile.mediums.join(", ")}. Inspirations: ${[...profile.artists, ...profile.movements].join(", ")}. Subject interests: ${profile.goals.join(", ")}.`;
    const isDeceased = targetArtist && DECEASED_ARTISTS.has(targetArtist);
    const voiceInstruction = isDeceased
      ? `You are to write this feedback IN THE VOICE AND SPIRIT OF ${targetArtist}. Write in first person as if you ARE ${targetArtist} speaking directly to this artist. Use what is known about ${targetArtist}'s philosophy, personality, documented teachings, letters and writings to shape your language and perspective. Make it feel like a genuine encounter with that artist's mind.`
      : targetArtist
        ? `You are a masterful mentor deeply versed in the work and teachings of ${targetArtist}. Reference their documented techniques and known philosophy, but speak as a knowledgeable mentor rather than in their voice directly.`
        : `You are a masterful, deeply encouraging art mentor with encyclopaedic knowledge of art history.`;

    const prompt = `${voiceInstruction} ${profileCtx}

This is a safe, private studio. Treat the work with generous respect.

Work in progress: "${description}". ${struggle ? `The artist is struggling with: "${struggle}".` : ""}

Provide encouraging, specific feedback:
1. **What's Working** — genuine strengths
2. **The Most Important Thing to Focus On** — highest priority
3. **Master Artist Wisdom** — Choose a quote or documented technique that speaks directly and specifically to something you can see in THIS painting. You must draw from a genuinely wide range of artists — do NOT default to Monet, Van Gogh or other overused names. Consider artists from different centuries, countries and traditions: Velázquez, Chardin, Constable, Whistler, Eakins, Zorn, Fechin, Hawthorne, Hensche, Carlson, and many others. The quote must be directly relevant to a specific issue visible in this work. Never use a generic motivational quote.
4. **Your Next Steps** — 2-3 concrete actions
5. **Encouragement** — warm, personalised closing`;

    const timeout = setTimeout(() => { setError("The analysis is taking too long — please check your connection and try again."); setLoading(false); setLoadingStep(""); }, 45000);

    try {
      setLoadingStep("Consulting the masters…");
      const res = await fetch("/api/chat", { method: "POST", headers: HEADERS, body: JSON.stringify({ model: MODEL, max_tokens: 1200, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: imageMime, data: imageB64 } }, { type: "text", text: prompt }] }] }) });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.error) throw new Error(`${data.error.type}: ${data.error.message}`);
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!text) throw new Error("No feedback received — please try again.");
      setLoadingStep("Opening your feedback…");
      const s = { id: `session:${Date.now()}`, date: Date.now(), imageSrc: image, imageB64, imageMime, description, struggle, targetArtist, feedback: text, resources: null, chatHistory: [] };
      await onAnalyse(s);
    } catch (e) { clearTimeout(timeout); setError(`${e.message}`); setLoading(false); setLoadingStep(""); }
  };

  const textareaStyle = { width: "100%", boxSizing: "border-box", ...T.body, fontSize: "0.9rem", color: T.cream, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none", resize: "none", lineHeight: 1.7 };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.cream }}>
      <Header onEditProfile={onEditProfile} onAbout={onAbout} sessions={sessions} onLoadSession={onLoadSession} onDeleteSession={onDeleteSession} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <h2 style={{ ...T.serif, fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 300, color: T.cream, marginBottom: "0.5rem" }}>The Easel</h2>
        <p style={{ ...T.body, fontSize: "0.9rem", color: T.muted, marginBottom: "3rem", lineHeight: 1.7 }}>Upload your work and describe what you're painting — your mentor will do the rest.</p>

        {/* Upload zone */}
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current.click()}
          style={{ border: `1px solid ${dragOver ? T.borderHover : T.border}`, borderRadius: 16, minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", marginBottom: "1rem", transition: "border-color 0.2s", background: dragOver ? "rgba(240,235,227,0.04)" : "transparent" }}>
          {image
            ? <img src={image} alt="upload" style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 320 }} />
            : <div style={{ textAlign: "center", padding: "3rem 2rem" }}>
              <p style={{ ...T.body, fontSize: "0.9rem", color: T.muted, marginBottom: "0.3rem" }}>Drop your artwork here or click to browse</p>
              <p style={{ ...T.body, fontSize: "0.72rem", color: "rgba(240,235,227,0.25)" }}>JPG, PNG, WEBP supported</p>
            </div>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "3rem" }}>
          <button onClick={() => cameraRef.current.click()} style={{ flex: 1, ...T.body, fontSize: "0.8rem", color: T.muted, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 50, padding: "0.65rem 0", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = T.cream; e.currentTarget.style.borderColor = T.borderHover; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}>
            Take a Photo
          </button>
          <button onClick={() => fileRef.current.click()} style={{ flex: 1, ...T.body, fontSize: "0.8rem", color: T.muted, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 50, padding: "0.65rem 0", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = T.cream; e.currentTarget.style.borderColor = T.borderHover; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}>
            Upload from Gallery
          </button>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />

        {/* Artist / Style */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>Artist / Style I'm aiming for</p>
          <input value={targetArtist} onChange={e => setTargetArtist(e.target.value)}
            placeholder="e.g. Rembrandt, Sargent, Georgia O'Keeffe — they will speak to you directly"
            style={{ width: "100%", boxSizing: "border-box", ...T.body, fontSize: "0.9rem", color: T.cream, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none" }} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>What are you painting / drawing?</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="e.g. A portrait study in oil paint…" style={textareaStyle} />
        </div>

        {/* Struggle */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>
            What are you struggling with? <span style={{ textTransform: "none", letterSpacing: "normal", fontSize: "0.72rem" }}>(optional)</span>
          </p>
          <textarea value={struggle} onChange={e => setStruggle(e.target.value)} rows={2} placeholder="e.g. The skin tones feel flat, the eyes aren't working…" style={{ ...textareaStyle, marginBottom: "1rem" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
            <LostButton onSelect={t => setStruggle(t)} />
            <VoiceButton onTranscript={t => setStruggle(t)} />
          </div>
        </div>

        {/* CTA */}
        <PillBtn onClick={analyse} disabled={!image || !description || loading} style={{ width: "100%", textAlign: "center", fontSize: "1rem", padding: "1rem 2rem" }}>
          {loading ? loadingStep : "Analyse My Work →"}
        </PillBtn>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginTop: "1rem" }}>
            {[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
          </div>
        )}

        {error && <p style={{ ...T.body, fontSize: "0.82rem", color: "#f87171", textAlign: "center", marginTop: "1rem" }}>{error}</p>}

        <p style={{ ...T.body, fontSize: "0.7rem", color: "rgba(240,235,227,0.25)", textAlign: "center", marginTop: "2.5rem", lineHeight: 1.8 }}>
          ✦ Teknon is a companion to your creative journey, not a replacement for the irreplaceable.<br />Nothing substitutes a one-to-one lesson with a practising artist.
        </p>
      </div>
    </div>
  );
}

// ─── Response Page ────────────────────────────────────────────────────
function ResponsePage({ session, profile, onBack, onEditProfile, onAbout, onSaveSession, sessions, onLoadSession, onDeleteSession }) {
  const { imageSrc, imageB64, imageMime, description, struggle, targetArtist, feedback } = session;
  const [resources, setResources] = useState(session.resources || null);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState(session.chatHistory || []);
  const [followUp, setFollowUp] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatBottomRef = useRef();
  const topRef = useRef();
  useEffect(() => { topRef.current?.scrollIntoView(); }, []);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, chatLoading]);
  useEffect(() => {
    if (!resources && targetArtist) {
      (async () => {
        setResourcesLoading(true);
        try {
          const text = await callAPI([{ role: "user", content: `Find 4-6 real online resources about "${targetArtist}".\n\nReturn ONLY valid JSON:\n[{"title":"...","url":"...","source":"...","type":"article|video|interview|tutorial|website","description":"one sentence"}]\n\nOnly real URLs.` }]);
          const c = text.replace(/```json|```/g, "").trim(); const s = c.indexOf("["), e = c.lastIndexOf("]");
          if (s !== -1) { const r = JSON.parse(c.slice(s, e + 1)); setResources(r); onSaveSession({ ...session, resources: r }); }
        } catch { }
        setResourcesLoading(false);
      })();
    }
  }, []);

  const profileCtx = `Level: ${profile.level}. Medium: ${profile.mediums.join(", ")}. Inspirations: ${[...profile.artists, ...profile.movements].join(", ")}.`;
  const sendFollowUp = async () => {
    if (!followUp.trim() || chatLoading) return;
    const q = followUp.trim(); setFollowUp(""); setChatError(null);
    const nh = [...chatHistory, { role: "user", text: q }]; setChatHistory(nh); setChatLoading(true);
    try {
      const ctx = `You are a masterful, encouraging art mentor. ${profileCtx} Working on: "${description}". Target: ${targetArtist || "not specified"}. Initial analysis:\n\n${feedback}\n\nAnswer with generosity and master artist wisdom.`;
      const msgs = [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: imageMime, data: imageB64 } }, { type: "text", text: ctx }] }, { role: "assistant", content: "Understood. Please ask me anything." }, ...nh.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }))];
      const reply = await callAPI(msgs);
      const uh = [...nh, { role: "assistant", text: reply }]; setChatHistory(uh);
      onSaveSession({ ...session, chatHistory: uh });
    } catch (e) { setChatError(`Error: ${e.message}`); }
    setChatLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.cream }}>
      <Header onEditProfile={onEditProfile} onAbout={onAbout} sessionSaved={true} sessions={sessions} onLoadSession={onLoadSession} onDeleteSession={onDeleteSession} />
      <div ref={topRef} style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <button onClick={onBack} style={{ ...T.body, fontSize: "0.8rem", color: T.muted, background: "transparent", border: "none", cursor: "pointer", marginBottom: "3rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
          onMouseEnter={e => e.currentTarget.style.color = T.cream} onMouseLeave={e => e.currentTarget.style.color = T.muted}>
          ← Analyse another work
        </button>

        {/* Artwork + meta */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "3.5rem", alignItems: "center" }}>
          <img src={imageSrc} alt="artwork" style={{ width: "100%", borderRadius: 12, border: `1px solid ${T.border}`, objectFit: "contain", maxHeight: 280, background: "#0d0d0d" }} />
          <div>
            <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>Your work</p>
            <p style={{ ...T.body, fontSize: "0.9rem", color: "rgba(240,235,227,0.8)", lineHeight: 1.7, marginBottom: "0.5rem" }}>{description}</p>
            {targetArtist && <p style={{ ...T.body, fontSize: "0.78rem", color: T.amber, marginBottom: "0.3rem" }}>Mentor: {targetArtist}</p>}
            {struggle && <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted, fontStyle: "italic" }}>"{struggle}"</p>}
          </div>
        </div>

        <Hairline />

        {/* Feedback */}
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Studio Analysis</SectionLabel>
          <FeedbackBlock text={feedback} />
        </div>

        <Hairline />

        {/* Visual analysis */}
        <VisualAnalysis imageSrc={imageSrc} imageB64={imageB64} imageMime={imageMime} feedback={feedback} targetArtist={targetArtist} />

        <Hairline />

        {/* Resources */}
        {(resourcesLoading || resources) && (
          <div style={{ marginBottom: "0" }}>
            <SectionLabel>Related Resources{targetArtist ? ` — ${targetArtist}` : ""}</SectionLabel>
            {resourcesLoading && <p style={{ ...T.body, fontSize: "0.85rem", color: T.muted }} className="animate-pulse">Finding articles, interviews & videos…</p>}
            {resources && resources.map((r, i) => <ResourceCard key={i} r={r} />)}
            <Hairline />
          </div>
        )}

        {/* Classes */}
        <ClassesPanel profile={profile} />

        <Hairline />

        {/* Follow-up chat */}
        <div>
          <SectionLabel>Ask a Follow-up Question</SectionLabel>
          {chatHistory.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem", maxHeight: 400, overflowY: "auto" }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "80%", borderRadius: 16, padding: "0.9rem 1.2rem", ...T.body, fontSize: "0.85rem", lineHeight: 1.7, background: msg.role === "user" ? "rgba(200,137,58,0.2)" : "rgba(240,235,227,0.06)", border: `1px solid ${msg.role === "user" ? "rgba(200,137,58,0.3)" : T.border}`, color: "rgba(240,235,227,0.8)" }}>
                    {msg.role === "assistant" ? <FeedbackBlock text={msg.text} /> : msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && <div style={{ display: "flex", justifyContent: "flex-start" }}><div style={{ ...T.body, fontSize: "0.85rem", color: T.muted, fontStyle: "italic", border: `1px solid ${T.border}`, borderRadius: 16, padding: "0.9rem 1.2rem" }}>Thinking…</div></div>}
              <div ref={chatBottomRef} />
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input value={followUp} onChange={e => setFollowUp(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendFollowUp()}
              placeholder="e.g. How did Sargent handle lost edges in portraits?"
              style={{ flex: 1, ...T.body, fontSize: "0.85rem", color: T.cream, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none" }} />
            <button onClick={sendFollowUp} disabled={!followUp.trim() || chatLoading}
              style={{ ...T.body, fontSize: "0.8rem", color: followUp.trim() && !chatLoading ? T.cream : T.muted, background: "transparent", border: `1px solid ${followUp.trim() && !chatLoading ? T.border : "rgba(240,235,227,0.08)"}`, borderRadius: 50, padding: "0.6rem 1.4rem", cursor: followUp.trim() && !chatLoading ? "pointer" : "default", transition: "all 0.2s" }}>
              Ask
            </button>
          </div>
          {chatError && <p style={{ ...T.body, fontSize: "0.78rem", color: "#f87171", marginTop: "0.75rem" }}>{chatError}</p>}
        </div>

        <div style={{ marginTop: "3.5rem", textAlign: "center" }}>
          <button onClick={onBack} style={{ ...T.body, fontSize: "0.8rem", color: T.muted, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 50, padding: "0.7rem 1.8rem", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.color = T.cream} onMouseLeave={e => e.currentTarget.style.color = T.muted}>
            ← Analyse another work
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("landing");
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);

  useEffect(() => {
    (async () => {
      try { const r = await storage.get("art-mentor-profile"); if (r) setProfile(JSON.parse(r.value)); } catch { }
      try {
        const r = await storage.list("session:");
        if (r?.keys?.length) {
          const loaded = await Promise.all(r.keys.map(async k => { try { const d = await storage.get(k); return d ? JSON.parse(d.value) : null; } catch { return null; } }));
          setSessions(loaded.filter(Boolean).sort((a, b) => b.date - a.date));
        }
      } catch { }
      setLoaded(true);
    })();
  }, []);

  const saveProfile = async p => { await storage.set("art-mentor-profile", JSON.stringify(p)); setProfile(p); setEditing(false); };
  const saveSession = async s => { try { await storage.set(s.id, JSON.stringify(s)); setSessions(prev => [s, ...prev.filter(x => x.id !== s.id)].sort((a, b) => b.date - a.date)); } catch { } };
  const deleteSession = async id => { try { await storage.delete(id); setSessions(prev => prev.filter(s => s.id !== id)); } catch { } };

  const handleMentorSelect = (artist) => { setSelectedMentor(artist); setPage(profile ? "easel" : "profile"); };
  const handleAnalyse = async s => {
    const session = s.targetArtist ? s : { ...s, targetArtist: selectedMentor || "" };
    await saveSession(session); setCurrentSession(session); setPage("response");
  };
  const handleLoad = s => { setCurrentSession(s); setPage("response"); };

  if (!loaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, ...T.body, fontSize: "0.8rem", color: T.muted }}>Loading…</div>;
  if (page === "landing") return <LandingPage onStart={() => setPage("mentor")} />;
  if (page === "mentor") return <MentorSelectPage onSelect={handleMentorSelect} />;
  if (page === "about") return <AboutPage onBack={() => setPage(profile ? "easel" : "mentor")} />;
  if (!profile || editing) return <ProfileSetup onSave={saveProfile} existing={profile} onAbout={() => setPage("about")} />;
  if (page === "response" && currentSession) return <ResponsePage session={currentSession} profile={profile} onBack={() => setPage("mentor")} onEditProfile={() => setEditing(true)} onAbout={() => setPage("about")} onSaveSession={saveSession} sessions={sessions} onLoadSession={handleLoad} onDeleteSession={deleteSession} />;
  return <EaselPage profile={profile} onEditProfile={() => setEditing(true)} onAbout={() => setPage("about")} onAnalyse={handleAnalyse} sessions={sessions} onLoadSession={handleLoad} onDeleteSession={deleteSession} defaultMentor={selectedMentor} />;
}
