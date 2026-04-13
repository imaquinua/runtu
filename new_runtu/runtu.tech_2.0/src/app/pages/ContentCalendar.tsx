import { useState, useRef, useEffect } from "react";
import { Send, ChevronLeft, ChevronRight, Plus, Sparkles, Clock, CheckCircle, Edit3, Square } from "lucide-react";

type PostStatus = "draft" | "scheduled" | "published";
interface CalendarPost { id: string; date: string; time: string; platform: string; content: string; status: PostStatus; aiGenerated?: boolean; }
interface ChatMessage { role: "user" | "assistant"; content: string; }

const platformColors: Record<string, string> = { Instagram: "#E1306C", TikTok: "#6d28d9", Facebook: "#1877F2", LinkedIn: "#0A66C2" };

const mockPosts: CalendarPost[] = [
  { id: "1", date: "2026-04-13", time: "09:00", platform: "Instagram", content: "Lunes de rutina matutina: 3 pasos para una piel radiante", status: "scheduled", aiGenerated: true },
  { id: "2", date: "2026-04-13", time: "18:00", platform: "TikTok", content: "Tutorial: tonico facial con ingredientes del mercado", status: "scheduled" },
  { id: "3", date: "2026-04-14", time: "12:00", platform: "LinkedIn", content: "El mercado de cosmetica natural en Mexico crecio 28% en Q1", status: "draft" },
  { id: "4", date: "2026-04-14", time: "17:00", platform: "Instagram", content: "Carrusel: 5 ingredientes mexicanos que tu piel necesita", status: "scheduled", aiGenerated: true },
  { id: "5", date: "2026-04-15", time: "10:00", platform: "TikTok", content: "POV: descubres que el mejor skincare viene de tu pais", status: "draft", aiGenerated: true },
  { id: "6", date: "2026-04-15", time: "14:00", platform: "Facebook", content: "Promo: 20% en humectantes. Codigo MIERCOLES20", status: "scheduled" },
  { id: "7", date: "2026-04-16", time: "09:00", platform: "Instagram", content: "Antes y despues: 2 semanas de constancia", status: "draft" },
  { id: "8", date: "2026-04-16", time: "19:00", platform: "TikTok", content: "Respondiendo preguntas sobre nuestra formula vegana", status: "scheduled", aiGenerated: true },
  { id: "9", date: "2026-04-17", time: "11:00", platform: "LinkedIn", content: "Caso de estudio: marca indie vs las grandes usando data", status: "draft" },
  { id: "10", date: "2026-04-18", time: "10:00", platform: "Instagram", content: "TGIF: detras de camaras del laboratorio", status: "scheduled" },
  { id: "11", date: "2026-04-18", time: "20:00", platform: "TikTok", content: "Reto viral: skincare routine en 30 segundos", status: "draft", aiGenerated: true },
  { id: "12", date: "2026-04-19", time: "12:00", platform: "Facebook", content: "Testimonial de la semana", status: "scheduled" },
];

const weekDays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const statusConfig = {
  draft: { label: "Borrador", cls: "text-gray-500 bg-gray-100", icon: Edit3 },
  scheduled: { label: "Programado", cls: "text-amber-600 bg-amber-50", icon: Clock },
  published: { label: "Publicado", cls: "text-emerald-600 bg-emerald-50", icon: CheckCircle },
};

const calendarSuggestions = [
  "Genera contenido para toda la semana",
  "Mejores horarios para publicar",
  "Crea un post viral para TikTok",
  "Planifica campana de lanzamiento",
];

