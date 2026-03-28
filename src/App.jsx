import { useState, useEffect, useRef } from "react";

const HEADERS = { "Content-Type": "application/json" };
const MODEL = "claude-sonnet-4-20250514";
const BG = "#6b6b69";

const DECEASED_ARTISTS = new Set([
  // 16th Century
  "Leonardo da Vinci","Michelangelo","Raphael","Titian","El Greco",
  "Albrecht Dürer","Pieter Bruegel the Elder","Hieronymus Bosch",
  "Hans Holbein the Younger","Tintoretto","Paolo Veronese","Correggio",
  // 17th Century
  "Caravaggio","Artemisia Gentileschi","Guido Reni",
  "Rembrandt","Johannes Vermeer","Frans Hals","Jan Steen","Pieter de Hooch",
  "Jacob van Ruisdael","Peter Paul Rubens","Anthony van Dyck",
  "Diego Velázquez","Francisco de Zurbarán","Bartolomé Esteban Murillo",
  "Nicolas Poussin","Claude Lorrain","Georges de La Tour",
  "Élisabeth Vigée Le Brun","Angelica Kauffmann","Jan Davidsz de Heem",
  // 18th Century
  "Jean-Antoine Watteau","François Boucher","Jean-Honoré Fragonard",
  "Jean-Baptiste-Siméon Chardin","Jean-Baptiste Greuze","Giovanni Battista Tiepolo",
  "William Hogarth","Thomas Gainsborough","Joshua Reynolds","George Stubbs",
  "Jacques-Louis David","Jean-Auguste-Dominique Ingres",
  "Francisco Goya","Giovanni Battista Piranesi","Henry Fuseli",
  // 19th Century — Romanticism & Realism
  "Eugène Delacroix","Théodore Géricault","Jean-François Millet",
  "Gustave Courbet","Honoré Daumier","Rosa Bonheur",
  "J.M.W. Turner","John Constable","John Martin","Samuel Palmer",
  "Caspar David Friedrich","Philipp Otto Runge",
  "Thomas Cole","Frederic Edwin Church","Albert Bierstadt","Winslow Homer",
  "William-Adolphe Bouguereau","Alexandre Cabanel","Lawrence Alma-Tadema",
  "Dante Gabriel Rossetti","John Everett Millais","Edward Burne-Jones","William Holman Hunt",
  // 19th Century — Impressionism & Post-Impressionism
  "Claude Monet","Pierre-Auguste Renoir","Edgar Degas","Camille Pissarro",
  "Alfred Sisley","Berthe Morisot","Mary Cassatt","Gustave Caillebotte",
  "Édouard Manet","Frédéric Bazille",
  "Paul Cézanne","Vincent van Gogh","Paul Gauguin","Georges Seurat","Paul Signac",
  "Henri de Toulouse-Lautrec","Odilon Redon",
  "Joaquín Sorolla","Anders Zorn","John Singer Sargent","Ilya Repin",
  "James McNeill Whistler","Thomas Eakins",
  // Late 19th–Early 20th Century
  "Gustav Klimt","Egon Schiele","Oskar Kokoschka",
  "Édouard Vuillard","Pierre Bonnard","Maurice Denis",
  "Auguste Rodin","Camille Claudel",
  "Giovanni Boldini","Franz von Stuck","Max Liebermann","Lovis Corinth",
  "Nikolai Ge","Valentin Serov","Isaac Levitan","Mikhail Vrubel",
  "Gwen John","Walter Sickert","Augustus John",
  "Edward Hopper","George Bellows","John Sloan","Robert Henri",
  // Early 20th Century — Modernism
  "Pablo Picasso","Henri Matisse","Georges Braque","Juan Gris",
  "Wassily Kandinsky","Paul Klee","Franz Marc","August Macke",
  "Ernst Ludwig Kirchner","Erich Heckel","Emil Nolde","Max Beckmann",
  "Piet Mondrian","Theo van Doesburg",
  "Kazimir Malevich","El Lissitzky","Alexander Rodchenko",
  "Marcel Duchamp","Francis Picabia","Kurt Schwitters",
  "Amedeo Modigliani","Chaim Soutine","Marc Chagall",
  "Giorgio de Chirico","Carlo Carrà",
  "Salvador Dalí","René Magritte","Max Ernst","Joan Miró","Yves Tanguy",
  "Frida Kahlo","Diego Rivera","José Clemente Orozco","David Alfaro Siqueiros",
  "Georgia O'Keeffe","Charles Sheeler","Charles Demuth",
  "Grant Wood","Thomas Hart Benton","Andrew Wyeth",
  "Tamara de Lempicka","Félix Vallotton","Käthe Kollwitz",
  // Mid 20th Century
  "Jackson Pollock","Willem de Kooning","Mark Rothko","Franz Kline",
  "Arshile Gorky","Lee Krasner","Helen Frankenthaler","Joan Mitchell",
  "Barnett Newman","Clyfford Still","Robert Motherwell","Hans Hofmann",
  "Alberto Giacometti","Henry Moore","Barbara Hepworth",
  "Francis Bacon","Lucian Freud","Frank Auerbach","Leon Kossoff",
  "Andy Warhol","Roy Lichtenstein","Jasper Johns","Robert Rauschenberg",
  "Balthus","Pierre Soulages","Nicolas de Staël",
  "Fairfield Porter","Giorgio Morandi","Renato Guttuso",
  "Osamu Tezuka","Katsuhiro Otomo","Yoshitaka Amano",
  "Isao Takahata","Satoshi Kon",
  "Jack Kirby","Steve Ditko","Will Eisner","Moebius","Bernie Wrightson",
  "Norman Rockwell","N.C. Wyeth","Howard Pyle","J.C. Leyendecker",
  "Basquiat","Keith Haring","Cy Twombly","Donald Judd","Dan Flavin",
  "Richard Williams","Chuck Jones",
]);

