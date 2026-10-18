import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload, Code2, Terminal, FileJson, ShieldAlert, Cpu } from 'lucide-react';
import { AgentConfig } from '../types';
import {
  generatePythonCode,
  generateTypeScriptCode,
  generateCurlCode,
  generatePowerShellScript,
  generateVsCodeAuditorPy,
} from '../utils/codeGenerators';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentConfig;
  onImportAgent: (imported: AgentConfig) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  agent,
  onImportAgent,
}) => {
  const [activeTab, setActiveTab] = useState<'vscode' | 'powershell' | 'python' | 'typescript' | 'curl' | 'json'>('vscode');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const vsCodeAuditorCode = generateVsCodeAuditorPy(agent);
  const powerShellCode = generatePowerShellScript(agent);
  const pythonCode = generatePythonCode(agent);
  const typeScriptCode = generateTypeScriptCode(agent);
  const curlCode = generateCurlCode(agent);
  const jsonCode = JSON.stringify(agent, null, 2);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'vscode':
        return vsCodeAuditorCode;
      case 'powershell':
        return powerShellCode;
      case 'python':
        return pythonCode;
      case 'typescript':
        return typeScriptCode;
      case 'curl':
        return curlCode;
      case 'json':
        return jsonCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonCode], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-agent.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.name || !parsed.systemInstruction) {
          throw new Error('El archivo JSON no contiene un agente válido.');
        }
        onImportAgent({
          ...parsed,
          id: `imported-${Date.now()}`,
          updatedAt: Date.now(),
        });
        onClose();
      } catch (err: any) {
        setImportError(err.message || 'Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="export-modal"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-900 border border-stone-200">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Exportar & Desplegar Agente: {agent.name}
              </h2>
              <p className="text-xs text-stone-500">
                Código listo para producción con la librería oficial @google/genai.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code Tabs */}
        <div className="px-5 pt-3 flex items-center justify-between border-b border-stone-200 bg-stone-50/50">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'vscode', label: 'VS Code Auditor (Python)' },
              { id: 'powershell', label: 'PowerShell Directo' },
              { id: 'python', label: 'Python Chat' },
              { id: 'typescript', label: 'TypeScript / Node' },
              { id: 'curl', label: 'cURL REST' },
              { id: 'json', label: 'JSON' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-stone-900 text-stone-900 bg-white rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 hover:bg-stone-100 transition-colors text-stone-800"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>

            {activeTab === 'json' && (
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .json</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Display */}
        <div className="p-5 flex-1 overflow-y-auto bg-stone-950 font-mono text-xs text-stone-200">
          <pre className="whitespace-pre overflow-x-auto leading-relaxed">
            <code>{getActiveCode()}</code>
          </pre>
        </div>

        {/* Footer / Import Agent */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-600">
            <Upload className="w-4 h-4 text-stone-400" />
            <span>¿Tienes un archivo de agente exportado?</span>
            <label className="font-semibold text-stone-900 cursor-pointer underline hover:text-stone-700">
              Importar JSON
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {importError && (
              <span className="text-rose-600 font-medium ml-2">{importError}</span>
            )}
          </div>

          <span className="text-[11px] text-stone-400 font-mono">
            SDK: @google/genai • Gemini 3.8 Flash
          </span>
        </div>
      </div>
    </div>
  );
};
