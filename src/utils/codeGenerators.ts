import { AgentConfig } from '../types';

export function generatePythonCode(agent: AgentConfig): string {
  const toolsList = agent.tools
    .filter((t) => t.enabled)
    .map((t) => `        # Herramienta activa: ${t.label} (${t.name})`)
    .join('\n');

  return `"""
Agente Inteligente: ${agent.name}
Rol: ${agent.role}
Modelo: ${agent.model}
Exportado desde Creador de Agentes IA
"""
import os
import sys
from google import genai
from google.genai import types

# 1. Validar clave de API de Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: La variable de entorno GEMINI_API_KEY no está configurada.")
    print("Configúrala en PowerShell con: $env:GEMINI_API_KEY='tu_clave'")
    print("O en CMD con: set GEMINI_API_KEY=tu_clave")
    sys.exit(1)

client = genai.Client(
    api_key=api_key,
    http_options={"headers": {"User-Agent": "aistudio-build"}}
)

# 2. Instrucciones del Agente
system_instruction = """${agent.systemInstruction.replace(/"""/g, '\\"\\"\\"')}"""

config = types.GenerateContentConfig(
    system_instruction=system_instruction,
    temperature=${agent.temperature},
)

# 3. Iniciar sesión interactiva
chat = client.chats.create(
    model="${agent.model}",
    config=config
)

print(f"🤖 {agent.name}: ${agent.initialGreeting.replace(/"/g, '\\"')}")
print("Escribe tu consulta o 'salir' para terminar.\\n" + "-" * 50)

while True:
    try:
        user_input = input("\\nTú: ")
        if user_input.strip().lower() in ["salir", "exit", "quit"]:
            print("\\nSesión finalizada.")
            break
        if not user_input.strip():
            continue
            
        response = chat.send_message(user_input)
        print(f"\\n🤖 ${agent.name}:\\n{response.text}")
    except KeyboardInterrupt:
        print("\\nInterrumpido por el usuario.")
        break
    except Exception as e:
        print(f"\\n⚠️ Error: {e}")
`;
}

export function generateTypeScriptCode(agent: AgentConfig): string {
  return `/**
 * Agente Inteligente: ${agent.name}
 * Rol: ${agent.role}
 * Modelo: ${agent.model}
 */
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ ERROR: Falta la variable de entorno GEMINI_API_KEY.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const agentSystemInstruction = \`${agent.systemInstruction.replace(/`/g, '\\`')}\`;

export async function askAgent(userPrompt: string, history: any[] = []) {
  const chat = ai.chats.create({
    model: "${agent.model}",
    config: {
      systemInstruction: agentSystemInstruction,
      temperature: ${agent.temperature},
    },
    history,
  });

  const response = await chat.sendMessage({
    message: userPrompt,
  });

  return response.text;
}

// Ejemplo de ejecución directa:
async function main() {
  console.log("🤖 ${agent.name}: ${agent.initialGreeting.replace(/"/g, '\\"')}\\n");
  const respuesta = await askAgent("Hola, ¿cómo puedes auditar mi código y ayudarme en mi proyecto?");
  console.log("Respuesta:\\n", respuesta);
}

if (import.meta.url === \`file://\${process.argv[1]}\` || !process.parent) {
  main().catch(console.error);
}
`;
}

