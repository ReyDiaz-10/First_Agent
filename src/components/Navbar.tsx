import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Plus,
  Layers,
  Sparkles,
  Code2,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { AgentConfig } from '../types';
import { AgentAvatar } from './AgentAvatar';

interface NavbarProps {
  agents: AgentConfig[];
  currentAgent: AgentConfig;
  onSelectAgent: (agent: AgentConfig) => void;
  onCreateNewAgent: () => void;
  onDuplicateAgent: (agent: AgentConfig) => void;
  onDeleteAgent: (agentId: string) => void;
  onOpenTemplates: () => void;
  onOpenAiWizard: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  agents,
  currentAgent,
  onSelectAgent,
  onCreateNewAgent,
  onDuplicateAgent,
  onDeleteAgent,
  onOpenTemplates,
  onOpenAiWizard,
  onOpenExport,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="app-navbar"
      className="h-16 border-b border-stone-200 bg-white px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none"
    >
      {/* Brand & Active Agent Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-stone-900 leading-tight">
              Creador de Agentes
            </h1>
            <p className="text-xs text-stone-500 font-medium">Gemini 3.8 Intelligence</p>
          </div>
        </div>

        <div className="h-6 w-px bg-stone-200 mx-1 hidden md:block" />

        {/* Dropdown selector for active agent */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="agent-selector-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all text-left group"
          >
            <AgentAvatar
              iconName={currentAgent.avatarIcon}
              colorName={currentAgent.avatarColor}
              size="sm"
            />
            <div className="max-w-[140px] md:max-w-[200px] truncate">
              <span className="block text-sm font-semibold text-stone-900 truncate">
                {currentAgent.name}
              </span>
              <span className="block text-[11px] text-stone-500 truncate">
                {currentAgent.role}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div
              id="agents-dropdown-menu"
              className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1.5 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Mis Agentes ({agents.length})
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {agents.map((agent) => {
                  const isSelected = agent.id === currentAgent.id;
                  return (
                    <div
                      key={agent.id}
                      className={`flex items-center justify-between px-3 py-2 hover:bg-stone-50 group cursor-pointer transition-colors ${
                        isSelected ? 'bg-stone-100/70 font-medium' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAgent(agent);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                      >
                        <AgentAvatar
                          iconName={agent.avatarIcon}
                          colorName={agent.avatarColor}
                          size="sm"
                        />
                        <div className="truncate">
                          <div className="text-sm text-stone-900 truncate flex items-center gap-1.5">
                            {agent.name}
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-stone-800 shrink-0 inline" />
                            )}
                          </div>
                          <div className="text-xs text-stone-500 truncate">{agent.role}</div>
                        </div>
                      </button>

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 pl-2 transition-opacity">
                        <button
                          type="button"
                          title="Duplicar agente"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateAgent(agent);
                          }}
                          className="p-1 hover:bg-stone-200 rounded text-stone-600 hover:text-stone-900"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {agents.length > 1 && (
                          <button
                            type="button"
                            title="Eliminar agente"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAgent(agent.id);
                            }}
                            className="p-1 hover:bg-rose-100 rounded text-stone-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-stone-100 mt-1 pt-1.5 px-2">
                <button
                  type="button"
                  onClick={() => {
                    onCreateNewAgent();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-stone-600" />
                  Crear Nuevo Agente en Blanco
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          id="btn-ai-wizard"
          onClick={onOpenAiWizard}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors border border-stone-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Generar con IA</span>
        </button>

        <button
          id="btn-open-templates"
          onClick={onOpenTemplates}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 transition-colors border border-stone-200"
        >
          <Layers className="w-3.5 h-3.5 text-stone-600" />
          <span>Plantillas</span>
        </button>

        <button
          id="btn-export-code"
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors border border-stone-300"
        >
          <Code2 className="w-3.5 h-3.5 text-stone-700" />
          <span>Exportar Código</span>
        </button>

        <button
          id="btn-create-new-agent"
          onClick={onCreateNewAgent}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span className="hidden md:inline">Nuevo Agente</span>
        </button>
      </div>
    </header>
  );
};
