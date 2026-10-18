import React from 'react';
import {
  Bot,
  Code2,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Brain,
  Cpu,
  ShieldCheck,
  Stethoscope,
  Compass,
  Search,
  Wrench,
  MessageSquare,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Bot,
  Code2,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Brain,
  Cpu,
  ShieldCheck,
  Stethoscope,
  Compass,
  Search,
  Wrench,
  MessageSquare,
  Zap,
};

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  indigo: { bg: 'bg-indigo-100 text-indigo-700', text: 'text-indigo-600', ring: 'ring-indigo-200' },
  emerald: { bg: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-600', ring: 'ring-emerald-200' },
  amber: { bg: 'bg-amber-100 text-amber-700', text: 'text-amber-600', ring: 'ring-amber-200' },
  rose: { bg: 'bg-rose-100 text-rose-700', text: 'text-rose-600', ring: 'ring-rose-200' },
  sky: { bg: 'bg-sky-100 text-sky-700', text: 'text-sky-600', ring: 'ring-sky-200' },
  violet: { bg: 'bg-violet-100 text-violet-700', text: 'text-violet-600', ring: 'ring-violet-200' },
  stone: { bg: 'bg-stone-200 text-stone-800', text: 'text-stone-700', ring: 'ring-stone-300' },
  teal: { bg: 'bg-teal-100 text-teal-700', text: 'text-teal-600', ring: 'ring-teal-200' },
};

interface AgentAvatarProps {
  iconName?: string;
  colorName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  id?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  iconName = 'Bot',
  colorName = 'indigo',
  size = 'md',
  className = '',
  id,
}) => {
  const IconComponent = ICON_MAP[iconName] || Bot;
  const colorScheme = COLOR_MAP[colorName] || COLOR_MAP.indigo;

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5 rounded-lg text-sm',
    md: 'w-10 h-10 p-2 rounded-xl text-base',
    lg: 'w-12 h-12 p-2.5 rounded-xl text-lg',
    xl: 'w-16 h-16 p-3.5 rounded-2xl text-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }[size];

  return (
    <div
      id={id}
      className={`inline-flex items-center justify-center shrink-0 transition-colors ${colorScheme.bg} ${sizeClasses} ${className}`}
    >
      <IconComponent className={iconSizes} />
    </div>
  );
};
