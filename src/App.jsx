import { useState, useEffect, useRef } from "react";

const HEADERS = { "Content-Type": "application/json" };
const MODEL = "claude-sonnet-4-20250514";
const BG = "#6b6b69";
const card = "bg-stone-900 border border-stone-800 rounded-2xl";
const cardInner = "bg-stone-900 border border-stone-800 rounded-xl";

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

function TeknonLogo({ size = "md" }) {
  const scale = size === "lg" ? 1.8 : size === "sm" ? 0.7 : 1;
  const cx = 18 * scale, cy = 18 * scale;
  const lines = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return { x1: cx + Math.cos(a) * 2.5 * scale, y1: cy + Math.sin(a) * 2.5 * scale, x2: cx + Math.cos(a) * 16 * scale, y2: cy + Math.sin(a) * 16 * scale };
  });
  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 4*scale }}>
      <div style={{ display:"flex", alignItems:"center", gap: 10*scale }}>
        <svg width={36*scale} height={36*scale} viewBox={`0 0 ${36*scale} ${36*scale}`} fill="none">
          {lines.map((l,i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#e7e0d5" strokeWidth={0.6*scale} strokeLinecap="round" opacity="0.9"/>)}
          <circle cx={cx} cy={cy} r={1.5*scale} fill="#e7e0d5"/>
        </svg>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15*scale, letterSpacing:3.5*scale, color:"#e7e0d5", fontWeight:300 }}>teknon</span>
      </div>
      {size !== "sm" && <div style={{ height:0.5, background:"#e7e0d5", opacity:0.3, width:"100%" }}/>}
    </div>
  );
}

const Tag = ({ label, selected, onClick }) => (
  <button onClick={onClick} style={{fontFamily:"'DM Sans',sans-serif"}} className={`px-3 py-1 rounded-full text-sm border transition-all ${selected ? "bg-amber-800 border-amber-700 text-amber-100" : "border-stone-700 text-stone-400 hover:border-amber-700 hover:text-amber-200"}`}>{label}</button>
);
const Section = ({ title, subtitle, children }) => (
  <div className="mb-7">
    <h3 className="text-xs uppercase tracking-widest mb-1" style={{color:"#c0b8b0",fontFamily:"'DM Sans',sans-serif"}}>{title}</h3>
    {subtitle && <p className="text-xs mb-3" style={{color:"#a0988e",fontFamily:"'DM Sans',sans-serif"}}>{subtitle}</p>}
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);
const Divider = () => <div className="border-t border-stone-800 my-6"/>;
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-amber-700 text-xs">✦</span>
    <h3 className="text-xs uppercase tracking-widest text-stone-500" style={{fontFamily:"'DM Sans',sans-serif"}}>{children}</h3>
  </div>
);

