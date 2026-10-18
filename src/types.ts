export interface AgentTool {
  id: string;
  name: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  tagline: string;
  avatarIcon: string;
  avatarColor: string;
  model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
  systemInstruction: string;
  temperature: number;
  thinkingLevel: 'MINIMAL' | 'LOW' | 'HIGH';
  tone: 'professional' | 'pedagogical' | 'creative' | 'technical' | 'empathetic' | 'analytical';
  responseLength: 'concise' | 'balanced' | 'detailed';
  initialGreeting: string;
  tools: AgentTool[];
  knowledgeBase: KnowledgeItem[];
  starterPrompts: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: {
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  }[];
  latencyMs?: number;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  agentId: string;
  messages: ChatMessage[];
  scratchpadNotes: { title: string; content: string; time: string }[];
}