export function ContentCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages.length]);

  const getWeekDates = () => {
    const base = new Date(2026, 3, 13);
    base.setDate(base.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i); return d.toISOString().split("T")[0]; });
  };
  const weekDates = getWeekDates();
  const getPostsForDate = (date: string) => mockPosts.filter(p => p.date === date);

  const sendChat = (text?: string) => {
    const msg = text || chatInput.trim();
    if (!msg) return;
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatInput("");
    setStreaming(true);
    setTimeout(() => {
      let response = "";
      if (msg.toLowerCase().includes("semana")) {
        response = "Propuesta semanal basada en tu engagement:\n\n**Lun** — IG Story: Rutina matutina (09:00)\n**Mar** — TikTok: Tutorial ingredientes (18:00)\n**Mie** — LinkedIn: Articulo sector (12:00)\n**Jue** — IG Carrusel: Top 5 productos (10:00)\n**Vie** — TikTok: Behind the scenes (19:00)\n**Sab** — Facebook: Testimonial + promo (11:00)\n\n¿Los programo al calendario?";
      } else if (msg.toLowerCase().includes("horario")) {
        response = "Mejores horarios segun tu data:\n\n**Instagram:** 09:00 y 18:00 (5.8% ER)\n**TikTok:** 18:00-21:00 (8.2% ER)\n**LinkedIn:** Mar/Jue 12:00-14:00\n**Facebook:** Sabados 11:00-13:00";
      } else {
        response = "Basandome en tu ER de 5.3% y keywords trending ('natural', 'vegano'), te recomiendo tutoriales con ingredientes locales — tienen 2.4x mejor performance. ¿Genero una propuesta especifica?";
      }
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
      setStreaming(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 lg:pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>Calendario Social</h1>
            <p className="text-gray-400 text-sm mt-1">Planifica y programa contenido con IA</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-700 text-sm px-3" style={{ fontWeight: 600 }}>
              {new Date(weekDates[0]).toLocaleDateString("es-MX", { month: "short", day: "numeric" })} — {new Date(weekDates[6]).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day, i) => (
            <div key={day} className="text-center">
              <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">{day}</p>
              <p className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>{new Date(weekDates[i]).getDate()}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map(date => {
            const posts = getPostsForDate(date);
            const isSelected = selectedDay === date;
            return (
              <button key={date} onClick={() => setSelectedDay(isSelected ? null : date)}
                className={`min-h-[120px] md:min-h-[160px] bg-white border rounded-xl p-2 text-left transition-all flex flex-col ${
                  isSelected ? "border-gray-900 shadow-sm" : "border-gray-100 hover:border-gray-200"
                }`}>
                <div className="space-y-1.5 flex-1">
                  {posts.map(post => (
                    <div key={post.id} className="rounded-lg p-1.5 text-[10px] bg-gray-50" style={{ borderLeft: `2px solid ${platformColors[post.platform]}` }}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-gray-400">{post.time}</span>
                        {post.aiGenerated && <Sparkles className="w-2.5 h-2.5 text-amber-500" />}
                      </div>
                      <p className="text-gray-500 truncate">{post.content.slice(0, 30)}...</p>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex items-center justify-center"><Plus className="w-3 h-3 text-gray-200" /></div>
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-gray-700 text-sm mb-4" style={{ fontWeight: 700 }}>
              {new Date(selectedDay).toLocaleDateString("es-MX", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <div className="space-y-3">
              {getPostsForDate(selectedDay).map(post => {
                const sc = statusConfig[post.status];
                const SIcon = sc.icon;
                return (
                  <div key={post.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100" style={{ borderLeftWidth: 3, borderLeftColor: platformColors[post.platform] }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: platformColors[post.platform] + "12", color: platformColors[post.platform], fontWeight: 600 }}>{post.platform}</span>
                      <span className="text-gray-400 text-xs">{post.time}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${sc.cls}`} style={{ fontWeight: 600 }}><SIcon className="w-3 h-3" />{sc.label}</span>
                      {post.aiGenerated && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 flex items-center gap-1" style={{ fontWeight: 600 }}><Sparkles className="w-3 h-3" /> IA</span>}
                    </div>
                    <p className="text-gray-600 text-sm">{post.content}</p>
                  </div>
                );
              })}
              {getPostsForDate(selectedDay).length === 0 && <p className="text-gray-400 text-sm text-center py-6">Sin posts. Pide a la IA que sugiera contenido.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Chat sidebar */}
      <div className="lg:w-[380px] border-l border-gray-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-gray-700 text-sm flex items-center gap-2" style={{ fontWeight: 700 }}><Sparkles className="w-4 h-4 text-amber-500" /> Asistente de Contenido</h3>
          <p className="text-gray-400 text-[10px] mt-1">Planifica, genera y programa contenido con IA</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-8 h-8 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Pideme que genere contenido o planifique tu semana</p>
              <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                {calendarSuggestions.map(s => (
                  <button key={s} onClick={() => sendChat(s)} className="text-[10px] border border-gray-200 text-gray-500 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm ${
                    m.role === "user" ? "bg-gray-900 text-white rounded-br-sm" : "bg-gray-50 border border-gray-100 text-gray-700"
                  }`} style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                </div>
              ))}
              {streaming && <div className="flex justify-start"><div className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2.5"><span className="animate-pulse text-gray-400">|</span></div></div>}
              <div ref={chatBottomRef} />
            </>
          )}
        </div>
        <div className="p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Pide contenido, horarios, ideas..." rows={1}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:border-gray-400 outline-none resize-none" />
            <button onClick={() => sendChat()} className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
