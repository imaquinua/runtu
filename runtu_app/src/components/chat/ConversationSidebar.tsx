"use client";

import { useState } from "react";
import { MessageSquarePlus, Trash2, MessageSquare, Clock, X, Menu } from "lucide-react";
import type { Conversation } from "@/lib/db/conversations";

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function ConversationSidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  isLoading = false,
}: ConversationSidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString("es", { day: "numeric", month: "short" });
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-300">Conversaciones</h2>
        <button
          onClick={onNew}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          title="Nueva conversación"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              No hay conversaciones aún
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Inicia una nueva pregunta
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => {
              const isActive = conv.id === currentId;
              const isDeleting = conv.id === deletingId;

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    onSelect(conv.id);
                    setIsOpen(false);
                  }}
                  disabled={isDeleting}
                  className={`
                    w-full text-left p-3 rounded-lg transition-colors group relative
                    ${isActive
                      ? "bg-indigo-600/20 border border-indigo-500/30"
                      : "hover:bg-slate-800/50 border border-transparent"
                    }
                    ${isDeleting ? "opacity-50" : ""}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-indigo-300" : "text-slate-300"}`}>
                        {conv.title || "Nueva conversación"}
                      </p>
                      {conv.preview && (
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {conv.preview}
                        </p>
                      )}
                    </div>

                    {/* Delete button - shows on hover */}
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      disabled={isDeleting}
                      className={`
                        p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity
                        hover:bg-red-500/20 hover:text-red-400 text-slate-500
                        ${isDeleting ? "opacity-100" : ""}
                      `}
                      title="Eliminar"
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? "animate-pulse" : ""}`} />
                    </button>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(conv.updated_at)}</span>
                    {conv.message_count !== undefined && conv.message_count > 0 && (
                      <span className="ml-2">{conv.message_count} msgs</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 left-4 z-40 p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-slate-900/50 border-r border-slate-800/50">
        {sidebarContent}
      </div>
    </>
  );
}
