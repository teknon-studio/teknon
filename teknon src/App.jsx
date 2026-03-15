import { useState, useEffect, useRef } from "react";

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

const API = "/api/chat";
const HEADERS = { "Content-Type": "application/json" };
const MODEL = "claude-sonnet-4-20250514";
const BG = "#6b6b69";
const card = "bg-stone-900 border border-stone-800 rounded-2xl";
const cardInner = "bg-stone-900 border border-stone-800 rounded-xl";

const callAPI = async (messages, tools = true, maxTokens = 4000) => {
  const body = { model: MODEL, max_tokens: maxTokens, messages };
  if (tools) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch(API, { method: "POST", headers: HEADERS, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(`${data.error.type}: ${data.error.message}`);
  return data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
};

if (!document.getElementById("teknon-font")) {
  const style = document.createElement("style");
  style.id = "teknon-font";
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Serif+Display&family=Dancing+Script:wght@600&display=swap');
    .text-stone-400 { color: #ddd8d0 !important; }
    .text-stone-500 { color: #d4cec6 !important; }
    .text-stone-600 { color: #c0b8b0 !important; }
    .placeholder-stone-600::placeholder { color: #9a9088 !important; }
  `;
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
  <button onClick={onClick} className={`px-3 py-1 rounded-full text-sm border transition-all ${selected ? "bg-amber-800 border-amber-700 text-amber-100" : "border-stone-700 text-stone-400 hover:border-amber-700 hover:text-amber-200"}`}>{label}</button>
);
const Section = ({ title, subtitle, children }) => (
  <div className="mb-7">
    <h3 className="text-xs uppercase tracking-widest text-stone-500 mb-1">{title}</h3>
    {subtitle && <p className="text-stone-600 text-xs mb-3">{subtitle}</p>}
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);
const Divider = () => <div className="border-t border-stone-800 my-6"/>;
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-amber-700 text-xs">✦</span>
    <h3 className="text-xs uppercase tracking-widest text-stone-500">{children}</h3>
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
            <button onClick={()=>setSessionsOpen(o=>!o)} className="text-xs text-stone-500 hover:text-amber-400 border border-stone-700 hover:border-amber-700 px-3 py-1 rounded-full transition-all flex items-center gap-1">
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
        <button onClick={onAbout} className="text-xs text-stone-500 hover:text-amber-400 transition-all">About</button>
        {onEditProfile && <button onClick={onEditProfile} className="text-xs text-stone-500 hover:text-amber-400 border border-stone-700 hover:border-amber-700 px-3 py-1 rounded-full transition-all">Edit Profile</button>}
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

function AboutPage({ onBack }) {
  return (
    <div className="min-h-screen text-stone-200" style={{background:BG}}>
      <div className="border-b border-stone-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10" style={{background:"rgba(80,78,74,0.97)"}}>
        <TeknonLogo/><button onClick={onBack} className="text-xs text-stone-500 hover:text-amber-400 border border-stone-700 px-3 py-1 rounded-full transition-all">← Back</button>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-12 text-center"><TeknonLogo size="lg"/><p className="text-stone-500 text-sm mt-4">Private guidance. Master wisdom. No judgement.</p></div>
        {[
          { title:"The name", body:["Teknon (τέκνον) is an ancient Greek word meaning child, offspring — but also a term used to describe the relationship between a teacher and their student. In the classical tradition, a pupil was the teacher's teknon: someone whose mind was being nourished, whose character was being shaped, who was being brought into their fullest creative self.","Its root is closely related to tektōn — the craftsman, the maker, the one who carves and moulds. From this root we get the word architect. Together, these words describe something essential: the creative child being guided by a master who has walked the same difficult path."] },
          { title:"The philosophy", body:["Teknon was born from a simple observation: the internet has made it easier than ever to share your work, and harder than ever to receive genuine feedback on it. Public forums are too often unkind. Social media rewards the polished and punishes the vulnerable.","And yet the great artists of history were deeply generous with those who came after them. Across a thousand years and every tradition, artists wrote and taught and encouraged with extraordinary openness.","Teknon exists to bring that tradition into the private studio of every artist, at every level, at any hour."] },
          { title:"What Teknon is not", body:["Teknon is a companion to your creative journey, not a replacement for the irreplaceable. No algorithm can replicate the experience of standing at an easel beside a working artist.","We actively encourage every Teknon user to seek out teachers, mentors, workshops, and classes in the real world. Nothing we build will ever compete with a great teacher — and we wouldn't want it to."] },
          { title:"Your privacy", body:["Everything you upload and every session you create belongs entirely to you. Your artwork is never shared, never used for training, never seen by anyone but you and your mentor.","This is your studio. The door closes behind you."] },
        ].map((s,i) => (
          <div key={i} className={`${card} p-8 mb-6`}>
            <h2 className="text-amber-400 mb-4" style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.25rem"}}>{s.title}</h2>
            {s.body.map((p,j) => <p key={j} className="text-stone-300 text-sm leading-relaxed mb-3 last:mb-0">{p}</p>)}
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
        <TeknonLogo/><button onClick={onAbout} className="text-xs text-stone-500 hover:text-amber-400 transition-all">About</button>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <p className="text-amber-600 text-xs uppercase tracking-widest mb-3">Welcome to</p>
          <TeknonLogo size="lg"/>
          <p className="text-stone-400 text-sm leading-relaxed max-w-lg mx-auto mt-4">A private studio where your work is met with the kind of thoughtful, generous feedback the great masters gave to those who came after them.</p>
        </div>
        <InspirationalQuote/>
        <div className={`${card} p-8`}>
          <p className="text-stone-500 text-sm mb-7">Tell us about your artistic journey so we can tailor your mentor's guidance personally to you.</p>
          <Section title="Movements & styles that interest you">{MOVEMENTS.map(m=><Tag key={m} label={m} selected={movements.includes(m)} onClick={()=>handleMovement(m)}/>)}</Section>
          <Divider/>
          <Section title={movements.length>0?"Artists who inspire you — based on your selections":"Artists who inspire you"} subtitle={movements.length===0?"Select a movement above to see relevant artists, or browse all below.":""}>
            {visible.map(a=><Tag key={a} label={a} selected={artists.includes(a)} onClick={()=>toggle(artists,setArtists,a)}/>)}
            <div classNa