const LIVING_ARTISTS = new Set([
  "David Hockney","Gerhard Richter","Cindy Sherman","Jeff Koons",
  "Damien Hirst","Tracey Emin","Anish Kapoor","Ai Weiwei",
  "Jenny Saville","Kehinde Wiley","Cecily Brown","Lisa Yuskavage",
  "Peter Doig","Luc Tuymans","Neo Rauch","Eric Fischl",
  "Ellsworth Kelly","Frank Stella",
  "Hayao Miyazaki","Naoki Urasawa","Rumiko Takahashi",
  "Glen Keane","Craig McCracken","Bill Sienkiewicz",
  "Tim Benson","Alan Moore","Frank Miller","Chris Ware",
]);

const PUBLISHABLE_KEY = "pk_live_51Pfm8URx0s8BAK67OMPGXIi8twIsWZ7l5H2keJbAhhlD2pmGeJ7BAE0golYD7YunJ6UcVjzkg52nPY5RIIEijdhB00DFMhwdbD";

const MEDIUMS = ["Oil paint","Watercolour","Acrylic","Gouache","Pencil","Charcoal","Pastel","Ink","Digital","Mixed media","Brush & ink","Marker","Screen tone","Digital painting","Frame-by-frame animation"];

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

const divider = { height: 1, background: "rgba(240,235,227,0.18)", margin: "2rem 0" };

function TeknonLogo({ size = "md" }) {
  const scale = size === "lg" ? 1.8 : size === "sm" ? 0.7 : 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 * scale }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 * scale }}>
        <img src="/Home.png" alt="Teknon" style={{ height: 36 * scale, width: "auto", objectFit: "contain" }} />
        <span style={{ ...T.body, fontSize: 15 * scale, letterSpacing: 3.5 * scale, color: T.cream, fontWeight: 300 }}>teknon</span>
      </div>
      {size !== "sm" && <div style={{ height: 0.5, background: T.cream, opacity: 0.2, width: "100%" }} />}
    </div>
  );
}
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

const SectionLabel = ({ children }) => (
  <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "1rem" }}>
    ✦ {children}
  </p>
);

const Hairline = () => <div style={divider} />;