function Header({ onEditProfile, onAbout, sessionSaved, sessions, onLoadSession, onDeleteSession }) {
  const [sessionsOpen, setSessionsOpen] = useState(false);
  return (
    <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-stone-700" style={{background:"rgba(80,78,74,0.97)",backdropFilter:"blur(12px)"}}>
      <TeknonLogo/>
      <div className="flex items-center gap-3">
        {sessionSaved && <span className="text-xs text-amber-700 border border-amber-900 px-2 py-0.5 rounded-full">Saved</span>}
        {sessions?.length > 0 && (
          <div className="relative">
            <button onClick={()=>setSessionsOpen(o=>!o)} className="text-xs text-stone-500 hover:text-amber-400 border border-stone-700 hover:border-amber-700 px-3 py-1 rounded-full transition-all flex items-center gap-1" style={{fontFamily:"'DM Sans',sans-serif"}}>
              My Sessions <span className="bg-stone-700 text-stone-300 text-xs px-1.5 py-0.5 rounded-full ml-1">{sessions.length}</span>
            </button>
            {sessionsOpen && (
              <div className="absolute right-0 top-9 w-80 bg-stone-900 border border-stone-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-stone-500">My Sessions</p>
                  <button onClick={()=>setSessionsOpen(false)} className="text-stone-600 hover:text-stone-400 text-sm">✕</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {sessions.map(s=>(
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-800 border-b border-stone-800 last:border-0 group">
                      <img src={s.imageSrc} alt="artwork" className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-stone-700"/>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>{onLoadSession(s);setSessionsOpen(false);}}>
                        <p className="text-amber-400 text-xs font-medium truncate">{s.targetArtist||"No target artist"}</p>
                        <p className="text-stone-400 text-xs truncate">{s.description}</p>
                        <p className="text-stone-600 text-xs mt-0.5">{new Date(s.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</p>
                      </div>
                      <button onClick={()=>onDeleteSession(s.id)} className="text-stone-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={onAbout} className="text-xs text-stone-500 hover:text-amber-400 transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}>About</button>
        {onEditProfile && <button onClick={onEditProfile} className="text-xs text-stone-500 hover:text-amber-400 border border-stone-700 hover:border-amber-700 px-3 py-1 rounded-full transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}>Edit Profile</button>}
      </div>
    </div>
  );
}

function LandingPage({ onStart }) {
  return (
    <div style={{ width:"100%", height:"100vh", background:"#6b6b69", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"2.5rem 2.5rem 3rem", boxSizing:"border-box" }}>
      <TeknonLogo size="md"/>
      <div style={{ maxWidth:560 }}>
        <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(2.8rem,8vw,5.5rem)", fontWeight:300, lineHeight:1.05, color:"#f0ebe3", letterSpacing:"-0.01em", marginBottom:"2rem" }}>
          your art tutor<br/>in your pocket
        </h1>
        <button onClick={onStart}
          style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"1rem", fontWeight:400, letterSpacing:"0.12em", color:"#f0ebe3", background:"transparent", border:"1px solid rgba(240,235,227,0.5)", borderRadius:50, padding:"0.85rem 2.2rem", cursor:"pointer" }}
          onMouseEnter={e=>{e.target.style.background="rgba(240,235,227,0.1)";e.target.style.borderColor="rgba(240,235,227,0.9)";}}
          onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.borderColor="rgba(240,235,227,0.5)";}}>
          get started
        </button>
        <p style={{ color:"rgba(240,235,227,0.35)", fontSize:"0.7rem", letterSpacing:"0.08em", marginTop:"1.2rem" }}>master wisdom · private studio · no judgement</p>
      </div>
    </div>
  );
}

function MentorSelectPage({ onSelect }) {
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef();
  const suggestions = [
    "Rembrandt","John Singer Sargent","Georgia O'Keeffe","Leonardo da Vinci",
    "Claude Monet","Frida Kahlo","Caravaggio","Edgar Degas","Pablo Picasso",
    "Joaquín Sorolla","Vincent van Gogh","Johannes Vermeer","Anders Zorn","Francis Bacon"
  ];
  const filtered = name.length > 0 ? suggestions.filter(s => s.toLowerCase().startsWith(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase()) : [];
  const proceed = (artist) => { const val = (artist || name).trim(); if (val) onSelect(val); };
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);
  return (
    <div style={{ width:"100%", height:"100vh", background:"#6b6b69", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"2.5rem 2.5rem 3rem", boxSizing:"border-box" }}>
      <TeknonLogo size="md"/>
      <div style={{ maxWidth:620 }}>
        <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(2rem,6vw,4rem)", fontWeight:300, lineHeight:1.1, color:"#f0ebe3", letterSpacing:"-0.01em", marginBottom:"2.5rem" }}>
          who would you like<br/>to mentor you today?
        </h1>
        <div style={{ position:"relative" }}>
          <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&proceed()} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),150)}
            placeholder="type an artist's name…"
            style={{ width:"100%", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", fontSize:"1.2rem", fontWeight:300, color:"#f0ebe3", background:"transparent", border:"none", borderBottom:"1px solid rgba(240,235,227,0.4)", padding:"0.75rem 0", outline:"none", letterSpacing:"0.02em" }}/>
          {focused && filtered.length > 0 && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"rgba(60,58,55,0.97)", border:"1px solid rgba(240,235,227,0.15)", borderRadius:8, marginTop:4, overflow:"hidden", zIndex:10 }}>
              {filtered.slice(0,5).map((s,i) => (
                <button key={i} onClick={()=>proceed(s)} style={{ display:"block", width:"100%", textAlign:"left", padding:"0.75rem 1rem", fontFamily:"'DM Sans',sans-serif", fontSize:"1rem", fontWeight:300, color:"#d6cfc4", background:"transparent", border:"none", cursor:"pointer" }}
                  onMouseEnter={e=>e.target.style.background="rgba(240,235,227,0.08)"}
                  onMouseLeave={e=>e.target.style.background="transparent"}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop:"2rem", display:"flex", alignItems:"center", gap:"1rem" }}>
          <button onClick={()=>proceed()} disabled={!name.trim()}
            style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"1rem", fontWeight:400, letterSpacing:"0.12em", color:name.trim()?"#f0ebe3":"rgba(240,235,227,0.3)", background:"transparent", border:`1px solid ${name.trim()?"rgba(240,235,227,0.5)":"rgba(240,235,227,0.15)"}`, borderRadius:50, padding:"0.85rem 2.2rem", cursor:name.trim()?"pointer":"default", transition:"all 0.2s" }}>
            begin
          </button>
          <button onClick={()=>onSelect("")} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", fontWeight:300, color:"rgba(240,235,227,0.35)", background:"transparent", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>
            skip for now
          </button>
        </div>
        <p style={{ color:"rgba(240,235,227,0.25)", fontSize:"0.7rem", letterSpacing:"0.06em", marginTop:"1.5rem", lineHeight:1.6 }}>
          Choose any artist — living or from history. If they are no longer with us, they will speak to you directly in their own voice.
        </p>
      </div>
    </div>
  );
}

function AboutPage({ onBack }) {
  return (
    <div className="min-h-screen text-stone-200" style={{background:BG}}>
      <div className="border-b border-stone-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10" style={{background:"rgba(80,78,74,0.97)"}}>
        <TeknonLogo/>
        <button onClick={onBack} className="text-xs text-stone-500 hover:text-amber-400 border border-stone-700 px-3 py-1 rounded-full transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}>← Back</button>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-12 text-center"><TeknonLogo size="lg"/><p className="text-stone-500 text-sm mt-4" style={{fontFamily:"'DM Sans',sans-serif"}}>Private guidance. Master wisdom. No judgement.</p></div>
        {[
          { title:"The name", body:["Teknon (τέκνον) is an ancient Greek word meaning child, offspring — but also a term used to describe the relationship between a teacher and their student. In the classical tradition, a pupil was the teacher's teknon: someone whose mind was being nourished, whose character was being shaped, who was being brought into their fullest creative self.","Its root is closely related to tektōn — the craftsman, the maker, the one who carves and moulds. From this root we get the word architect. Together, these words describe something essential: the creative child being guided by a master who has walked the same difficult path."] },
          { title:"The philosophy", body:["Teknon was born from a simple observation: the internet has made it easier than ever to share your work, and harder than ever to receive genuine feedback on it. Public forums are too often unkind. Social media rewards the polished and punishes the vulnerable.","And yet the great artists of history were deeply generous with those who came after them. Across a thousand years and every tradition, artists wrote and taught and encouraged with extraordinary openness.","Teknon exists to bring that tradition into the private studio of every artist, at every level, at any hour."] },
          { title:"What Teknon is not", body:["Teknon is a companion to your creative journey, not a replacement for the irreplaceable. No algorithm can replicate the experience of standing at an easel beside a working artist.","We actively encourage every Teknon user to seek out teachers, mentors, workshops, and classes in the real world. Nothing we build will ever compete with a great teacher — and we wouldn't want it to."] },
          { title:"Your privacy", body:["Everything you upload and every session you create belongs entirely to you. Your artwork is never shared, never used for training, never seen by anyone but you and your mentor.","This is your studio. The door closes behind you."] },
        ].map((s,i) => (
          <div key={i} className={`${card} p-8 mb-6`}>
            <h2 className="text-amber-400 mb-4" style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.25rem"}}>{s.title}</h2>
            {s.body.map((p,j) => <p key={j} className="text-stone-300 text-sm leading-relaxed mb-3 last:mb-0" style={{fontFamily:"'DM Sans',sans-serif"}}>{p}</p>)}
          </div>
        ))}
        <div className="text-center mt-8">
          <button onClick={onBack} className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-xl transition-all" style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem"}}>Enter the Studio →</button>
        </div>
      </div>
    </div>
  );
}

function InspirationalQuote() {
  const [quote, setQuote] = useState(null);
  const quotes = [
    {text:"Every artist was first an amateur.",author:"Ralph Waldo Emerson"},
    {text:"I am always doing that which I cannot do, in order that I may learn how to do it.",author:"Pablo Picasso"},
    {text:"The painter has the universe in his mind and hands.",author:"Leonardo da Vinci"},
    {text:"Colour is my day-long obsession, joy and torment.",author:"Claude Monet"},
    {text:"I dream of painting and then I paint my dream.",author:"Vincent van Gogh"},
    {text:"The job of the artist is always to deepen the mystery.",author:"Francis Bacon"},
    {text:"Art is not what you see, but what you make others see.",author:"Edgar Degas"},
    {text:"I found I could say things with colour and shapes that I couldn't say any other way.",author:"Georgia O'Keeffe"},
    {text:"Great things are done by a series of small things brought together.",author:"Vincent van Gogh"},
    {text:"Creativity takes courage.",author:"Henri Matisse"},
  ];
  useEffect(() => { setQuote(quotes[Math.floor(Math.random()*quotes.length)]); }, []);
  if (!quote) return null;
  return (
    <div className={`${cardInner} px-6 py-6 mb-8 text-center`}>
      <p style={{fontFamily:"'Dancing Script',cursive",fontSize:"1.45rem",lineHeight:1.6,color:"#d6cfc4",fontWeight:600}}>"{quote.text}"</p>
      <p style={{fontFamily:"'Dancing Script',cursive",fontSize:"1.45rem",lineHeight:1.6,color:"#d6cfc4",marginTop:"0.5rem"}}>— {quote.author}</p>
    </div>
  );
}

