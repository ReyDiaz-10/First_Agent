import React from 'react';
import { X, Check, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { AgentConfig } from '../types';
import { DEFAULT_TEMPLATES } from '../defaultTemplates';
import { AgentAvatar } from './AgentAvatar';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: AgentConfig) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="templates-modal"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Plantillas de Agentes Listas para Usar
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Selecciona una plantilla optimizada y adáptala a las necesidades específicas de tu proyecto.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-xs transition-all flex flex-col justify-between group bg-stone-50/40 hover:bg-white"
            >
              <div>
                <div className="flex items-start gap-3 mb-2.5">
                  <AgentAvatar
                    iconName={tmpl.avatarIcon}
                    colorName={tmpl.avatarColor}
                    size="md"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">
                      {tmpl.name}
                    </h3>
                    <span className="text-xs text-stone-500 font-medium">
                      {tmpl.role}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                  {tmpl.tagline}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                    Tono: {tmpl.tone}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                    Temp: {tmpl.temperature}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                    {tmpl.tools.filter((t) => t.enabled).length} Herramientas
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTemplate({
                    ...tmpl,
                    id: `agent-${Date.now()}`,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  });
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Usar esta Plantilla</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