function Header({ onAbout, onLibrary, sessionSaved, sessions, onLoadSession, onDeleteSession }) {
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
                  <button onClick={() => setSessionsOpen(false)} style={{ ...navBtn, fontSize: "0.8rem" }}>✕</button>
                </div>
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.9rem 1.2rem", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
                      <img src={s.imageSrc} alt="artwork" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.border}`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }} onClick={() => { onLoadSession(s); setSessionsOpen(false); }}>
                        <p style={{ ...T.body, fontSize: "0.8rem", color: T.amber, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.targetArtist || "No mentor"}</p>
                        <p style={{ ...T.body, fontSize: "0.7rem", color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.description}</p>
                        <p style={{ ...T.body, fontSize: "0.65rem", color: "rgba(240,235,227,0.25)", marginTop: 2 }}>{new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <button onClick={() => onDeleteSession(s.id)} style={{ ...navBtn, color: "rgba(240,235,227,0.2)", fontSize: "0.75rem" }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={onLibrary} style={navBtn} onMouseEnter={e => e.target.style.color = T.cream} onMouseLeave={e => e.target.style.color = T.muted}>Library</button>
<button onClick={onAbout} style={navBtn} onMouseEnter={e => e.target.style.color = T.cream} onMouseLeave={e => e.target.style.color = T.muted}>About</button>
      </div>
    </div>
  );
}

function PaywallPage({ onBack, firstAnalysisDone }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const checkout = async (priceKey) => {
    if (!email.trim()) { setError("Please enter your email address first."); return; }
    setLoading(priceKey); setError(null);
    try {
      const origin = window.location.origin;
      const res = await fetch("/api/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceKey, email: email.trim(), successUrl: `${origin}?subscribed=true`, cancelUrl: `${origin}?cancelled=true` })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (e) { setError(e.message); setLoading(null); }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.cream, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem 2.5rem 3rem", boxSizing: "border-box" }}>
      <TeknonLogo size="md" />
      <div style={{ maxWidth: 520 }}>
        {firstAnalysisDone && (
          <p style={{ ...T.body, fontSize: "0.75rem", letterSpacing: "0.1em", color: T.amber, textTransform: "uppercase", marginBottom: "1.5rem" }}>
            Your first analysis is complete
          </p>
        )}
        <h1 style={{ ...T.body, fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 300, lineHeight: 1.1, color: T.cream, letterSpacing: "-0.01em", marginBottom: "1rem" }}>
          continue your<br />practice
        </h1>
        <p style={{ ...T.body, fontSize: "0.9rem", color: T.muted, lineHeight: 1.8, marginBottom: "2.5rem" }}>
          7 days free — then choose your plan. Cancel any time.
        </p>

        <input value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your email address"
          style={{ width: "100%", boxSizing: "border-box", ...T.body, fontSize: "1rem", color: T.cream, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none", marginBottom: "2rem" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { key: "studio_monthly", label: "Studio", price: "£9.99 / month", desc: "Unlimited analyses · Full session history · Studio Library" },
            { key: "studio_annual",  label: "Studio", price: "£89 / year", desc: "Save two months · Everything in Studio monthly" },
            { key: "master_monthly", label: "Master", price: "£19.99 / month", desc: "Everything in Studio · ElevenLabs voice when launched" },
            { key: "master_annual",  label: "Master", price: "£179 / year", desc: "Save two months · Everything in Master monthly" },
          ].map(plan => (
            <button key={plan.key} onClick={() => checkout(plan.key)} disabled={!!loading}
              style={{ ...T.body, textAlign: "left", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 12, padding: "1.1rem 1.4rem", cursor: loading ? "default" : "pointer", transition: "all 0.2s", opacity: loading && loading !== plan.key ? 0.4 : 1 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = T.borderHover; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ ...T.body, fontSize: "0.9rem", color: T.cream, fontWeight: 400 }}>{plan.label}</span>
                <span style={{ ...T.body, fontSize: "0.9rem", color: T.amber }}>{loading === plan.key ? "Redirecting…" : plan.price}</span>
              </div>
              <p style={{ ...T.body, fontSize: "0.75rem", color: T.muted, margin: 0 }}>{plan.desc}</p>
            </button>
          ))}
        </div>

        {error && <p style={{ ...T.body, fontSize: "0.8rem", color: "#f87171", marginBottom: "1rem" }}>{error}</p>}

        <button onClick={onBack} style={{ ...T.body, fontSize: "0.8rem", color: T.faint, background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.05em" }}>
          ← go back
        </button>
      </div>
      <p style={{ ...T.body, fontSize: "0.68rem", color: "rgba(240,235,227,0.22)", lineHeight: 1.8 }}>
        Secure payment by Stripe · Cancel any time · No commitment
      </p>
    </div>
  );
}

function LandingPage({ onStart }) {
  return (
    <div style={{ width: "100%", height: "100vh", background: BG, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem 2.5rem 3rem", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
      <img src="/hero.jpg" alt="" style={{ position: "absolute", right: "-2%", bottom: "-2%", height: "88vh", width: "auto", opacity: 0.55, pointerEvents: "none", userSelect: "none", maxWidth: "60vw" }} />
      <TeknonLogo size="md" />
      <div style={{ maxWidth: 560, position: "relative", zIndex: 1 }}>
        <h1 style={{ ...T.body, fontSize: "clamp(2.8rem,8vw,5.5rem)", fontWeight: 300, lineHeight: 1.05, color: T.cream, letterSpacing: "-0.01em", marginBottom: "2rem" }}>
          your art tutor<br />in your pocket
        </h1>
        <p style={{ ...T.body, fontSize: "clamp(1rem,2.5vw,1.4rem)", fontWeight: 300, color: "rgba(240,235,227,0.6)", letterSpacing: "0.01em", marginBottom: "2rem", lineHeight: 1.4 }}>great advice doesn't need to come at a great price</p>
        <PillBtn onClick={onStart}>get started</PillBtn>
        
<p style={{ ...T.body, fontSize: "0.7rem", letterSpacing: "0.08em", color: "rgba(240,235,227,0.3)", marginTop: "1.2rem" }}>master wisdom · private studio · no judgement</p>
      </div>
    </div>
  );
}

const PORTRAIT_ARTISTS = [
  { file: "Rembrandt.jpg",   name: "Rembrandt" },
  { file: "Cassatt.jpg",     name: "Mary Cassatt" },
  { file: "Caravaggio.jpg",  name: "Caravaggio" },
  { file: "OKeeffe.jpg",     name: "Georgia O'Keeffe" },
  { file: "Sargent.jpg",     name: "John Singer Sargent" },
  { file: "Kollwitz.jpg",    name: "Käthe Kollwitz" },
  { file: "VanGogh.jpg",     name: "Vincent van Gogh" },
  { file: "Kahlo.jpg",       name: "Frida Kahlo" },
  { file: "Monet.jpg",       name: "Claude Monet" },
  { file: "GwenJohn.jpg",    name: "Gwen John" },
  { file: "Picasso.jpg",     name: "Pablo Picasso" },
  { file: "Kauffmann.jpg",   name: "Angelica Kauffmann" },
  { file: "Degas.jpg",       name: "Edgar Degas" },
  { file: "Hepworth.jpg",    name: "Barbara Hepworth" },
  { file: "Vermeer.jpg",     name: "Johannes Vermeer" },
  { file: "LeBrun.jpg",      name: "Élisabeth Vigée Le Brun" },
  { file: "Matisse.jpg",     name: "Henri Matisse" },
  { file: "Merian.jpeg",     name: "Maria Sibylla Merian" },
  { file: "Klimt.jpg",       name: "Gustav Klimt" },
  { file: "Sorolla.jpg",     name: "Joaquín Sorolla" },
  { file: "Cezanne.jpg",     name: "Paul Cézanne" },
  { file: "Giacometti.jpg",  name: "Alberto Giacometti" },
  { file: "Homer.jpeg",      name: "Winslow Homer" },
  { file: "Whistler.jpg",    name: "James McNeill Whistler" },
  { file: "Rockwell.jpg",    name: "Norman Rockwell" },
  { file: "Moebius.jpg",     name: "Moebius" },
  { file: "Kirby.jpg",       name: "Jack Kirby" },
  { file: "Miyazaki.jpg",    name: "Hayao Miyazaki" },
  { file: "DaVici.png",      name: "Leonardo da Vinci" },
  { file: "Zornself.jpg",    name: "Anders Zorn" },
];
const COLLAGE_LAYOUT = [
  { top:"2%",  left:"1%",  rotate:-4, size:150, zIndex:3 },
  { top:"1%",  left:"22%", rotate:3,  size:135, zIndex:2 },
  { top:"0%",  left:"42%", rotate:-2, size:145, zIndex:4 },
  { top:"2%",  left:"62%", rotate:5,  size:130, zIndex:2 },
  { top:"1%",  left:"80%", rotate:-3, size:140, zIndex:3 },
  { top:"26%", left:"3%",  rotate:2,  size:140, zIndex:4 },
  { top:"25%", left:"24%", rotate:-5, size:150, zIndex:3 },
  { top:"24%", left:"45%", rotate:4,  size:135, zIndex:2 },
  { top:"27%", left:"64%", rotate:-2, size:145, zIndex:5 },
  { top:"25%", left:"82%", rotate:3,  size:130, zIndex:3 },
  { top:"50%", left:"2%",  rotate:-3, size:145, zIndex:2 },
  { top:"49%", left:"22%", rotate:5,  size:135, zIndex:4 },
  { top:"51%", left:"42%", rotate:-4, size:150, zIndex:3 },
  { top:"50%", left:"63%", rotate:2,  size:140, zIndex:2 },
  { top:"52%", left:"81%", rotate:-5, size:135, zIndex:4 },
  { top:"74%", left:"4%",  rotate:4,  size:140, zIndex:3 },
  { top:"73%", left:"25%", rotate:-2, size:150, zIndex:2 },
  { top:"75%", left:"44%", rotate:3,  size:135, zIndex:5 },
  { top:"74%", left:"64%", rotate:-4, size:145, zIndex:3 },
  { top:"76%", left:"82%", rotate:2,  size:130, zIndex:2 },
  { top:"98%", left:"1%",  rotate:-3, size:150, zIndex:3 },
  { top:"97%", left:"22%", rotate:4,  size:135, zIndex:2 },
  { top:"99%", left:"42%", rotate:-2, size:145, zIndex:4 },
  { top:"98%", left:"62%", rotate:3,  size:130, zIndex:2 },
  { top:"97%", left:"80%", rotate:-4, size:140, zIndex:3 },
  { top:"122%",left:"3%",  rotate:2,  size:140, zIndex:4 },
  { top:"121%",left:"24%", rotate:-5, size:150, zIndex:3 },
  { top:"123%",left:"45%", rotate:4,  size:135, zIndex:2 },
  { top:"122%",left:"64%", rotate:-2, size:145, zIndex:5 },
  { top:"121%",left:"82%", rotate:3,  size:130, zIndex:3 },
];
function ArtistCollage({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 1200 }}>
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
style={{ width: "100%", height: "96%", objectFit: "cover", objectPosition: "top", display: "block", filter: "sepia(20%) brightness(0.88)" }} />
              <div style={{ height: "4%" }} />
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

function MentorSelectPage({ onSelect, onLibrary }) {
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [isMobile] = useState(window.innerWidth < 1024);
  const inputRef = useRef();
  const suggestions = PORTRAIT_ARTISTS.map(a => a.name);
  const filtered = name.length > 0 ? suggestions.filter(s => s.toLowerCase().includes(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase()) : [];
  const proceed = (artist) => { const val = (artist || name).trim(); if (val) onSelect(val); };
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);
  return (
    <div style={{ width: "100%", height: "100vh", background: BG, display: "flex", flexDirection: "row", boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem 2.5rem 3rem", boxSizing: "border-box", minWidth: 0 }}>
        <TeknonLogo size="md" />
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ ...T.body, fontSize: "clamp(1.6rem,3.5vw,3.5rem)", fontWeight: 300, lineHeight: 1.1, color: T.cream, letterSpacing: "-0.01em", marginBottom: "2.5rem" }}>
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
            <button onClick={() => onSelect("")} style={{ ...T.body, fontSize: "0.8rem", color: T.faint, background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.05em" }}>
  skip for now
</button>
          </div>
         <p style={{ ...T.body, fontSize: "0.68rem", letterSpacing: "0.05em", color: "rgba(240,235,227,0.22)", marginTop: "1.5rem", lineHeight: 1.8 }}>
  Choose any artist — living or from history.<br />If they are no longer with us, they will speak<br />to you directly in their own voice.
</p>
<button onClick={onLibrary} style={{ ...T.body, fontSize: "0.78rem", color: T.muted, background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.06em", marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem", padding: 0 }}
  onMouseEnter={e => e.currentTarget.style.color = T.cream}
  onMouseLeave={e => e.currentTarget.style.color = T.muted}>
  Explore the Studio Library →
</button> 
        </div>
        <div />
      </div>
      {isMobile ? (
  <div style={{ width: "45%", borderLeft: `1px solid ${T.border}`, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", flexShrink: 0, padding: "1rem" }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
      {PORTRAIT_ARTISTS.map((artist, i) => (
        <button key={i} onClick={() => proceed(artist.name)}
          style={{ width: "100%", aspectRatio: "3/4", background: "#3a3835", border: "none", borderRadius: 4, overflow: "hidden", cursor: "pointer", boxShadow: "0 3px 10px rgba(0,0,0,0.3)", padding: 0 }}>
          <img src={`/artists/${artist.file}`} alt={artist.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block", filter: "sepia(20%) brightness(0.88)" }} />
        </button>
      ))}
    </div>
  </div>
      ) : (
       <div style={{ width: "45%", position: "relative", overflowY: "auto", overflowX: "hidden", borderLeft: `1px solid ${T.border}`, flexShrink: 0 }}>
  <div style={{ position: "relative", width: "100%", minHeight: 1200 }}>
    <ArtistCollage onSelect={proceed} />
  </div>
</div> 
      )}
    </div>
  );
}

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
    { text: "To draw, you must close your eyes and sing.", author: "Pablo Picasso" },
    { text: "I saw the angel in the marble and carved until I set him free.", author: "Michelangelo" },
    { text: "Paint what you feel, not what you see.", author: "Paul Cézanne" },
    { text: "I paint flowers so they will not die.", author: "Frida Kahlo" },
    { text: "If you hear a voice within you say you cannot paint, then by all means paint and that voice will be silenced.", author: "Vincent van Gogh" },
    { text: "One must always draw, draw with the eyes, when one cannot draw with a pencil.", author: "Balthus" },
    { text: "Colour is a power which directly influences the soul.", author: "Wassily Kandinsky" },
    { text: "To be an artist is to believe in life.", author: "Henry Moore" },
    { text: "I never paint dreams or nightmares. I paint my own reality.", author: "Frida Kahlo" },
    { text: "Drawing is the honesty of the art. There is no possibility of cheating. It is either good or bad.", author: "Salvador Dalí" },
    { text: "Art is the lie that enables us to realise the truth.", author: "Pablo Picasso" },
    { text: "Painting is silent poetry, and poetry is painting that speaks.", author: "Plutarch" },
    { text: "I want to make beautiful things, even if nobody cares.", author: "Saul Bass" },
    { text: "Comics are a gateway drug to literacy.", author: "Art Spiegelman" },
    { text: "Always carry a sketchbook. It is your visual diary.", author: "Will Eisner" },
    { text: "Animation is not the art of drawings that move, but the art of movements that are drawn.", author: "Norman McLaren" },
    { text: "I want to create anime that puts Japanese animation on the world stage.", author: "Hayao Miyazaki" },
    { text: "Sculpture is the art of the intelligence.", author: "Pablo Picasso" },
    { text: "I work with the same intensity whether the piece is large or small.", author: "Barbara Hepworth" },
    { text: "The printmaker's line has a rawness and immediacy that no other medium can match.", author: "Käthe Kollwitz" },
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

function LibraryPage({ onBack, selectedMentor }) {
  const [question, setQuestion] = useState("");
  const [useVoice, setUseVoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const bottomRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const r = await storage.list("library:");
        if (r?.keys?.length) {
          const loaded = await Promise.all(r.keys.map(async k => { try { const d = await storage.get(k); return d ? JSON.parse(d.value) : null; } catch { return null; } }));
          setEntries(loaded.filter(Boolean).sort((a, b) => a.date - b.date));
        }
      } catch { }
    })();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [entries, loading]);

  const ask = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion(""); setError(null); setLoading(true);
    try {
      const voiceCtx = useVoice && selectedMentor
        ? LIVING_ARTISTS.has(selectedMentor)
          ? `You are a knowledgeable mentor deeply versed in the work and philosophy of ${selectedMentor}. Answer drawing on their known approach and documented thinking.`
          : `You are answering in the spirit of ${selectedMentor}. Draw on their documented writings, letters and recorded teachings. Speak with the directness of someone who spent a lifetime in the studio. No theatrical actions or affectations — just genuine, accumulated knowledge.`
        : `You are a masterful, experienced art tutor and technician with encyclopaedic knowledge of artists' materials, techniques, art history and studio practice across all media and traditions.`;
      const text = await callAPI([{ role: "user", content: `${voiceCtx}\n\nA student has asked the following question:\n\n"${q}"\n\nGive a thorough, practical, genuinely useful answer drawing on deep knowledge of artists' materials, techniques and art history. Be specific and direct — like a great tutor answering at the easel or in the studio. Where relevant, mention specific artists, materials, or approaches by name. Avoid generic advice.` }], true, 1500);
      const entry = { id: `library:${Date.now()}`, date: Date.now(), question: q, answer: text, voice: useVoice && selectedMentor ? selectedMentor : null };
      await storage.set(entry.id, JSON.stringify(entry));
      setEntries(prev => [...prev, entry]);
    } catch (e) { setError(`Error: ${e.message}`); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.cream }}>
      <div style={{ padding: "1.2rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(107,107,105,0.96)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, zIndex: 10 }}>
        <TeknonLogo size="sm" />
        <PillBtn onClick={onBack} style={{ fontSize: "0.75rem", padding: "0.5rem 1.2rem" }}>← Back</PillBtn>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <h2 style={{ ...T.serif, fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 300, color: T.cream, marginBottom: "0.5rem" }}>The Studio Library</h2>
        <p style={{ ...T.body, fontSize: "0.9rem", color: T.muted, marginBottom: "3rem", lineHeight: 1.7 }}>Ask any question about materials, technique, art history or studio practice.</p>

        {entries.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            {entries.map((e, i) => (
              <div key={e.id}>
                <div style={{ marginBottom: "2rem" }}>
                  <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.15em", color: T.amber, textTransform: "uppercase", marginBottom: "0.75rem" }}>
                    {e.voice ? `In the spirit of ${e.voice}` : "Studio knowledge"} · {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                  <p style={{ ...T.body, fontSize: "1rem", color: T.cream, marginBottom: "1.25rem", lineHeight: 1.6 }}>"{e.question}"</p>
                  <FeedbackBlock text={e.answer} />
                </div>
                {i < entries.length - 1 && <Hairline />}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {loading && (
          <div style={{ marginBottom: "2rem" }}>
            <Hairline />
            <p style={{ ...T.body, fontSize: "0.85rem", color: T.muted, padding: "1.5rem 0" }}>Consulting the library…</p>
          </div>
        )}

        {error && <p style={{ ...T.body, fontSize: "0.82rem", color: "#f87171", marginBottom: "1rem" }}>{error}</p>}

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "2rem" }}>
          <textarea value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
            rows={3} placeholder="e.g. My burnt umber is very thick and difficult to work with — what can I do?"
            style={{ width: "100%", boxSizing: "border-box", ...T.body, fontSize: "0.9rem", color: T.cream, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none", resize: "none", lineHeight: 1.7, marginBottom: "1.5rem" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {selectedMentor && (
                <button onClick={() => setUseVoice(v => !v)}
                  style={{ ...T.body, fontSize: "0.78rem", color: useVoice ? T.cream : T.muted, background: "transparent", border: `1px solid ${useVoice ? T.border : "rgba(240,235,227,0.1)"}`, borderRadius: 50, padding: "0.5rem 1.1rem", cursor: "pointer", transition: "all 0.2s" }}>
                  {useVoice ? `✦ Voice of ${selectedMentor}` : `Ask as ${selectedMentor}?`}
                </button>
              )}
            </div>
            <PillBtn onClick={ask} disabled={!question.trim() || loading} style={{ fontSize: "0.9rem", padding: "0.75rem 2rem" }}>
              {loading ? "Searching…" : "Ask →"}
            </PillBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
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

function ClassesPanel() {
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
      const typeLabel = type === "schools" ? "art schools" : type === "workshops" ? "workshops and short courses" : "art schools, workshops and short courses";
      await new Promise(r => setTimeout(r, 10000));
      const text = await callAPI([{ role: "user", content: `Find 5-6 real, active ${typeLabel} near ${location} for an artist interested in painting at developing level.\n\nReturn ONLY valid JSON:\n[{"name":"...","type":"school|workshop","location":"...","description":"...","url":"...","distance":"local|regional|international"}]` }]);
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
            <p style={{ ...T.body, fontSize: "0.85rem", color: T.muted, marginBottom: "1.25rem", lineHeight: 1.7 }}>We'll use your location to find schools and workshops near you.</p>
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

function EaselPage({ onAbout, onLibrary, onAnalyse, sessions, onLoadSession, onDeleteSession, defaultMentor }) {
  const [image, setImage] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [medium, setMedium] = useState("");
  const [description, setDescription] = useState("");
  const [struggle, setStruggle] = useState("");
  const [targetArtist, setTargetArtist] = useState(defaultMentor || "");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
const [refImage, setRefImage] = useState(null);
const [refImageB64, setRefImageB64] = useState(null);
const refFileRef = useRef();
  const fileRef = useRef();
  const cameraRef = useRef();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleFile = file => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp|heic|tiff|tif|avif)$/i)) {
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
          } catch { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime("image/jpeg"); setError(null); }
        };
        img.onerror = () => { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime("image/jpeg"); setError(null); };
        img.src = e.target.result;
      } catch { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime("image/jpeg"); setError(null); }
    };
    reader.onerror = () => setError("This image couldn't be read — try saving it as a JPG first and uploading again.");
    reader.readAsDataURL(file);
  };