function ProfileSetup({ onSave, existing, onAbout }) {
  const [artists, setArtists] = useState(existing?.artists||[]);
  const [movements, setMovements] = useState(existing?.movements||[]);
  const [mediums, setMediums] = useState(existing?.mediums||[]);
  const [level, setLevel] = useState(existing?.level||"");
  const [goals, setGoals] = useState(existing?.goals||[]);
  const [customArtist, setCustomArtist] = useState("");
  const toggle = (arr,setArr,val) => setArr(arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]);
  const addCustom = () => { const v=customArtist.trim(); if(v&&!artists.includes(v)) setArtists([...artists,v]); setCustomArtist(""); };
  const suggested = movements.length>0 ? [...new Set(movements.flatMap(m=>MOVEMENT_ARTISTS[m]||[]))] : ALL_ARTISTS;
  const visible = [...new Set([...suggested,...artists.filter(a=>!suggested.includes(a))])];
  const handleMovement = m => {
    const nxt = movements.includes(m)?movements.filter(x=>x!==m):[...movements,m];
    setMovements(nxt);
    const ns = [...new Set(nxt.flatMap(mv=>MOVEMENT_ARTISTS[mv]||[]))];
    if(nxt.length>0) setArtists(prev=>prev.filter(a=>ns.includes(a)||!ALL_ARTISTS.includes(a)));
  };
  const valid = (artists.length||movements.length)&&mediums.length&&level&&goals.length;
  return (
    <div className="min-h-screen text-stone-200" style={{background:BG}}>
      <div className="border-b border-stone-700 px-6 py-4 flex items-center justify-between" style={{background:"rgba(80,78,74,0.97)"}}>
        <TeknonLogo/>
        <button onClick={onAbout} className="text-xs text-stone-500 hover:text-amber-400 transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}>About</button>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <p className="text-amber-600 text-xs uppercase tracking-widest mb-3" style={{fontFamily:"'DM Sans',sans-serif"}}>Welcome to</p>
          <TeknonLogo size="lg"/>
          <p className="text-stone-400 text-sm leading-relaxed max-w-lg mx-auto mt-4" style={{fontFamily:"'DM Sans',sans-serif"}}>A private studio where your work is met with the kind of thoughtful, generous feedback the great masters gave to those who came after them.</p>
        </div>
        <InspirationalQuote/>
        <div className={`${card} p-8`}>
          <p className="text-stone-500 text-sm mb-7" style={{fontFamily:"'DM Sans',sans-serif"}}>Tell us about your artistic journey so we can tailor your mentor's guidance personally to you.</p>
          <Section title="Movements & styles that interest you">{MOVEMENTS.map(m=><Tag key={m} label={m} selected={movements.includes(m)} onClick={()=>handleMovement(m)}/>)}</Section>
          <Divider/>
          <Section title={movements.length>0?"Artists who inspire you — based on your selections":"Artists who inspire you"} subtitle={movements.length===0?"Select a movement above to see relevant artists, or browse all below.":""}>
            {visible.map(a=><Tag key={a} label={a} selected={artists.includes(a)} onClick={()=>toggle(artists,setArtists,a)}/>)}
            <div className="flex gap-2 mt-3 w-full">
              <input value={customArtist} onChange={e=>setCustomArtist(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustom()} placeholder="Add another artist…" className="flex-1 bg-stone-800 border border-stone-700 rounded-full px-4 py-1.5 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-amber-700" style={{fontFamily:"'DM Sans',sans-serif"}}/>
              <button onClick={addCustom} className="px-4 py-1.5 bg-stone-800 border border-stone-700 rounded-full text-sm text-stone-400 hover:border-amber-700 transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}>Add</button>
            </div>
          </Section>
          <Divider/>
          <Section title="Your medium">{MEDIUMS.map(m=><Tag key={m} label={m} selected={mediums.includes(m)} onClick={()=>toggle(mediums,setMediums,m)}/>)}</Section>
          <Divider/>
          <Section title="Skill level">
            <div className="flex gap-2 flex-wrap">{LEVELS.map(l=><Tag key={l} label={l} selected={level===l} onClick={()=>setLevel(l)}/>)}</div>
            <p className="text-xs mt-2 w-full" style={{color:"#a0988e",fontFamily:"'DM Sans',sans-serif"}}>There is no wrong answer — every level is welcome here.</p>
          </Section>
          <Divider/>
          <Section title="What do you love to paint / draw?">{GOALS.map(g=><Tag key={g} label={g} selected={goals.includes(g)} onClick={()=>toggle(goals,setGoals,g)}/>)}</Section>
          {!valid&&(
            <div className="mb-5 space-y-2 pt-2">
              <p className="text-amber-600 text-xs uppercase tracking-widest mb-2">Still needed:</p>
              {!artists.length&&!movements.length&&<p className="text-xs text-stone-500 flex items-center gap-2"><span className="text-red-500">✕</span>Select at least one movement or artist</p>}
              {!mediums.length&&<p className="text-xs text-stone-500 flex items-center gap-2"><span className="text-red-500">✕</span>Select at least one medium</p>}
              {!level&&<p className="text-xs text-stone-500 flex items-center gap-2"><span className="text-red-500">✕</span>Select your skill level</p>}
              {!goals.length&&<p className="text-xs text-stone-500 flex items-center gap-2"><span className="text-red-500">✕</span>Select at least one subject</p>}
            </div>
          )}
          <button onClick={()=>valid&&onSave({artists,movements,mediums,level,goals})} className={`w-full mt-2 py-3.5 rounded-xl text-lg transition-all ${valid?"bg-amber-700 hover:bg-amber-600 text-amber-50 cursor-pointer":"bg-stone-800 text-stone-600 cursor-not-allowed"}`} style={{fontFamily:"'DM Serif Display',serif"}}>Enter the Studio →</button>
        </div>
        <p className="text-center text-xs mt-6 leading-relaxed" style={{color:"#a0988e",fontFamily:"'DM Sans',sans-serif"}}>Your sessions are private and belong only to you.<br/>No public sharing. No judgement. Just honest, expert guidance.</p>
      </div>
    </div>
  );
}

