import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = 3000;

// Lazy initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Built-in Tool Declarations for the Agent
const calculatorDeclaration: FunctionDeclaration = {
  name: "calculator",
  description: "Realiza operaciones aritméticas y evalúa cálculos matemáticos (suma, resta, multiplicación, división, porcentajes, potencias, etc.).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      expression: {
        type: Type.STRING,
        description: "La expresión matemática a evaluar, e.g. '(15000 / 120) * 1.2' o '1500 * (1 - 0.15)'",
      },
    },
    required: ["expression"],
  },
};

const getCurrentTimeDeclaration: FunctionDeclaration = {
  name: "getCurrentTime",
  description: "Obtiene la fecha, día y hora actual exacta del sistema, con zona horaria.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      timezone: {
        type: Type.STRING,
        description: "Nombre de la zona horaria IANA opcional, e.g. 'UTC', 'America/Madrid', 'America/Mexico_City', 'America/New_York'.",
      },
    },
  },
};

const textAnalyzerDeclaration: FunctionDeclaration = {
  name: "textAnalyzer",
  description: "Analiza un texto para contar palabras, caracteres, tiempo estimado de lectura y tono.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: "El fragmento de texto a analizar métricamente.",
      },
    },
    required: ["text"],
  },
};

const takeNoteDeclaration: FunctionDeclaration = {
  name: "takeNote",
  description: "Registra y guarda una nota, conclusión importante o apunte clave en la memoria de trabajo de la sesión del agente.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Título breve de la nota.",
      },
      content: {
        type: Type.STRING,
        description: "Contenido detallado de la nota o conclusión guardada.",
      },
    },
    required: ["title", "content"],
  },
};

const searchKnowledgeDeclaration: FunctionDeclaration = {
  name: "searchKnowledge",
  description: "Busca dentro de los documentos y base de conocimiento cargada en la configuración del agente.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Término de búsqueda o concepto a consultar en la base de conocimiento.",
      },
    },
    required: ["query"],
  },
};

const codeAuditorDeclaration: FunctionDeclaration = {
  name: "codeAuditor",
  description: "Analiza un fragmento de código fuente: revisa balanceo de llaves/corchetes/paréntesis, detecta patrones inseguros (eval, exec, innerHTML) y extrae métricas de líneas y funciones.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: {
        type: Type.STRING,
        description: "El código fuente a inspeccionar y auditar.",
      },
      language: {
        type: Type.STRING,
        description: "El lenguaje de programación (python, typescript, javascript, etc.)",
      },
    },
    required: ["code"],
  },
};

const regexTesterDeclaration: FunctionDeclaration = {
  name: "regexTester",
  description: "Prueba y valida una expresión regular sobre un texto de prueba, extrayendo coincidencias o reportando errores de sintaxis.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pattern: {
        type: Type.STRING,
        description: "El patrón de la expresión regular sin las barras iniciales/finales.",
      },
      flags: {
        type: Type.STRING,
        description: "Modificadores opcionales (ej: 'g', 'i', 'm'). Por defecto 'g'.",
      },
      testText: {
        type: Type.STRING,
        description: "El texto sobre el cual evaluar el patrón regex.",
      },
    },
    required: ["pattern", "testText"],
  },
};

const errorStackExplainerDeclaration: FunctionDeclaration = {
  name: "errorStackExplainer",
  description: "Parsea y descompone trazas de error o stack traces (Node.js, Python Traceback, React, SQL, etc.), identificando archivo, línea exacta del fallo y tipo de excepción.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      errorTrace: {
        type: Type.STRING,
        description: "El texto completo del error o stack trace copiado de la terminal de VS Code.",
      },
    },
    required: ["errorTrace"],
  },
};

const testCaseGeneratorDeclaration: FunctionDeclaration = {
  name: "testCaseGenerator",
  description: "Genera una batería de casos de prueba unitarios (casos normales, casos borde, nulos y valores extremos) para una función dada en Jest, Pytest o Vitest.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      functionName: {
        type: Type.STRING,
        description: "Nombre de la función a probar.",
      },
      framework: {
        type: Type.STRING,
        description: "Framework deseado: 'pytest', 'jest', o 'vitest'.",
      },
      scenarios: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Lista de escenarios a cubrir (ej: 'lista vacía', 'números negativos', 'string nulo').",
      },
    },
    required: ["functionName", "framework"],
  },
};