const handleRefFile = file => {
  if (!file) return;
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
          setRefImage(compressed); setRefImageB64(compressed.split(",")[1]);
        } catch { setRefImage(e.target.result); setRefImageB64(e.target.result.split(",")[1]); }
      };
      img.src = e.target.result;
    } catch { setRefImage(e.target.result); setRefImageB64(e.target.result.split(",")[1]); }
  };
  reader.readAsDataURL(file);
};
  const analyse = async () => {
    if (!imageB64 || !description) return;
    setLoading(true); setError(null); setLoadingStep("Reading your painting…");
    const voiceInstruction = !targetArtist
      ? `You are a masterful, deeply experienced art tutor with encyclopaedic knowledge of art history and a lifetime of studio practice.`
      : LIVING_ARTISTS.has(targetArtist)
      ? `You are a masterful mentor with deep knowledge of ${targetArtist}'s working methods, documented philosophy and artistic concerns. Draw on what is known about how they think and work.`
      : `You are giving feedback in the spirit of ${targetArtist}. Draw directly on their documented writings, letters, interviews, and recorded teachings. Speak with the directness and authority of someone who has spent a lifetime painting. Do NOT perform or roleplay — no theatrical actions, no forced period language, no affectations. Simply think and speak as they would have done when standing at a student's easel.`;

    const prompt = `${voiceInstruction}${medium ? ` The artist is working in ${medium}.` : ""}

Look at this painting carefully before forming any opinion. Survey the whole — the mood, the handling, the quality of observation, what has genuinely been achieved. Only after looking honestly should you decide what, if anything, needs improving. You are not required to find problems. If the work is strong, say so clearly and specifically.

Work in progress: "${description}".${refImageB64 ? " A reference photo has been provided as the second image — only raise a discrepancy if you can see it clearly and unambiguously." : ""}${struggle ? ` The artist says: "${struggle}".` : ""}

Read the description carefully. The subject, medium and intention of the work must shape everything you say.

TRADITION: Identify whether this work is observational (oil, watercolour, life drawing, portraiture, landscape, animal painting) or expressive/interpretive/abstract. If observational, assess accuracy — but only raise proportion issues with clear visual evidence. If expressive, assess it entirely on its own terms: mark quality, paint handling, compositional energy, emotional weight. Never apply observational criteria to expressive work.

SUBJECT: If the subject is an animal, speak about it as an animal — fur not flesh, coat not skin, that animal's specific anatomy. Never transpose human portrait terminology onto animal subjects.

PROPORTION: Only raise a proportion or drawing issue if you can see clear, specific, unambiguous visual evidence. If the drawing looks right, say so and move on. You have explicit permission to conclude the drawing is sound. Never assert anatomical errors without evidence. A false critique is more damaging than a missed one.

"DRAW WHAT YOU SEE": Only invoke this principle when there is demonstrable evidence of a specific discrepancy AND the work is clearly attempting observational accuracy. Never use it as a default critique.

REFERENCE PHOTOS: Do not assume the artist works from a reference. If no reference has been provided and you have genuine uncertainty about accuracy, you may suggest — once, briefly, at the end — that a reference photo would allow more precise comparison. Never suggest this for expressive or abstract work, or if the drawing already looks convincing.

Now give your feedback in these sections:

**What I see**
What is genuinely working — specifically and honestly. Name things the artist may not have noticed. This is accurate observation, not empty encouragement.

**The most important thing**
Look at these in order and use whichever gives the single most genuinely useful observation:
— Background and surrounding space: does it support or fight the subject? Could a colour change make the subject glow?
— Unresolved edges: does the subject feel grounded or float? Would a few marks resolve it?
— Compositional completeness: anything the eye expects but doesn't find? An element a stroke or two would address?
— Colour relationships across the whole painting: harmony, temperature, saturation
— Quality and consistency of light
— Only if clearly relevant with unambiguous visual evidence: structural or proportional issues. For landscapes, abstracts or expressive work, ignore this entirely.

If the painting is strong and close to resolved, say so and offer the most considered small observation you can. Not every painting needs a major intervention.

**What to look at**
Reference another artist only if genuinely reminded of them or if they solved exactly this problem. Name a specific work if you can. Do not redirect simply to avoid direct advice.

**How I would approach this**
What you would actually do next if this were your painting. Specific: which brush, which colour, which mark first.

**A final word**
Something true about this work. Encouragement with real knowledge and intelligence — not flattery. Make the artist want to go back to the canvas. Mean what you say.

NEVER: invent problems · apply observational criteria to expressive work · assert anatomy errors without evidence · repeat the same point across sections · use theatrical actions or affectations · open with a performative greeting · give generic motivational quotes · be sycophantic`;
    
    const timeout = setTimeout(() => { setError("The analysis is taking too long — please check your connection and try again."); setLoading(false); setLoadingStep(""); }, 45000);

    try {
      setLoadingStep("Consulting the masters…");
      const imageContent = [
  { type: "image", source: { type: "base64", media_type: imageMime, data: imageB64 } },
  ...(refImageB64 ? [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: refImageB64 } }] : []),
  { type: "text", text: prompt }
];
const res = await fetch("/api/chat", { method: "POST", headers: HEADERS, body: JSON.stringify({ model: MODEL, max_tokens: 1200, messages: [{ role: "user", content: imageContent }] }) });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.error) throw new Error(`${data.error.type}: ${data.error.message}`);
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!text) throw new Error("No feedback received — please try again.");
      setLoadingStep("Opening your feedback…");
      const s = { id: `session:${Date.now()}`, date: Date.now(), imageSrc: image, imageB64, imageMime, description, struggle, targetArtist, medium, feedback: text, resources: null, chatHistory: [] };
      await onAnalyse(s);
    } catch (e) { clearTimeout(timeout); setError(`${e.message}`); setLoading(false); setLoadingStep(""); }
  };

  const textareaStyle = { width: "100%", boxSizing: "border-box", ...T.body, fontSize: "0.9rem", color: T.cream, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none", resize: "none", lineHeight: 1.7 };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.cream }}>
     <Header onAbout={onAbout} onLibrary={onLibrary} sessions={sessions} onLoadSession={onLoadSession} onDeleteSession={onDeleteSession} />       <div style={{ maxWidth: 600, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <h2 style={{ ...T.serif, fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 300, color: T.cream, marginBottom: "0.5rem" }}>The Easel</h2>
        <p style={{ ...T.body, fontSize: "0.9rem", color: T.muted, marginBottom: "3rem", lineHeight: 1.7 }}>Upload your work and describe what you're painting — your mentor will do the rest.</p>

        <div onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onClick={() => fileRef.current.click()}
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
<input ref={refFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleRefFile(e.target.files[0])} />

       {image && (
  <div style={{ marginBottom: "2.5rem" }}>
    {!refImage ? (
      <button onClick={() => refFileRef.current.click()}
        style={{ ...T.body, fontSize: "0.8rem", color: T.muted, background: "transparent", border: `1px solid rgba(240,235,227,0.1)`, borderRadius: 50, padding: "0.65rem 1.4rem", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.5rem" }}
        onMouseEnter={e => { e.currentTarget.style.color = T.cream; e.currentTarget.style.borderColor = T.border; }}
        onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = "rgba(240,235,227,0.1)"; }}>
        <span style={{ fontSize: "0.7rem" }}>+</span> Add a reference photo (optional)
      </button>
    ) : (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <img src={refImage} alt="reference" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.border}` }} />
        <div>
          <p style={{ ...T.body, fontSize: "0.78rem", color: T.cream, marginBottom: "0.2rem" }}>Reference photo added</p>
          <button onClick={() => { setRefImage(null); setRefImageB64(null); }}
            style={{ ...T.body, fontSize: "0.72rem", color: T.muted, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            Remove
          </button>
        </div>
      </div>
    )}
  </div>
)} 
       <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>Artist / Style I'm aiming for</p>
          <input value={targetArtist} onChange={e => setTargetArtist(e.target.value)}
            placeholder="e.g. Rembrandt, Sargent, Georgia O'Keeffe — they will speak to you directly"
            style={{ width: "100%", boxSizing: "border-box", ...T.body, fontSize: "0.9rem", color: T.cream, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none" }} />
        </div>

        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>Medium <span style={{ textTransform: "none", letterSpacing: "normal", fontSize: "0.72rem" }}>(optional)</span></p>
          <select value={medium} onChange={e => setMedium(e.target.value)}
            style={{ width: "100%", ...T.body, fontSize: "0.9rem", color: medium ? T.cream : T.muted, background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "0.75rem 0", outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}>
            <option value="" style={{ background: "#6b6b69" }}>Select your medium…</option>
            {MEDIUMS.map(m => <option key={m} value={m} style={{ background: "#6b6b69" }}>{m}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>What are you painting / drawing?</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="e.g. A portrait study in oil paint…" style={textareaStyle} />
        </div>

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

function ResponsePage({ session, onBack, onAbout, onLibrary, onSaveSession, sessions, onLoadSession, onDeleteSession }) {
  const { imageSrc, imageB64, imageMime, description, struggle, targetArtist, medium, feedback } = session;
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
          const text = await callAPI([{ role: "user", content: `Find 4-6 real online resources that would genuinely help an artist with the specific issues raised in this feedback:\n\n${feedback}\n\nPrioritise practical tutorials, technique videos, and instructional articles that directly address the problems discussed — for example if the feedback mentions hair painting, find resources specifically about painting hair. Only include resources about ${targetArtist} if they are specifically instructional about technique. Avoid biographical articles, museum pages, or general overviews.\n\nReturn ONLY valid JSON:\n[{"title":"...","url":"...","source":"...","type":"article|video|interview|tutorial|website","description":"one sentence"}]\n\nOnly real URLs.` }]);
          const c = text.replace(/```json|```/g, "").trim(); const s = c.indexOf("["), e = c.lastIndexOf("]");
          if (s !== -1) { const r = JSON.parse(c.slice(s, e + 1)); setResources(r); onSaveSession({ ...session, resources: r }); }
        } catch { }
        setResourcesLoading(false);
      })();
    }
  }, []);

  const sendFollowUp = async () => {
    if (!followUp.trim() || chatLoading) return;
    const q = followUp.trim(); setFollowUp(""); setChatError(null);
    const nh = [...chatHistory, { role: "user", text: q }]; setChatHistory(nh); setChatLoading(true);
    try {
      const ctx = `You are a masterful, encouraging art mentor.${medium ? ` The artist works in ${medium}.` : ""} Working on: "${description}". Mentor: ${targetArtist || "not specified"}. Initial analysis:\n\n${feedback}\n\nAnswer with generosity and master artist wisdom.`;
      const msgs = [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: imageMime, data: imageB64 } }, { type: "text", text: ctx }] }, { role: "assistant", content: "Understood. Please ask me anything." }, ...nh.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }))];
      const reply = await callAPI(msgs);
      const uh = [...nh, { role: "assistant", text: reply }]; setChatHistory(uh);
      onSaveSession({ ...session, chatHistory: uh });
    } catch (e) { setChatError(`Error: ${e.message}`); }
    setChatLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T.cream }}>
      <Header onAbout={onAbout} onLibrary={onLibrary} sessionSaved={true} sessions={sessions} onLoadSession={onLoadSession} onDeleteSession={onDeleteSession} />
      <div ref={topRef} style={{ maxWidth: 680, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <button onClick={onBack} style={{ ...T.body, fontSize: "0.8rem", color: T.muted, background: "transparent", border: "none", cursor: "pointer", marginBottom: "3rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
          onMouseEnter={e => e.currentTarget.style.color = T.cream} onMouseLeave={e => e.currentTarget.style.color = T.muted}>
          ← Analyse another work
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "3.5rem", alignItems: "center" }}>
          <img src={imageSrc} alt="artwork" style={{ width: "100%", borderRadius: 12, border: `1px solid ${T.border}`, objectFit: "contain", maxHeight: 280, background: "#0d0d0d" }} />
          <div>
            <p style={{ ...T.body, fontSize: "0.65rem", letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>Your work</p>
            <p style={{ ...T.body, fontSize: "0.9rem", color: "rgba(240,235,227,0.8)", lineHeight: 1.7, marginBottom: "0.5rem" }}>{description}</p>
            {targetArtist && <p style={{ ...T.body, fontSize: "0.78rem", color: T.amber, marginBottom: "0.3rem" }}>Mentor: {targetArtist}</p>}
            {medium && <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted, marginBottom: "0.3rem" }}>Medium: {medium}</p>}
            {struggle && <p style={{ ...T.body, fontSize: "0.78rem", color: T.muted, fontStyle: "italic" }}>"{struggle}"</p>}
          </div>
        </div>

        <Hairline />

        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel>Studio Analysis</SectionLabel>
          {targetArtist && (
            <p style={{ ...T.body, fontSize: "0.7rem", letterSpacing: "0.1em", color: T.muted, textTransform: "uppercase", marginBottom: "1.5rem", fontStyle: "italic" }}>
              Your feedback inspired by the accumulated records of {targetArtist}'s writings and works
            </p>
          )}
          <FeedbackBlock text={feedback} />
        </div>

        <Hairline />

        {(resourcesLoading || resources) && (
          <div style={{ marginBottom: "0" }}>
            <SectionLabel>Related Resources{targetArtist ? ` — ${targetArtist}` : ""}</SectionLabel>
            {resourcesLoading && <p style={{ ...T.body, fontSize: "0.85rem", color: T.muted }}>Finding articles, interviews & videos…</p>}
            {resources && resources.map((r, i) => <ResourceCard key={i} r={r} />)}
            <Hairline />
          </div>
        )}

        <ClassesPanel />

        <Hairline />

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

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("landing");
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
const [subscription, setSubscription] = useState(null); // null = unknown, false = none, {tier, trialing} = active
const [analysisCount, setAnalysisCount] = useState(0);
const [userEmail, setUserEmail] = useState(null);
  const [prevPage, setPrevPage] = useState("mentor");

useEffect(() => {
    (async () => {
      // Check for successful Stripe redirect
      const params = new URLSearchParams(window.location.search);
      if (params.get("subscribed") === "true") {
        window.history.replaceState({}, "", window.location.pathname);
        const savedEmail = localStorage.getItem("teknon-email");
        if (savedEmail) {
          try {
            const res = await fetch("/api/verify-subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: savedEmail }) });
            const data = await res.json();
            if (data.active) { setSubscription({ tier: data.tier, trialing: data.trialing }); setUserEmail(savedEmail); }
          } catch {}
        }
      }
      // Restore email and check subscription
      const savedEmail = localStorage.getItem("teknon-email");
      if (savedEmail) {
        setUserEmail(savedEmail);
        try {
          const res = await fetch("/api/verify-subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: savedEmail }) });
          const data = await res.json();
          setSubscription(data.active ? { tier: data.tier, trialing: data.trialing } : false);
        } catch { setSubscription(false); }
      } else { setSubscription(false); }
      // Restore analysis count
      const count = parseInt(localStorage.getItem("teknon-analysis-count") || "0");
      setAnalysisCount(count);
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

  const saveSession = async s => { try { await storage.set(s.id, JSON.stringify(s)); setSessions(prev => [s, ...prev.filter(x => x.id !== s.id)].sort((a, b) => b.date - a.date)); } catch { } };
  const deleteSession = async id => { try { await storage.delete(id); setSessions(prev => prev.filter(s => s.id !== id)); } catch { } };
  const handleMentorSelect = (artist) => { setSelectedMentor(artist); setPage("easel"); };
  const handleAnalyse = async s => {
    const session = s.targetArtist ? s : { ...s, targetArtist: selectedMentor || "" };
    const newCount = analysisCount + 1;
    setAnalysisCount(newCount);
    localStorage.setItem("teknon-analysis-count", newCount.toString());
    // First analysis always free
    if (true) {
      await saveSession(session); setCurrentSession(session); setPage("response");
    } else {
      // Save session but show paywall
      await saveSession(session); setCurrentSession(session); setPage("paywall");
    }
  };  
  const handleLoad = s => { setCurrentSession(s); setPage("response"); };

  if (!loaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, ...T.body, fontSize: "0.8rem", color: T.muted }}>Loading…</div>;
  if (page === "landing") return <LandingPage onStart={() => setPage("mentor")} />;
  if (page === "paywall") return <PaywallPage onBack={() => setPage("easel")} firstAnalysisDone={analysisCount >= 1} />;
  if (page === "mentor") return <MentorSelectPage onSelect={handleMentorSelect} onLibrary={() => { setPrevPage("mentor"); setPage("library"); }} />;
  if (page === "about") return <AboutPage onBack={() => setPage(prevPage)} />;
  if (page === "library") return <LibraryPage onBack={() => setPage(prevPage)} selectedMentor={selectedMentor} />;
  if (page === "response" && currentSession) return <ResponsePage session={currentSession} onBack={() => setPage("mentor")} onAbout={() => { setPrevPage("response"); setPage("about"); }} onLibrary={() => { setPrevPage("response"); setPage("library"); }} onSaveSession={saveSession} sessions={sessions} onLoadSession={handleLoad} onDeleteSession={deleteSession} />;
  return <EaselPage onAbout={() => { setPrevPage("easel"); setPage("about"); }} onLibrary={() => { setPrevPage("easel"); setPage("library"); }} onAnalyse={handleAnalyse} sessions={sessions} onLoadSession={handleLoad} onDeleteSession={deleteSession} defaultMentor={selectedMentor} />;
}
