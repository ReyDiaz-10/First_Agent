import React, { useState } from 'react';
import {
  User,
  Sliders,
  Wrench,
  BookOpen,
  MessageSquareQuote,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Check,
  AlertCircle,
  Clock,
  Calculator,
  FileText,
  StickyNote,
  Search,
  Code2,
  Terminal,
} from 'lucide-react';
import { AgentConfig, KnowledgeItem } from '../types';
import { AgentAvatar } from './AgentAvatar';

interface AgentConfigPanelProps {
  agent: AgentConfig;
  onUpdateAgent: (updated: AgentConfig) => void;
  isGeneratingInstructions: boolean;
  onAutoGenerateInstructions: () => void;
}

const AVATAR_ICONS = [
  'Bot',
  'Code2',
  'TrendingUp',
  'GraduationCap',
  'Sparkles',
  'Brain',
  'Cpu',
  'ShieldCheck',
  'Stethoscope',
  'Compass',
  'Search',
  'Wrench',
  'Zap',
];

const AVATAR_COLORS = ['indigo', 'emerald', 'amber', 'rose', 'sky', 'violet', 'stone', 'teal'];

export const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  agent,
  onUpdateAgent,
  isGeneratingInstructions,
  onAutoGenerateInstructions,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'instructions' | 'tools' | 'knowledge' | 'starters'>('profile');
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbContent, setNewKbContent] = useState('');
  const [showAddKb, setShowAddKb] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');

  const handleTextChange = (field: keyof AgentConfig, value: any) => {
    onUpdateAgent({
      ...agent,
      [field]: value,
      updatedAt: Date.now(),
    });
  };

  const toggleTool = (toolId: string) => {
    const updatedTools = agent.tools.map((t) =>
      t.id === toolId ? { ...t, enabled: !t.enabled } : t
    );
    onUpdateAgent({
      ...agent,
      tools: updatedTools,
      updatedAt: Date.now(),
    });
  };

  const handleAddKnowledge = () => {
    if (!newKbTitle.trim() || !newKbContent.trim()) return;
    const newItem: KnowledgeItem = {
      id: `kb-${Date.now()}`,
      title: newKbTitle.trim(),
      content: newKbContent.trim(),
    };
    onUpdateAgent({
      ...agent,
      knowledgeBase: [...(agent.knowledgeBase || []), newItem],
      updatedAt: Date.now(),
    });
    setNewKbTitle('');
    setNewKbContent('');
    setShowAddKb(false);
  };

  const handleDeleteKnowledge = (id: string) => {
    onUpdateAgent({
      ...agent,
      knowledgeBase: (agent.knowledgeBase || []).filter((item) => item.id !== id),
      updatedAt: Date.now(),
    });
  };

  const handleAddStarterPrompt = () => {
    if (!newPromptText.trim()) return;
    onUpdateAgent({
      ...agent,
      starterPrompts: [...(agent.starterPrompts || []), newPromptText.trim()],
      updatedAt: Date.now(),
    });
    setNewPromptText('');
  };

  const handleDeleteStarterPrompt = (index: number) => {
    onUpdateAgent({
      ...agent,
      starterPrompts: agent.starterPrompts.filter((_, i) => i !== index),
      updatedAt: Date.now(),
    });
  };

  const toolIcons: Record<string, React.ElementType> = {
    calculator: Calculator,
    getCurrentTime: Clock,
    textAnalyzer: FileText,
    takeNote: StickyNote,
    searchKnowledge: Search,
    codeAuditor: Code2,
    regexTester: Terminal,
    errorStackExplainer: AlertCircle,
    testCaseGenerator: Check,
  };

  return (
    <div id="agent-config-panel" className="h-full flex flex-col bg-white border-r border-stone-200">
      {/* Sub-navigation tabs */}
      <div className="border-b border-stone-200 px-4 py-2 flex items-center gap-1 overflow-x-auto shrink-0 bg-stone-50/50">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'profile'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Identidad</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('instructions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'instructions'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Instrucciones & IA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'tools'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Herramientas ({agent.tools.filter((t) => t.enabled).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'knowledge'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Conocimiento ({agent.knowledgeBase?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('starters')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'starters'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Inicios Rápidos</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* TAB 1: IDENTIDAD & PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Avatar e Icono
              </label>
              <div className="flex items-center gap-4 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <AgentAvatar
                  iconName={agent.avatarIcon}
                  colorName={agent.avatarColor}
                  size="lg"
                />
                <div className="space-y-2 flex-1">
                  {/* Icon Picker */}
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleTextChange('avatarIcon', icon)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          agent.avatarIcon === icon
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                        }`}
                        title={icon}
                      >
                        <AgentAvatar iconName={icon} colorName="stone" size="sm" className="w-5 h-5 !p-0.5" />
                      </button>
                    ))}
                  </div>
                  {/* Color Picker */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {AVATAR_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleTextChange('avatarColor', col)}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          agent.avatarColor === col
                            ? 'ring-2 ring-stone-900 ring-offset-1 scale-110'
                            : 'border-stone-300 hover:scale-105'
                        }`}
                        style={{
                          backgroundColor:
                            col === 'indigo'
                              ? '#6366f1'
                              : col === 'emerald'
                              ? '#10b981'
                              : col === 'amber'
                              ? '#f59e0b'
                              : col === 'rose'
                              ? '#f43f5e'
                              : col === 'sky'
                              ? '#0ea5e9'
                              : col === 'violet'
                              ? '#8b5cf6'
                              : col === 'teal'
                              ? '#14b8a6'
                              : '#78716c',
                        }}
                        title={col}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Nombre del Agente */}
            <div>
              <label htmlFor="agent-name-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nombre del Agente
              </label>
              <input
                id="agent-name-input"
                type="text"
                value={agent.name}
                onChange={(e) => handleTextChange('name', e.target.value)}
                placeholder="Ej. Ada Code Architect, Nexus Data Analyst"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
              />
            </div>

            {/* Rol / Profesión */}
            <div>
              <label htmlFor="agent-role-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Rol o Especialidad
              </label>
              <input
                id="agent-role-input"
                type="text"
                value={agent.role}
                onChange={(e) => handleTextChange('role', e.target.value)}
                placeholder="Ej. Arquitecta de Software Senior, Tutor de Matemáticas"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
              />
            </div>

            {/* Descripción breve / Tagline */}
            <div>
              <label htmlFor="agent-tagline-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Descripción Breve (Tagline)
              </label>
              <input
                id="agent-tagline-input"
                type="text"
                value={agent.tagline}
                onChange={(e) => handleTextChange('tagline', e.target.value)}
                placeholder="Ej. Experto en optimización de algoritmos y patrones de diseño."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
              />
            </div>

            {/* Saludo Inicial */}
            <div>
              <label htmlFor="agent-greeting-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Mensaje de Saludo Inicial
              </label>
              <textarea
                id="agent-greeting-input"
                rows={3}
                value={agent.initialGreeting}
                onChange={(e) => handleTextChange('initialGreeting', e.target.value)}
                placeholder="El mensaje con el que el agente abre la conversación..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all resize-y"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Este mensaje se mostrará automáticamente al iniciar un nuevo chat.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: INSTRUCCIONES & PARÁMETROS IA */}
        {activeTab === 'instructions' && (
          <div className="space-y-4">
            {/* System Instruction with AI Generation Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="agent-system-prompt" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Instrucciones del Sistema (System Prompt)
                </label>
                <button
                  type="button"
                  id="btn-auto-prompt"
                  disabled={isGeneratingInstructions}
                  onClick={onAutoGenerateInstructions}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-60"
                >
                  {isGeneratingInstructions ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
                      <span>Diseñando prompt...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>✨ Mejorar con IA</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                id="agent-system-prompt"
                rows={9}
                value={agent.systemInstruction}
                onChange={(e) => handleTextChange('systemInstruction', e.target.value)}
                placeholder="Define aquí quién es el agente, cómo debe comportarse, qué directrices seguir y cómo formatear sus respuestas..."
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all leading-relaxed"
              />
              <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 inline shrink-0" />
                Define la personalidad central, misión, límites y directrices estrictas del agente.
              </p>
            </div>

            {/* Model & Reasoning selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Modelo Base
                </label>
                <select
                  value={agent.model}
                  onChange={(e) => handleTextChange('model', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium focus:border-stone-900 outline-none"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recomendado)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Rápido)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nivel de Pensamiento (Reasoning)
                </label>
                <select
                  value={agent.thinkingLevel}
                  onChange={(e) => handleTextChange('thinkingLevel', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium focus:border-stone-900 outline-none"
                >
                  <option value="HIGH">Alto (Razonamiento profundo para tareas complejas)</option>
                  <option value="LOW">Bajo (Menor latencia y respuestas ágiles)</option>
                  <option value="MINIMAL">Mínimo (Directo al punto sin pasos reflexivos)</option>
                </select>
              </div>
            </div>

            {/* Estilo y Tono de Comunicación */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Tono de Comunicación
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'professional', label: 'Profesional & Ejecutivo' },
                  { id: 'technical', label: 'Técnico & Riguroso' },
                  { id: 'pedagogical', label: 'Didáctico & Paciente' },
                  { id: 'creative', label: 'Creativo & Persuasivo' },
                  { id: 'empathetic', label: 'Empático & Humano' },
                  { id: 'analytical', label: 'Analítico & Basado en Datos' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTextChange('tone', t.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      agent.tone === t.id
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperatura (Creatividad vs Precisión) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-stone-700 uppercase tracking-wider">
                  Creatividad (Temperatura): {agent.temperature}
                </span>
                <span className="text-stone-500 text-[11px]">
                  {agent.temperature < 0.3
                    ? 'Muy Determinista & Preciso'
                    : agent.temperature < 0.7
                    ? 'Equilibrado'
                    : 'Altamente Creativo'}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.2"
                step="0.05"
                value={agent.temperature}
                onChange={(e) => handleTextChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                <span>0.1 (Código, lógica, cálculos)</span>
                <span>0.7 (Conversacional)</span>
                <span>1.2 (Ideas, novelas, marketing)</span>
              </div>
            </div>

            {/* Nivel de Extensión */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Extensión de Respuestas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'concise', label: 'Conciso', desc: 'Directo y sintético' },
                  { id: 'balanced', label: 'Equilibrado', desc: 'Completo y fluido' },
                  { id: 'detailed', label: 'Detallado', desc: 'Exhaustivo con contexto' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleTextChange('responseLength', l.id)}
                    className={`px-3 py-2 rounded-xl text-xs border text-center transition-all ${
                      agent.responseLength === l.id
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-semibold">{l.label}</div>
                    <div className="text-[10px] opacity-70">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HERRAMIENTAS ACTIVAS */}
        {activeTab === 'tools' && (
          <div className="space-y-3">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
              <span className="font-semibold text-stone-900">Herramientas nativas del agente:</span>{' '}
              El agente invocará automáticamente estas funciones durante la conversación cuando requiera calcular fórmulas, consultar la hora, analizar textos o tomar notas.
            </div>

            <div className="space-y-2.5">
              {agent.tools.map((tool) => {
                const Icon = toolIcons[tool.id] || Wrench;
                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      tool.enabled
                        ? 'bg-stone-50/70 border-stone-300 shadow-xs'
                        : 'bg-white border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        tool.enabled ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900">{tool.label}</span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            tool.enabled
                              ? 'bg-stone-900 border-stone-900 text-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {tool.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 leading-snug">{tool.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: BASE DE CONOCIMIENTO (RAG / CONTEXTO) */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Documentos & Contexto
                </h3>
                <p className="text-xs text-stone-500">
                  Agrega fragmentos de políticas, catálogo, manuales o lineamientos que el agente consultará.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddKb(!showAddKb)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Agregar Documento</span>
              </button>
            </div>

            {/* Add Document Form */}
            {showAddKb && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 animate-in fade-in duration-150">
                <div className="font-semibold text-xs text-stone-900">Nuevo Documento de Conocimiento</div>
                <input
                  type="text"
                  placeholder="Título del documento (ej. Manual de Devoluciones, Especificación v2)"
                  value={newKbTitle}
                  onChange={(e) => setNewKbTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white outline-none focus:border-stone-900"
                />
                <textarea
                  rows={4}
                  placeholder="Pega aquí el contenido, directrices, catálogo o especificaciones..."
                  value={newKbContent}
                  onChange={(e) => setNewKbContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white outline-none focus:border-stone-900"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddKb(false)}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddKnowledge}
                    disabled={!newKbTitle.trim() || !newKbContent.trim()}
                    className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    Guardar Documento
                  </button>
                </div>
              </div>
            )}

            {/* List of Knowledge items */}
            {(!agent.knowledgeBase || agent.knowledgeBase.length === 0) && !showAddKb ? (
              <div className="text-center py-8 px-4 border border-dashed border-stone-200 rounded-2xl">
                <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-600">Sin documentos de conocimiento añadidos</p>
                <p className="text-[11px] text-stone-400 mt-1 max-w-xs mx-auto">
                  El agente responderá con su conocimiento general. Añade directrices de tu empresa o proyecto aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {agent.knowledgeBase?.map((kb) => (
                  <div
                    key={kb.id}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-stone-900">{kb.title}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteKnowledge(kb.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-opacity"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-600 font-mono whitespace-pre-wrap line-clamp-3 bg-white p-2 rounded-lg border border-stone-200/60">
                      {kb.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STARTER PROMPTS */}
        {activeTab === 'starters' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Preguntas y Comandos Sugeridos
              </h3>
              <p className="text-xs text-stone-500">
                Aparecen como botones rápidos en el playground para probar el agente con 1 clic.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStarterPrompt()}
                placeholder="Escribe una pregunta o instrucción de prueba..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 outline-none focus:border-stone-900"
              />
              <button
                type="button"
                onClick={handleAddStarterPrompt}
                disabled={!newPromptText.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                Agregar
              </button>
            </div>

            <div className="space-y-2">
              {agent.starterPrompts?.map((prompt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors text-xs text-stone-700"
                >
                  <span className="truncate flex-1 font-medium">"{prompt}"</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteStarterPrompt(idx)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                    title="Eliminar prompt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
