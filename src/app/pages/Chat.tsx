import { useState, useRef, useEffect } from "react";
import { Send, Plus, Square, Sparkles, Radar, BarChart3, CalendarDays, Globe, Activity, Trash2, Loader2 } from "lucide-react";
import { RuntuLogo } from "../components/RuntuLogo";
import { useAuth } from "../../lib/auth-context";
import {
  listConversations, createConversation, getMessages, insertMessage,
  updateConversationTitle, deleteConversation,
  type DbConversation,
} from "../../lib/chat/storage";
import { streamChat, buildMMMContext } from "../../lib/chat/gemini";
import { getLatestMMMAnalysis } from "../../lib/mmm/storage";
import type { MMMResult } from "../../lib/mmm/types";

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  { text: "¿Qué canal me da mejor ROI esta semana?", icon: BarChart3 },
  { text: "Analiza el sentimiento de mi campaña", icon: Radar },
  { text: "Genera contenido para Instagram y TikTok", icon: CalendarDays },
  { text: "¿Qué dice mi scraping de competidores?", icon: Globe },
  { text: "¿Cuál es mi engagement rate por plataforma?", icon: Activity },
  { text: "Optimiza mi presupuesto de marketing", icon: BarChart3 },
];

export function Chat() {
  const { business } = useAuth();
  const [convs, setConvs] = useState<DbConversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mmm, setMmm] = useState<MMMResult | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cargar conversaciones + último MMM al montar
  useEffect(() => {
    if (!business?.id) { setLoadingConvs(false); return; }
    Promise.all([
      listConversations(business.id),
      getLatestMMMAnalysis(business.id),
    ]).then(([{ data }, { result }]) => {
      setConvs(data);
      setMmm(result);
      setLoadingConvs(false);
    });
  }, [business?.id]);

  // Cargar mensajes al cambiar de conversación
  useEffect(() => {
    if (!activeConv) { setMessages([]); return; }
    getMessages(activeConv).then(({ data }) => {
      setMessages(data.map((m) => ({ id: m.id, role: m.role, content: m.content })));
    });
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streaming]);

  const stopStream = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  };

  const handleDeleteConv = async (id: string) => {
    await deleteConversation(id);
    setConvs((p) => p.filter((c) => c.id !== id));
    if (activeConv === id) { setActiveConv(null); setMessages([]); }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || !business?.id || streaming) return;

    setError(null);
    setInput("");

    // Crear conversación si no existe
    let convId = activeConv;
    if (!convId) {
      const { data, error } = await createConversation(business.id, msg);
      if (error || !data) { setError(error?.message ?? "No se pudo crear la conversación"); return; }
      convId = data.id;
      setConvs((p) => [data, ...p]);
      setActiveConv(convId);
    }

    const userMsg: UIMessage = { id: `u-${Date.now()}`, role: "user", content: msg };
    const assistantId = `a-${Date.now()}`;
    setMessages((p) => [...p, userMsg, { id: assistantId, role: "assistant", content: "" }]);

    // Persistir mensaje del usuario
    await insertMessage(convId, "user", msg);

    // Si es el primer mensaje y el título es el default, actualizarlo
    const conv = convs.find((c) => c.id === convId);
    if (conv && (conv.title === "Nueva conversación" || conv.title === msg)) {
      updateConversationTitle(convId, msg);
      setConvs((p) => p.map((c) => (c.id === convId ? { ...c, title: msg.slice(0, 100) } : c)));
    }

    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Historia: todos los mensajes previos (sin incluir el que acabamos de agregar)
      const historyForAPI = messages.map((m) => ({ role: m.role, content: m.content }));

      const fullText = await streamChat(
        {
          message: msg,
          history: historyForAPI,
          business,
          mmmContext: buildMMMContext(mmm),
        },
        (chunk) => {
          setMessages((p) =>
            p.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        },
        controller.signal
      );

      await insertMessage(convId, "assistant", fullText);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // usuario detuvo
      } else {
        const errMsg = err instanceof Error ? err.message : "Error en el chat";
        setError(errMsg);
        setMessages((p) =>
          p.map((m) => (m.id === assistantId ? { ...m, content: `⚠️ ${errMsg}` } : m))
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const startNewConv = () => {
    setActiveConv(null);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="h-full flex">
      {/* Sidebar conversaciones */}
      <div className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex">
        <div className="p-3">
          <button
            onClick={startNewConv}
            className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva conversación
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {loadingConvs ? (
            <div className="p-3 text-gray-400 text-xs">Cargando...</div>
          ) : convs.length === 0 ? (
            <div className="p-3 text-gray-400 text-xs">Sin conversaciones</div>
          ) : (
            convs.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-xl ${
                  c.id === activeConv ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <button
                  onClick={() => setActiveConv(c.id)}
                  className="flex-1 text-left px-3 py-2 text-sm truncate"
                >
                  {c.title}
                </button>
                <button
                  onClick={() => handleDeleteConv(c.id)}
                  className={`p-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    c.id === activeConv ? "text-white/60 hover:text-white" : "text-gray-400 hover:text-red-500"
                  }`}
                  aria-label="Eliminar conversación"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
        {mmm && (
          <div className="p-3 border-t border-gray-100">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px]">
              <p className="text-emerald-700" style={{ fontWeight: 600 }}>✓ Contexto MMM activo</p>
              <p className="text-emerald-600/80 mt-0.5 truncate">{mmm.filename}</p>
              <p className="text-emerald-600/60 mt-1">R² {mmm.rSquared.toFixed(2)} · {mmm.k} canales</p>
            </div>
          </div>
        )}
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col bg-[#FAFAFA]">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <RuntuLogo variant="header" className="!w-12 !h-12" />
              <h2 className="text-xl text-gray-900 mt-5" style={{ fontWeight: 700 }}>
                Tu copiloto de marketing
              </h2>
              <p className="text-gray-400 mt-2 text-center max-w-lg text-sm">
                Pregúntame sobre ROI, canales, presupuestos, contenido o cualquier decisión de marketing.
              </p>
              {!mmm && (
                <p className="text-gray-400 mt-1 text-center max-w-lg text-xs">
                  💡 Sube un CSV en <span className="font-mono">/app/mmm</span> para activar respuestas con tus datos reales.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg w-full">
                {suggestions.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-2.5 text-left text-sm border border-gray-200 text-gray-500 rounded-xl px-4 py-3 hover:bg-white hover:border-gray-300 hover:text-gray-700 transition-all bg-white"
                  >
                    <s.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "bg-gray-900 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-700 shadow-sm"
                    }`}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {m.content || (streaming && m.role === "assistant" ? <span className="animate-pulse text-gray-400">|</span> : "")}
                  </div>
                </div>
              ))}
              {streaming && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && (
                <div className="flex justify-start">
                  <span className="animate-pulse text-gray-400 ml-2">|</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 md:px-6 pb-2">
            <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-xl p-2 text-xs text-red-700">{error}</div>
          </div>
        )}

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Pregunta sobre tu marketing..."
              rows={1}
              disabled={streaming}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none resize-none transition-all disabled:opacity-60"
            />
            {streaming ? (
              <button
                onClick={stopStream}
                className="w-12 h-12 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"
                aria-label="Detener"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-all disabled:bg-gray-300"
                aria-label="Enviar"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
