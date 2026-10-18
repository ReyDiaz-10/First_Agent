import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, ArrowRight, Lightbulb } from 'lucide-react';
import { AgentConfig } from '../types';
import { AVAILABLE_TOOLS } from '../defaultTemplates';

interface AiWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedAgent: (agent: AgentConfig) => void;
}

const EXAMPLE_PROMPTS = [
  'Un tutor de ajedrez táctico que analiza aperturas y plantea acertijos con paciencia',
  'Un asesor de viajes y rutas por Latinoamérica con presupuestos detallados en moneda local',
  'Un especialista en auditoría de contratos freelance y prevención de cláusulas abusivas',
  'Un sommelier y experto en maridajes gastronómicos con recomendaciones paso a paso',
];

export const AiWizardModal: React.FC<AiWizardModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedAgent,
}) => {
  const [concept, setConcept] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agent/suggest-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error en el servidor al generar el agente.');
      }

      const generated = await res.json();

      const newAgent: AgentConfig = {
        id: `agent-${Date.now()}`,
        name: generated.name || 'Agente Inteligente',
        role: generated.role || 'Asistente Especializado',
        tagline: generated.tagline || 'Diseñado para asistirte con precisión.',
        avatarIcon: 'Sparkles',
        avatarColor: 'violet',
        model: 'gemini-3.8-flash',
        systemInstruction: generated.systemInstruction || 'Eres un asistente inteligente de Gemini.',
        temperature: 0.7,
        thinkingLevel: 'HIGH',
        tone: generated.recommendedTone || 'professional',
        responseLength: 'balanced',
        initialGreeting: generated.initialGreeting || '¡Hola! ¿En qué puedo asistirte hoy?',
        tools: AVAILABLE_TOOLS.map((t) => ({ ...t, enabled: t.id === 'calculator' || t.id === 'takeNote' })),
        knowledgeBase: [],
        starterPrompts: generated.starterPrompts || [
          '¿Cuál es tu especialidad?',
          '¿Cómo puedes ayudarme hoy?',
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onApplyGeneratedAgent(newAgent);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al comunicarse con Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="ai-wizard-modal"
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Diseñar Agente con Gemini
              </h2>
              <p className="text-xs text-stone-500">
                Describe tu idea y Gemini configurará el agente completo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              ¿Qué tipo de agente deseas crear?
            </label>
            <textarea
              rows={3}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. Un asesor financiero personal enfocado en personas que quieren ahorrar para su primera vivienda..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>O prueba una de estas ideas:</span>
            </div>
            <div className="space-y-1.5">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setConcept(prompt)}
                  className="w-full text-left p-2 rounded-lg text-xs bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/80 transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!concept.trim() || isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Diseñando Agente con Gemini...</span>
                </>
              ) : (
                <>
                  <span>Crear Agente Ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
