import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Sparkles,
  Terminal,
  Clock,
  Wrench,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
  StickyNote,
  Code,
  Zap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AgentConfig, ChatMessage } from '../types';
import { AgentAvatar } from './AgentAvatar';

interface PlaygroundPanelProps {
  agent: AgentConfig;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
  activeScratchpadNotes: { title: string; content: string; time: string }[];
}

export const PlaygroundPanel: React.FC<PlaygroundPanelProps> = ({
  agent,
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  activeScratchpadNotes,
}) => {
  const [inputText, setInputText] = useState('');
  const [showInspector, setShowInspector] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleToolExpand = (id: string) => {
    setExpandedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div id="playground-panel" className="h-full flex flex-col bg-stone-50/50 relative overflow-hidden">
      {/* Playground Header */}
      <div className="h-14 border-b border-stone-200 bg-white px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AgentAvatar
              iconName={agent.avatarIcon}
              colorName={agent.avatarColor}
              size="sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900 leading-none">{agent.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 font-mono text-stone-600 border border-stone-200">
                {agent.model}
              </span>
            </div>
            <span className="text-xs text-stone-500 leading-none block mt-0.5">
              {agent.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notes drawer button */}
          {activeScratchpadNotes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
              <span>Notas ({activeScratchpadNotes.length})</span>
            </button>
          )}

          {/* Prompt / System Inspector Button */}
          <button
            type="button"
            onClick={() => setShowInspector(!showInspector)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              showInspector
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
            title="Inspeccionar System Prompt y Variables"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspeccionar</span>
          </button>

          {/* Reset Chat Button */}
          <button
            type="button"
            onClick={onClearChat}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200"
            title="Reiniciar conversación"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inspector Drawer */}
      {showInspector && (
        <div className="bg-stone-900 text-stone-200 p-4 border-b border-stone-800 text-xs font-mono space-y-2 max-h-56 overflow-y-auto animate-in slide-in-from-top duration-150 shrink-0">
          <div className="flex items-center justify-between text-stone-400 pb-1 border-b border-stone-800">
            <span className="font-bold text-amber-400">⚡ System Prompt Activo Enviado a Gemini:</span>
            <button
              type="button"
              onClick={() => setShowInspector(false)}
              className="hover:text-white"
            >
              Cerrar
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs text-stone-300 leading-relaxed">
            {agent.systemInstruction}
          </pre>
          <div className="pt-2 border-t border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-stone-400">
            <div>Temperatura: <span className="text-white">{agent.temperature}</span></div>
            <div>Tono: <span className="text-white">{agent.tone}</span></div>
            <div>Razonamiento: <span className="text-white">{agent.thinkingLevel}</span></div>
            <div>Herramientas: <span className="text-white">{agent.tools.filter(t => t.enabled).length}</span></div>
          </div>
        </div>
      )}

      {/* Notes Drawer */}
      {showNotesDrawer && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 text-xs space-y-2 max-h-56 overflow-y-auto shrink-0 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between text-amber-900 font-bold">
            <span className="flex items-center gap-1.5">
              <StickyNote className="w-4 h-4 text-amber-700" />
              Bloc de Notas del Agente (Memoria de Sesión)
            </span>
            <button
              type="button"
              onClick={() => setShowNotesDrawer(false)}
              className="text-amber-700 hover:text-amber-900 font-normal"
            >
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeScratchpadNotes.map((note, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-lg border border-amber-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-amber-950 font-semibold mb-1">
                  <span>{note.title}</span>
                  <span className="text-[10px] text-stone-400">{note.time}</span>
                </div>
                <p className="text-stone-700 text-xs font-mono">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              {isAssistant && (
                <AgentAvatar
                  iconName={agent.avatarIcon}
                  colorName={agent.avatarColor}
                  size="sm"
                  className="mt-0.5"
                />
              )}

              <div className={`space-y-2 max-w-[85%] sm:max-w-[80%] ${isUser ? 'items-end' : ''}`}>
                {/* Tool Invocations Badge (if any) */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5">
                    {msg.toolCalls.map((tc, idx) => {
                      const toolKey = `${msg.id}-tool-${idx}`;
                      const isExpanded = expandedTools[toolKey];
                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-xl border border-stone-200 text-xs overflow-hidden shadow-2xs"
                        >
                          <button
                            type="button"
                            onClick={() => toggleToolExpand(toolKey)}
                            className="w-full flex items-center justify-between px-3 py-1.5 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
                          >
                            <div className="flex items-center gap-1.5 text-stone-700 font-mono text-[11px]">
                              <Wrench className="w-3.5 h-3.5 text-stone-800" />
                              <span className="font-semibold text-stone-900">Herramienta invocada:</span>
                              <span className="text-stone-900 bg-stone-200/80 px-1.5 py-0.5 rounded">
                                {tc.name}()
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-stone-400">
                              <span className="text-[10px]">Ver detalles</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-3 bg-stone-950 text-stone-200 font-mono text-[11px] space-y-2 border-t border-stone-200">
                              <div>
                                <span className="text-stone-400">Parámetros enviados:</span>
                                <pre className="text-emerald-400 whitespace-pre-wrap mt-0.5">
                                  {JSON.stringify(tc.args, null, 2)}
                                </pre>
                              </div>
                              {tc.result && (
                                <div>
                                  <span className="text-stone-400">Resultado obtenido:</span>
                                  <pre className="text-sky-300 whitespace-pre-wrap mt-0.5">
                                    {JSON.stringify(tc.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-stone-900 text-white rounded-br-xs shadow-xs'
                      : msg.error
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  ) : (
                    <div className="markdown-body space-y-2 break-words text-stone-800">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            const isInline = !match && !codeString.includes('\n');

                            if (isInline) {
                              return (
                                <code
                                  className="bg-stone-100 text-stone-900 px-1.5 py-0.5 rounded text-xs font-mono font-medium"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }

                            const blockId = `code-${Math.random()}`;
                            return (
                              <div className="my-2 rounded-xl overflow-hidden border border-stone-800 bg-stone-950 text-stone-100 font-mono text-xs">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900 border-b border-stone-800 text-stone-400 text-[11px]">
                                  <span>{match ? match[1] : 'código'}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(codeString, blockId)}
                                    className="flex items-center gap-1 hover:text-white transition-colors"
                                  >
                                    {copiedCodeId === blockId ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3 overflow-x-auto">
                                  <code>{children}</code>
                                </pre>
                              </div>
                            );
                          },
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          h1: ({ children }) => <h1 className="text-base font-bold my-2 text-stone-900">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold my-2 text-stone-900">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-xs font-bold my-1 text-stone-900">{children}</h3>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Sub info (Latency) */}
                {msg.latencyMs && (
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 px-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Tiempo de respuesta: {msg.latencyMs} ms</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-2xl animate-pulse">
            <AgentAvatar
              iconName={agent.avatarIcon}
              colorName={agent.avatarColor}
              size="sm"
            />
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-stone-500 font-medium ml-1">
                {agent.name} está procesando y razonando...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Starter Prompts */}
      {agent.starterPrompts && agent.starterPrompts.length > 0 && messages.length <= 2 && (
        <div className="px-4 md:px-6 py-2 border-t border-stone-200/60 bg-white/70 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-stone-400 whitespace-nowrap">
              Sugerencias:
            </span>
            {agent.starterPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSendMessage(prompt)}
                disabled={isLoading}
                className="text-xs px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium whitespace-nowrap transition-colors border border-stone-200/80 shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Box */}
      <div className="p-3 md:p-4 bg-white border-t border-stone-200">
        {/* Quick action bar for Code Audit & Bug Hunting */}
        <div className="flex items-center gap-2 mb-2 max-w-4xl mx-auto overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-stone-400 shrink-0">Acciones Rápidas:</span>
          <button
            type="button"
            onClick={() => {
              setInputText(
                'Por favor audita y busca errores en este código:\n\n```python\ndef procesar_pedidos(pedidos):\n    total = 0\n    for p in pedidos:\n        total += p["monto"] * (1 - p.get("descuento", 0))\n    return total / len(pedidos)\n```'
              );
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium shrink-0 transition-colors border border-stone-200/80"
          >
            <Code className="w-3.5 h-3.5 text-stone-600" />
            <span>Auditar Código Python (Ejemplo)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputText(
                'Audita esta función TypeScript asíncrona y corrige posibles fugas o promesas no resueltas:\n\n```typescript\nasync function fetchUserData(userId: string) {\n  const user = await db.users.find({ id: userId });\n  const posts = db.posts.find({ authorId: user.id });\n  return { user, posts };\n}\n```'
              );
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium shrink-0 transition-colors border border-stone-200/80"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Auditar Async en TypeScript</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputText(
                'Me saltó este error en la consola de VS Code, por favor explícame la causa raíz y dame la solución:\n\n```text\nTypeError: Cannot read properties of undefined (reading \'map\')\n    at UserList (src/components/UserList.tsx:24:18)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:15486:18)\n```'
              );
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium shrink-0 transition-colors border border-rose-200/80"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Explicar Error / Stack Trace</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputText(
                'Genera una batería completa de pruebas unitarias (happy path y casos borde) para esta función:\n\n```python\ndef calcular_descuento(precio, cupon):\n    if cupon == "PROMO10":\n        return precio * 0.9\n    elif cupon == "MITAD":\n        return precio * 0.5\n    return precio\n```'
              );
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium shrink-0 transition-colors border border-emerald-200/80"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Generar Tests Unitarios</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative bg-stone-50 rounded-2xl border border-stone-200 focus-within:border-stone-900 focus-within:bg-white transition-all shadow-2xs">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Escribe un mensaje o pega tu código para ${agent.name}... (Enter para enviar, Shift+Enter nueva línea)`}
              rows={2}
              className="w-full px-4 py-2.5 text-sm bg-transparent outline-none resize-none text-stone-800 placeholder:text-stone-400"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