export function generatePowerShellScript(agent: AgentConfig): string {
  const cleanInstructions = agent.systemInstruction.replace(/"/g, '`"');

  return `# ==============================================================
# Script de PowerShell para ejecutar el Agente: ${agent.name}
# Uso en Visual Studio Code Terminal (PowerShell)
# ==============================================================

if (-not $env:GEMINI_API_KEY) {
    Write-Warning "⚠️ GEMINI_API_KEY no encontrada en la sesión actual."
    Write-Host "Ejecuta: " + '$env:GEMINI_API_KEY = "tu_clave_aqui"' -ForegroundColor Yellow
    exit
}

$agentName = "${agent.name}"
$systemPrompt = @"
${cleanInstructions}
"@

Write-Host "🚀 Iniciando Agente: $agentName" -ForegroundColor Cyan
Write-Host "Modelo: ${agent.model} | Temperatura: ${agent.temperature}" -ForegroundColor DarkGray
Write-Host "Escribe tu consulta y presiona Enter (o 'salir' para cerrar):\`n" -ForegroundColor Green

function Consultar-Agente {
    param([string]$Mensaje)
    
    $body = @{
        contents = @(
            @{
                role = "user"
                parts = @(@{ text = $Mensaje })
            }
        )
        systemInstruction = @{
            parts = @(@{ text = $systemPrompt })
        }
        generationConfig = @{
            temperature = ${agent.temperature}
        }
    } | ConvertTo-Json -Depth 6

    $url = "https://generativelanguage.googleapis.com/v1beta/models/${agent.model}:generateContent?key=" + $env:GEMINI_API_KEY

    try {
        $res = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json; charset=utf-8" -Body $body
        return $res.candidates[0].content.parts[0].text
    } catch {
        Write-Error "Fallo al comunicar con Gemini: $_"
        return $null
    }
}

while ($true) {
    $pregunta = Read-Host "\`nTú"
    if ($pregunta -eq "salir" -or $pregunta -eq "exit") { break }
    if ([string]::IsNullOrWhiteSpace($pregunta)) { continue }

    Write-Host "\`n[$agentName pensando...]" -ForegroundColor DarkGray
    $respuesta = Consultar-Agente -Mensaje $pregunta
    Write-Host "\`n$agentName:\`n$respuesta" -ForegroundColor White
}
`;
}

export function generateVsCodeAuditorPy(agent: AgentConfig): string {
  return `"""
Auditor de Código para Visual Studio Code con Gemini
Archivo: auditor.py
Uso en Terminal de VS Code:
    python auditor.py mi_codigo.py
    python auditor.py archivo.ts
"""
import sys
import os
from google import genai
from google.genai import types

# 1. Validar archivo de entrada
if len(sys.argv) < 2:
    print("❌ Uso: python auditor.py <archivo_a_analizar>")
    print("Ejemplo: python auditor.py app.py")
    sys.exit(1)

file_path = sys.argv[1]
if not os.path.exists(file_path):
    print(f"❌ Error: El archivo '{file_path}' no fue encontrado.")
    sys.exit(1)

with open(file_path, "r", encoding="utf-8", errors="replace") as f:
    source_code = f.read()

# 2. Inicializar Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ Falta GEMINI_API_KEY en las variables de entorno.")
    sys.exit(1)

client = genai.Client(api_key=api_key)

print(f"🔍 [Sentinel Auditor] Analizando '{file_path}' ({len(source_code)} caracteres)...")

system_instruction = """${agent.systemInstruction.replace(/"""/g, '\\"\\"\\"')}"""

prompt = f"""Por favor audita exhaustivamente el siguiente archivo de código ({file_path}):

\`\`\`
{source_code}
\`\`\`

Proporciona:
1. 🔴 Errores y bugs detectados (con números de línea o bloques afectados).
2. ⚠️ Advertencias de seguridad y malas prácticas.
3. 🟢 Código corregido completo listo para sustituir en Visual Studio Code.
4. Explicación breve de las soluciones aplicadas.
"""

response = client.models.generate_content(
    model="${agent.model}",
    contents=prompt,
    config=types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=${agent.temperature},
    )
)

print("\\n" + "=" * 60)
print(f"📋 INFORME DE AUDITORÍA: {file_path}")
print("=" * 60 + "\\n")
print(response.text)
`;
}

export function generateCurlCode(agent: AgentConfig): string {
  return `curl "https://generativelanguage.googleapis.com/v1beta/models/${agent.model}:generateContent?key=$GEMINI_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [{ "text": "Hola, preséntate brevemente." }]
      }
    ],
    "systemInstruction": {
      "parts": [{ "text": "${agent.systemInstruction.replace(/\n/g, '\\n').replace(/"/g, '\\"')}" }]
    },
    "generationConfig": {
      "temperature": ${agent.temperature}
    }
  }'`;
}
