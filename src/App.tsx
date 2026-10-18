import React, { useState, useEffect } from 'react';
import { AgentConfig, ChatMessage, ChatSession } from './types';
import { DEFAULT_TEMPLATES, AVAILABLE_TOOLS } from './defaultTemplates';
import { Navbar } from './components/Navbar';
import { AgentConfigPanel } from './components/AgentConfigPanel';
import { PlaygroundPanel } from './components/PlaygroundPanel';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { AiWizardModal } from './components/AiWizardModal';
import { Sliders, MessageSquare } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'ai_studio_agents_v1';
const LOCAL_STORAGE_ACTIVE_KEY = 'ai_studio_active_agent_id_v1';

export default function App() {
  // Load saved agents or initialize with defaults
  const [agents, setAgents] = useState<AgentConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_TEMPLATES;
  });

  const [activeAgentId, setActiveAgentId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return DEFAULT_TEMPLATES[0].id;
  });

  // Current active agent
  const currentAgent =
    agents.find((a) => a.id === activeAgentId) || agents[0] || DEFAULT_TEMPLATES[0];

  // Chat sessions keyed by agentId
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isGeneratingInstructions, setIsGeneratingInstructions] = useState(false);

  // Modals state
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);

  // Mobile tab view ('config' | 'chat')
  const [mobileTab, setMobileTab] = useState<'config' | 'chat'>('chat');

  // Save agents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(agents));
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, currentAgent.id);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [agents, currentAgent.id]);

  // Ensure current agent has an active session with its initial greeting
  useEffect(() => {
    setSessions((prev) => {
      if (prev[currentAgent.id]) return prev;
      return {
        ...prev,
        [currentAgent.id]: {
          id: `session-${currentAgent.id}`,
          agentId: currentAgent.id,
          messages: [
            {
              id: `msg-initial-${currentAgent.id}`,
              role: 'assistant',
              content: currentAgent.initialGreeting,
              timestamp: Date.now(),
            },
          ],
          scratchpadNotes: [],
        },
      };
    });
  }, [currentAgent.id, currentAgent.initialGreeting]);

  const currentSession = sessions[currentAgent.id] || {
    id: `session-${currentAgent.id}`,
    agentId: currentAgent.id,
    messages: [
      {
        id: `msg-initial-${currentAgent.id}`,
        role: 'assistant',
        content: currentAgent.initialGreeting,
        timestamp: Date.now(),
      },
    ],
    scratchpadNotes: [],
  };

  // Agent updating
  const handleUpdateAgent = (updated: AgentConfig) => {
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  // Create new blank agent
  const handleCreateNewAgent = () => {
    const newId = `agent-${Date.now()}`;
    const newAgent: AgentConfig = {
      id: newId,
      name: 'Nuevo Agente',
      role: 'Asistente Especializado',
      tagline: 'Configura este agente para cumplir tus objetivos específicos.',
      avatarIcon: 'Bot',
      avatarColor: 'indigo',
      model: 'gemini-3.8-flash',
      systemInstruction: `Eres un agente de inteligencia artificial altamente capacitado.
Misión: Asistir al usuario con precisión, lógica y empatía.
Directrices:
1. Responde de forma clara y fundamentada.
2. Si desconoces un dato específico, decláralo con honestidad.
3. Utiliza formato legible con listas o bloques de código si es necesario.`,
      temperature: 0.7,
      thinkingLevel: 'HIGH',
      tone: 'professional',
      responseLength: 'balanced',
      initialGreeting: '¡Hola! He sido configurado para ayudarte. ¿En qué trabajamos hoy?',
      tools: AVAILABLE_TOOLS.map((t) => ({ ...t, enabled: t.id === 'calculator' })),
      knowledgeBase: [],
      starterPrompts: [
        '¿Cuáles son tus funciones principales?',
        '¿Cómo puedes ayudarme en mi flujo de trabajo?',
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setAgents((prev) => [newAgent, ...prev]);
    setActiveAgentId(newId);
    setMobileTab('config');
  };

  // Duplicate agent
  const handleDuplicateAgent = (target: AgentConfig) => {
    const newId = `agent-${Date.now()}`;
    const duplicated: AgentConfig = {
      ...target,
      id: newId,
      name: `${target.name} (Copia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setAgents((prev) => [duplicated, ...prev]);
    setActiveAgentId(newId);
  };

  // Delete agent
  const handleDeleteAgent = (agentId: string) => {
    if (agents.length <= 1) return;
    const remaining = agents.filter((a) => a.id !== agentId);
    setAgents(remaining);
    if (activeAgentId === agentId) {
      setActiveAgentId(remaining[0].id);
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setSessions((prev) => ({
      ...prev,
      [currentAgent.id]: {
        id: `session-${Date.now()}`,
        agentId: currentAgent.id,
        messages: [
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: currentAgent.initialGreeting,
            timestamp: Date.now(),
          },
        ],
        scratchpadNotes: [],
      },
    }));
  };

  // Send message in chat
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoadingChat) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const updatedMessages = [...currentSession.messages, userMessage];

    // Optimistically update UI
    setSessions((prev) => ({
      ...prev,
      [currentAgent.id]: {
        ...currentSession,
        messages: updatedMessages,
      },
    }));

    setIsLoadingChat(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: currentAgent,
          messages: updatedMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con el agente.');
      }

      const assistantMessage: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        toolCalls: data.toolCalls,
        latencyMs: data.executionTimeMs,
      };

      // Check if takeNote was invoked and add to scratchpad
      const newNotes = [...currentSession.scratchpadNotes];
      if (Array.isArray(data.toolCalls)) {
        data.toolCalls.forEach((tc: any) => {
          if (tc.name === 'takeNote' && tc.result?.saved) {
            newNotes.push({
              title: tc.result.title,
              content: tc.result.content,
              time: tc.result.savedAt,
            });
          }
        });
      }

      setSessions((prev) => ({
        ...prev,
        [currentAgent.id]: {
          ...currentSession,
          messages: [...updatedMessages, assistantMessage],
          scratchpadNotes: newNotes,
        },
      }));
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${err.message || 'Hubo un error al procesar tu solicitud con el agente.'}`,
        timestamp: Date.now(),
        error: true,
      };

      setSessions((prev) => ({
        ...prev,
        [currentAgent.id]: {
          ...currentSession,
          messages: [...updatedMessages, errorMessage],
        },
      }));
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Auto generate improved system instructions with AI
  const handleAutoGenerateInstructions = async () => {
    setIsGeneratingInstructions(true);
    try {
      const res = await fetch('/api/agent/generate-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentAgent.name,
          role: currentAgent.role,
          tone: currentAgent.tone,
          purpose: currentAgent.tagline,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al generar instrucciones.');
      }

      const { instructions } = await res.json();
      if (instructions) {
        handleUpdateAgent({
          ...currentAgent,
          systemInstruction: instructions,
          updatedAt: Date.now(),
        });
      }
    } catch (err: any) {
      alert(`No se pudo generar el prompt: ${err.message}`);
    } finally {
      setIsGeneratingInstructions(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-stone-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        agents={agents}
        currentAgent={currentAgent}
        onSelectAgent={(agent) => setActiveAgentId(agent.id)}
        onCreateNewAgent={handleCreateNewAgent}
        onDuplicateAgent={handleDuplicateAgent}
        onDeleteAgent={handleDeleteAgent}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenAiWizard={() => setIsAiWizardOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Mobile view switcher tab bar */}
      <div className="md:hidden flex border-b border-stone-200 bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setMobileTab('config')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'config'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Configurar Agente</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'chat'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Probar en Vivo</span>
        </button>
      </div>

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Agent Configurator */}
        <div
          className={`w-full md:w-[460px] lg:w-[500px] shrink-0 h-full ${
            mobileTab === 'config' ? 'block' : 'hidden md:block'
          }`}
        >
          <AgentConfigPanel
            agent={currentAgent}
            onUpdateAgent={handleUpdateAgent}
            isGeneratingInstructions={isGeneratingInstructions}
            onAutoGenerateInstructions={handleAutoGenerateInstructions}
          />
        </div>

        {/* Right Side: Interactive Playground & Testing Studio */}
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileTab === 'chat' ? 'block' : 'hidden md:block'
          }`}
        >
          <PlaygroundPanel
            agent={currentAgent}
            messages={currentSession.messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isLoading={isLoadingChat}
            activeScratchpadNotes={currentSession.scratchpadNotes}
          />
        </div>
      </main>

      {/* Modals */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={(tmpl) => {
          setAgents((prev) => [tmpl, ...prev]);
          setActiveAgentId(tmpl.id);
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        agent={currentAgent}
        onImportAgent={(imported) => {
          setAgents((prev) => [imported, ...prev]);
          setActiveAgentId(imported.id);
        }}
      />

      <AiWizardModal
        isOpen={isAiWizardOpen}
        onClose={() => setIsAiWizardOpen(false)}
        onApplyGeneratedAgent={(newAgent) => {
          setAgents((prev) => [newAgent, ...prev]);
          setActiveAgentId(newAgent.id);
        }}
      />
    </div>
  );
}