function FeedbackBlock({ text }) {
  return text.split("\n").map((line,i) => {
    if (/^\d+\.\s\*\*/.test(line)) { const p=line.replace(/^\d+\.\s\*\*/,"").split("**"); return <div key={i} className="mt-6"><h3 className="text-amber-500 font-medium mb-2 text-xs uppercase tracking-widest" style={{fontFamily:"'DM Sans',sans-serif"}}>{p[0]}</h3>{p[1]&&<p className="text-stone-300 text-sm leading-relaxed" style={{fontFamily:"'DM Sans',sans-serif"}}>{p[1].replace(/^[\s—–-]+/,"")}</p>}</div>; }
    if (line.startsWith("**")&&line.endsWith("**")) return <h3 key={i} className="text-amber-500 font-medium mt-6 mb-2 text-xs uppercase tracking-widest" style={{fontFamily:"'DM Sans',sans-serif"}}>{line.replace(/\*\*/g,"")}</h3>;
    if (line.startsWith("- ")||line.startsWith("• ")) return <li key={i} className="text-stone-300 text-sm leading-relaxed ml-4 list-disc mt-1" style={{fontFamily:"'DM Sans',sans-serif"}}>{line.replace(/^[-•]\s/,"").replace(/\*\*/g,"")}</li>;
    if (line.trim()==="") return <div key={i} className="h-2"/>;
    return <p key={i} className="text-stone-300 text-sm leading-relaxed" style={{fontFamily:"'DM Sans',sans-serif"}}>{line.replace(/\*\*/g,"")}</p>;
  });
}