// Safe local execution of functions
function executeTool(
  name: string,
  args: Record<string, any>,
  knowledgeBase: Array<{ id: string; title: string; content: string }> = []
): any {
  if (name === "calculator") {
    const rawExpr = String(args.expression || "0");
    // Sanitize expression allowing only digits, math operators and math functions
    const sanitized = rawExpr.replace(/[^0-9+\-*/().,%^ ]/g, "");
    try {
      // Evaluate basic arithmetic
      // Replace ^ with ** for power
      const safeEvaluated = Function(`"use strict"; return (${sanitized.replace(/\^/g, "**")});`)();
      return {
        expression: rawExpr,
        result: safeEvaluated,
        formatted: typeof safeEvaluated === "number" ? Number(safeEvaluated.toFixed(4)) : safeEvaluated,
        success: true,
      };
    } catch (err: any) {
      return {
        expression: rawExpr,
        error: `No se pudo evaluar la expresión matemática: ${err.message}`,
        success: false,
      };
    }
  }

  if (name === "getCurrentTime") {
    const now = new Date();
    const tz = args.timezone || "UTC";
    try {
      const formatted = new Intl.DateTimeFormat("es-ES", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: tz === "local" ? undefined : tz,
      }).format(now);
      return {
        iso: now.toISOString(),
        formatted,
        timezone: tz,
        timestampMs: now.getTime(),
        success: true,
      };
    } catch {
      return {
        iso: now.toISOString(),
        formatted: now.toUTCString(),
        timezone: "UTC",
        timestampMs: now.getTime(),
        success: true,
      };
    }
  }

  if (name === "textAnalyzer") {
    const text = String(args.text || "");
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const estimatedReadingTimeMinutes = (words / 200).toFixed(1);
    return {
      wordCount: words,
      characterCount: chars,
      characterCountNoSpaces: charsNoSpaces,
      estimatedReadingTimeMinutes: `${estimatedReadingTimeMinutes} min`,
      sentenceCount: text.split(/[.!?]+/).filter(Boolean).length,
      success: true,
    };
  }

  if (name === "takeNote") {
    const title = String(args.title || "Nota");
    const content = String(args.content || "");
    return {
      saved: true,
      title,
      content,
      savedAt: new Date().toLocaleTimeString("es-ES"),
      message: `Nota guardada exitosamente en la memoria del agente: "${title}"`,
    };
  }

  if (name === "searchKnowledge") {
    const query = String(args.query || "").toLowerCase();
    const results = knowledgeBase.filter(
      (kb) =>
        kb.title.toLowerCase().includes(query) ||
        kb.content.toLowerCase().includes(query)
    );
    if (results.length > 0) {
      return {
        found: true,
        matches: results.map((r) => ({ title: r.title, excerpt: r.content })),
      };
    }
    return {
      found: false,
      matches: [],
      message: `No se encontraron documentos exactos para "${query}". Utiliza el conocimiento general provisto en el sistema.`,
    };
  }

  if (name === "codeAuditor") {
    const rawCode = String(args.code || "");
    const lang = String(args.language || "unknown").toLowerCase();
    const lines = rawCode.split("\n");
    const totalLines = lines.length;

    // Check bracket/parentheses/brace balance
    const pairs: Record<string, string> = { "(": ")", "{": "}", "[": "]" };
    const stack: { char: string; line: number }[] = [];
    const syntaxWarnings: string[] = [];

    // Scan for security and bad practices
    const securityWarnings: string[] = [];
    if (/eval\s*\(/.test(rawCode)) securityWarnings.push("Uso de 'eval()': riesgo crítico de inyección de código.");
    if (/exec\s*\(/.test(rawCode)) securityWarnings.push("Uso de 'exec()': ejecución arbitraria de comandos.");
    if (/innerHTML\s*=/.test(rawCode)) securityWarnings.push("Asignación a 'innerHTML': riesgo de Cross-Site Scripting (XSS).");
    if (/process\.env\.[A-Z0-9_]+\s*===?\s*["'][^"']+["']/.test(rawCode)) {
      securityWarnings.push("Comparación o hardcodeo aparente de secretos/credenciales.");
    }

    lines.forEach((line, index) => {
      // Basic bracket matching ignoring strings loosely
      for (const char of line) {
        if (char === "(" || char === "{" || char === "[") {
          stack.push({ char, line: index + 1 });
        } else if (char === ")" || char === "}" || char === "]") {
          const last = stack.pop();
          if (!last || pairs[last.char] !== char) {
            syntaxWarnings.push(`Desbalance de cierre '${char}' en la línea ${index + 1}.`);
          }
        }
      }
    });

    if (stack.length > 0) {
      const unclosed = stack.slice(0, 3).map((item) => `'${item.char}' abierto en línea ${item.line}`).join(", ");
      syntaxWarnings.push(`Símbolos sin cerrar: ${unclosed}${stack.length > 3 ? "..." : ""}`);
    }

    return {
      language: lang,
      totalLines,
      syntaxStatus: syntaxWarnings.length === 0 ? "Estructura de delimitadores balanceada" : "Posible error estructural",
      structuralIssues: syntaxWarnings,
      securityWarnings,
      hasPotentialIssues: syntaxWarnings.length > 0 || securityWarnings.length > 0,
      inspectedLength: rawCode.length,
      success: true,
    };
  }

  if (name === "regexTester") {
    const pattern = String(args.pattern || "");
    const flags = String(args.flags || "g");
    const testText = String(args.testText || "");

    try {
      const reg = new RegExp(pattern, flags);
      const matches = Array.from(testText.matchAll(reg)).map((m) => ({
        match: m[0],
        index: m.index,
        groups: m.groups || null,
      }));

      return {
        valid: true,
        pattern,
        flags,
        totalMatches: matches.length,
        matches: matches.slice(0, 20),
        testTextLength: testText.length,
        success: true,
      };
    } catch (err: any) {
      return {
        valid: false,
        pattern,
        error: `Error de sintaxis Regex: ${err.message}`,
        success: false,
      };
    }
  }

  if (name === "errorStackExplainer") {
    const rawTrace = String(args.errorTrace || "");
    const lines = rawTrace.split("\n").map((l) => l.trim()).filter(Boolean);

    // Identify error type and message
    const firstLine = lines[0] || "";
    let detectedErrorType = "Desconocido";
    if (firstLine.includes("Error:") || firstLine.includes("Exception:") || firstLine.includes("Traceback")) {
      detectedErrorType = firstLine;
    }

    // Extract file and line hints
    const locationRegex = /(?:at\s+|File\s+["'])([^"'\n\r:]+)[",\s]+(?:line\s+|:)(\d+)(?::(\d+))?/gi;
    const locations: Array<{ file: string; line: string }> = [];
    let match;
    while ((match = locationRegex.exec(rawTrace)) !== null) {
      locations.push({
        file: match[1].replace(/\\/g, "/").split("/").pop() || match[1],
        line: match[2],
      });
    }

    return {
      traceLength: rawTrace.length,
      detectedErrorHeader: detectedErrorType,
      primaryLocation: locations[locations.length - 1] || locations[0] || null,
      callStackDepth: locations.length,
      allReferencedFiles: locations.slice(-5),
      rawFirstThreeLines: lines.slice(0, 3),
      success: true,
    };
  }

  if (name === "testCaseGenerator") {
    const fnName = String(args.functionName || "targetFunction");
    const framework = String(args.framework || "pytest").toLowerCase();
    const scenarios = Array.isArray(args.scenarios) ? args.scenarios : ["caso nominal", "valores extremos", "entradas nulas"];

    return {
      functionName: fnName,
      framework,
      recommendedSuites: scenarios.map((sc: string, i: number) => ({
        id: `test_${fnName}_${i + 1}`,
        description: `Debe manejar correctamente ${sc}`,
        type: i === 0 ? "happy_path" : "edge_case",
      })),
      testFileSuggestedName: framework === "pytest" ? `test_${fnName}.py` : `${fnName}.test.ts`,
      success: true,
    };
  }

  return { error: `Herramienta desconocida: ${name}`, success: false };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));

  // API Health
  app.get("/api/health", (_req: Request, res: Response) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({ status: "ok", hasApiKey: hasKey, timestamp: Date.now() });
  });

  // API: Generate / Improve System Instructions with AI
  app.post("/api/agent/generate-instructions", async (req: Request, res: Response) => {
    try {
      const { name, role, tone, purpose, targetAudience } = req.body;
      const ai = getAIClient();

      const prompt = `Actúa como un Diseñador Experto de Agentes de Inteligencia Artificial (Agent Prompt Architect).
Crea unas "Instrucciones de Sistema" (System Prompt) de calidad profesional para el siguiente agente:

Nombre del agente: ${name || "Agente Inteligente"}
Rol o función: ${role || "Asistente multipropósito"}
Tono de comunicación: ${tone || "Profesional y reflexivo"}
Propósito principal: ${purpose || "Ayudar al usuario con excelencia"}
Audiencia o usuarios objetivo: ${targetAudience || "Usuarios profesionales y estudiantes"}

Estructura el System Prompt en las siguientes secciones claras:
1. IDENTIDAD Y ROL (Quién es, su misión esencial).
2. DIRECTRICES DE PENSAMIENTO Y COMPORTAMIENTO (Cómo razona y responde paso a paso).
3. REGLAS INQUEBRANTABLES (Límites, precisión, honestidad ante incertidumbre, nada de alucinaciones).
4. ESTILO Y FORMATO DE RESPUESTA (Tono, estructura con viñetas o código limpio cuando sea oportuno).

Devuelve SOLAMENTE el texto del System Prompt redactado en español, sin preámbulos explicativos ni comillas envolventes, listo para ser copiado en el campo de configuración.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.6,
        },
      });

      const generatedInstructions = response.text?.trim() || "";
      res.json({ instructions: generatedInstructions });
    } catch (error: any) {
      console.error("Error generating instructions:", error);
      res.status(500).json({
        error: error.message || "Error al generar instrucciones con Gemini.",
      });
    }
  });

  // API: Suggest Agent Ideas / Starters
  app.post("/api/agent/suggest-ideas", async (req: Request, res: Response) => {
    try {
      const { concept } = req.body;
      const ai = getAIClient();

      const prompt = `El usuario quiere crear un Agente IA sobre: "${concept || "un asistente útil"}".
Genera una sugerencia completa en formato JSON con la siguiente estructura:
{
  "name": "Nombre creativo para el agente",
  "role": "Rol descriptivo conciso",
  "tagline": "Una frase llamativa de resumen",
  "initialGreeting": "Saludo inicial acogedor y personalizado",
  "starterPrompts": ["3 preguntas o comandos iniciales sugeridos"],
  "recommendedTone": "professional" | "pedagogical" | "creative" | "technical" | "empathetic" | "analytical",
  "systemInstruction": "System prompt completo y estructurado en español"
}
Responde ÚNICAMENTE con el objeto JSON válido, sin markdown ni comillas adicionales.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Error suggesting ideas:", error);
      res.status(500).json({
        error: error.message || "Error al generar sugerencias de agente.",
      });
    }
  });

  // API: Interactive Chat with configured Agent
  app.post("/api/chat", async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const { agent, messages } = req.body;

      if (!agent) {
        return res.status(400).json({ error: "Configuración del agente requerida." });
      }

      const ai = getAIClient();
      const modelName = agent.model || "gemini-3.8-flash";

      // 1. Build composite system instruction
      const toneDescriptions: Record<string, string> = {
        professional: "Mantén un tono formal, objetivo, ejecutivo y de alto estándar profesional.",
        pedagogical: "Sé paciente, didáctico, fomenta el razonamiento y utiliza analogías esclarecedoras.",
        creative: "Sé inspirador, utiliza lenguaje persuasivo, imaginativo y metáforas elocuentes.",
        technical: "Sé conciso, riguroso a nivel técnico, prioriza arquitectura, buenas prácticas y código exacto.",
        empathetic: "Sé cálido, comprensivo, cercano y escucha con atención las inquietudes del usuario.",
        analytical: "Fundamenta todo en datos, lógica estructurada, métricas cuantitativas y pensamiento crítico.",
      };

      const lengthDirectives: Record<string, string> = {
        concise: "Responde de forma muy directa y breve, eliminando redundancias.",
        balanced: "Proporciona una respuesta completa, balanceada y bien articulada sin ser excesivamente larga.",
        detailed: "Proporciona explicaciones exhaustivas, con análisis paso a paso, contexto de fondo y ejemplos completos.",
      };

      let combinedSystemInstruction = `Eres ${agent.name || "Agente IA"}, con el rol de: ${agent.role || "Asistente inteligente"}.\n\n`;

      if (agent.systemInstruction) {
        combinedSystemInstruction += `--- INSTRUCCIONES ESPECÍFICAS DE PERSONALIDAD Y COMPORTAMIENTO ---\n${agent.systemInstruction}\n\n`;
      }

      if (agent.tone && toneDescriptions[agent.tone]) {
        combinedSystemInstruction += `ESTILO Y TONO: ${toneDescriptions[agent.tone]}\n`;
      }

      if (agent.responseLength && lengthDirectives[agent.responseLength]) {
        combinedSystemInstruction += `LONGITUD: ${lengthDirectives[agent.responseLength]}\n`;
      }

      // Add knowledge base docs if available
      if (Array.isArray(agent.knowledgeBase) && agent.knowledgeBase.length > 0) {
        combinedSystemInstruction += `\n--- BASE DE CONOCIMIENTO AUTORIZADA DEL AGENTE ---\n`;
        agent.knowledgeBase.forEach((kb: any, idx: number) => {
          combinedSystemInstruction += `[Doc ${idx + 1}: ${kb.title}]\n${kb.content}\n\n`;
        });
        combinedSystemInstruction += `Utiliza prioritariamente la información anterior para responder consultas relativas a estos temas.\n`;
      }

      // 2. Setup enabled tools
      const enabledTools: FunctionDeclaration[] = [];
      const toolMap: Record<string, FunctionDeclaration> = {
        calculator: calculatorDeclaration,
        getCurrentTime: getCurrentTimeDeclaration,
        textAnalyzer: textAnalyzerDeclaration,
        takeNote: takeNoteDeclaration,
        searchKnowledge: searchKnowledgeDeclaration,
        codeAuditor: codeAuditorDeclaration,
        regexTester: regexTesterDeclaration,
        errorStackExplainer: errorStackExplainerDeclaration,
        testCaseGenerator: testCaseGeneratorDeclaration,
      };

      if (Array.isArray(agent.tools)) {
        agent.tools.forEach((t: any) => {
          if (t.enabled && toolMap[t.id]) {
            enabledTools.push(toolMap[t.id]);
          }
        });
      }

      // 3. Convert incoming chat messages to Gemini contents structure
      const formattedContents: any[] = [];
      const history = Array.isArray(messages) ? messages : [];

      for (const msg of history) {
        if (msg.role === "user") {
          formattedContents.push({
            role: "user",
            parts: [{ text: msg.content }],
          });
        } else if (msg.role === "assistant") {
          formattedContents.push({
            role: "model",
            parts: [{ text: msg.content }],
          });
        }
      }

      if (formattedContents.length === 0) {
        return res.status(400).json({ error: "Se requiere al menos un mensaje de usuario." });
      }

      // 4. Model Config
      const config: any = {
        systemInstruction: combinedSystemInstruction,
        temperature: typeof agent.temperature === "number" ? agent.temperature : 0.7,
      };

      if (enabledTools.length > 0) {
        config.tools = [{ functionDeclarations: enabledTools }];
      }

      // 5. Initial generation call
      let response = await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config,
      });

      const executedToolCalls: any[] = [];

      // 6. Check for Tool Invocations and run multi-step loop if required
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          const toolResult = executeTool(call.name, call.args || {}, agent.knowledgeBase || []);
          executedToolCalls.push({
            name: call.name,
            args: call.args,
            result: toolResult,
          });
        }

        // Send function responses back to model to get final conversational synthesis
        const modelCandidate = response.candidates?.[0]?.content;
        const functionResponseParts = executedToolCalls.map((tc) => ({
          functionResponse: {
            name: tc.name,
            response: tc.result,
          },
        }));

        const followUpContents = [
          ...formattedContents,
          modelCandidate,
          {
            role: "user",
            parts: functionResponseParts,
          },
        ];

        const followUpResponse = await ai.models.generateContent({
          model: modelName,
          contents: followUpContents,
          config,
        });

        const finalText = followUpResponse.text || "";
        const executionTimeMs = Date.now() - startTime;

        return res.json({
          reply: finalText,
          toolCalls: executedToolCalls,
          executionTimeMs,
          modelUsed: modelName,
        });
      }

      const replyText = response.text || "";
      const executionTimeMs = Date.now() - startTime;

      return res.json({
        reply: replyText,
        toolCalls: executedToolCalls,
        executionTimeMs,
        modelUsed: modelName,
      });
    } catch (error: any) {
      console.error("Chat execution error:", error);
      const executionTimeMs = Date.now() - startTime;
      return res.status(500).json({
        error: error.message || "Error al procesar la solicitud con el agente.",
        executionTimeMs,
      });
    }
  });

  // 7. Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