function ListenButton({ text, artistName }) {
  const [speaking, setSpeaking] = useState(false);
  const synth = window.speechSynthesis;
  const getVoice = () => {
    const voices = synth.getVoices();
    return voices.find(v=>v.lang==="en-GB"&&v.localService)||voices.find(v=>v.lang==="en-GB")||voices.find(v=>v.lang.startsWith("en"))||voices[0];
  };
  const speak = () => {
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const clean = text.replace(/\*\*/g,"").replace(/#+/g,"").replace(/✦/g,"");
    const utt = new SpeechSynthesisUtterance(clean);
    utt.voice = getVoice(); utt.rate = 0.92; utt.pitch = 1.0; utt.volume = 1;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    synth.speak(utt); setSpeaking(true);
  };
  if (!window.speechSynthesis) return null;
  return (
    <button onClick={speak} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs border transition-all ${speaking?"bg-amber-800 border-amber-700 text-amber-100":"border-stone-700 text-stone-400 hover:border-amber-700 hover:text-amber-300"}`} style={{fontFamily:"'DM Sans',sans-serif"}}>
      <span>{speaking?"◼ Stop":"▶ Listen"}</span>
      {artistName&&<span className="text-stone-600">— in the spirit of {artistName}</span>}
    </button>
  );
}

function ResourceCard({ r }) {
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer" className={`flex items-start gap-3 p-4 ${cardInner} hover:border-amber-700 transition-all group`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-stone-600 text-xs uppercase tracking-wider">{r.type}</span><span className="text-stone-700 text-xs">·</span><span className="text-stone-600 text-xs">{r.source}</span></div>
        <p className="text-amber-400 text-sm font-medium group-hover:text-amber-300 leading-snug">{r.title}</p>
        {r.description&&<p className="text-stone-500 text-xs mt-1 leading-relaxed">{r.description}</p>}
      </div>
      <span className="text-stone-600 group-hover:text-amber-500 text-sm mt-1 flex-shrink-0">↗</span>
    </a>
  );
}

function AnnotatedImage({ imageSrc, annotations }) {
  const [active, setActive] = useState(null);
  return (
    <div className="relative rounded-xl overflow-hidden border border-stone-700" style={{background:"#0d0d0d"}}>
      <img src={imageSrc} alt="artwork" className="w-full object-contain max-h-96"/>
      {annotations.map((a,i)=>(
        <button key={i} onClick={()=>setActive(active===i?null:i)} style={{position:"absolute",left:`${a.x}%`,top:`${a.y}%`,transform:"translate(-50%,-50%)"}}
          className={`w-8 h-8 rounded-full text-xs font-bold border-2 transition-all z-10 flex items-center justify-center ${active===i?"bg-amber-500 border-amber-300 text-stone-900 scale-125":"bg-stone-950 bg-opacity-80 border-amber-600 text-amber-400 hover:scale-110"}`}>
          {i+1}
        </button>
      ))}
      {active!==null&&(
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-900" style={{background:"rgba(12,10,8,0.95)"}}>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-bold flex items-center justify-center flex-shrink-0">{active+1}</span>
            <p className="text-stone-300 text-sm leading-relaxed" style={{fontFamily:"'DM Sans',sans-serif"}}>{annotations[active].note}</p>
          </div>
        </div>
      )}
    </div>
  );
}

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
      const at = await callAPI([{role:"user",content:[{type:"image",source:{type:"base64",media_type:imageMime,data:imageB64}},{type:"text",text:`Feedback:\n\n${feedback}\n\nIdentify 3-4 specific areas. Return ONLY valid JSON:\n[{"x":45,"y":30,"note":"max 15 words"}]`}]}],false);
      const ac=at.replace(/```json|```/g,"").trim(); const as=ac.indexOf("["),ae=ac.lastIndexOf("]");
      const pa=as!==-1?JSON.parse(ac.slice(as,ae+1)):[];
      setAnnotations(pa);
      const rt = await callAPI([{role:"user",content:`Feedback:\n\n${feedback}\n\nFind ${pa.length} master examples for:\n${pa.map((a,i)=>`${i+1}. ${a.note}`).join("\n")}\n\nReturn ONLY valid JSON:\n[{"issue":"...","artist":"...","work":"...","what_to_notice":"one sentence","search_query":"artist + work"}]`}]);
      const rc=rt.replace(/```json|```/g,"").trim(); const rs=rc.indexOf("["),re=rc.lastIndexOf("]");
      if(rs!==-1) setRefs(JSON.parse(rc.slice(rs,re+1)));
    } catch(e) { setError(`Error: ${e.message}`); }
    setLoading(false);
  };
  return (
    <div className={`${cardInner} overflow-hidden`}>
      <button onClick={build} className="w-full flex items-center justify-between px-5 py-4 group">
        <div className="flex items-center gap-3"><span className="text-amber-700 text-xs">✦</span><div><p className="text-stone-300 text-sm text-left" style={{fontFamily:"'DM Sans',sans-serif"}}>Visual Annotations & Master References</p><p className="text-xs mt-0.5 text-left" style={{color:"#a0988e",fontFamily:"'DM Sans',sans-serif"}}>See exactly where to focus, with examples from the masters</p></div></div>
        <span className={`text-stone-600 group-hover:text-amber-500 text-xs transition-transform ${open?"rotate-180":""}`}>▼</span>
      </button>
      {open&&(
        <div className="border-t border-stone-800 p-5">
          {loading&&<div className="text-center py-10"><p className="text-amber-500 text-sm mb-1" style={{fontFamily:"'DM Sans',sans-serif"}}>Preparing visual analysis…</p><p className="text-xs" style={{color:"#a0988e",fontFamily:"'DM Sans',sans-serif"}}>Locating key areas and finding master references</p></div>}
          {error&&<p className="text-red-400 text-xs">{error}</p>}
          {annotations&&(
            <div className="flex flex-col gap-7">
              <div><p className="text-xs uppercase tracking-widest mb-3" style={{color:"#a0988e"}}>Tap a marker to see the note</p><AnnotatedImage imageSrc={imageSrc} annotations={annotations}/></div>
              {refs?.length>0&&<div>
                <p className="text-xs uppercase tracking-widest mb-4" style={{color:"#a0988e"}}>Study these master works</p>
                <div className="flex flex-col gap-3">{refs.map((r,i)=>(
                  <div key={i} className={`${cardInner} p-4`}>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-800 text-amber-200 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                      <div><p className="text-stone-500 text-xs mb-1 italic">{r.issue}</p><p className="text-amber-400 text-sm font-medium">{r.artist}</p><p className="text-stone-500 text-xs mb-2">{r.work}</p><p className="text-stone-300 text-sm leading-relaxed mb-3" style={{fontFamily:"'DM Sans',sans-serif"}}>{r.what_to_notice}</p>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(r.search_query)}&tbm=isch`} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:text-amber-400 border border-amber-900 px-3 py-1 rounded-full transition-all">Find this work ↗</a>
                      </div>
                    </div>
                  </div>
                ))}</div>
              </div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LostButton({ onSelect }) {
  const [open, setOpen] = useState(false);
  const opts = ["It just doesn't look right, but I can't say why","I don't know what to work on next","Something feels off but I can't put my finger on it","I've lost confidence in this piece","I keep making the same mistake and don't know how to fix it","It looks flat or lifeless and I don't know why"];
  return (
    <div>
      <button onClick={()=>setOpen(o=>!o)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all border ${open?"bg-amber-900 border-amber-700 text-amber-200":"border-stone-700 text-stone-400 hover:border-amber-700"}`} style={{fontFamily:"'DM Sans',sans-serif"}}>
        I'm not sure what's wrong <span className={`text-xs transition-transform ${open?"rotate-180":""}`}>▼</span>
      </button>
      {open&&<div className={`mt-2 flex flex-col gap-1 ${cardInner} p-3`}>
        <p className="text-xs mb-2" style={{color:"#a0988e",fontFamily:"'DM Sans',sans-serif"}}>Choose what resonates:</p>
        {opts.map((o,i)=><button key={i} onClick={()=>{onSelect(o);setOpen(false);}} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-300 transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}><span className="text-amber-800 text-xs">✦</span>{o}</button>)}
      </div>}
    </div>
  );
}

function VoiceButton({ onTranscript }) {
  const [state, setState] = useState("idle");
  const recRef = useRef(null);
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if (!SR) return null;
  const start = () => { const r=new SR(); r.continuous=true; r.interimResults=false; r.lang="en-GB"; r.onresult=e=>{const t=Array.from(e.results).map(r=>r[0].transcript).join(" ").trim();if(t)onTranscript(t);}; r.onerror=()=>setState("error"); r.onend=()=>setState(s=>s==="recording"?"idle":s); recRef.current=r; r.start(); setState("recording"); };
  const stop = () => { recRef.current?.stop(); recRef.current=null; setState("idle"); };
  const isRec = state==="recording";
  return (
    <button onMouseDown={start} onMouseUp={stop} onTouchStart={e=>{e.preventDefault();start();}} onTouchEnd={e=>{e.preventDefault();stop();}}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all select-none border ${isRec?"bg-red-900 border-red-700 text-red-200 animate-pulse":"border-stone-700 text-stone-400 hover:border-amber-700"}`} style={{fontFamily:"'DM Sans',sans-serif"}}>
      <span className="w-2 h-2 rounded-full" style={{background:isRec?"#f87171":"#57534e"}}/>
      {isRec?"Recording — release to stop":"Hold to speak"}
    </button>
  );
}

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
      const pos = await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
      const geo = await (await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)).json();
      const city = geo.address?.city||geo.address?.town||geo.address?.village||"your area";
      const location = `${city}, ${geo.address?.country||""}`;
      setLoc(location);
      const styleCtx = [...(profile.artists||[]),...(profile.movements||[])].join(", ");
      const typeLabel = type==="schools"?"art schools":type==="workshops"?"workshops and short courses":"art schools, workshops and short courses";
      await new Promise(r => setTimeout(r, 10000));
      const text = await callAPI([{role:"user",content:`Find 5-6 real, active ${typeLabel} near ${location} for an artist interested in ${styleCtx||"painting"} at ${profile.level||"developing"} level.\n\nReturn ONLY valid JSON:\n[{"name":"...","type":"school|workshop","location":"...","description":"...","url":"...","distance":"local|regional|international"}]`}]);
      const c=text.replace(/```json|```/g,"").trim(); const s=c.indexOf("["),e=c.lastIndexOf("]");
      if(s!==-1) setResults(JSON.parse(c.slice(s,e+1))); else setError("Couldn't parse results.");
    } catch(e) { setError(e.code===1?"Location access denied.":`Error: ${e.message}`); }
    setLoading(false);
  };
  const distCol = d=>d==="local"?"text-amber-400":d==="regional"?"text-stone-400":"text-stone-500";
  return (
    <div className={`${cardInner} overflow-hidden`}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-5 py-4 group">
        <div className="flex items-center gap-3"><span className="text-amber-700 text-xs">✦</span><div><p className="text-stone-300 text-sm text-left" style={{fontFamily:"'DM Sans',sans-serif"}}>Need more help? Find Classes & Workshops</p><p className="text-xs mt-0.5 text-left" style={{color:"#a0988e",fontFamily:"'DM Sans',sans-serif"}}>Deepen your practice with a living artist</p></div></div>
        <span className={`text-stone-600 group-hover:text-amber-500 text-xs transition-transform ${open?"rotate-180":""}`}>▼</span>
      </button>
      {open&&<div className="border-t border-stone-800 p-5">
        {!results&&!loading&&<>
          <p className="text-stone-400 text-sm mb-4" style={{fontFamily:"'DM Sans',sans-serif"}}>We'll use your location to find schools and workshops suited to your style and level.</p>
          <div className="flex gap-2 mb-4">{[["both","Schools & Workshops"],["schools","Art Schools"],["workshops","Workshops"]].map(([v,l])=>(<button key={v} onClick={()=>setType(v)} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${type===v?"bg-amber-800 border-amber-700 text-amber-100":"border-stone-700 text-stone-400 hover:border-amber-700"}`} style={{fontFamily:"'DM Sans',sans-serif"}}>{l}</button>))}</div>
          <button onClick={search} className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-xl text-sm transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}>Find Near Me</button>
          {error&&<p className="text-red-400 text-xs mt-3">{error}</p>}
        </>}
        {loading&&<div className="text-center py-8"><p className="text-amber-500 text-sm mb-1" style={{fontFamily:"'DM Sans',sans-serif"}}>Searching near you…</p><p className="text-xs" style={{color:"#a0988e",fontFamily:"'DM Sans',sans-serif"}}>Finding the best options for your style and level</p></div>}
        {results&&<>
          <div className="flex items-center justify-between mb-4"><p className="text-stone-500 text-xs" style={{fontFamily:"'DM Sans',sans-serif"}}>Near <span className="text-amber-600">{loc}</span></p><button onClick={()=>{setResults(null);setError(null);}} className="text-stone-600 hover:text-amber-500 text-xs" style={{fontFamily:"'DM Sans',sans-serif"}}>Search again</button></div>
          <div className="flex flex-col gap-3">{results.map((r,i)=>(
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className={`flex flex-col gap-1.5 p-4 ${cardInner} hover:border-amber-700 transition-all group`}>
              <div className="flex items-start justify-between gap-2"><p className="text-amber-400 text-sm font-medium group-hover:text-amber-300">{r.name}</p><span className="text-stone-600 group-hover:text-amber-500 text-sm">↗</span></div>
              <div className="flex items-center gap-2"><span className="text-stone-600 text-xs uppercase">{r.type}</span><span className="text-stone-700">·</span><span className={`text-xs ${distCol(r.distance)}`}>{r.location}</span></div>
              {r.description&&<p className="text-stone-500 text-xs leading-relaxed">{r.description}</p>}
            </a>
          ))}</div>
        </>}
      </div>}
    </div>
  );
}

function EaselPage({ profile, onEditProfile, onAbout, onAnalyse, sessions, onLoadSession, onDeleteSession, defaultMentor }) {
  const [image, setImage] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [description, setDescription] = useState("");
  const [struggle, setStruggle] = useState("");
  const [targetArtist, setTargetArtist] = useState(defaultMentor||"");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState(null);
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
            const maxSize=1200; let w=img.width,h=img.height;
            if(w>maxSize||h>maxSize){if(w>h){h=Math.round(h*maxSize/w);w=maxSize;}else{w=Math.round(w*maxSize/h);h=maxSize;}}
            const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h;
            canvas.getContext("2d").drawImage(img,0,0,w,h);
            const compressed=canvas.toDataURL("image/jpeg",0.82);
            setImage(compressed); setImageB64(compressed.split(",")[1]); setImageMime("image/jpeg"); setError(null);
          } catch { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime(file.type||"image/jpeg"); setError(null); }
        };
        img.onerror = () => { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime(file.type||"image/jpeg"); setError(null); };
        img.src = e.target.result;
      } catch { setImage(e.target.result); setImageB64(e.target.result.split(",")[1]); setImageMime(file.type||"image/jpeg"); setError(null); }
    };
    reader.onerror = () => setError("Could not read the image file. Please try another.");
    reader.readAsDataURL(file);
  };

  const analyse = async () => {
    if (!imageB64||!description) return;
    setLoading(true); setError(null); setLoadingStep("Reading your painting…");
    const profileCtx = `User profile — Level: ${profile.level}. Medium: ${profile.mediums.join(", ")}. Inspirations: ${[...profile.artists,...profile.movements].join(", ")}. Subject interests: ${profile.goals.join(", ")}.`;
    const isDeceased = targetArtist && DECEASED_ARTISTS.has(targetArtist);
    const voiceInstruction = isDeceased
      ? `You are to write this feedback IN THE VOICE AND SPIRIT OF ${targetArtist}. Write in first person as if you ARE ${targetArtist} speaking directly to this artist. Use what is known about ${targetArtist}'s philosophy, personality, documented teachings, letters and writings to shape your language and perspective. Make it feel like a genuine encounter with that artist's mind.`
      : targetArtist
      ? `You are a masterful mentor deeply versed in the work and teachings of ${targetArtist}. Reference their documented techniques and known philosophy, but speak as a knowledgeable mentor rather than in their voice directly.`
      : `You are a masterful, deeply encouraging art mentor with encyclopaedic knowledge of art history.`;

    const prompt = `${voiceInstruction} ${profileCtx}

This is a safe, private studio. Treat the work with generous respect.

Work in progress: "${description}". ${struggle?`The artist is struggling with: "${struggle}".`:""}

Provide encouraging, specific feedback:
1. **What's Working** — genuine strengths
2. **The Most Important Thing to Focus On** — highest priority
3. **Master Artist Wisdom** — Choose a quote or documented technique that speaks directly and specifically to something you can see in THIS painting. You must draw from a genuinely wide range of artists — do NOT default to Monet, Van Gogh or other overused names. Consider artists from different centuries, countries and traditions: Velázquez, Chardin, Constable, Whistler, Eakins, Zorn, Fechin, Hawthorne, Hensche, Carlson, and many others. The quote must be directly relevant to a specific issue visible in this work. Never use a generic motivational quote.
4. **Your Next Steps** — 2-3 concrete actions
5. **Encouragement** — warm, personalised closing`;

    const timeout = setTimeout(() => { setError("The analysis is taking too long — please check your connection and try again."); setLoading(false); setLoadingStep(""); }, 45000);

    try {
      setLoadingStep("Consulting the masters…");
      const res = await fetch("/api/chat", { method:"POST", headers:HEADERS, body:JSON.stringify({ model:MODEL, max_tokens:1200, messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:imageMime,data:imageB64}},{type:"text",text:prompt}]}] }) });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.error) throw new Error(`${data.error.type}: ${data.error.message}`);
      const text = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n");
      if (!text) throw new Error("No feedback received — please try again.");
      setLoadingStep("Opening your feedback…");
      const s = { id:`session:${Date.now()}`, date:Date.now(), imageSrc:image, imageB64, imageMime, description, struggle, targetArtist, feedback:text, resources:null, chatHistory:[] };
      await onAnalyse(s);
    } catch(e) { clearTimeout(timeout); setError(`${e.message}`); setLoading(false); setLoadingStep(""); }
  };

  return (
    <div className="min-h-screen text-stone-200" style={{background:BG}}>
      <Header onEditProfile={onEditProfile} onAbout={onAbout} sessions={sessions} onLoadSession={onLoadSession} onDeleteSession={onDeleteSession}/>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-2xl text-stone-200 mb-1" style={{fontFamily:"'DM Serif Display',serif"}}>The Easel</h2>
        <p className="text-sm mb-8" style={{color:"#e0d8cc",fontFamily:"'DM Sans',sans-serif"}}>Upload your work and describe what you're painting — your mentor will do the rest.</p>
        <div onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()} onClick={()=>fileRef.current.click()}
          className={`${cardInner} flex items-center justify-center cursor-pointer hover:border-amber-700 transition-all mb-3 overflow-hidden`} style={{minHeight:280,borderStyle:"dashed"}}>
          {image?<img src={image} alt="upload" className="w-full h-full object-contain max-h-80"/>
            :<div className="text-center py-16 px-4"><p className="text-stone-400 text-sm mb-1" style={{fontFamily:"'DM Sans',sans-serif"}}>Drop your artwork here or click to browse</p><p className="text-xs" style={{color:"#e0d8cc",fontFamily:"'DM Sans',sans-serif"}}>JPG, PNG, WEBP supported</p></div>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>handleFile(e.target.files[0])}/>
        </div>
        <div className="flex gap-2 mb-7">
          <button onClick={()=>cameraRef.current.click()} className={`flex-1 py-2.5 ${cardInner} hover:border-amber-700 text-stone-400 hover:text-amber-300 text-sm transition-all`} style={{fontFamily:"'DM Sans',sans-serif"}}>Take a Photo</button>
          <button onClick={()=>fileRef.current.click()} className={`flex-1 py-2.5 ${cardInner} hover:border-amber-700 text-stone-400 hover:text-amber-300 text-sm transition-all`} style={{fontFamily:"'DM Sans',sans-serif"}}>Upload from Gallery</button>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>handleFile(e.target.files[0])}/>
        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest block mb-2" style={{color:"#e0d8cc",fontFamily:"'DM Sans',sans-serif"}}>Artist / Style I'm aiming for</label>
          <input value={targetArtist} onChange={e=>setTargetArtist(e.target.value)} placeholder="e.g. Rembrandt, Sargent, Georgia O'Keeffe — they will speak to you directly" className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-amber-700 transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}/>
        </div>
        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest block mb-2" style={{color:"#e0d8cc",fontFamily:"'DM Sans',sans-serif"}}>What are you painting / drawing?</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="e.g. A portrait study in oil paint…" className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-amber-700 resize-none transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}/>
        </div>
        <div className="mb-8">
          <label className="text-xs uppercase tracking-widest block mb-2" style={{color:"#e0d8cc",fontFamily:"'DM Sans',sans-serif"}}>What are you struggling with? <span style={{color:"#b0a898",textTransform:"none",letterSpacing:"normal",fontSize:"0.75rem"}}>(optional)</span></label>
          <textarea value={struggle} onChange={e=>setStruggle(e.target.value)} rows={2} placeholder="e.g. The skin tones feel flat, the eyes aren't working…" className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-amber-700 resize-none mb-3 transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}/>
          <div className="flex items-start justify-between gap-2">
            <LostButton onSelect={t=>setStruggle(t)}/>
            <VoiceButton onTranscript={t=>setStruggle(t)}/>
          </div>
        </div>
        <button onClick={analyse} disabled={!image||!description||loading}
          className={`w-full py-4 rounded-xl text-xl transition-all mb-4 ${image&&description&&!loading?"bg-amber-700 hover:bg-amber-600 text-amber-50 cursor-pointer":"bg-stone-800 text-stone-600 cursor-not-allowed"}`} style={{fontFamily:"'DM Serif Display',serif"}}>
          {loading?loadingStep:"Analyse My Work →"}
        </button>
        {loading&&(
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:"0ms"}}/>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:"150ms"}}/>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" style={{animationDelay:"300ms"}}/>
          </div>
        )}
        <p className="text-xs leading-relaxed text-center pb-2" style={{color:"#e0d8cc",fontFamily:"'DM Sans',sans-serif"}}>✦ Teknon is a companion to your creative journey, not a replacement for the irreplaceable. Nothing substitutes a one-to-one lesson with a practising artist.</p>
        {error&&<p className="text-red-400 text-sm mt-3 text-center" style={{fontFamily:"'DM Sans',sans-serif"}}>{error}</p>}
      </div>
    </div>
  );
}

function ResponsePage({ session, profile, onBack, onEditProfile, onAbout, onSaveSession, sessions, onLoadSession, onDeleteSession }) {
  const { imageSrc, imageB64, imageMime, description, struggle, targetArtist, feedback } = session;
  const [resources, setResources] = useState(session.resources||null);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState(session.chatHistory||[]);
  const [followUp, setFollowUp] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatBottomRef = useRef();
  const topRef = useRef();
  useEffect(()=>{topRef.current?.scrollIntoView();},[]);
  useEffect(()=>{chatBottomRef.current?.scrollIntoView({behavior:"smooth"});},[chatHistory,chatLoading]);
  useEffect(()=>{
    if(!resources&&targetArtist){
      (async()=>{
        setResourcesLoading(true);
        try {
          const text=await callAPI([{role:"user",content:`Find 4-6 real online resources about "${targetArtist}".\n\nReturn ONLY valid JSON:\n[{"title":"...","url":"...","source":"...","type":"article|video|interview|tutorial|website","description":"one sentence"}]\n\nOnly real URLs.`}]);
          const c=text.replace(/```json|```/g,"").trim(); const s=c.indexOf("["),e=c.lastIndexOf("]");
          if(s!==-1){const r=JSON.parse(c.slice(s,e+1));setResources(r);onSaveSession({...session,resources:r});}
        } catch {}
        setResourcesLoading(false);
      })();
    }
  },[]);
  const profileCtx = `Level: ${profile.level}. Medium: ${profile.mediums.join(", ")}. Inspirations: ${[...profile.artists,...profile.movements].join(", ")}.`;
  const sendFollowUp = async () => {
    if(!followUp.trim()||chatLoading) return;
    const q=followUp.trim(); setFollowUp(""); setChatError(null);
    const nh=[...chatHistory,{role:"user",text:q}]; setChatHistory(nh); setChatLoading(true);
    try {
      const ctx=`You are a masterful, encouraging art mentor. ${profileCtx} Working on: "${description}". Target: ${targetArtist||"not specified"}. Initial analysis:\n\n${feedback}\n\nAnswer with generosity and master artist wisdom.`;
      const msgs=[{role:"user",content:[{type:"image",source:{type:"base64",media_type:imageMime,data:imageB64}},{type:"text",text:ctx}]},{role:"assistant",content:"Understood. Please ask me anything."},...nh.map(m=>({role:m.role==="user"?"user":"assistant",content:m.text}))];
      const reply=await callAPI(msgs);
      const uh=[...nh,{role:"assistant",text:reply}]; setChatHistory(uh);
      onSaveSession({...session,chatHistory:uh});
    } catch(e){setChatError(`Error: ${e.message}`);}
    setChatLoading(false);
  };
  return (
    <div className="min-h-screen text-stone-200" style={{background:BG}}>
      <Header onEditProfile={onEditProfile} onAbout={onAbout} sessionSaved={true} sessions={sessions} onLoadSession={onLoadSession} onDeleteSession={onDeleteSession}/>
      <div ref={topRef} className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-stone-500 hover:text-amber-400 text-sm mb-8 transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}>← Analyse another work</button>
        <div className={`${card} p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <img src={imageSrc} alt="artwork" className="w-full rounded-xl border border-stone-700 object-contain max-h-72 bg-stone-950"/>
            <div className="flex flex-col justify-center gap-2">
              <p className="text-xs uppercase tracking-widest text-stone-600" style={{fontFamily:"'DM Sans',sans-serif"}}>Your work</p>
              <p className="text-stone-300 text-sm leading-relaxed" style={{fontFamily:"'DM Sans',sans-serif"}}>{description}</p>
              {targetArtist&&<p className="text-amber-600 text-xs mt-1" style={{fontFamily:"'DM Sans',sans-serif"}}>Aiming for: {targetArtist}</p>}
              {struggle&&<p className="text-stone-500 text-xs italic mt-1" style={{fontFamily:"'DM Sans',sans-serif"}}>"{struggle}"</p>}
            </div>
          </div>
        </div>
        <div className={`${card} p-7 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Studio Analysis</SectionLabel>
            <ListenButton text={feedback} artistName={targetArtist&&DECEASED_ARTISTS.has(targetArtist)?targetArtist:null}/>
          </div>
          <FeedbackBlock text={feedback}/>
        </div>
        <div className="mb-6"><VisualAnalysis imageSrc={imageSrc} imageB64={imageB64} imageMime={imageMime} feedback={feedback} targetArtist={targetArtist}/></div>
        {(resourcesLoading||resources)&&(
          <div className="mb-6">
            <SectionLabel>Related Resources{targetArtist?` — ${targetArtist}`:""}</SectionLabel>
            {resourcesLoading&&<div className={`${cardInner} p-4 text-center text-stone-600 text-sm`}><span className="animate-pulse">Finding articles, interviews & videos…</span></div>}
            {resources&&<div className="flex flex-col gap-2">{resources.map((r,i)=><ResourceCard key={i} r={r}/>)}</div>}
          </div>
        )}
        <div className="mb-6"><ClassesPanel profile={profile}/></div>
        <div className={`${card} overflow-hidden mb-8`}>
          <div className="px-6 py-4 border-b border-stone-800 flex items-center gap-2">
            <span className="text-amber-700 text-xs">✦</span>
            <h3 className="text-xs uppercase tracking-widest text-stone-500" style={{fontFamily:"'DM Sans',sans-serif"}}>Ask a Follow-up Question</h3>
          </div>
          {chatHistory.length>0&&(
            <div className="p-5 flex flex-col gap-4 max-h-96 overflow-y-auto">
              {chatHistory.map((msg,i)=>(
                <div key={i} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                  <div className={`max-w-xl rounded-2xl px-5 py-3 text-sm leading-relaxed ${msg.role==="user"?"bg-amber-800 text-amber-50 rounded-br-none":"bg-stone-800 text-stone-300 rounded-bl-none"}`} style={{fontFamily:"'DM Sans',sans-serif"}}>
                    {msg.role==="assistant"?<FeedbackBlock text={msg.text}/>:msg.text}
                  </div>
                </div>
              ))}
              {chatLoading&&<div className="flex justify-start"><div className="bg-stone-800 text-stone-500 text-sm px-5 py-3 rounded-2xl rounded-bl-none italic" style={{fontFamily:"'DM Sans',sans-serif"}}>Thinking…</div></div>}
              <div ref={chatBottomRef}/>
            </div>
          )}
          <div className="p-4 flex gap-3 border-t border-stone-800">
            <input value={followUp} onChange={e=>setFollowUp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendFollowUp()} placeholder="e.g. How did Sargent handle lost edges in portraits?" className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-amber-700 transition-all" style={{fontFamily:"'DM Sans',sans-serif"}}/>
            <button onClick={sendFollowUp} disabled={!followUp.trim()||chatLoading} className={`px-5 py-2.5 rounded-xl text-sm transition-all ${followUp.trim()&&!chatLoading?"bg-amber-700 hover:bg-amber-600 text-amber-50":"bg-stone-800 text-stone-600 cursor-not-allowed"}`} style={{fontFamily:"'DM Sans',sans-serif"}}>Ask</button>
          </div>
          {chatError&&<p className="text-red-400 text-xs px-5 pb-4">{chatError}</p>}
        </div>
        <button onClick={onBack} className={`w-full py-3.5 rounded-xl ${cardInner} hover:border-amber-700 text-stone-400 hover:text-amber-300 text-sm transition-all`} style={{fontFamily:"'DM Sans',sans-serif"}}>← Analyse another work</button>
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("landing");
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);

  useEffect(()=>{
    (async()=>{
      try{const r=await storage.get("art-mentor-profile");if(r)setProfile(JSON.parse(r.value));}catch{}
      try{
        const r=await storage.list("session:");
        if(r?.keys?.length){
          const loaded=await Promise.all(r.keys.map(async k=>{try{const d=await storage.get(k);return d?JSON.parse(d.value):null;}catch{return null;}}));
          setSessions(loaded.filter(Boolean).sort((a,b)=>b.date-a.date));
        }
      }catch{}
      setLoaded(true);
    })();
  },[]);

  const saveProfile = async p => { await storage.set("art-mentor-profile",JSON.stringify(p)); setProfile(p); setEditing(false); };
  const saveSession = async s => { try{ await storage.set(s.id,JSON.stringify(s)); setSessions(prev=>[s,...prev.filter(x=>x.id!==s.id)].sort((a,b)=>b.date-a.date)); }catch{} };
  const deleteSession = async id => { try{ await storage.delete(id); setSessions(prev=>prev.filter(s=>s.id!==id)); }catch{} };

  const handleMentorSelect = (artist) => { setSelectedMentor(artist); setPage(profile?"easel":"profile"); };
  const handleAnalyse = async s => {
    const session = s.targetArtist ? s : { ...s, targetArtist: selectedMentor||"" };
    await saveSession(session); setCurrentSession(session); setPage("response");
  };
  const handleLoad = s => { setCurrentSession(s); setPage("response"); };

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-stone-600 text-sm" style={{background:BG}}>Loading…</div>;
  if (page==="landing") return <LandingPage onStart={()=>setPage("mentor")}/>;
  if (page==="mentor") return <MentorSelectPage onSelect={handleMentorSelect}/>;
  if (page==="about") return <AboutPage onBack={()=>setPage(profile?"easel":"mentor")}/>;
  if (!profile||editing) return <ProfileSetup onSave={saveProfile} existing={profile} onAbout={()=>setPage("about")}/>;
  if (page==="response"&&currentSession) return <ResponsePage session={currentSession} profile={profile} onBack={()=>setPage("mentor")} onEditProfile={()=>setEditing(true)} onAbout={()=>setPage("about")} onSaveSession={saveSession} sessions={sessions} onLoadSession={handleLoad} onDeleteSession={deleteSession}/>;
  return <EaselPage profile={profile} onEditProfile={()=>setEditing(true)} onAbout={()=>setPage("about")} onAnalyse={handleAnalyse} sessions={sessions} onLoadSession={handleLoad} onDeleteSession={deleteSession} defaultMentor={selectedMentor}/>;
}
